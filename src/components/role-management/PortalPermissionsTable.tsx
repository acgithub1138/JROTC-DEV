import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { RefreshCw } from 'lucide-react';
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
          <th className="text-center p-3 font-medium min-w-24">
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
  isUpdating: boolean;
  handlePermissionChange: (moduleId: string, actionId: string, enabled: boolean) => void;
}
export const PortalPermissionsTable: React.FC<PortalPermissionsTableProps> = ({
  portal,
  modules,
  actions,
  rolePermissions,
  isUpdating,
  handlePermissionChange
}) => {
  // Filter modules based on portal
  const filteredModules = modules.filter(module => {
    if (portal === 'ccc') {
      // CCC Portal modules - show modules where is_competition_portal is false
      return !module.is_competition_portal;
    } else {
      // Competition Portal modules - show modules where is_competition_portal is true
      return module.is_competition_portal;
    }
  });
  return <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b">
            <th className="text-left p-3 font-medium">Module</th>
            {actions.map(action => <ColumnHeader key={action.id} action={action}>
                {action.label}
              </ColumnHeader>)}
          </tr>
        </thead>
        <tbody>
          {filteredModules.map(module => <tr key={module.id} className="border-b hover:bg-gray-50">
              <td className="p-3 font-medium py-[4px] px-[4px]">
                <div className="font-medium">{module.label}</div>
              </td>
              {actions.map(action => {
            const isEnabled = rolePermissions[module.name]?.[action.name] || false;
            return <td key={action.id} className="p-3 text-center px-[4px] py-[4px]">
                    <Checkbox checked={isEnabled} disabled={isUpdating} onCheckedChange={checked => handlePermissionChange(module.id, action.id, !!checked)} />
                  </td>;
          })}
            </tr>)}
        </tbody>
      </table>

      {isUpdating && <div className="flex items-center justify-center mt-4 text-sm text-gray-500">
          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          Updating permissions...
        </div>}
    </div>;
};