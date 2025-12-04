import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
const ColumnHeader: React.FC<{
  action: any;
  children: React.ReactNode;
}> = ({
  action,
  children
}) => {
  const getTooltipContent = (actionName: string) => {
    switch (actionName) {
      case 'sidebar':
        return 'Access to module/page via navigation and sidebar';
      case 'view':
        return 'Access to view individual record details in modals/popups';
      case 'read':
        return 'Access to see data in tables, lists, and related content';
      case 'create':
        return 'Ability to create new records';
      case 'update':
        return 'Ability to edit existing records';
      case 'delete':
        return 'Ability to delete records';
      default:
        return action.description || '';
    }
  };
  return <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <th className="text-center p-3 font-medium min-w-24 py-[8px] px-[4px]">
            <span>{children}</span>
          </th>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">{getTooltipContent(action.name)}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>;
};
interface PortalPermissionsTableProps {
  portal: 'ccc' | 'competition';
  modules: any[];
  actions: any[];
  rolePermissions: any;
  isCellPending: (moduleId: string, actionId: string) => boolean;
  handlePermissionChange: (moduleId: string, actionId: string, enabled: boolean) => void;
}
export const PortalPermissionsTable: React.FC<PortalPermissionsTableProps> = ({
  portal,
  modules,
  actions,
  rolePermissions,
  isCellPending,
  handlePermissionChange
}) => {
  // Filter modules based on portal
  const filteredModules = modules.filter(module => {
    // Exclude dashboard widget modules from both portal grids
    if (module.name.startsWith('dashboard_')) {
      return false;
    }
    
    if (portal === 'ccc') {
      // CCC Portal modules - show modules where is_competition_portal is false
      return !module.is_competition_portal;
    } else {
      // Competition Portal modules - show modules where is_competition_portal is true
      return module.is_competition_portal;
    }
  });

  // Filter out widget actions from both portal grids
  const filteredActions = actions.filter(action => !action.is_widget);
  return <div className="overflow-auto max-h-[calc(100vh-300px)]">
      <table className="w-full border-collapse">
        <thead className="sticky top-0 bg-background z-10">
          <tr className="border-b">
            <th className="text-left p-3 font-medium bg-background">Module</th>
            {filteredActions.map(action => <ColumnHeader key={action.id} action={action}>
                {action.label}
              </ColumnHeader>)}
          </tr>
        </thead>
        <tbody>
          {filteredModules.map(module => <tr key={module.id} className="border-b hover:bg-gray-50">
              <td className="p-3 font-medium py-[4px] px-[4px]">
                <div className="font-medium">{module.label}</div>
              </td>
              {filteredActions.map(action => {
            const isEnabled = rolePermissions[module.id]?.[action.id] || false;
            return <td key={action.id} className="p-3 text-center px-[4px] py-[4px]">
                    <Checkbox 
                      checked={isEnabled} 
                      disabled={isCellPending(module.id, action.id)} 
                      onCheckedChange={(checked) => {
                        console.log('Checkbox changed:', {
                          module: module.name,
                          action: action.name,
                          currentState: isEnabled,
                          newState: checked,
                          checkedType: typeof checked
                        });
                        // Convert indeterminate state to true, otherwise use boolean value
                        const enabledValue = checked === 'indeterminate' ? true : Boolean(checked);
                        handlePermissionChange(module.id, action.id, enabledValue);
                      }} 
                    />
                  </td>;
          })}
            </tr>)}
        </tbody>
      </table>
    </div>;
};