import React from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface IssuedUsersPopoverProps {
  issuedTo: string[];
}

export const IssuedUsersPopover: React.FC<IssuedUsersPopoverProps> = ({ issuedTo }) => {
  const { data: users, isLoading } = useQuery({
    queryKey: ['issued-users', issuedTo],
    queryFn: async () => {
      if (!issuedTo || issuedTo.length === 0) return [];
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .in('id', issuedTo);
      
      if (error) throw error;
      return data;
    },
    enabled: issuedTo && issuedTo.length > 0,
  });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" title="View issued users">
          <Users className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Issued To ({issuedTo.length})</h4>
          {isLoading ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : users && users.length > 0 ? (
            <div className="space-y-1">
              {users.map((user) => (
                <div key={user.id} className="text-sm">
                  <div className="font-medium">{user.first_name} {user.last_name}</div>
                  <div className="text-muted-foreground text-xs">{user.email}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No users found</div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};