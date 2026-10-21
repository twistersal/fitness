export type ShiftCode = 'P' | 'S' | 'M11'
export interface Shift { n: string; h: [string, string]; wt: string; pre: [string, string]; post: [string, string]; c: 'P' | 'S' | 'M' }
export interface Routine { t: string; warm?: string; core?: string[]; cardio?: string; cool?: string; rest?: string; prep?: boolean }

export const SHIFTS: Record<ShiftCode, Shift> = {
  P: { n: 'Pagi', h: ['09:00', '17:00'], wt: '19:00', pre: ['17:00', 'Pre-workout snack'], post: ['20:00', 'High-protein dinner'], c: 'P' },
  S: { n: 'Siang', h: ['14:00', '22:00'], wt: '09:00', pre: ['07:30', 'Pre-workout fruit or coffee'], post: ['10:00', 'High-protein brunch'], c: 'S' },
  M11: { n: 'Middle', h: ['11:00', '19:00'], wt: '20:30', pre: ['17:30', 'Pre-workout snack, during shift'], post: ['21:30', 'High-protein dinner'], c: 'M' },
}
const SQ = 'Bodyweight Bulgarian Split Squat (3x12/leg)'
const AB = 'Towel Floor Bridge Abduction (3x20)'
export const ROUTINES: Record<string, Routine> = {
  lower_body_a: { t: 'Lower body A', warm: 'Jumping Jacks, Hip Circles, Bodyweight Squats (5 mins)', core: ['Backpack Hip Thrust (4x15)', SQ, AB], cool: 'Child’s Pose, Lying Figure-Four Stretch (5 mins)' },
  lower_body_b: { t: 'Lower body B', warm: 'Jumping Jacks, Bodyweight Glute Bridges (5 mins)', core: ['Backpack Romanian Deadlift (3x15)', SQ, AB], cool: 'Kneeling Lunge Stretch, Lying Figure-Four Stretch (5 mins)' },
  core_and_cardio: { t: 'Core and cardio', warm: 'Light marching in place (5 mins)', core: ['Static Plank (3x60 sec)', 'Side Plank (3x45 sec/side)'], cardio: 'LISS Fast Walk (15-25 mins, adjust based on work fatigue)', cool: 'Seated Butterfly Stretch (5 mins)' },
  active_rest: { t: 'Active rest', rest: 'No muscle training. Focus on work shift steps and recovery.' },
  total_rest: { t: 'Total rest', rest: 'Total rest. Meal prep day for the upcoming week.', prep: true },
}
export const DEFAULT_WEEK: [ShiftCode, string][] = [['P', 'lower_body_a'], ['S', 'core_and_cardio'], ['S', 'lower_body_b'], ['M11', 'active_rest'], ['S', 'lower_body_a'], ['M11', 'core_and_cardio'], ['P', 'total_rest']]
export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
export const TARGET: Record<'k' | 'p' | 'c' | 'f', [number, number]> = { k: [1750, 1850], p: [110, 140], c: [180, 200], f: [45, 55] }
