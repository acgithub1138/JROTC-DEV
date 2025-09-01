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
        .select('id, first_name, last_name')
        .in('id', issuedTo)
        .order('last_name', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: issuedTo && issuedTo.length > 0,
  });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="h-6 w-6" title="View issued users">
          <Users className="w-3 h-3" />
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
                  <div className="font-medium">{user.last_name}, {user.first_name}</div>
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