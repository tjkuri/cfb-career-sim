export const INJURIES: Record<string, { label: string; overallDelta: number; recoveryPhases: number }> = {
  hamstring: { label: "Hamstring strain", overallDelta: 3, recoveryPhases: 1 },
  ankle: { label: "High-ankle sprain", overallDelta: 5, recoveryPhases: 2 },
  shoulder: { label: "Shoulder sprain", overallDelta: 6, recoveryPhases: 2 },
  concussion: { label: "Concussion", overallDelta: 4, recoveryPhases: 1 },
  acl: { label: "Torn ACL", overallDelta: 14, recoveryPhases: 5 },
};
