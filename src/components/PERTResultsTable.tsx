import { ComputedPERTActivity } from '@/types/pert';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface PERTResultsTableProps {
  activities: ComputedPERTActivity[];
  onExport: () => void;
}

export function PERTResultsTable({ activities, onExport }: PERTResultsTableProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Activity Results</h3>
        <Button variant="outline" size="sm" onClick={onExport} className="gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>
      
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="p-3 text-left text-sm font-semibold">ID</th>
              <th className="p-3 text-left text-sm font-semibold">Name</th>
              <th className="p-3 text-left text-sm font-semibold">Optimistic</th>
              <th className="p-3 text-left text-sm font-semibold">Most Likely</th>
              <th className="p-3 text-left text-sm font-semibold">Pessimistic</th>
              <th className="p-3 text-left text-sm font-semibold bg-primary/5">Expected</th>
              <th className="p-3 text-left text-sm font-semibold">ES</th>
              <th className="p-3 text-left text-sm font-semibold">EF</th>
              <th className="p-3 text-left text-sm font-semibold">LS</th>
              <th className="p-3 text-left text-sm font-semibold">LF</th>
              <th className="p-3 text-left text-sm font-semibold">TF</th>
              <th className="p-3 text-left text-sm font-semibold">FF</th>
              <th className="p-3 text-left text-sm font-semibold">Critical</th>
            </tr>
          </thead>
          <tbody>
            {activities.map((activity) => (
              <tr
                key={activity.id}
                className={`border-b border-border hover:bg-muted/30 transition-colors ${
                  activity.isCritical ? 'bg-critical-light' : ''
                }`}
              >
                <td className="p-3 font-medium">{activity.id}</td>
                <td className="p-3">{activity.name}</td>
                <td className="p-3 text-center">{activity.optimistic.toFixed(1)}</td>
                <td className="p-3 text-center">{activity.mostLikely.toFixed(1)}</td>
                <td className="p-3 text-center">{activity.pessimistic.toFixed(1)}</td>
                <td className="p-3 text-center bg-primary/5 font-semibold">{activity.expectedDuration.toFixed(2)}</td>
                <td className="p-3 text-center">{activity.es.toFixed(1)}</td>
                <td className="p-3 text-center">{activity.ef.toFixed(1)}</td>
                <td className="p-3 text-center">{activity.ls.toFixed(1)}</td>
                <td className="p-3 text-center">{activity.lf.toFixed(1)}</td>
                <td className="p-3 text-center">{activity.totalFloat.toFixed(1)}</td>
                <td className="p-3 text-center">{activity.freeFloat.toFixed(1)}</td>
                <td className="p-3 text-center">
                  {activity.isCritical ? (
                    <span className="px-2 py-1 rounded bg-critical text-critical-foreground text-xs font-semibold">
                      YES
                    </span>
                  ) : (
                    <span className="px-2 py-1 rounded bg-muted text-muted-foreground text-xs">
                      NO
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
