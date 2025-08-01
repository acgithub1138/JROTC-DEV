import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSchoolUsers } from '@/hooks/useSchoolUsers';

const formSchema = z.object({
  resource: z.string().min(1, 'Resource is required'),
  location: z.string().optional(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  assignment_details: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface AddResourceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  competitionId: string;
  onResourceAdded: (resourceData: any) => Promise<any>;
}

export const AddResourceModal: React.FC<AddResourceModalProps> = ({
  open,
  onOpenChange,
  competitionId,
  onResourceAdded,
}) => {
  const { users, isLoading: usersLoading } = useSchoolUsers(true); // Only active users
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      resource: '',
      location: '',
      start_time: '',
      end_time: '',
      assignment_details: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await onResourceAdded({
        ...data,
        competition_id: competitionId,
        start_time: data.start_time ? new Date(data.start_time).toISOString() : null,
        end_time: data.end_time ? new Date(data.end_time).toISOString() : null,
      });
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Error adding resource:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Resource</DialogTitle>
          <DialogDescription>
            Add a new resource assignment for this competition.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="resource"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resource (User)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={usersLoading ? "Loading users..." : "Select a user"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.first_name} {user.last_name} ({user.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter location" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="start_time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Time</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="end_time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Time</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="assignment_details"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assignment Details</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter assignment details" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Adding...' : 'Add Resource'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};