import { ComputedActivity } from '@/types/activity';
import { useState } from 'react';
import { ArrowUpDown, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ResultsTableProps {
  activities: ComputedActivity[];
  onExport: () => void;
}

type SortField = keyof ComputedActivity;
type SortDirection = 'asc' | 'desc';

export function ResultsTable({ activities, onExport }: ResultsTableProps) {
  const [sortField, setSortField] = useState<SortField>('es');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedActivities = [...activities].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];
    
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    }
    
    const aStr = String(aVal);
    const bStr = String(bVal);
    return sortDirection === 'asc' 
      ? aStr.localeCompare(bStr)
      : bStr.localeCompare(aStr);
  });

  const SortButton = ({ field, label }: { field: SortField; label: string }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:text-primary transition-colors"
    >
      {label}
      <ArrowUpDown className="h-3 w-3" />
    </button>
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Computed Schedule</h3>
        <Button onClick={onExport} variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>
      
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="p-3 text-left text-sm font-semibold">
                <SortButton field="id" label="ID" />
              </th>
              <th className="p-3 text-left text-sm font-semibold">
                <SortButton field="name" label="Activity" />
              </th>
              <th className="p-3 text-left text-sm font-semibold">
                <SortButton field="duration" label="Duration" />
              </th>
              <th className="p-3 text-left text-sm font-semibold">
                <SortButton field="es" label="ES" />
              </th>
              <th className="p-3 text-left text-sm font-semibold">
                <SortButton field="ef" label="EF" />
              </th>
              <th className="p-3 text-left text-sm font-semibold">
                <SortButton field="ls" label="LS" />
              </th>
              <th className="p-3 text-left text-sm font-semibold">
                <SortButton field="lf" label="LF" />
              </th>
              <th className="p-3 text-left text-sm font-semibold">
                <SortButton field="totalFloat" label="Total Float" />
              </th>
              <th className="p-3 text-left text-sm font-semibold">
                <SortButton field="freeFloat" label="Free Float" />
              </th>
              <th className="p-3 text-left text-sm font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {sortedActivities.map((activity) => (
              <tr
                key={activity.id}
                className={`border-b border-border transition-colors ${
                  activity.isCritical
                    ? 'bg-critical-light hover:bg-critical-light/80'
                    : 'hover:bg-muted/30'
                }`}
              >
                <td className="p-3 font-medium">{activity.id}</td>
                <td className="p-3">{activity.name}</td>
                <td className="p-3">{activity.duration.toFixed(1)}</td>
                <td className="p-3">{activity.es.toFixed(1)}</td>
                <td className="p-3">{activity.ef.toFixed(1)}</td>
                <td className="p-3">{activity.ls.toFixed(1)}</td>
                <td className="p-3">{activity.lf.toFixed(1)}</td>
                <td className="p-3">{activity.totalFloat.toFixed(1)}</td>
                <td className="p-3">{activity.freeFloat.toFixed(1)}</td>
                <td className="p-3">
                  {activity.isCritical ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-critical text-critical-foreground">
                      Critical
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-non-critical-light text-non-critical">
                      Non-Critical
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
