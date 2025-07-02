import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSchoolUsers } from '@/hooks/useSchoolUsers';

interface MultiSelectProfilesProps {
  value: string[];
  onChange: (value: string[]) => void;
}

export const MultiSelectProfiles: React.FC<MultiSelectProfilesProps> = ({
  value,
  onChange,
}) => {
  const [open, setOpen] = useState(false);
  const { users, isLoading } = useSchoolUsers();

  const selectedUsers = users?.filter(user => value.includes(user.id)) || [];
  const availableUsers = users?.filter(user => !value.includes(user.id)) || [];

  const handleSelect = (userId: string) => {
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
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedUsers.length > 0
              ? `${selectedUsers.length} user(s) selected`
              : "Select users..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Search users..." />
            <CommandList>
              <CommandEmpty>
                {isLoading ? "Loading users..." : "No users found."}
              </CommandEmpty>
              <CommandGroup>
                {availableUsers.map((user) => (
                  <CommandItem
                    key={user.id}
                    value={`${user.last_name}, ${user.first_name}`}
                    onSelect={() => handleSelect(user.id)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value.includes(user.id) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {user.last_name}, {user.first_name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedUsers.map((user) => (
            <Badge key={user.id} variant="secondary" className="flex items-center gap-1">
              {user.last_name}, {user.first_name}
              <button
                type="button"
                onClick={() => handleRemove(user.id)}
                className="ml-1 hover:bg-red-100 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};