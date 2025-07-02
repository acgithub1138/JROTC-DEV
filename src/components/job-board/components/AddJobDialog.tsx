
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSchoolUsers } from '@/hooks/useSchoolUsers';
import { useJobBoardRoles } from '../hooks/useJobBoardRoles';
import { NewJobBoard } from '../types';

interface AddJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (job: NewJobBoard) => void;
  loading: boolean;
}

export const AddJobDialog = ({ open, onOpenChange, onSubmit, loading }: AddJobDialogProps) => {
  const [formData, setFormData] = useState<NewJobBoard>({
    cadet_id: '',
    role: '',
    reports_to: '',
    assistant: '',
  });
  const [cadetPopoverOpen, setCadetPopoverOpen] = useState(false);

  const { users: cadets } = useSchoolUsers(true); // Only active cadets
  const { roles } = useJobBoardRoles();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.cadet_id || !formData.role || !formData.reports_to || !formData.assistant) return;
    
    onSubmit({
      ...formData,
      reports_to: formData.reports_to || undefined,
      assistant: formData.assistant || undefined,
    });
  };

  const handleClose = () => {
    setFormData({
      cadet_id: '',
      role: '',
      reports_to: '',
      assistant: '',
    });
    onOpenChange(false);
  };

  const formatCadetName = (cadet: any) => {
    return `${cadet.last_name}, ${cadet.first_name}${cadet.rank ? ` - ${cadet.rank}` : ''}`;
  };

  // Filter for active cadets only
  const activeCadets = cadets.filter(cadet => cadet.active);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Job</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cadet">Cadet *</Label>
            <Popover open={cadetPopoverOpen} onOpenChange={setCadetPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={cadetPopoverOpen}
                  className="w-full justify-between"
                >
                  {formData.cadet_id
                    ? formatCadetName(activeCadets.find((cadet) => cadet.id === formData.cadet_id))
                    : "Select cadet..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0 z-50" align="start">
                <Command>
                  <CommandInput placeholder="Search cadets..." />
                  <CommandList>
                    <CommandEmpty>No cadet found.</CommandEmpty>
                    <CommandGroup>
                      {activeCadets.map((cadet) => (
                        <CommandItem
                          key={cadet.id}
                          value={formatCadetName(cadet)}
                          onSelect={() => {
                            setFormData(prev => ({ ...prev, cadet_id: cadet.id }));
                            setCadetPopoverOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.cadet_id === cadet.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {formatCadetName(cadet)}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role *</Label>
            <Input
              id="role"
              value={formData.role}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
              placeholder="Enter job role..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reports_to">Reports To *</Label>
            <Select
              value={formData.reports_to}
              onValueChange={(value) => setFormData(prev => ({ ...prev, reports_to: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NA">NA</SelectItem>
                {roles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assistant">Assistant *</Label>
            <Select
              value={formData.assistant}
              onValueChange={(value) => setFormData(prev => ({ ...prev, assistant: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NA">NA</SelectItem>
                {roles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !formData.cadet_id || !formData.role || !formData.reports_to || !formData.assistant}
            >
              {loading ? 'Adding...' : 'Add Job'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
