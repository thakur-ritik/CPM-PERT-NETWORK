import { ComputedActivity, AOANetwork, AOAEvent, AOAActivity } from '@/types/activity';

/**
 * Converts Activity-on-Node (AON) representation to Activity-on-Arrow (AOA)
 * with automatic dummy activity insertion following CPM network rules:
 * 1. Activities are represented on edges, not nodes
 * 2. No two activities can share the same start-end node pair
 * 3. Single start and end event for the entire network
 */
export class AOAConverter {
  private eventCounter = 1;
  private events: Map<number, AOAEvent> = new Map();
  private activities: AOAActivity[] = [];
  private dummyCounter = 1;

  constructor(private computedActivities: ComputedActivity[]) {}

  public convert(): AOANetwork {
    // Reset state
    this.eventCounter = 1;
    this.events = new Map();
    this.activities = [];
    this.dummyCounter = 1;

    // Build initial AOA network
    this.buildInitialNetwork();

    // After calculateEventTimes()
    
    // Apply grammatical rule: fix duplicate edges (same start AND end)
    // this.fixDuplicateEdges();
    
    // Ensure single start and end
    // this.ensureSingleStartAndEnd();
    
    // Calculate event times
    this.calculateEventTimes();

    this.removeDuplicateDummyEdges();
    this.cleanUpDummyEdges();
    this.mergeAllLeafNodesToSingleEnd();

    return {
      events: Array.from(this.events.values()),
      activities: this.activities,
      startEvent: 1,
      endEvent: Math.max(...Array.from(this.events.keys())),
    };
  }

  private buildInitialNetwork(): void {
    const activityToEvents = new Map<string, { start: number; end: number }>();
    const sortedActivities = [...this.computedActivities].sort((a, b) => a.es - b.es);

    // Create start event
    const startEvent = this.createEvent(0, 0);

    // Process activities in topological order (by ES)
    sortedActivities.forEach(activity => {
      let startEventId: number;

      if (activity.predecessors.length === 0) {
        // No predecessors - connect to start event
        startEventId = startEvent;
      } else if (activity.predecessors.length === 1) {
        // Single predecessor - use its end event directly
        const pred = activityToEvents.get(activity.predecessors[0]);
        startEventId = pred ? pred.end : startEvent;
      }else {
  // Multiple predecessors case (no extra global scan, no successor property needed)

  // Step 1: Find which of the current predecessors are already used as predecessors elsewhere
  const predecessorsUsed = new Set<string>();

  // Check for each predecessor if it appears as a predecessor of any other computed activity
  activity.predecessors.forEach(predId => {
    const isUsed = this.computedActivities.some(
      act => act.id !== activity.id && act.predecessors.includes(predId)
    );
    if (isUsed) {
      predecessorsUsed.add(predId);
    }
  });

  // Step 2: Among current predecessors, find one that has NOT been used yet
  let freePredId: string | null = null;
  for (const predId of activity.predecessors) {
    if (!predecessorsUsed.has(predId)) {
      freePredId = predId;
      break;
    }
  }

  // Step 3: If all predecessors already have successors, pick the first one
  if (!freePredId) {
    freePredId = activity.predecessors[0];
  }

  // Step 4: Connect new activity to that free predecessor directly
  const mainPred = activityToEvents.get(freePredId);
  startEventId = mainPred ? mainPred.end : startEvent;

  // Step 5: For all other predecessors, create dummy edges → mainPred → new activity
  activity.predecessors.forEach(predId => {
    if (predId !== freePredId) {
      const pred = activityToEvents.get(predId);
      if (pred && pred.end !== startEventId) {
        this.addDummy(pred.end, startEventId, activity.es);
        console.log(`🔸 Dummy created between ${predId} → ${freePredId} for ${activity.id}`);
      }
    }
  });

  console.log(`✅ For ${activity.id}: chosen main predecessor = ${freePredId}`);
}



      // Create end event for this activity
      const endEventId = this.createEvent(activity.ef, activity.lf);

      // Add the activity
      this.addActivity({
        id: activity.id,
        name: activity.name,
        duration: activity.duration,
        startEvent: startEventId,
        endEvent: endEventId,
        isDummy: false,
        es: activity.es,
        ef: activity.ef,
        ls: activity.ls,
        lf: activity.lf,
        totalFloat: activity.totalFloat,
        isCritical: activity.isCritical,
      });

      activityToEvents.set(activity.id, { start: startEventId, end: endEventId });
    });
  }


 /**
 * Clean up unnecessary dummy edges after graph generation
 * Rule:
 *  1️⃣ Edge must be dummy
 *  2️⃣ Either source or target node has only dummy edges
 *  3️⃣ Their starting points are different
 */
/**
 * Clean up unnecessary dummy nodes and merge them properly
 * Logic (node-based):
 *  1️⃣ If a node has only one outgoing edge AND that edge is dummy
 *  2️⃣ Merge this node with its target node (combine them into one)
 *  3️⃣ Update all other edges referencing the target to reference the source
 */
private cleanUpDummyEdges(): void {
  console.log("🧹 UPDATED DUMMY CLEANUP...");
  
  let changed = true;
  let iteration = 0;

  while (changed && iteration < 10) {
    changed = false;
    iteration++;
    
    console.log(`--- Iteration ${iteration} ---`);
    
    const activitiesCopy = [...this.activities];
    
    for (const dummy of activitiesCopy) {
      if (!dummy.isDummy) continue;
      if (!this.activities.includes(dummy)) continue;
      
      const src = dummy.startEvent;
      const tgt = dummy.endEvent;
      
      console.log(`CHECKING DUMMY: ${dummy.id} (${src}→${tgt})`);
      
      const fromSrc = this.activities.filter(a => a.startEvent === src);
      const toTgt = this.activities.filter(a => a.endEvent === tgt);
      
      console.log(`  FROM ${src}:`, fromSrc.map(a => a.id));
      console.log(`  TO ${tgt}:`, toTgt.map(a => a.id));
      
      // Condition 1: Source has only this dummy going out
      if (fromSrc.length === 1 && fromSrc[0].id === dummy.id) {
        console.log(`  ✅ Node ${src} has only 1 outgoing (this dummy)`);
        
        // ✅ UPDATED RULE: Check if they have different IMMEDIATE REAL PARENTS
        const parentSrc = this.getImmediateRealParent(src);
        const parentTgt = this.getImmediateRealParent(tgt);
        
        console.log(`  Immediate parents: ${src}→${parentSrc}, ${tgt}→${parentTgt}`);
        
        if (parentSrc !== parentTgt) {
          console.log(`  🎯 DIFFERENT PARENTS - MERGING!`);
          
          // Rewire activities
          for (const activity of this.activities) {
            if (activity.startEvent === tgt) activity.startEvent = src;
            if (activity.endEvent === tgt) activity.endEvent = src;
          }
          
          // Remove dummy
          this.activities = this.activities.filter(a => a.id !== dummy.id);
          console.log(`  Removed dummy ${dummy.id}`);
          
          // Remove unused event
          const stillUsed = this.activities.some(a => a.startEvent === tgt || a.endEvent === tgt);
          if (!stillUsed) {
            this.events.delete(tgt);
            console.log(`  Removed event ${tgt}`);
          }
          
          changed = true;
          break;
        } else {
          console.log(`  ⛔ Same immediate parent (${parentSrc}) - skipping`);
        }
      }
    }
  }
  
  console.log(`FINAL: ${this.activities.length} activities`);
}

// ✅ NEW: Get immediate real parent (not ultimate start node)
private getImmediateRealParent(nodeId: number): number {
  const realIncoming = this.activities.filter(a => 
    a.endEvent === nodeId && !a.isDummy
  );
  
  if (realIncoming.length === 0) return nodeId; // No parent, return self
  
  return realIncoming[0].startEvent;
}
private findStartNode(nodeId: number): number {
  console.log(`    Tracing start from ${nodeId}...`);
  let current = nodeId;
  const visited = new Set<number>();
  
  while (true) {
    if (visited.has(current)) {
      console.log(`      Cycle detected at ${current}`);
      return current;
    }
    visited.add(current);
    
    const realIncoming = this.activities.filter(a => 
      a.endEvent === current && !a.isDummy
    );
    
    console.log(`      Node ${current} has ${realIncoming.length} real incoming`);
    
    if (realIncoming.length === 0) {
      console.log(`      Found start node: ${current}`);
      return current;
    }
    
    current = realIncoming[0].startEvent;
    console.log(`      Moving to node ${current}`);
  }
}

// SUPER SIMPLE start trace
private traceStart(node: number): number {
  let current = node;
  let prev = node;
  
  while (true) {
    const incoming = this.activities.filter(a => a.endEvent === current && !a.isDummy);
    if (incoming.length === 0) return current;
    
    prev = current;
    current = incoming[0].startEvent;
    
    // Safety
    if (current === prev) return current;
  }
}

/**
 * Removes duplicate dummy edges between the same two nodes.
 * Keeps only one dummy for each unique (startEvent, endEvent) pair.
 */
private removeDuplicateDummyEdges(): void {
  console.log("🧹 Removing duplicate dummy edges...");

  const seen = new Set<string>();
  const filtered: AOAActivity[] = [];

  for (const act of this.activities) {
    if (act.isDummy) {
      const key = `${act.startEvent}->${act.endEvent}`;
      if (seen.has(key)) {
        console.log(`❌ Removed duplicate dummy edge: ${key}`);
        continue; // skip duplicate
      }
      seen.add(key);
    }
    filtered.push(act);
  }

  const removed = this.activities.length - filtered.length;
  this.activities = filtered;

  console.log(`✅ Duplicate dummy cleanup complete. Removed ${removed} edges.`);
}

/**
 * Ensures the AOA network has a single end node.
 * Merges all leaf events (no outgoing edges) into one final event.
 */
private mergeAllLeafNodesToSingleEnd(): void {
  console.log("🔗 Merging all leaf nodes into a single end node...");

  // Find all leaf events (events with no outgoing edges)
  const leafNodes = Array.from(this.events.keys()).filter(
    id => !this.activities.some(a => a.startEvent === id)
  );

  // If only one leaf node already → nothing to do
  if (leafNodes.length <= 1) {
    console.log("✅ Only one end node exists. No merging needed.");
    return;
  }

  // Create new final event
  const newEndEvent = this.createEvent(0, 0);
  console.log(`🆕 Created single final event: ${newEndEvent}`);

  // Redirect all activities ending at old leaves → to new final event
  this.activities.forEach(a => {
    if (leafNodes.includes(a.endEvent)) {
      a.endEvent = newEndEvent;
    }
  });

  // Remove old leaf events (they are no longer used)
  const referenced = new Set<number>(
    this.activities.flatMap(a => [a.startEvent, a.endEvent])
  );
  const before = this.events.size;
  this.events = new Map(
    Array.from(this.events.entries()).filter(([id]) => referenced.has(id))
  );

  console.log(`🧹 Removed ${before - this.events.size} old leaf nodes.`);
  console.log("✅ All activities now end at a single final node:", newEndEvent);
}








  private calculateEventTimes() {
    // Calculate ES for each event (forward pass)
    const eventES = new Map<number, number>();
    const eventLF = new Map<number, number>();

    // Initialize
    this.events.forEach(event => {
      eventES.set(event.id, 0);
      eventLF.set(event.id, Infinity);
    });

    // Forward pass (ES calculation)
    const sorted = this.topologicalSort();
    sorted.forEach(eventId => {
      this.activities
        .filter(a => a.endEvent === eventId)
        .forEach(activity => {
          const currentES = eventES.get(eventId) || 0;
          const predES = (eventES.get(activity.startEvent) || 0) + activity.duration;
          eventES.set(eventId, Math.max(currentES, predES));
        });
    });

    // Backward pass (LF calculation)
    const projectDuration = Math.max(...Array.from(eventES.values()));
    const endEvents = sorted.filter(id => 
      !this.activities.some(a => a.startEvent === id)
    );
    endEvents.forEach(id => eventLF.set(id, projectDuration));

    for (let i = sorted.length - 1; i >= 0; i--) {
      const eventId = sorted[i];
      this.activities
        .filter(a => a.startEvent === eventId)
        .forEach(activity => {
          const currentLF = eventLF.get(eventId) || Infinity;
          const succLF = (eventLF.get(activity.endEvent) || projectDuration) - activity.duration;
          eventLF.set(eventId, Math.min(currentLF, succLF));
        });
    }

    // Update event objects
    this.events.forEach(event => {
      event.es = eventES.get(event.id) || 0;
      event.lf = eventLF.get(event.id) || projectDuration;
    });
  }

  private topologicalSort(): number[] {
    const visited = new Set<number>();
    const result: number[] = [];
    const eventIds = Array.from(this.events.keys());

    const visit = (eventId: number) => {
      if (visited.has(eventId)) return;
      visited.add(eventId);

      // Visit predecessors first
      this.activities
        .filter(a => a.endEvent === eventId)
        .forEach(a => visit(a.startEvent));

      result.push(eventId);
    };

    eventIds.forEach(id => visit(id));
    return result;
  }

  private createEvent(es: number, lf: number): number {
    const id = this.eventCounter++;
    this.events.set(id, { id, es, lf });
    return id;
  }

  private addActivity(activity: AOAActivity) {
    this.activities.push(activity);
  }

  private addDummy(startEvent: number, endEvent: number, es: number) {
    this.activities.push({
      id: `DUMMY_${this.dummyCounter++}`,
      name: 'Dummy',
      duration: 0,
      startEvent,
      endEvent,
      isDummy: true,
      es,
      ef: es,
      ls: es,
      lf: es,
      totalFloat: 0,
      isCritical: false,
    });
  }

}

export function convertToAOA(activities: ComputedActivity[]): AOANetwork {
  const converter = new AOAConverter(activities);
  return converter.convert();
}

