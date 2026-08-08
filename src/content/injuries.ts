export const INJURIES: Record<string, { label: string; overallDelta: number; recoveryPhases: number }> = {
  hamstring: { label: "Hamstring strain", overallDelta: 3, recoveryPhases: 1 },
  ankle: { label: "High-ankle sprain", overallDelta: 5, recoveryPhases: 2 },
  shoulder: { label: "Shoulder sprain", overallDelta: 6, recoveryPhases: 2 },
  concussion: { label: "Concussion", overallDelta: 4, recoveryPhases: 1 },
  acl: { label: "Torn ACL", overallDelta: 14, recoveryPhases: 5 },
  collarbone: { label: "Broken collarbone", overallDelta: 7, recoveryPhases: 2 },
  turfToe: { label: "Turf toe", overallDelta: 2, recoveryPhases: 1 },
  mcl: { label: "MCL sprain", overallDelta: 8, recoveryPhases: 3 },
};
