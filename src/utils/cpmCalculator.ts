import { Activity, ComputedActivity, CPMResult } from '@/types/activity';
import { convertToAOA } from './aoaConverter';

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export class CPMCalculator {
  private activities: Map<string, Activity>;
  private computed: Map<string, ComputedActivity>;
  private adjacencyList: Map<string, string[]>;
  private reverseAdjacencyList: Map<string, string[]>;

  constructor(activities: Activity[]) {
    this.activities = new Map();
    this.computed = new Map();
    this.adjacencyList = new Map();
    this.reverseAdjacencyList = new Map();

    activities.forEach(activity => {
      this.activities.set(activity.id, activity);
    });
  }

  public compute(): CPMResult {
    // Validate input
    const validation = this.validate();
    if (!validation.valid) {
      return {
        activities: [],
        projectDuration: 0,
        criticalPaths: [],
        errors: validation.errors,
        warnings: validation.warnings,
      };
    }

    // Build adjacency lists
    this.buildAdjacencyLists();

    // Check for cycles
    const cycleCheck = this.detectCycles();
    if (cycleCheck.hasCycle) {
      return {
        activities: [],
        projectDuration: 0,
        criticalPaths: [],
        errors: [`Cycle detected in the network: ${cycleCheck.cycle.join(' → ')}`],
        warnings: validation.warnings,
      };
    }

    // Perform forward pass (ES, EF)
    this.forwardPass();

    // Calculate project duration
    const projectDuration = this.calculateProjectDuration();

    // Perform backward pass (LS, LF)
    this.backwardPass(projectDuration);

    // Calculate float values
    this.calculateFloats();

    // Find critical paths
    const criticalPaths = this.findCriticalPaths();

    // Generate AOA network
    const computedActivities = Array.from(this.computed.values());
    const aoaNetwork = convertToAOA(computedActivities);

    return {
      activities: computedActivities,
      projectDuration,
      criticalPaths,
      warnings: validation.warnings,
      aoaNetwork,
    };
  }

  private validate(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const activityIds = new Set(this.activities.keys());

    // Check for duplicate IDs (already handled by Map)
    
    // Check for missing predecessors
    this.activities.forEach((activity, id) => {
      activity.predecessors.forEach(predId => {
        if (!activityIds.has(predId)) {
          errors.push(`Activity "${id}" references non-existent predecessor "${predId}"`);
        }
      });

      // Check for negative durations
      if (activity.duration < 0) {
        errors.push(`Activity "${id}" has negative duration`);
      }

      // Warn about zero duration
      if (activity.duration === 0) {
        warnings.push(`Activity "${id}" has zero duration (milestone)`);
      }
    });

    // Check for disconnected components
    const components = this.findDisconnectedComponents();
    if (components.length > 1) {
      warnings.push(`Network has ${components.length} disconnected components. Computing for entire project.`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private buildAdjacencyLists(): void {
    this.activities.forEach((activity, id) => {
      if (!this.adjacencyList.has(id)) {
        this.adjacencyList.set(id, []);
      }
      if (!this.reverseAdjacencyList.has(id)) {
        this.reverseAdjacencyList.set(id, []);
      }

      activity.predecessors.forEach(predId => {
        if (!this.adjacencyList.has(predId)) {
          this.adjacencyList.set(predId, []);
        }
        this.adjacencyList.get(predId)!.push(id);

        if (!this.reverseAdjacencyList.has(id)) {
          this.reverseAdjacencyList.set(id, []);
        }
        this.reverseAdjacencyList.get(id)!.push(predId);
      });
    });
  }

  private detectCycles(): { hasCycle: boolean; cycle: string[] } {
    const visited = new Set<string>();
    const recStack = new Set<string>();
    const path: string[] = [];

    const dfs = (node: string): boolean => {
      visited.add(node);
      recStack.add(node);
      path.push(node);

      const successors = this.adjacencyList.get(node) || [];
      for (const successor of successors) {
        if (!visited.has(successor)) {
          if (dfs(successor)) {
            return true;
          }
        } else if (recStack.has(successor)) {
          // Found cycle
          const cycleStart = path.indexOf(successor);
          path.splice(0, cycleStart);
          path.push(successor);
          return true;
        }
      }

      recStack.delete(node);
      path.pop();
      return false;
    };

    for (const node of this.activities.keys()) {
      if (!visited.has(node)) {
        if (dfs(node)) {
          return { hasCycle: true, cycle: path };
        }
      }
    }

    return { hasCycle: false, cycle: [] };
  }

  private findDisconnectedComponents(): string[][] {
    const visited = new Set<string>();
    const components: string[][] = [];

    const dfs = (node: string, component: string[]): void => {
      visited.add(node);
      component.push(node);

      // Check both forward and backward connections
      const successors = this.adjacencyList.get(node) || [];
      const predecessors = this.reverseAdjacencyList.get(node) || [];
      
      [...successors, ...predecessors].forEach(neighbor => {
        if (!visited.has(neighbor)) {
          dfs(neighbor, component);
        }
      });
    };

    this.activities.forEach((_, id) => {
      if (!visited.has(id)) {
        const component: string[] = [];
        dfs(id, component);
        components.push(component);
      }
    });

    return components;
  }

  private topologicalSort(): string[] {
    const inDegree = new Map<string, number>();
    const queue: string[] = [];
    const sorted: string[] = [];

    // Initialize in-degree
    this.activities.forEach((_, id) => {
      inDegree.set(id, 0);
    });

    this.activities.forEach(activity => {
      activity.predecessors.forEach(predId => {
        inDegree.set(activity.id, (inDegree.get(activity.id) || 0) + 1);
      });
    });

    // Find all nodes with in-degree 0
    inDegree.forEach((degree, id) => {
      if (degree === 0) {
        queue.push(id);
      }
    });

    while (queue.length > 0) {
      const node = queue.shift()!;
      sorted.push(node);

      const successors = this.adjacencyList.get(node) || [];
      successors.forEach(successor => {
        const newDegree = (inDegree.get(successor) || 0) - 1;
        inDegree.set(successor, newDegree);
        if (newDegree === 0) {
          queue.push(successor);
        }
      });
    }

    return sorted;
  }

  private forwardPass(): void {
    const sorted = this.topologicalSort();

    sorted.forEach(id => {
      const activity = this.activities.get(id)!;
      const predecessors = this.reverseAdjacencyList.get(id) || [];

      let es = 0;
      if (predecessors.length > 0) {
        es = Math.max(...predecessors.map(predId => {
          const pred = this.computed.get(predId);
          return pred ? pred.ef : 0;
        }));
      }

      const ef = es + activity.duration;

      this.computed.set(id, {
        ...activity,
        es,
        ef,
        ls: 0,
        lf: 0,
        totalFloat: 0,
        freeFloat: 0,
        isCritical: false,
      });
    });
  }

  private calculateProjectDuration(): number {
    let maxEF = 0;
    this.computed.forEach(activity => {
      maxEF = Math.max(maxEF, activity.ef);
    });
    return maxEF;
  }

  private backwardPass(projectDuration: number): void {
    const sorted = this.topologicalSort().reverse();

    sorted.forEach(id => {
      const activity = this.computed.get(id)!;
      const successors = this.adjacencyList.get(id) || [];

      let lf = projectDuration;
      if (successors.length > 0) {
        lf = Math.min(...successors.map(succId => {
          const succ = this.computed.get(succId);
          return succ ? succ.ls : projectDuration;
        }));
      }

      const ls = lf - activity.duration;

      this.computed.set(id, {
        ...activity,
        ls,
        lf,
      });
    });
  }

  private calculateFloats(): void {
    this.computed.forEach((activity, id) => {
      const totalFloat = activity.ls - activity.es;
      
      const successors = this.adjacencyList.get(id) || [];
      let freeFloat = 0;
      
      if (successors.length > 0) {
        const minSuccessorES = Math.min(...successors.map(succId => {
          const succ = this.computed.get(succId);
          return succ ? succ.es : Infinity;
        }));
        freeFloat = minSuccessorES - activity.ef;
      } else {
        // End node
        const projectDuration = this.calculateProjectDuration();
        freeFloat = projectDuration - activity.ef;
      }

      const isCritical = Math.abs(totalFloat) < 0.001; // Floating point tolerance

      this.computed.set(id, {
        ...activity,
        totalFloat,
        freeFloat,
        isCritical,
      });
    });
  }

  private findCriticalPaths(): string[][] {
    const criticalActivities = Array.from(this.computed.values())
      .filter(a => a.isCritical)
      .map(a => a.id);

    if (criticalActivities.length === 0) {
      return [];
    }

    // Build critical subgraph
    const criticalGraph = new Map<string, string[]>();
    criticalActivities.forEach(id => {
      const successors = (this.adjacencyList.get(id) || [])
        .filter(succId => criticalActivities.includes(succId));
      criticalGraph.set(id, successors);
    });

    // Find all paths from start nodes to end nodes in critical subgraph
    const paths: string[][] = [];
    const startNodes = criticalActivities.filter(id => {
      const predecessors = this.reverseAdjacencyList.get(id) || [];
      return predecessors.every(predId => !criticalActivities.includes(predId));
    });

    const endNodes = new Set(
      criticalActivities.filter(id => {
        const successors = criticalGraph.get(id) || [];
        return successors.length === 0;
      })
    );

    const dfs = (node: string, path: string[]): void => {
      path.push(node);

      if (endNodes.has(node)) {
        paths.push([...path]);
      } else {
        const successors = criticalGraph.get(node) || [];
        successors.forEach(successor => {
          dfs(successor, path);
        });
      }

      path.pop();
    };

    startNodes.forEach(start => {
      dfs(start, []);
    });

    return paths;
  }
}
