import React, { useState, useEffect, useCallback } from 'react';
import { MapPin, Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface AddressSuggestion {
  display_name: string;
  name?: string;
  type?: string;
}

interface AddressLookupFieldProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

export const AddressLookupField: React.FC<AddressLookupFieldProps> = ({
  value,
  onValueChange,
  placeholder = "Enter location...",
}) => {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value || '');
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  const searchAddresses = useCallback(async (query: string) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5`
      );
      
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data || []);
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      console.error('Address search error:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounce the search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (open && inputValue) {
        searchAddresses(inputValue);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [inputValue, open, searchAddresses]);

  const handleSelect = (selectedValue: string) => {
    onValueChange(selectedValue);
    setInputValue(selectedValue);
    setOpen(false);
  };

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
    onValueChange(newValue);
  };

  const formatAddress = (suggestion: AddressSuggestion) => {
    // Use the name if available, otherwise use display_name
    return suggestion.name || suggestion.display_name;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          <div className="flex items-center">
            <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
            <span className="truncate">
              {value || placeholder}
            </span>
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search for an address or place..."
            value={inputValue}
            onValueChange={handleInputChange}
          />
          <CommandList>
            {isLoading ? (
              <CommandEmpty>Searching...</CommandEmpty>
            ) : suggestions.length === 0 && inputValue.length >= 3 ? (
              <CommandEmpty>No addresses found. Type to enter manually.</CommandEmpty>
            ) : inputValue.length < 3 && inputValue.length > 0 ? (
              <CommandEmpty>Type at least 3 characters to search...</CommandEmpty>
            ) : (
              <>
                {suggestions.length > 0 && (
                  <CommandGroup heading="Address Suggestions">
                    {suggestions.map((suggestion, index) => (
                      <CommandItem
                        key={`${suggestion.display_name}-${index}`}
                        value={suggestion.display_name}
                        onSelect={() => handleSelect(suggestion.display_name)}
                        className="flex items-start"
                      >
                        <MapPin className="mr-2 h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">
                            {formatAddress(suggestion)}
                          </div>
                          <div className="text-sm text-muted-foreground truncate">
                            {suggestion.display_name}
                          </div>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
                
                {inputValue && !suggestions.some(s => s.display_name === inputValue) && (
                  <CommandGroup>
                    <CommandItem
                      value={inputValue}
                      onSelect={() => handleSelect(inputValue)}
                    >
                      <span className="mr-2 h-4 w-4 flex items-center justify-center text-xs bg-primary text-primary-foreground rounded">
                        +
                      </span>
                      Use "{inputValue}"
                    </CommandItem>
                  </CommandGroup>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};