import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { RefreshCw, GripVertical } from 'lucide-react';
import { isPermissionRelevantForModule } from '@/utils/modulePermissionMappings';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableColumnHeaderProps {
  action: any;
  children: React.ReactNode;
}

const SortableColumnHeader: React.FC<SortableColumnHeaderProps> = ({
  action,
  children
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: action.id
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

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

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <th 
            ref={setNodeRef} 
            style={style} 
            className="text-center p-3 font-medium min-w-24 relative group cursor-move" 
            {...attributes} 
            {...listeners}
          >
            <div className="flex items-center justify-center gap-1">
              <GripVertical className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              <span>{children}</span>
            </div>
          </th>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">{getTooltipContent(action.name)}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

interface PortalPermissionsTableProps {
  portal: 'ccc' | 'competition';
  modules: any[];
  actions: any[];
  orderedActions: any[];
  rolePermissions: any;
  isUpdating: boolean;
  sensors: any;
  handleDragEnd: (event: any) => void;
  handlePermissionChange: (moduleId: string, actionId: string, enabled: boolean) => void;
}

export const PortalPermissionsTable: React.FC<PortalPermissionsTableProps> = ({
  portal,
  modules,
  actions,
  orderedActions,
  rolePermissions,
  isUpdating,
  sensors,
  handleDragEnd,
  handlePermissionChange
}) => {
  // Filter modules based on portal
  const filteredModules = modules.filter(module => {
    if (portal === 'ccc') {
      // CCC Portal modules - exclude competition portal modules
      return !module.name.startsWith('cp_');
    } else {
      // Competition Portal modules - only include cp_ modules
      return module.name.startsWith('cp_');
    }
  });

  return (
    <div className="overflow-x-auto">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b">
              <th className="text-left p-3 font-medium">Module</th>
              <SortableContext items={orderedActions.map(action => action.id)} strategy={horizontalListSortingStrategy}>
                {orderedActions.map(action => (
                  <SortableColumnHeader key={action.id} action={action}>
                    {action.name === 'sidebar' ? 'Module Access' : action.label}
                  </SortableColumnHeader>
                ))}
              </SortableContext>
            </tr>
          </thead>
          <tbody>
            {filteredModules.map(module => (
              <tr key={module.id} className="border-b hover:bg-gray-50">
                <td className="p-3 font-medium">
                  <div className="font-medium">{module.label}</div>
                </td>
                {orderedActions.map(action => {
                  const isRelevant = isPermissionRelevantForModule(module.name, action.name);
                  const isEnabled = rolePermissions[module.name]?.[action.name] || false;
                  return (
                    <td key={action.id} className="p-3 text-center">
                      {isRelevant ? (
                        <Checkbox 
                          checked={isEnabled} 
                          disabled={isUpdating} 
                          onCheckedChange={checked => handlePermissionChange(module.id, action.id, !!checked)} 
                        />
                      ) : null}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </DndContext>

      {isUpdating && (
        <div className="flex items-center justify-center mt-4 text-sm text-gray-500">
          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          Updating permissions...
        </div>
      )}
    </div>
  );
};