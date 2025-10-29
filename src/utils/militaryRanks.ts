export type MilitaryBranch = 
  | 'Army'
  | 'Navy'
  | 'Marine Corps'
  | 'Air Force'
  | 'Space Force'
  | 'Coast Guard';

export interface BranchRanks {
  branch: MilitaryBranch;
  ranks: string[];
}

export const MILITARY_RANKS: BranchRanks[] = [
  {
    branch: 'Army',
    ranks: [
      'Private (PVT)',
      'Private (PV2)',
      'Private First Class (PFC)',
      'Specialist (SPC) / Corporal (CPL)',
      'Sergeant (SGT)',
      'Staff Sergeant (SSG)',
      'Sergeant First Class (SFC)',
      'Master Sergeant (MSG) / First Sergeant (1SG)',
      'Sergeant Major (SGM) / Command Sergeant Major (CSM) / Sergeant Major of the Army (SMA)',
      'Warrant Officer 1 (WO1)',
      'Chief Warrant Officer 2 (CW2)',
      'Chief Warrant Officer 3 (CW3)',
      'Chief Warrant Officer 4 (CW4)',
      'Chief Warrant Officer 5 (CW5)',
      'Second Lieutenant (2LT)',
      'First Lieutenant (1LT)',
      'Captain (CPT)',
      'Major (MAJ)',
      'Lieutenant Colonel (LTC)',
      'Colonel (COL)',
      'Brigadier General (BG)',
      'Major General (MG)',
      'Lieutenant General (LTG)',
      'General (GEN)',
      'Special: General of the Army (GOA) *(wartime only)*',
    ]
  },
  {
    branch: 'Navy',
    ranks: [
      'Seaman Recruit (SR)',
      'Seaman Apprentice (SA)',
      'Seaman (SN)',
      'Petty Officer Third Class (PO3)',
      'Petty Officer Second Class (PO2)',
      'Petty Officer First Class (PO1)',
      'Chief Petty Officer (CPO)',
      'Senior Chief Petty Officer (SCPO)',
      'Master Chief Petty Officer (MCPO) / Master Chief Petty Officer of the Navy (MCPON)',
      'Chief Warrant Officer 2 (CWO2) *(and up to CWO5)*',
      'Ensign (ENS)',
      'Lieutenant Junior Grade (LTJG)',
      'Lieutenant (LT)',
      'Lieutenant Commander (LCDR)',
      'Commander (CDR)',
      'Captain (CAPT)',
      'Rear Admiral (Lower Half) (RDML)',
      'Rear Admiral (Upper Half) (RADM)',
      'Vice Admiral (VADM)',
      'Admiral (ADM)',
    ]
  },
  {
    branch: 'Marine Corps',
    ranks: [
      'Private (Pvt)',
      'Private First Class (PFC)',
      'Lance Corporal (LCpl)',
      'Corporal (Cpl)',
      'Sergeant (Sgt)',
      'Staff Sergeant (SSgt)',
      'Gunnery Sergeant (GySgt)',
      'Master Sergeant (MSgt) / First Sergeant (1Sgt)',
      'Master Gunnery Sergeant (MGySgt) / Sergeant Major (SgtMaj) / Sergeant Major of the Marine Corps (SMMC)',
      'Warrant Officers (WO1)',
      'Second Lieutenant (2ndLt)',
      'First Lieutenant (1stLt)',
      'Captain (Capt)',
      'Major (Maj)',
      'Lieutenant Colonel (LtCol)',
      'Colonel (Col)',
      'Brigadier General (BGen)',
      'Major General (MajGen)',
      'Lieutenant General (LtGen)',
      'General (Gen)',
    ]
  },
  {
    branch: 'Air Force',
    ranks: [
      'Airman Basic (AB)',
      'Airman (Amn)',
      'Airman First Class (A1C)',
      'Senior Airman (SrA)',
      'Staff Sergeant (SSgt)',
      'Technical Sergeant (TSgt)',
      'Master Sergeant (MSgt) / First Sergeant (additional duty)',
      'Senior Master Sergeant (SMSgt) / First Sergeant (additional duty)',
      'Chief Master Sergeant (CMSgt) / Command Chief Master Sergeant / Chief Master Sergeant of the Air Force (CMSAF)',
      'Second Lieutenant (2d Lt)',
      'First Lieutenant (1st Lt)',
      'Captain (Capt)',
      'Major (Maj)',
      'Lieutenant Colonel (Lt Col)',
      'Colonel (Col)',
      'Brigadier General (Brig Gen)',
      'Major General (Maj Gen)',
      'Lieutenant General (Lt Gen)',
      'General (Gen)',
    ]
  },
  {
    branch: 'Space Force',
    ranks: [
      'Specialist 1 (Spc1) *(formerly Airman Basic)*',
      'Specialist 2 (Spc2)',
      'Specialist 3 (Spc3)',
      'Specialist 4 (Spc4)',
      'Sergeant (Sgt)',
      'Technical Sergeant (TSgt)',
      'Master Sergeant (MSgt) / First Sergeant (if designated)',
      'Senior Master Sergeant (SMSgt) / First Sergeant (if designated)',
      'Chief Master Sergeant (CMSgt) / Chief Master Sergeant of the Space Force (CMSSF)',
      'Second Lieutenant (2d Lt)',
      'First Lieutenant (1st Lt)',
      'Captain (Capt)',
      'Major (Maj)',
      'Lieutenant Colonel (Lt Col)',
      'Colonel (Col)',
      'Brigadier General (Brig Gen)',
      'Major General (Maj Gen)',
      'Lieutenant General (Lt Gen)',
      'General (Gen)',
    ]
  },
  {
    branch: 'Coast Guard',
    ranks: [
      'Seaman Recruit (SR)',
      'Seaman Apprentice (SA)',
      'Seaman (SN)',
      'Petty Officer Third Class (PO3)',
      'Petty Officer Second Class (PO2)',
      'Petty Officer First Class (PO1)',
      'Chief Petty Officer (CPO)',
      'Senior Chief Petty Officer (SCPO)',
      'Master Chief Petty Officer (MCPO) / Master Chief Petty Officer of the Coast Guard (MCPOCG)',
      'Warrant Officers (CWO2‑CWO4) *(though rare)*',
      'Ensign (ENS)',
      'Lieutenant Junior Grade (LTJG)',
      'Lieutenant (LT)',
      'Lieutenant Commander (LCDR)',
      'Commander (CDR)',
      'Captain (CAPT)',
      'Rear Admiral (Lower Half) (RDML)',
      'Rear Admiral (RADM)',
      'Vice Admiral (VADM)',
      'Admiral (ADM)',
    ]
  },
];

export const getBranches = (): string[] => {
  return MILITARY_RANKS.map(br => br.branch);
};

export const getRanksForBranch = (branch: MilitaryBranch | null | undefined): string[] => {
  if (!branch) return [];
  const branchData = MILITARY_RANKS.find(br => br.branch === branch);
  return branchData ? branchData.ranks : [];
};
