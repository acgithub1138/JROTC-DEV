import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useSchoolUsers } from '@/hooks/useSchoolUsers';
import { useIsMobile } from '@/hooks/use-mobile';

interface IncidentInfoRightFieldsProps {
  form: UseFormReturn<any>;
  mode: 'create' | 'edit';
  canAssignIncidents: boolean;
  priorityOptions: Array<{ value: string; label: string; }>;
}

export const IncidentInfoRightFields: React.FC<IncidentInfoRightFieldsProps> = ({
  form,
  mode,
  canAssignIncidents,
  priorityOptions
}) => {
  const { users } = useSchoolUsers();
  const isMobile = useIsMobile();
  
  // Filter users for assignment (admins only for incidents)
  const adminOptions = [
    { value: 'unassigned', label: 'Unassigned' },
    ...users.filter(user => user.role === 'admin').map(user => ({
      value: user.id,
      label: `${user.last_name}, ${user.first_name}`
    }))
  ];

  return (
    <>
      {/* Priority */}
      <FormField
        control={form.control}
        name="priority"
        render={({ field }) => (
          <FormItem className={`flex ${isMobile ? 'flex-col' : 'items-center'} gap-${isMobile ? '2' : '4'}`}>
            <FormLabel className={isMobile ? '' : 'w-32 text-right flex-shrink-0'}>
              Priority <span className="text-destructive">*</span>
            </FormLabel>
            <div className="flex-1">
              <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {priorityOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </div>
          </FormItem>
        )}
      />

      {/* Status */}
      <FormField
        control={form.control}
        name="status"
        render={({ field }) => (
          <FormItem className={`flex ${isMobile ? 'flex-col' : 'items-center'} gap-${isMobile ? '2' : '4'}`}>
            <FormLabel className={isMobile ? '' : 'w-32 text-right flex-shrink-0'}>Status</FormLabel>
            <div className="flex-1">
              <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </div>
          </FormItem>
        )}
      />

      {/* Assigned To - Only show if user can assign incidents */}
      {canAssignIncidents && (
        <FormField
          control={form.control}
          name="assigned_to_admin"
          render={({ field }) => (
            <FormItem className={`flex ${isMobile ? 'flex-col' : 'items-center'} gap-${isMobile ? '2' : '4'}`}>
              <FormLabel className={isMobile ? '' : 'w-32 text-right flex-shrink-0'}>Assigned To</FormLabel>
              <div className="flex-1">
                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select assignee" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {adminOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />
      )}

      {/* Due Date */}
      <FormField
        control={form.control}
        name="due_date"
        render={({ field }) => (
          <FormItem className={`flex ${isMobile ? 'flex-col' : 'items-center'} gap-${isMobile ? '2' : '4'}`}>
            <FormLabel className={isMobile ? '' : 'w-32 text-right flex-shrink-0'}>Due Date</FormLabel>
            <div className="flex-1">
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date < new Date()
                    }
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </div>
          </FormItem>
        )}
      />
    </>
  );
};