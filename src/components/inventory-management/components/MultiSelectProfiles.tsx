import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Search } from 'lucide-react';
import { useSchoolUsers } from '@/hooks/useSchoolUsers';

interface MultiSelectProfilesProps {
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
}

export const MultiSelectProfiles: React.FC<MultiSelectProfilesProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { users, isLoading } = useSchoolUsers();

  const selectedUsers = users?.filter(user => value.includes(user.id)) || [];
  
  const filteredUsers = users?.filter(user => {
    const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  }) || [];

  const handleToggleUser = (userId: string) => {
    if (value.includes(userId)) {
      onChange(value.filter(id => id !== userId));
    } else {
      onChange([...value, userId]);
    }
  };

  const handleRemove = (userId: string) => {
    onChange(value.filter(id => id !== userId));
  };

  return (
    <div className="space-y-3">
      {/* Selected users display */}
      {selectedUsers.length > 0 && (
        <div className="space-y-2">
          <span className="text-sm font-medium">Selected Users ({selectedUsers.length})</span>
          <div className="flex flex-wrap gap-2">
            {selectedUsers.map((user) => (
              <Badge key={user.id} variant="secondary" className="flex items-center gap-1">
                {user.last_name}, {user.first_name}
                <button
                  type="button"
                  onClick={() => handleRemove(user.id)}
                  className="ml-1 hover:bg-red-100 rounded-full p-0.5"
                  disabled={disabled}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Search and user list */}
      <div className="border rounded-md">
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              disabled={disabled}
            />
          </div>
        </div>
        
        <ScrollArea className="h-48">
          <div className="p-2">
            {isLoading ? (
              <div className="text-sm text-gray-500 p-2">Loading users...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-sm text-gray-500 p-2">No users found.</div>
            ) : (
              <div className="space-y-2">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded"
                  >
                    <Checkbox
                      checked={value.includes(user.id)}
                      onCheckedChange={() => handleToggleUser(user.id)}
                      disabled={disabled}
                    />
                    <span 
                      className={`text-sm flex-1 ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                      onClick={disabled ? undefined : () => handleToggleUser(user.id)}
                    >
                      {user.last_name}, {user.first_name}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};