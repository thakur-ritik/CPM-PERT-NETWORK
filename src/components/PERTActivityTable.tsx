import { PERTActivity } from '@/types/pert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Plus } from 'lucide-react';

interface PERTActivityTableProps {
  activities: PERTActivity[];
  onChange: (activities: PERTActivity[]) => void;
}

export function PERTActivityTable({ activities, onChange }: PERTActivityTableProps) {
  const updateActivity = (index: number, field: keyof PERTActivity, value: string | string[]) => {
    const newActivities = [...activities];
    if (field === 'predecessors') {
      newActivities[index] = {
        ...newActivities[index],
        predecessors: Array.isArray(value) ? value : value.split(',').map(p => p.trim()).filter(Boolean),
      };
    } else if (field === 'optimistic' || field === 'mostLikely' || field === 'pessimistic') {
      newActivities[index] = {
        ...newActivities[index],
        [field]: parseFloat(value as string) || 0,
      };
    } else {
      newActivities[index] = {
        ...newActivities[index],
        [field]: value,
      };
    }
    onChange(newActivities);
  };

  const calculateExpectedDuration = (activity: PERTActivity): number => {
    return (activity.optimistic + 4 * activity.mostLikely + activity.pessimistic) / 6;
  };

  const addActivity = () => {
    const newId = String.fromCharCode(65 + activities.length);
    onChange([
      ...activities,
      {
        id: newId,
        name: `Activity ${newId}`,
        optimistic: 1,
        mostLikely: 2,
        pessimistic: 3,
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
              <th className="p-3 text-left text-sm font-semibold">Best Time (Optimistic)</th>
              <th className="p-3 text-left text-sm font-semibold">Average Time (Most Likely)</th>
              <th className="p-3 text-left text-sm font-semibold">Worst Time (Pessimistic)</th>
              <th className="p-3 text-left text-sm font-semibold bg-primary/5">Expected Duration</th>
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
                    value={activity.optimistic}
                    onChange={(e) => updateActivity(index, 'optimistic', e.target.value)}
                    className="w-24 h-8"
                    placeholder="Best"
                  />
                </td>
                <td className="p-3">
                  <Input
                    type="number"
                    min="0"
                    step="0.1"
                    value={activity.mostLikely}
                    onChange={(e) => updateActivity(index, 'mostLikely', e.target.value)}
                    className="w-24 h-8"
                    placeholder="Average"
                  />
                </td>
                <td className="p-3">
                  <Input
                    type="number"
                    min="0"
                    step="0.1"
                    value={activity.pessimistic}
                    onChange={(e) => updateActivity(index, 'pessimistic', e.target.value)}
                    className="w-24 h-8"
                    placeholder="Worst"
                  />
                </td>
                <td className="p-3 bg-primary/5">
                  <div className="px-3 py-1 rounded bg-primary/10 text-center font-semibold text-sm">
                    {calculateExpectedDuration(activity).toFixed(2)}
                  </div>
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
