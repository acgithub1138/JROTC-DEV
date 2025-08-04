import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';
import { useForm } from 'react-hook-form';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
interface JudgeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  judge?: any | null;
  onSubmit: (data: any) => Promise<void>;
}
interface JudgeFormData {
  name: string;
  phone: string;
  email: string;
  available: boolean;
}
export const JudgeDialog: React.FC<JudgeDialogProps> = ({
  open,
  onOpenChange,
  judge,
  onSubmit
}) => {
  const [showUnsavedDialog, setShowUnsavedDialog] = React.useState(false);
  
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    getValues
  } = useForm<JudgeFormData>({
    defaultValues: {
      name: judge?.name || '',
      phone: judge?.phone || '',
      email: judge?.email || '',
      available: judge?.available ?? true
    }
  });

  const [initialFormData, setInitialFormData] = React.useState<JudgeFormData>({
    name: '',
    phone: '',
    email: '',
    available: true
  });

  const currentFormData = watch();

  const { hasUnsavedChanges } = useUnsavedChanges({
    initialData: initialFormData,
    currentData: currentFormData
  });
  React.useEffect(() => {
    if (judge) {
      const formData = {
        name: judge.name || '',
        phone: judge.phone || '',
        email: judge.email || '',
        available: judge.available ?? true
      };
      reset(formData);
      setInitialFormData(formData);
    } else {
      const formData = {
        name: '',
        phone: '',
        email: '',
        available: true
      };
      reset(formData);
      setInitialFormData(formData);
    }
  }, [judge, reset]);
  const handleFormSubmit = async (data: JudgeFormData) => {
    await onSubmit(data);
    reset();
  };
  const available = watch('available');

  const handleOpenChange = (open: boolean) => {
    if (!open && hasUnsavedChanges) {
      setShowUnsavedDialog(true);
    } else {
      onOpenChange(open);
    }
  };

  const handleDiscardChanges = () => {
    reset(initialFormData);
    setShowUnsavedDialog(false);
    onOpenChange(false);
  };

  const handleCancelDiscard = () => {
    setShowUnsavedDialog(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[400px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {judge ? 'Edit Judge' : 'Create Judge'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input id="name" {...register('name', {
            required: true
          })} placeholder="Enter judge name" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" {...register('phone')} placeholder="Enter phone number" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register('email')} placeholder="Enter email address" />
          </div>

          <div className="flex items-center space-x-2">
            <Switch id="available" checked={available} onCheckedChange={checked => setValue('available', checked)} />
            <Label htmlFor="available">Available for judging</Label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {judge ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>

    <UnsavedChangesDialog
      open={showUnsavedDialog}
      onOpenChange={setShowUnsavedDialog}
      onDiscard={handleDiscardChanges}
      onCancel={handleCancelDiscard}
    />
    </>
  );
};