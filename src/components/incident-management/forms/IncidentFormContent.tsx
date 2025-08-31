import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useIncidentPermissions } from '@/hooks/useModuleSpecificPermissions';
import { useIncidentForm } from './hooks/useIncidentForm';
import { useAttachments } from '@/hooks/attachments/useAttachments';
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';
import { AttachmentSection } from '@/components/attachments/AttachmentSection';
import { SharedIncidentFormLayout } from './SharedIncidentFormLayout';
import { IncidentTitleField } from './fields/IncidentTitleField';
import { IncidentDescriptionField } from './fields/IncidentDescriptionField';
import type { Incident } from '@/hooks/incidents/types';
interface IncidentFormContentProps {
  mode: 'create' | 'edit';
  incident?: Incident;
  onSuccess: (incident: Incident) => void;
  onCancel: () => void;
  showAttachments?: boolean;
  onIncidentCreated?: (incident: Incident) => void;
}
export const IncidentFormContent: React.FC<IncidentFormContentProps> = ({
  mode,
  incident,
  onSuccess,
  onCancel,
  showAttachments = false,
  onIncidentCreated
}) => {
  const {
    userProfile
  } = useAuth();
  const {
    canCreate,
    canUpdate,
    canUpdateAssigned
  } = useIncidentPermissions();

  // Form state
  const {
    form,
    onSubmit,
    onError,
    isSubmitting,
    isLoading,
    priorityOptions,
    categoryOptions
  } = useIncidentForm({
    mode,
    incident,
    onSuccess,
    canAssignIncidents: canUpdate // Admins can assign incidents
  });

  // Attachments for create mode
  const {
    uploadFile
  } = useAttachments('incident', incident?.id);

  // State for managing dialogs and changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingFiles2, setPendingFiles] = useState<File[]>([]);

  // Handle file uploads after incident creation
  const uploadPendingFiles = async (incidentId: string) => {
    if (pendingFiles2.length === 0) return;
    try {
      for (const file of pendingFiles2) {
        await uploadFile({
          record_type: 'incident',
          record_id: incidentId,
          file: file
        });
      }
      setPendingFiles([]);
    } catch (error) {
      console.error('Error uploading files:', error);
    }
  };

  // Watch for form changes to detect unsaved changes
  useEffect(() => {
    if (mode === 'edit' && incident) {
      const subscription = form.watch(formData => {
        const hasChanges = formData.title !== incident.title || formData.description !== (incident.description || '') || formData.priority !== incident.priority || formData.category !== incident.category || (formData.due_date?.getTime() || null) !== (incident.due_date ? new Date(incident.due_date).getTime() : null);
        setHasUnsavedChanges(hasChanges);
      });
      return () => subscription.unsubscribe();
    }
  }, [form, mode, incident]);

  // Handle form submission with file uploads
  const handleSubmit = async (data: any) => {
    try {
      const result = await onSubmit(data);
      if (result && mode === 'create') {
        await uploadPendingFiles(result.id);
        onIncidentCreated?.(result);
      }
    } catch (error) {
      onError(error);
    }
  };

  // Handle cancel with unsaved changes check
  const handleCancel = () => {
    if (hasUnsavedChanges) {
      setShowConfirmDialog(true);
    } else {
      onCancel();
    }
  };
  const confirmCancel = () => {
    setShowConfirmDialog(false);
    onCancel();
  };
  const cancelConfirm = () => {
    setShowConfirmDialog(false);
  };

  // Show loading state while form is initializing
  if (isLoading) {
    return <div className="p-6 text-center">Loading incident form...</div>;
  }

  // File input section for create mode
  const fileInputSection = mode === 'create' ? <div className="flex items-center gap-4">
      
      <div className="flex-1">
        <input type="file" multiple onChange={e => {
        const files = Array.from(e.target.files || []);
        setPendingFiles(prev => [...prev, ...files]);
      }} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/80" />
        {pendingFiles2.length > 0 && <div className="mt-2 space-y-2">
            <p className="text-sm text-muted-foreground">Files to upload:</p>
            {pendingFiles2.map((file, index) => <div key={index} className="flex items-center justify-between text-sm bg-muted p-2 rounded">
                <span>{file.name}</span>
                <button type="button" onClick={() => setPendingFiles(prev => prev.filter((_, i) => i !== index))} className="text-destructive hover:text-destructive/80">
                  Remove
                </button>
              </div>)}
          </div>}
      </div>
    </div> : null;

  // Attachment section for edit mode
  const attachmentSection = showAttachments && incident ? <AttachmentSection recordType="incident" recordId={incident.id} canEdit={canUpdate || canUpdateAssigned && incident.assigned_to_admin === userProfile?.id} /> : null;
  return <>
      <SharedIncidentFormLayout form={form} onSubmit={handleSubmit} mode={mode} incident={incident} canAssignIncidents={canUpdate} priorityOptions={priorityOptions} categoryOptions={categoryOptions} titleField={<IncidentTitleField form={form} />} descriptionField={<IncidentDescriptionField form={form} />} attachmentSection={attachmentSection || fileInputSection} onCancel={handleCancel} submitButtonText={mode === 'create' ? 'Create Incident' : 'Save Changes'} isSubmitting={isSubmitting} />

      <UnsavedChangesDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog} onDiscard={confirmCancel} onCancel={cancelConfirm} />
    </>;
};