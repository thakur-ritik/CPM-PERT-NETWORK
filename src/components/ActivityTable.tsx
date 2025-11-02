import { Activity } from '@/types/activity';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Plus } from 'lucide-react';
import { useState } from 'react';

interface ActivityTableProps {
  activities: Activity[];
  onChange: (activities: Activity[]) => void;
}

export function ActivityTable({ activities, onChange }: ActivityTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);

  const updateActivity = (index: number, field: keyof Activity, value: string | string[]) => {
    const newActivities = [...activities];
    if (field === 'predecessors') {
      newActivities[index] = {
        ...newActivities[index],
        predecessors: Array.isArray(value) ? value : value.split(',').map(p => p.trim()).filter(Boolean),
      };
    } else if (field === 'duration') {
      newActivities[index] = {
        ...newActivities[index],
        duration: parseFloat(value as string) || 0,
      };
    } else {
      newActivities[index] = {
        ...newActivities[index],
        [field]: value,
      };
    }
    onChange(newActivities);
  };

  const addActivity = () => {
    const newId = String.fromCharCode(65 + activities.length);
    onChange([
      ...activities,
      {
        id: newId,
        name: `Activity ${newId}`,
        duration: 1,
        predecessors: [],
      },
    ]);
  };

  const removeActivity = (index: number) => {
    const newActivities = activities.filter((_, i) => i !== index);
    onChange(newActivities);
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="p-3 text-left text-sm font-semibold">ID</th>
              <th className="p-3 text-left text-sm font-semibold">Activity Name</th>
              <th className="p-3 text-left text-sm font-semibold">Duration</th>
              <th className="p-3 text-left text-sm font-semibold">Predecessors</th>
              <th className="p-3 text-left text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {activities.map((activity, index) => (
              <tr key={activity.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                <td className="p-3">
                  <Input
                    value={activity.id}
                    onChange={(e) => updateActivity(index, 'id', e.target.value)}
                    className="w-16 h-8"
                    placeholder="A"
                  />
                </td>
                <td className="p-3">
                  <Input
                    value={activity.name}
                    onChange={(e) => updateActivity(index, 'name', e.target.value)}
                    className="h-8"
                    placeholder="Activity name"
                  />
                </td>
                <td className="p-3">
                  <Input
                    type="number"
                    min="0"
                    step="0.1"
                    value={activity.duration}
                    onChange={(e) => updateActivity(index, 'duration', e.target.value)}
                    className="w-20 h-8"
                  />
                </td>
                <td className="p-3">
                  <Input
                    value={activity.predecessors.join(', ')}
                    onChange={(e) => updateActivity(index, 'predecessors', e.target.value)}
                    className="h-8"
                    placeholder="A, B"
                  />
                </td>
                <td className="p-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeActivity(index)}
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Button onClick={addActivity} variant="outline" className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Add Activity
      </Button>
    </div>
  );
}
