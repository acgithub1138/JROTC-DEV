import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useIncidents } from "@/hooks/incidents/useIncidents";
import { useIncidentStatusOptions, useIncidentPriorityOptions, useIncidentCategoryOptions } from "@/hooks/incidents/useIncidentsQuery";
import { useAuth } from "@/contexts/AuthContext";
import type { Incident } from "@/hooks/incidents/types";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  priority: z.string().min(1, "Priority is required"),
  category: z.string().min(1, "Category is required"),
  status: z.string().optional(),
  assigned_to_admin: z.string().optional(),
  due_date: z.string().optional().refine((date) => {
    if (!date) return true; // Optional field, so empty is valid
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    return selectedDate >= today;
  }, "Due date must be today or in the future"),
});

type FormData = z.infer<typeof formSchema>;

interface IncidentFormProps {
  incident?: Incident | null;
  isOpen: boolean;
  onClose: () => void;
}

const IncidentForm: React.FC<IncidentFormProps> = ({
  incident,
  isOpen,
  onClose,
}) => {
  const { createIncident, updateIncident } = useIncidents();
  const { data: statusOptions = [] } = useIncidentStatusOptions();
  const { data: priorityOptions = [] } = useIncidentPriorityOptions();
  const { data: categoryOptions = [] } = useIncidentCategoryOptions();
  const { userProfile } = useAuth();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: incident?.title || "",
      description: incident?.description || "",
      priority: incident?.priority || "medium",
      category: incident?.category || "issue",
      status: incident?.status || "open",
      assigned_to_admin: incident?.assigned_to_admin || "",
      due_date: incident?.due_date ? new Date(incident.due_date).toISOString().split('T')[0] : "",
    },
  });

  const onSubmit = (data: FormData) => {
    if (incident) {
      updateIncident.mutate({
        id: incident.id,
        data: {
          ...data,
          due_date: data.due_date ? new Date(data.due_date).toISOString() : undefined,
        },
      });
    } else {
      createIncident.mutate({
        title: data.title,
        description: data.description,
        priority: data.priority,
        category: data.category,
        school_id: userProfile?.school_id || "",
        created_by: userProfile?.id,
        due_date: data.due_date ? new Date(data.due_date).toISOString() : undefined,
      });
    }
    
    // Close modal and reset form immediately after mutation is called
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {incident ? "Edit Incident" : "Create New Incident"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter incident title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter incident description"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categoryOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {field.value && (
                      <div className="text-sm text-muted-foreground mt-1">
                        {field.value === 'issue' && "Something is broken"}
                        {field.value === 'request' && "Ask a question"}
                        {field.value === 'enhancement' && "Request new functionality"}
                        {field.value === 'maintenance' && "System Update"}
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {incident && (
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {statusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createIncident.isPending || updateIncident.isPending}
              >
                {incident ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default IncidentForm;