
export type JROTCProgram = 'air_force' | 'army' | 'navy' | 'marine_corps' | 'coast_guard' | 'space_force';

export interface Rank {
  id: string;
  rank: string;
  abbreviation: string;
  order: number;
}

export const JROTC_RANKS: Record<JROTCProgram, Rank[]> = {
  air_force: [
    { id: 'af-1', rank: 'Cadet Airman Basic', abbreviation: 'C/AB', order: 1 },
    { id: 'af-2', rank: 'Cadet Airman', abbreviation: 'C/Amn', order: 2 },
    { id: 'af-3', rank: 'Cadet Airman First Class', abbreviation: 'C/A1C', order: 3 },
    { id: 'af-4', rank: 'Cadet Senior Airman', abbreviation: 'C/SrA', order: 4 },
    { id: 'af-5', rank: 'Cadet Staff Sergeant', abbreviation: 'C/SSgt', order: 5 },
    { id: 'af-6', rank: 'Cadet Technical Sergeant', abbreviation: 'C/TSgt', order: 6 },
    { id: 'af-7', rank: 'Cadet Master Sergeant', abbreviation: 'C/MSgt', order: 7 },
    { id: 'af-8', rank: 'Cadet Senior Master Sergeant', abbreviation: 'C/SMSgt', order: 8 },
    { id: 'af-9', rank: 'Cadet Chief Master Sergeant', abbreviation: 'C/CMSgt', order: 9 },
    { id: 'af-10', rank: 'Cadet Second Lieutenant', abbreviation: 'C/2d Lt', order: 10 },
    { id: 'af-11', rank: 'Cadet First Lieutenant', abbreviation: 'C/1st Lt', order: 11 },
    { id: 'af-12', rank: 'Cadet Captain', abbreviation: 'C/Capt', order: 12 },
    { id: 'af-13', rank: 'Cadet Major', abbreviation: 'C/Maj', order: 13 },
    { id: 'af-14', rank: 'Cadet Lieutenant Colonel', abbreviation: 'C/Lt Col', order: 14 },
    { id: 'af-15', rank: 'Cadet Colonel', abbreviation: 'C/Col', order: 15 }
  ],
  army: [
    { id: 'army-1', rank: 'Cadet Private', abbreviation: 'C/PVT', order: 1 },
    { id: 'army-2', rank: 'Cadet Private First Class', abbreviation: 'C/PFC', order: 2 },
    { id: 'army-3', rank: 'Cadet Corporal', abbreviation: 'C/CPL', order: 3 },
    { id: 'army-4', rank: 'Cadet Sergeant', abbreviation: 'C/SGT', order: 4 },
    { id: 'army-5', rank: 'Cadet Staff Sergeant', abbreviation: 'C/SSG', order: 5 },
    { id: 'army-6', rank: 'Cadet Sergeant First Class', abbreviation: 'C/SFC', order: 6 },
    { id: 'army-7', rank: 'Cadet Master Sergeant', abbreviation: 'C/MSG', order: 7 },
    { id: 'army-8', rank: 'Cadet First Sergeant', abbreviation: 'C/1SG', order: 8 },
    { id: 'army-9', rank: 'Cadet Sergeant Major', abbreviation: 'C/SGM', order: 9 },
    { id: 'army-10', rank: 'Cadet Second Lieutenant', abbreviation: 'C/2LT', order: 10 },
    { id: 'army-11', rank: 'Cadet First Lieutenant', abbreviation: 'C/1LT', order: 11 },
    { id: 'army-12', rank: 'Cadet Captain', abbreviation: 'C/CPT', order: 12 },
    { id: 'army-13', rank: 'Cadet Major', abbreviation: 'C/MAJ', order: 13 },
    { id: 'army-14', rank: 'Cadet Lieutenant Colonel', abbreviation: 'C/LTC', order: 14 },
    { id: 'army-15', rank: 'Cadet Colonel', abbreviation: 'C/COL', order: 15 }
  ],
  navy: [
    { id: 'navy-1', rank: 'Cadet Seaman Recruit', abbreviation: 'C/SR', order: 1 },
    { id: 'navy-2', rank: 'Cadet Seaman Apprentice', abbreviation: 'C/SA', order: 2 },
    { id: 'navy-3', rank: 'Cadet Seaman', abbreviation: 'C/SN', order: 3 },
    { id: 'navy-4', rank: 'Cadet Petty Officer Third Class', abbreviation: 'C/PO3', order: 4 },
    { id: 'navy-5', rank: 'Cadet Petty Officer Second Class', abbreviation: 'C/PO2', order: 5 },
    { id: 'navy-6', rank: 'Cadet Petty Officer First Class', abbreviation: 'C/PO1', order: 6 },
    { id: 'navy-7', rank: 'Cadet Chief Petty Officer', abbreviation: 'C/CPO', order: 7 },
    { id: 'navy-8', rank: 'Cadet Senior Chief Petty Officer', abbreviation: 'C/SCPO', order: 8 },
    { id: 'navy-9', rank: 'Cadet Master Chief Petty Officer', abbreviation: 'C/MCPO', order: 9 },
    { id: 'navy-10', rank: 'Cadet Ensign', abbreviation: 'C/ENS', order: 10 },
    { id: 'navy-11', rank: 'Cadet Lieutenant Junior Grade', abbreviation: 'C/LTJG', order: 11 },
    { id: 'navy-12', rank: 'Cadet Lieutenant', abbreviation: 'C/LT', order: 12 },
    { id: 'navy-13', rank: 'Cadet Lieutenant Commander', abbreviation: 'C/LCDR', order: 13 },
    { id: 'navy-14', rank: 'Cadet Commander', abbreviation: 'C/CDR', order: 14 },
    { id: 'navy-15', rank: 'Cadet Captain', abbreviation: 'C/CAPT', order: 15 }
  ],
  marine_corps: [
    { id: 'mc-1', rank: 'Cadet Private', abbreviation: 'C/Pvt', order: 1 },
    { id: 'mc-2', rank: 'Cadet Private First Class', abbreviation: 'C/PFC', order: 2 },
    { id: 'mc-3', rank: 'Cadet Lance Corporal', abbreviation: 'C/LCpl', order: 3 },
    { id: 'mc-4', rank: 'Cadet Corporal', abbreviation: 'C/Cpl', order: 4 },
    { id: 'mc-5', rank: 'Cadet Sergeant', abbreviation: 'C/Sgt', order: 5 },
    { id: 'mc-6', rank: 'Cadet Staff Sergeant', abbreviation: 'C/SSgt', order: 6 },
    { id: 'mc-7', rank: 'Cadet Gunnery Sergeant', abbreviation: 'C/GySgt', order: 7 },
    { id: 'mc-8', rank: 'Cadet Master Sergeant', abbreviation: 'C/MSgt', order: 8 },
    { id: 'mc-9', rank: 'Cadet First Sergeant', abbreviation: 'C/1stSgt', order: 9 },
    { id: 'mc-10', rank: 'Cadet Master Gunnery Sergeant', abbreviation: 'C/MGySgt', order: 10 },
    { id: 'mc-11', rank: 'Cadet Sergeant Major', abbreviation: 'C/SgtMaj', order: 11 },
    { id: 'mc-12', rank: 'Cadet Second Lieutenant', abbreviation: 'C/2ndLt', order: 12 },
    { id: 'mc-13', rank: 'Cadet First Lieutenant', abbreviation: 'C/1stLt', order: 13 },
    { id: 'mc-14', rank: 'Cadet Captain', abbreviation: 'C/Capt', order: 14 },
    { id: 'mc-15', rank: 'Cadet Major', abbreviation: 'C/Maj', order: 15 },
    { id: 'mc-16', rank: 'Cadet Lieutenant Colonel', abbreviation: 'C/LtCol', order: 16 },
    { id: 'mc-17', rank: 'Cadet Colonel', abbreviation: 'C/Col', order: 17 }
  ],
  coast_guard: [
    { id: 'cg-1', rank: 'Cadet Seaman Recruit', abbreviation: 'C/SR', order: 1 },
    { id: 'cg-2', rank: 'Cadet Seaman Apprentice', abbreviation: 'C/SA', order: 2 },
    { id: 'cg-3', rank: 'Cadet Seaman', abbreviation: 'C/SN', order: 3 },
    { id: 'cg-4', rank: 'Cadet Petty Officer Third Class', abbreviation: 'C/PO3', order: 4 },
    { id: 'cg-5', rank: 'Cadet Petty Officer Second Class', abbreviation: 'C/PO2', order: 5 },
    { id: 'cg-6', rank: 'Cadet Petty Officer First Class', abbreviation: 'C/PO1', order: 6 },
    { id: 'cg-7', rank: 'Cadet Chief Petty Officer', abbreviation: 'C/CPO', order: 7 },
    { id: 'cg-8', rank: 'Cadet Senior Chief Petty Officer', abbreviation: 'C/SCPO', order: 8 },
    { id: 'cg-9', rank: 'Cadet Master Chief Petty Officer', abbreviation: 'C/MCPO', order: 9 },
    { id: 'cg-10', rank: 'Cadet Ensign', abbreviation: 'C/ENS', order: 10 },
    { id: 'cg-11', rank: 'Cadet Lieutenant Junior Grade', abbreviation: 'C/LTJG', order: 11 },
    { id: 'cg-12', rank: 'Cadet Lieutenant', abbreviation: 'C/LT', order: 12 },
    { id: 'cg-13', rank: 'Cadet Lieutenant Commander', abbreviation: 'C/LCDR', order: 13 },
    { id: 'cg-14', rank: 'Cadet Commander', abbreviation: 'C/CDR', order: 14 },
    { id: 'cg-15', rank: 'Cadet Captain', abbreviation: 'C/CAPT', order: 15 }
  ],
  space_force: [
    { id: 'sf-1', rank: 'Cadet Specialist 1', abbreviation: 'C/Spc1', order: 1 },
    { id: 'sf-2', rank: 'Cadet Specialist 2', abbreviation: 'C/Spc2', order: 2 },
    { id: 'sf-3', rank: 'Cadet Specialist 3', abbreviation: 'C/Spc3', order: 3 },
    { id: 'sf-4', rank: 'Cadet Specialist 4', abbreviation: 'C/Spc4', order: 4 },
    { id: 'sf-5', rank: 'Cadet Sergeant', abbreviation: 'C/Sgt', order: 5 },
    { id: 'sf-6', rank: 'Cadet Technical Sergeant', abbreviation: 'C/TSgt', order: 6 },
    { id: 'sf-7', rank: 'Cadet Master Sergeant', abbreviation: 'C/MSgt', order: 7 },
    { id: 'sf-8', rank: 'Cadet Senior Master Sergeant', abbreviation: 'C/SMSgt', order: 8 },
    { id: 'sf-9', rank: 'Cadet Chief Master Sergeant', abbreviation: 'C/CMSgt', order: 9 },
    { id: 'sf-10', rank: 'Cadet Second Lieutenant', abbreviation: 'C/2d Lt', order: 10 },
    { id: 'sf-11', rank: 'Cadet First Lieutenant', abbreviation: 'C/1st Lt', order: 11 },
    { id: 'sf-12', rank: 'Cadet Captain', abbreviation: 'C/Capt', order: 12 },
    { id: 'sf-13', rank: 'Cadet Major', abbreviation: 'C/Maj', order: 13 },
    { id: 'sf-14', rank: 'Cadet Lieutenant Colonel', abbreviation: 'C/Lt Col', order: 14 },
    { id: 'sf-15', rank: 'Cadet Colonel', abbreviation: 'C/Col', order: 15 }
  ]
};

export const getRanksForProgram = (program: JROTCProgram | null | undefined): Rank[] => {
  if (!program || !JROTC_RANKS[program]) {
    return [];
  }
  return JROTC_RANKS[program];
};

export const getAllRankOptions = (): { value: string; label: string }[] => {
  const allRanks: { value: string; label: string }[] = [];
  
  Object.values(JROTC_RANKS).forEach(programRanks => {
    programRanks.forEach(rank => {
      allRanks.push({
        value: rank.rank,
        label: `${rank.rank} (${rank.abbreviation})`
      });
    });
  });
  
  return allRanks;
};
