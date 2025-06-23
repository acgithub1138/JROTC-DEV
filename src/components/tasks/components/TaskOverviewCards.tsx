
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Flag, Calendar as CalendarIcon, User, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { EditableField } from './EditableField';
import { EditState } from '../types/TaskDetailTypes';

interface TaskOverviewCardsProps {
  task: any;
  canEdit: boolean;
  editState: EditState;
  statusOptions: any[];
  priorityOptions: any[];
  assigneeOptions: any[];
  userProfile: any;
  onStartEdit: (field: string, currentValue: any) => void;
  onCancelEdit: () => void;
  onSaveEdit: (field: string) => void;
  onEditStateChange: (editState: EditState) => void;
  onQuickUpdate: (field: string, value: any) => void;
}

export const TaskOverviewCards: React.FC<TaskOverviewCardsProps> = ({
  task,
  canEdit,
  editState,
  statusOptions,
  priorityOptions,
  assigneeOptions,
  userProfile,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onEditStateChange,
  onQuickUpdate
}) => {
  const currentStatusOption = statusOptions.find(option => option.value === task.status);
  const currentPriorityOption = priorityOptions.find(option => option.value === task.priority);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Task Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Flag className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Priority:</span>
            <div 
              className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded px-2 py-1 -mx-2 -my-1 group"
              onClick={() => canEdit && onStartEdit('priority', task.priority)}
            >
              {editState.field === 'priority' ? (
                <EditableField
                  field="priority"
                  currentValue={task.priority}
                  displayValue=""
                  type="select"
                  options={priorityOptions}
                  canEdit={canEdit}
                  editState={editState}
                  onStartEdit={onStartEdit}
                  onCancelEdit={onCancelEdit}
                  onSaveEdit={onSaveEdit}
                  onEditStateChange={onEditStateChange}
                  onQuickUpdate={onQuickUpdate}
                />
              ) : (
                <>
                  <Badge className={currentPriorityOption?.color_class || 'bg-gray-100 text-gray-800'}>
                    {currentPriorityOption?.label || task.priority}
                  </Badge>
                  {canEdit && (
                    <MessageSquare className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                  )}
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Status:</span>
            <div 
              className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded px-2 py-1 -mx-2 -my-1 group"
              onClick={() => canEdit && onStartEdit('status', task.status)}
            >
              {editState.field === 'status' ? (
                <EditableField
                  field="status"
                  currentValue={task.status}
                  displayValue=""
                  type="select"
                  options={statusOptions}
                  canEdit={canEdit}
                  editState={editState}
                  onStartEdit={onStartEdit}
                  onCancelEdit={onCancelEdit}
                  onSaveEdit={onSaveEdit}
                  onEditStateChange={onEditStateChange}
                  onQuickUpdate={onQuickUpdate}
                />
              ) : (
                <>
                  <Badge className={currentStatusOption?.color_class || 'bg-gray-100 text-gray-800'}>
                    {currentStatusOption?.label || task.status.replace('_', ' ')}
                  </Badge>
                  {canEdit && (
                    <MessageSquare className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                  )}
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Due Date:</span>
            <EditableField
              field="due_date"
              currentValue={task.due_date ? new Date(task.due_date) : null}
              displayValue={task.due_date ? format(new Date(task.due_date), 'PPP') : 'No due date'}
              type="date"
              canEdit={canEdit}
              editState={editState}
              onStartEdit={onStartEdit}
              onCancelEdit={onCancelEdit}
              onSaveEdit={onSaveEdit}
              onEditStateChange={onEditStateChange}
              onQuickUpdate={onQuickUpdate}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Assignment Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Assigned to:</span>
            {userProfile?.role === 'instructor' || userProfile?.role === 'command_staff' ? (
              <EditableField
                field="assigned_to"
                currentValue={task.assigned_to || 'unassigned'}
                displayValue={task.assigned_to_profile
                  ? `${task.assigned_to_profile.first_name} ${task.assigned_to_profile.last_name}`
                  : 'Unassigned'}
                type="select"
                options={assigneeOptions}
                canEdit={canEdit}
                editState={editState}
                onStartEdit={onStartEdit}
                onCancelEdit={onCancelEdit}
                onSaveEdit={onSaveEdit}
                onEditStateChange={onEditStateChange}
                onQuickUpdate={onQuickUpdate}
              />
            ) : (
              <span className="text-sm font-medium">
                {task.assigned_to_profile
                  ? `${task.assigned_to_profile.first_name} ${task.assigned_to_profile.last_name}`
                  : 'Unassigned'}
              </span>
            )}
          </div>
          {task.assigned_by_profile && (
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">Assigned by:</span>
              <span className="text-sm font-medium">
                {task.assigned_by_profile.first_name} {task.assigned_by_profile.last_name}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Created:</span>
            <span className="text-sm font-medium">
              {format(new Date(task.created_at), 'PPP')}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
