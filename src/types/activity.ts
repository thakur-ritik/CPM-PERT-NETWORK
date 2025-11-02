export interface Activity {
  id: string;
  name: string;
  duration: number;
  predecessors: string[];
}

export interface ComputedActivity extends Activity {
  es: number;
  ef: number;
  ls: number;
  lf: number;
  totalFloat: number;
  freeFloat: number;
  isCritical: boolean;
}

export interface CPMResult {
  activities: ComputedActivity[];
  projectDuration: number;
  criticalPaths: string[][];
  errors?: string[];
  warnings?: string[];
  aoaNetwork?: AOANetwork;
}

export type TimeUnit = 'days' | 'weeks';

// Activity-on-Arrow (AOA) representation
export interface AOAEvent {
  id: number;
  es: number;
  lf: number;
}

export interface AOAActivity {
  id: string;
  name: string;
  duration: number;
  startEvent: number;
  endEvent: number;
  isDummy: boolean;
  es: number;
  ef: number;
  ls: number;
  lf: number;
  totalFloat: number;
  isCritical: boolean;
}

export interface AOANetwork {
  events: AOAEvent[];
  activities: AOAActivity[];
  startEvent: number;
  endEvent: number;
}
