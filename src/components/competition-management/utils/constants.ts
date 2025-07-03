export const COMPETITION_EVENT_OPTIONS = [
  'Armed Inspection',
  'Armed Color Guard', 
  'Armed Exhibition',
  'Armed Dual Exhibition',
  'Armed Regulation',
  'Armed Solo Exhibition',
  'Unarmed Inspection',
  'Unarmed Color Guard',
  'Unarmed Exhibition', 
  'Unarmed Dual Exhibition',
  'Unarmed Regulation'
] as const;

export const PLACEMENT_OPTIONS = [
  'NA', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'
] as const;

export const JROTC_PROGRAM_OPTIONS = [
  { value: 'air_force', label: 'Air Force' },
  { value: 'army', label: 'Army' },
  { value: 'navy', label: 'Navy' },
  { value: 'marine_corps', label: 'Marine Corps' },
  { value: 'coast_guard', label: 'Coast Guard' },
  { value: 'space_force', label: 'Space Force' }
] as const;

export const COMPETITION_TYPE_OPTIONS = [
  { value: 'individual', label: 'Individual' },
  { value: 'team', label: 'Team' },
  { value: 'mixed', label: 'Mixed' }
] as const;