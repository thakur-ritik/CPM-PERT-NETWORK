import { ComputedActivity } from '@/types/activity';
import { useMemo } from 'react';

interface GanttChartProps {
  activities: ComputedActivity[];
}

export function GanttChart({ activities }: GanttChartProps) {
  const sortedActivities = useMemo(() => {
    return [...activities].sort((a, b) => a.es - b.es);
  }, [activities]);

  const projectDuration = useMemo(() => {
    return Math.max(...activities.map(a => a.ef), 0);
  }, [activities]);

  if (activities.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No data to display. Add activities and compute CPM to see the Gantt chart.
      </div>
    );
  }

  const timelineMarkers = Array.from(
    { length: Math.ceil(projectDuration) + 1 },
    (_, i) => i
  );

  return (
    <div className="space-y-6">
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Timeline header */}
          <div className="flex border-b border-border pb-2 mb-4">
            <div className="w-48 flex-shrink-0"></div>
            <div className="flex-1 flex">
              {timelineMarkers.map((marker) => (
                <div
                  key={marker}
                  className="flex-1 text-center text-sm text-muted-foreground"
                  style={{ minWidth: '60px' }}
                >
                  {marker}
                </div>
              ))}
            </div>
          </div>

          {/* Activity rows */}
          <div className="space-y-3">
            {sortedActivities.map((activity) => {
              const barWidth = (activity.duration / projectDuration) * 100;
              const barStart = (activity.es / projectDuration) * 100;

              return (
                <div key={activity.id} className="flex items-center group">
                  {/* Activity label */}
                  <div className="w-48 flex-shrink-0 pr-4">
                    <div className="text-sm font-medium">{activity.id}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {activity.name}
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="flex-1 relative h-12">
                    {/* Grid lines */}
                    <div className="absolute inset-0 flex">
                      {timelineMarkers.map((marker, idx) => (
                        <div
                          key={marker}
                          className="flex-1 border-l border-border/30"
                          style={{ minWidth: '60px' }}
                        />
                      ))}
                    </div>

                    {/* Activity bar */}
                    <div
                      className={`absolute top-1/2 -translate-y-1/2 h-8 rounded-md transition-all ${
                        activity.isCritical
                          ? 'bg-critical hover:bg-critical/90'
                          : 'bg-non-critical hover:bg-non-critical/80'
                      }`}
                      style={{
                        left: `${barStart}%`,
                        width: `${barWidth}%`,
                        minWidth: '4px',
                      }}
                      title={`${activity.name}\nES: ${activity.es} | EF: ${activity.ef}\nDuration: ${activity.duration}\nFloat: ${activity.totalFloat}`}
                    >
                      <div className="h-full flex items-center justify-center">
                        <span className="text-xs font-medium text-white px-2 truncate">
                          {activity.duration > 0 && activity.duration}
                        </span>
                      </div>
                    </div>

                    {/* Float indicator */}
                    {!activity.isCritical && activity.totalFloat > 0 && (
                      <div
                        className="absolute top-1/2 -translate-y-1/2 h-2 bg-warning/30 rounded-full"
                        style={{
                          left: `${barStart}%`,
                          width: `${((activity.duration + activity.totalFloat) / projectDuration) * 100}%`,
                        }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-sm pt-4 border-t border-border">
        <div className="flex items-center gap-2">
          <div className="w-6 h-4 rounded bg-critical"></div>
          <span>Critical Activity</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-4 rounded bg-non-critical"></div>
          <span>Non-Critical Activity</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-2 rounded-full bg-warning/30"></div>
          <span>Total Float</span>
        </div>
      </div>
    </div>
  );
}
