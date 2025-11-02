import { Activity } from '@/types/activity';

export const SAMPLE_PROJECT: Activity[] = [
  {
    id: 'A',
    name: 'Project Start',
    duration: 0,
    predecessors: [],
  },
  {
    id: 'B',
    name: 'Requirements Analysis',
    duration: 5,
    predecessors: ['A'],
  },
  {
    id: 'C',
    name: 'Design',
    duration: 8,
    predecessors: ['B'],
  },
  {
    id: 'D',
    name: 'Procurement',
    duration: 10,
    predecessors: ['B'],
  },
  {
    id: 'E',
    name: 'Development',
    duration: 12,
    predecessors: ['C', 'D'],
  },
  {
    id: 'F',
    name: 'Testing',
    duration: 6,
    predecessors: ['E'],
  },
  {
    id: 'G',
    name: 'Documentation',
    duration: 4,
    predecessors: ['E'],
  },
  {
    id: 'H',
    name: 'Deployment',
    duration: 3,
    predecessors: ['F', 'G'],
  },
];

export const SAMPLE_SIMPLE: Activity[] = [
  {
    id: 'A',
    name: 'Start',
    duration: 3,
    predecessors: [],
  },
  {
    id: 'B',
    name: 'Design',
    duration: 2,
    predecessors: ['A'],
  },
  {
    id: 'C',
    name: 'Procure',
    duration: 4,
    predecessors: ['A'],
  },
  {
    id: 'D',
    name: 'Develop',
    duration: 2,
    predecessors: ['B', 'C'],
  },
  {
    id: 'E',
    name: 'Test',
    duration: 3,
    predecessors: ['D'],
  },
];

export function parseCSV(csv: string): Activity[] {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return [];

  const activities: Activity[] = [];
  
  // Skip header line
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = line.split(',').map(p => p.trim());
    if (parts.length < 3) continue;

    const id = parts[0];
    const name = parts[1] || id;
    const duration = parseFloat(parts[2]) || 0;
    const predecessors = parts[3] 
      ? parts[3].split(';').map(p => p.trim()).filter(Boolean)
      : [];

    activities.push({ id, name, duration, predecessors });
  }

  return activities;
}

export function exportToCSV(activities: Activity[]): string {
  const header = 'id,name,duration,predecessors\n';
  const rows = activities.map(a => 
    `${a.id},${a.name},${a.duration},${a.predecessors.join(';')}`
  );
  return header + rows.join('\n');
}
