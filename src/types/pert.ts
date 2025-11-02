export interface PERTActivity {
  id: string;
  name: string;
  optimistic: number; // Best time
  mostLikely: number; // Average time
  pessimistic: number; // Worst time
  expectedDuration?: number; // Calculated
  predecessors: string[];
}

export interface ComputedPERTActivity extends PERTActivity {
  expectedDuration: number;
  es: number;
  ef: number;
  ls: number;
  lf: number;
  totalFloat: number;
  freeFloat: number;
  isCritical: boolean;
}
