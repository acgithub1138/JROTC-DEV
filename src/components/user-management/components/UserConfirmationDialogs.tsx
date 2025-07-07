import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { User } from '../types';

interface UserConfirmationDialogsProps {
  disableDialogOpen: boolean;
  bulkDialogOpen: boolean;
  bulkLoading: boolean;
  userToDisable: User | null;
  selectedCount: number;
  activeTab: 'active' | 'disabled';
  onDisableDialogChange: (open: boolean) => void;
  onBulkDialogChange: (open: boolean) => void;
  onDisableUser: () => void;
  onBulkAction: () => void;
}

export const UserConfirmationDialogs = ({
  disableDialogOpen,
  bulkDialogOpen,
  bulkLoading,
  userToDisable,
  selectedCount,
  activeTab,
  onDisableDialogChange,
  onBulkDialogChange,
  onDisableUser,
  onBulkAction,
}: UserConfirmationDialogsProps) => {
  return (
    <>
      {/* Disable User Dialog */}
      <AlertDialog open={disableDialogOpen} onOpenChange={onDisableDialogChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disable User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to disable {userToDisable?.first_name} {userToDisable?.last_name}?
              <br /><br />
              <strong>This will prevent them from signing in to the system.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDisableUser}
              className="bg-red-600 hover:bg-red-700"
            >
              Disable User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Toggle Confirmation Dialog */}
      <AlertDialog open={bulkDialogOpen} onOpenChange={onBulkDialogChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {activeTab === 'active' ? 'Disable' : 'Enable'} Multiple Users
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {activeTab === 'active' ? 'disable' : 'enable'} {selectedCount} selected user{selectedCount > 1 ? 's' : ''}?
              <br /><br />
              <strong>
                This will {activeTab === 'active' ? 'prevent them from signing in to' : 'allow them to access'} the system.
              </strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onBulkAction}
              disabled={bulkLoading}
              className={activeTab === 'active' ? "bg-red-600 hover:bg-red-700" : ""}
            >
              {bulkLoading ? 
                `${activeTab === 'active' ? 'Disabling' : 'Enabling'}...` : 
                `${activeTab === 'active' ? 'Disable' : 'Enable'} Users`
              }
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};