import { PERTActivity, ComputedPERTActivity } from '@/types/pert';
import { Activity, CPMResult } from '@/types/activity';
import { CPMCalculator } from './cpmCalculator';

export class PERTCalculator {
  private pertActivities: PERTActivity[];

  constructor(activities: PERTActivity[]) {
    this.pertActivities = activities;
  }

  /**
   * Calculate expected duration using PERT formula:
   * Expected Duration = (Optimistic + 4 * Most Likely + Pessimistic) / 6
   */
  private calculateExpectedDuration(activity: PERTActivity): number {
    return (activity.optimistic + 4 * activity.mostLikely + activity.pessimistic) / 6;
  }

  /**
   * Convert PERT activities to CPM activities with expected durations
   */
  private convertToCPM(): Activity[] {
    return this.pertActivities.map(activity => ({
      id: activity.id,
      name: activity.name,
      duration: this.calculateExpectedDuration(activity),
      predecessors: activity.predecessors,
    }));
  }

  /**
   * Compute PERT analysis by converting to CPM and calculating
   */
  public compute(): CPMResult & { pertActivities: ComputedPERTActivity[] } {
    // Convert PERT to CPM format
    const cpmActivities = this.convertToCPM();

    // Use CPM calculator for the heavy lifting
    const cpmCalculator = new CPMCalculator(cpmActivities);
    const cpmResult = cpmCalculator.compute();

    // Convert back to PERT format with all computed values
    const pertActivities: ComputedPERTActivity[] = this.pertActivities.map(pertActivity => {
      const cpmActivity = cpmResult.activities.find(a => a.id === pertActivity.id);
      
      return {
        ...pertActivity,
        expectedDuration: this.calculateExpectedDuration(pertActivity),
        es: cpmActivity?.es || 0,
        ef: cpmActivity?.ef || 0,
        ls: cpmActivity?.ls || 0,
        lf: cpmActivity?.lf || 0,
        totalFloat: cpmActivity?.totalFloat || 0,
        freeFloat: cpmActivity?.freeFloat || 0,
        isCritical: cpmActivity?.isCritical || false,
      };
    });

    return {
      ...cpmResult,
      pertActivities,
    };
  }
}
