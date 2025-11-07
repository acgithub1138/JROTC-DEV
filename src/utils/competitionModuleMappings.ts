import { supabase } from '@/integrations/supabase/client';
import { filterCompetitionModulesBySchoolFlags } from './competitionPermissions';

export interface ModuleMapping {
  moduleName: string;
  path: string;
  label: string;
  icon: string;
  sortOrder: number;
}

export interface ModuleMappings {
  pathToModuleMap: Map<string, string>;
  moduleToPathMap: Map<string, string>;
  modules: ModuleMapping[];
}

/**
 * Fetch competition portal module mappings from the database
 * This creates bidirectional mappings between paths and module names
 */
export const fetchCompetitionModuleMappings = async (
  hasPermission: (module: string, action: string) => boolean,
  hasCompetitionModule: boolean,
  hasCompetitionPortal: boolean
): Promise<ModuleMappings> => {
  try {
    const { data: modules, error } = await supabase.rpc('get_permission_modules_simple', {
      is_tab_param: false,
      parent_module_param: null,
      is_active_param: true
    });

    if (error) {
      console.error('Error fetching competition portal modules:', error);
      return createEmptyMappings();
    }

    // Filter for competition portal modules only
    const allCompetitionModules = (modules || [])
      .filter((module: any) => module.is_competition_portal)
      .map((module: any) => ({
        moduleName: module.name,
        path: module.path,
        label: module.label,
        icon: module.icon,
        sortOrder: module.sort_order || 0
      }));

    // Filter by school-level flags, then by role permissions
    const schoolFilteredModules = filterCompetitionModulesBySchoolFlags(
      allCompetitionModules.map(m => ({ name: m.moduleName, id: m.moduleName })),
      hasCompetitionModule,
      hasCompetitionPortal
    );

    const accessibleModules = allCompetitionModules
      .filter((module: ModuleMapping) => 
        schoolFilteredModules.some(m => m.name === module.moduleName) &&
        hasPermission(module.moduleName, 'sidebar')
      )
      .sort((a: ModuleMapping, b: ModuleMapping) => a.sortOrder - b.sortOrder);

    // Build bidirectional mappings
    const pathToModuleMap = new Map<string, string>();
    const moduleToPathMap = new Map<string, string>();

    // Sort by path length (descending) to ensure more specific paths are checked first
    // e.g., /my-competitions-analytics before /my-competitions
    const sortedByPathLength = [...accessibleModules].sort(
      (a, b) => b.path.length - a.path.length
    );

    sortedByPathLength.forEach((module) => {
      const cleanPath = module.path.startsWith('/') ? module.path : `/${module.path}`;
      pathToModuleMap.set(cleanPath, module.moduleName);
      moduleToPathMap.set(module.moduleName, cleanPath);
    });

    console.log('Loaded competition module mappings:', {
      modules: accessibleModules,
      pathToModuleMap: Array.from(pathToModuleMap.entries()),
      moduleToPathMap: Array.from(moduleToPathMap.entries())
    });

    return {
      pathToModuleMap,
      moduleToPathMap,
      modules: accessibleModules
    };
  } catch (error) {
    console.error('Error in fetchCompetitionModuleMappings:', error);
    return createEmptyMappings();
  }
};

/**
 * Helper to create empty mappings in case of errors
 */
const createEmptyMappings = (): ModuleMappings => ({
  pathToModuleMap: new Map(),
  moduleToPathMap: new Map(),
  modules: []
});

/**
 * Find the module name for a given path
 * Checks for exact match first, then startsWith match
 */
export const findModuleForPath = (
  currentPath: string,
  pathToModuleMap: Map<string, string>
): string | null => {
  console.log('🔎 findModuleForPath:', {
    currentPath,
    availablePaths: Array.from(pathToModuleMap.entries())
  });

  // Try exact match first
  if (pathToModuleMap.has(currentPath)) {
    const module = pathToModuleMap.get(currentPath) || null;
    console.log('✅ Exact match found:', { currentPath, module });
    return module;
  }

  // Try startsWith match (for sub-routes)
  // Sort paths by length (descending) to match most specific first
  const sortedPaths = Array.from(pathToModuleMap.keys()).sort(
    (a, b) => b.length - a.length
  );

  for (const path of sortedPaths) {
    if (currentPath.startsWith(path + '/') || currentPath === path) {
      const module = pathToModuleMap.get(path) || null;
      console.log('✅ StartsWith match found:', { currentPath, matchedPath: path, module });
      return module;
    }
  }

  console.log('❌ No match found for path:', currentPath);
  return null;
};
