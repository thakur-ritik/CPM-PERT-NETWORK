import { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
import { ComputedActivity, AOANetwork } from '@/types/activity';
import { Button } from '@/components/ui/button';
import { Network, GitBranch } from 'lucide-react';

interface NetworkDiagramProps {
  activities: ComputedActivity[];
  criticalPaths: string[][];
  aoaNetwork?: AOANetwork;
}

export function NetworkDiagram({ activities, criticalPaths, aoaNetwork }: NetworkDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const [viewMode, setViewMode] = useState<'aon' | 'aoa'>('aoa');

  useEffect(() => {
    if (!containerRef.current || activities.length === 0) return;

    if (viewMode === 'aoa' && aoaNetwork) {
      renderAOA(aoaNetwork);
    } else if (viewMode === 'aon') {
      renderAON(activities, criticalPaths);
    }

    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
    };
  }, [activities, criticalPaths, aoaNetwork, viewMode]);

  const renderAOA = (network: AOANetwork) => {
    if (!containerRef.current) return;

    // Build nodes (events)
    const nodes = network.events.map(event => ({
      data: {
        id: `event_${event.id}`,
        label: `${event.id}\nES: ${event.es}\nLF: ${event.lf}`,
        isStart: event.id === network.startEvent,
        isEnd: event.id === network.endEvent,
      },
    }));

    // Build edges (activities)
    const edges = network.activities.map(activity => ({
      data: {
        id: activity.id,
        source: `event_${activity.startEvent}`,
        target: `event_${activity.endEvent}`,
        label: activity.isDummy 
          ? 'Dummy' 
          : `${activity.name} (${activity.duration})`,
        isDummy: activity.isDummy,
        isCritical: activity.isCritical,
        duration: activity.duration,
      },
    }));

    // Initialize or update Cytoscape
    if (cyRef.current) {
      cyRef.current.destroy();
    }

    cyRef.current = cytoscape({
      container: containerRef.current,
      elements: [...nodes, ...edges],
      style: [
        {
          selector: 'node',
          style: {
            'background-color': (ele: any) => {
              if (ele.data('isStart') || ele.data('isEnd')) return '#7c3aed';
              return '#64748b';
            },
            'label': 'data(label)',
            'text-valign': 'center',
            'text-halign': 'center',
            'color': '#fff',
            'text-wrap': 'wrap',
            'text-max-width': '80px',
            'font-size': '11px',
            'width': '60px',
            'height': '60px',
            'shape': 'ellipse',
            'border-width': '3px',
            'border-color': (ele: any) => {
              if (ele.data('isStart') || ele.data('isEnd')) return '#6d28d9';
              return '#475569';
            },
            'font-weight': (ele: any) => 
              (ele.data('isStart') || ele.data('isEnd')) ? 'bold' : 'normal',
          },
        },
        {
          selector: 'edge',
          style: {
            'width': (ele: any) => {
              if (ele.data('isCritical')) return 4;
              if (ele.data('isDummy')) return 1.5;
              return 2;
            },
            'line-color': (ele: any) => {
              if (ele.data('isCritical')) return '#dc2626';
              if (ele.data('isDummy')) return '#94a3b8';
              return '#64748b';
            },
            'line-style': (ele: any) => 
              ele.data('isDummy') ? 'dashed' : 'solid',
            'target-arrow-color': (ele: any) => {
              if (ele.data('isCritical')) return '#dc2626';
              if (ele.data('isDummy')) return '#94a3b8';
              return '#64748b';
            },
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'arrow-scale': 1.5,
            'label': 'data(label)',
            'text-rotation': 'autorotate',
            'text-margin-y': -10,
            'font-size': '10px',
            'color': (ele: any) => 
              ele.data('isCritical') ? '#dc2626' : '#1e293b',
            'text-background-opacity': 1,
            'text-background-color': '#fff',
            'text-background-padding': '2px',
            'text-border-opacity': 0.8,
            'text-border-width': 1,
            'text-border-color': '#e2e8f0',
          },
        },
      ],
      layout: {
        name: 'breadthfirst',
        directed: true,
        spacingFactor: 2,
        padding: 50,
        avoidOverlap: true,
      },
      userZoomingEnabled: true,
      userPanningEnabled: true,
      boxSelectionEnabled: false,
    });
  };

  const renderAON = (activities: ComputedActivity[], criticalPaths: string[][]) => {
    if (!containerRef.current) return;

    // Get all critical activity IDs
    const criticalIds = new Set(activities.filter(a => a.isCritical).map(a => a.id));
    const criticalEdges = new Set<string>();
    
    criticalPaths.forEach(path => {
      for (let i = 0; i < path.length - 1; i++) {
        criticalEdges.add(`${path[i]}-${path[i + 1]}`);
      }
    });

    // Build nodes
    const nodes = activities.map(activity => ({
      data: {
        id: activity.id,
        label: `${activity.id}\n${activity.name}\nES: ${activity.es} | EF: ${activity.ef}\nLS: ${activity.ls} | LF: ${activity.lf}`,
        critical: activity.isCritical,
      },
    }));

    // Build edges
    const edges: any[] = [];
    activities.forEach(activity => {
      activity.predecessors.forEach(predId => {
        const edgeId = `${predId}-${activity.id}`;
        edges.push({
          data: {
            id: edgeId,
            source: predId,
            target: activity.id,
            critical: criticalEdges.has(edgeId),
          },
        });
      });
    });

    // Initialize or update Cytoscape
    if (cyRef.current) {
      cyRef.current.destroy();
    }

    cyRef.current = cytoscape({
      container: containerRef.current,
      elements: [...nodes, ...edges],
      style: [
        {
          selector: 'node',
          style: {
            'background-color': (ele: any) => 
              ele.data('critical') ? '#dc2626' : '#64748b',
            'label': 'data(label)',
            'text-valign': 'center',
            'text-halign': 'center',
            'color': '#fff',
            'text-wrap': 'wrap',
            'text-max-width': '100px',
            'font-size': '10px',
            'width': '80px',
            'height': '80px',
            'shape': 'roundrectangle',
            'border-width': '2px',
            'border-color': (ele: any) => 
              ele.data('critical') ? '#991b1b' : '#475569',
          },
        },
        {
          selector: 'edge',
          style: {
            'width': (ele: any) => ele.data('critical') ? 3 : 2,
            'line-color': (ele: any) => 
              ele.data('critical') ? '#dc2626' : '#94a3b8',
            'target-arrow-color': (ele: any) => 
              ele.data('critical') ? '#dc2626' : '#94a3b8',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'arrow-scale': 1.5,
          },
        },
      ],
      layout: {
        name: 'breadthfirst',
        directed: true,
        spacingFactor: 1.5,
        padding: 30,
      },
      userZoomingEnabled: true,
      userPanningEnabled: true,
      boxSelectionEnabled: false,
    });
  };

  if (activities.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px] text-muted-foreground">
        No data to display. Add activities and compute CPM to see the network diagram.
      </div>
    );
  }

  if (viewMode === 'aoa' && !aoaNetwork) {
    return (
      <div className="flex items-center justify-center h-[400px] text-muted-foreground">
        AOA network could not be generated. Please check your activity dependencies and ensure there are no circular references.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-critical"></div>
            <span>Critical Path</span>
          </div>
          {viewMode === 'aoa' && (
            <>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-dashed border-muted-foreground"></div>
                <span>Dummy Activity</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-purple-600"></div>
                <span>Start/End Event</span>
              </div>
            </>
          )}
          {viewMode === 'aon' && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-non-critical"></div>
              <span>Non-Critical</span>
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'aoa' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('aoa')}
          >
            <GitBranch className="h-4 w-4 mr-2" />
            Activity-on-Arrow
          </Button>
          <Button
            variant={viewMode === 'aon' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('aon')}
          >
            <Network className="h-4 w-4 mr-2" />
            Activity-on-Node
          </Button>
        </div>
      </div>
      
      <div
        ref={containerRef}
        className="w-full h-[600px] border border-border rounded-lg bg-card"
      />
      
      {viewMode === 'aoa' && aoaNetwork && (
        <div className="text-sm text-muted-foreground">
          <p>
            <strong>Network Structure:</strong> {aoaNetwork.events.length} events, {' '}
            {aoaNetwork.activities.filter(a => !a.isDummy).length} real activities, {' '}
            {aoaNetwork.activities.filter(a => a.isDummy).length} dummy activities
          </p>
          <p className="mt-1">
            <strong>Note:</strong> In Activity-on-Arrow format, activities are shown as arrows 
            between circular event nodes. Dashed arrows represent dummy activities (zero duration) 
            inserted to maintain correct network logic and prevent multiple activities sharing 
            the same start-end event pair.
          </p>
        </div>
      )}
    </div>
  );
}
