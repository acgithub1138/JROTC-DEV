import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Loader2 } from 'lucide-react';
import { useUserRolesManagement } from '@/hooks/useUserRolesManagement';

export const AddRoleDialog = () => {
  const [open, setOpen] = useState(false);
  const [roleName, setRoleName] = useState('');
  const [displayLabel, setDisplayLabel] = useState('');
  const [isAdminOnly, setIsAdminOnly] = useState(false);
  
  const { addRole, isAdding } = useUserRolesManagement();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!roleName.trim()) {
      return;
    }

    addRole({
      roleName: roleName.trim(),
      roleLabel: displayLabel.trim() || previewLabel,
      adminOnly: isAdminOnly
    });
    
    // Reset form (success handling is in the hook)
    setOpen(false);
    setRoleName('');
    setDisplayLabel('');
    setIsAdminOnly(false);
  };

  // Generate display label from role name if not provided
  const previewLabel = displayLabel.trim() || 
    roleName.trim().split(/[\s_]+/).map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Role
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Role</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="roleName">Role Name *</Label>
            <Input
              id="roleName"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              placeholder="Enter role name (e.g., 'Team Leader')"
              required
            />
            <p className="text-sm text-muted-foreground">
              Will be converted to: <code>{roleName.trim().toLowerCase().replace(/\s+/g, '_')}</code>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayLabel">Display Label</Label>
            <Input
              id="displayLabel"
              value={displayLabel}
              onChange={(e) => setDisplayLabel(e.target.value)}
              placeholder="Custom display name (optional)"
            />
            <p className="text-sm text-muted-foreground">
              Preview: <strong>{previewLabel}</strong>
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isAdminOnly"
              checked={isAdminOnly}
              onCheckedChange={(checked) => setIsAdminOnly(checked as boolean)}
            />
            <Label htmlFor="isAdminOnly" className="text-sm">
              Admin Only (only admins can assign this role)
            </Label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isAdding}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!roleName.trim() || isAdding}
            >
              {isAdding && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Add Role
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};