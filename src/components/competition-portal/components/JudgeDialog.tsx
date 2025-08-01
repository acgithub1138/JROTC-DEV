import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useForm } from 'react-hook-form';
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
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue
  } = useForm<JudgeFormData>({
    defaultValues: {
      name: judge?.name || '',
      phone: judge?.phone || '',
      email: judge?.email || '',
      available: judge?.available ?? true
    }
  });
  React.useEffect(() => {
    if (judge) {
      reset({
        name: judge.name || '',
        phone: judge.phone || '',
        email: judge.email || '',
        available: judge.available ?? true
      });
    } else {
      reset({
        name: '',
        phone: '',
        email: '',
        available: true
      });
    }
  }, [judge, reset]);
  const handleFormSubmit = async (data: JudgeFormData) => {
    await onSubmit(data);
    reset();
  };
  const available = watch('available');
  return <Dialog open={open} onOpenChange={onOpenChange}>
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {judge ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>;
};