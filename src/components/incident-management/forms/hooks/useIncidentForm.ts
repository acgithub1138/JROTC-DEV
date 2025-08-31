import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useIncidentMutations } from '@/hooks/incidents/useIncidentMutations';
import { useIncidentPriorityOptions, useIncidentCategoryOptions, useIncidentStatusOptions } from '@/hooks/incidents/useIncidentsQuery';
import { useAuth } from '@/contexts/AuthContext';
import { createIncidentSchema, type IncidentFormData } from '../schemas/incidentFormSchema';
import type { Incident } from '@/hooks/incidents/types';

interface UseIncidentFormProps {
  mode: 'create' | 'edit';
  incident?: Incident;
  onSuccess: (incident: Incident) => void;
  canAssignIncidents?: boolean;
}

export const useIncidentForm = ({
  mode,
  incident,
  onSuccess,
  canAssignIncidents = false
}: UseIncidentFormProps) => {
  const { userProfile } = useAuth();
  const { createIncident, updateIncident } = useIncidentMutations();
  
  // Fetch options
  const { data: priorityOptions = [], isLoading: priorityLoading } = useIncidentPriorityOptions();
  const { data: categoryOptions = [], isLoading: categoryLoading } = useIncidentCategoryOptions();
  const { data: statusOptions = [] } = useIncidentStatusOptions();

  const isLoading = priorityLoading || categoryLoading;

  // Create form with dynamic schema
  const form = useForm<IncidentFormData>({
    resolver: zodResolver(createIncidentSchema(
      statusOptions.map(s => s.value),
      priorityOptions.map(p => p.value),
      categoryOptions.map(c => c.value),
      canAssignIncidents
    )),
    defaultValues: {
      title: incident?.title || '',
      description: incident?.description || '',
      priority: incident?.priority || 'medium',
      category: incident?.category || 'issue',
      status: incident?.status || 'open',
      assigned_to_admin: incident?.assigned_to_admin || 'unassigned',
      due_date: incident?.due_date ? new Date(incident.due_date) : undefined,
    }
  });

  // Update form values when options are loaded or incident changes
  useEffect(() => {
    if (incident) {
      form.reset({
        title: incident.title || '',
        description: incident.description || '',
        priority: incident.priority || 'medium',
        category: incident.category || 'issue',
        status: incident.status || 'open',
        assigned_to_admin: incident.assigned_to_admin || 'unassigned',
        due_date: incident.due_date ? new Date(incident.due_date) : undefined,
      });
    } else if (mode === 'create' && priorityOptions.length > 0 && categoryOptions.length > 0 && statusOptions.length > 0) {
      // Set default values for create mode when options are loaded
      const defaultPriority = priorityOptions.find(p => p.value === 'medium')?.value || priorityOptions[0]?.value || 'medium';
      const defaultCategory = categoryOptions.find(c => c.value === 'issue')?.value || categoryOptions[0]?.value || 'issue';
      const defaultStatus = statusOptions.find(s => s.value === 'open')?.value || statusOptions[0]?.value || 'open';
      
      form.reset({
        title: '',
        description: '',
        priority: defaultPriority,
        category: defaultCategory,
        status: defaultStatus,
        assigned_to_admin: 'unassigned',
        due_date: undefined,
      });
    }
  }, [form, incident, mode, priorityOptions, categoryOptions, statusOptions]);

  const onSubmit = async (data: IncidentFormData): Promise<Incident | undefined> => {
    try {
      if (mode === 'create') {
      const incidentData = {
        title: data.title,
        description: data.description,
        priority: data.priority,
        category: data.category,
        status: data.status,
        school_id: userProfile?.school_id || '',
        created_by: userProfile?.id,
        due_date: data.due_date ? data.due_date.toISOString() : null,
        assigned_to_admin: data.assigned_to_admin && data.assigned_to_admin !== 'unassigned' ? data.assigned_to_admin : null,
      };

      // Auto-set assigned_to_admin for incidents if not provided and user can assign
      if (canAssignIncidents && !incidentData.assigned_to_admin) {
        incidentData.assigned_to_admin = userProfile?.id;
      }

        const result = await createIncident.mutateAsync(incidentData);
        onSuccess(result);
        return result;
      } else if (mode === 'edit' && incident) {
        const updateData = {
          title: data.title,
          description: data.description,
          priority: data.priority,
          category: data.category,
          status: data.status,
          assigned_to_admin: data.assigned_to_admin && data.assigned_to_admin !== 'unassigned' ? data.assigned_to_admin : null,
          due_date: data.due_date ? data.due_date.toISOString() : null,
        };

        await updateIncident.mutateAsync({
          id: incident.id,
          data: updateData
        });
        
        // Create updated incident object for callback
        const updatedIncident = { ...incident, ...updateData };
        onSuccess(updatedIncident);
        return updatedIncident;
      }
    } catch (error) {
      console.error('🔴 FORM SUBMISSION ERROR:', error);
      console.error('🔴 FORM ERROR DETAILS:', {
        message: error?.message,
        code: error?.code,
        data: data
      });
      throw error;
    }
  };

  const onError = (error: any) => {
    console.error('Form validation error:', error);
  };

  return {
    form,
    onSubmit,
    onError,
    isSubmitting: createIncident.isPending || updateIncident.isPending,
    isLoading,
    priorityOptions: priorityOptions.map(option => ({ value: option.value, label: option.label })),
    categoryOptions: categoryOptions.map(option => ({ value: option.value, label: option.label })),
    statusOptions: statusOptions.map(option => ({ value: option.value, label: option.label })),
  };
};