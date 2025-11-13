import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSchoolUsers } from '@/hooks/useSchoolUsers';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

interface ImpersonateUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ImpersonateUserModal: React.FC<ImpersonateUserModalProps> = ({
  open,
  onOpenChange,
}) => {
  const { users, isLoading } = useSchoolUsers(true); // Only active users
  const { userProfile, startImpersonation } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [isStarting, setIsStarting] = useState(false);

  // Filter out the current admin from the list
  const availableUsers = users.filter(user => user.id !== userProfile?.id);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'instructor':
        return 'bg-blue-100 text-blue-800';
      case 'command_staff':
        return 'bg-green-100 text-green-800';
      case 'cadet':
        return 'bg-gray-100 text-gray-800';
      case 'parent':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleImpersonate = async () => {
    if (!selectedUserId) return;

    setIsStarting(true);
    await startImpersonation(selectedUserId);
    // The page will reload, so we don't need to close the modal or reset state
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Impersonate User</DialogTitle>
          <DialogDescription>
            Select a user to view the application as them. All permissions and data access will match their role.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Select User</label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a user to impersonate..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {availableUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex items-center gap-2">
                          <span>
                            {user.last_name}, {user.first_name}
                          </span>
                          <Badge variant="secondary" className={`text-xs ${getRoleColor(user.role)}`}>
                            {user.role.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {availableUsers.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No active users available to impersonate.
                </p>
              )}
            </>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isStarting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleImpersonate}
            disabled={!selectedUserId || isStarting}
          >
            {isStarting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Starting...
              </>
            ) : (
              'OK'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
