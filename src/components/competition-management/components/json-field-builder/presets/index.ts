import { JsonField } from '../types';
import { airForceArmedColorGuard } from './airForceArmedColorGuard';
import { airForceArmedDualExhibition } from './airForceArmedDualExhibition';
import { airForceArmedExhibition } from './airForceArmedExhibition';
import { airForceArmedInspection } from './airForceArmedInspection';
import { airForceArmedRegulation } from './airForceArmedRegulation';

export interface PresetOption {
  key: string;
  label: string;
  fields: JsonField[];
}

export const COMPETITION_PRESETS: Record<string, PresetOption> = {
  air_force_armed_color_guard: {
    key: 'air_force_armed_color_guard',
    label: 'Air Force - Armed Color Guard',
    fields: airForceArmedColorGuard
  },
  air_force_armed_dual_exhibition: {
    key: 'air_force_armed_dual_exhibition',
    label: 'Air Force - Armed Dual Exhibition',
    fields: airForceArmedDualExhibition
  },
  air_force_armed_exhibition: {
    key: 'air_force_armed_exhibition',
    label: 'Air Force - Armed Exhibition',
    fields: airForceArmedExhibition
  },
  air_force_armed_inspection: {
    key: 'air_force_armed_inspection',
    label: 'Air Force - Armed Inspection',
    fields: airForceArmedInspection
  },
  air_force_armed_regulation: {
    key: 'air_force_armed_regulation',
    label: 'Air Force - Armed Regulation',
    fields: airForceArmedRegulation
  }
};

export const getPresetOptions = (): PresetOption[] => {
  return Object.values(COMPETITION_PRESETS).sort((a, b) => a.label.localeCompare(b.label));
};

export const getPresetByKey = (key: string): PresetOption | undefined => {
  return COMPETITION_PRESETS[key];
};