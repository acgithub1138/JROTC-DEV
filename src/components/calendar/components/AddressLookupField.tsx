import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { supabase } from '@/integrations/supabase/client';

interface AddressSuggestion {
  display_name: string;
  name?: string;
  type?: string;
  parsed_address?: string;
  parsed_city?: string;
  parsed_state?: string;
  parsed_zip?: string;
  parsed_latitude?: string;
  parsed_longitude?: string;
}

interface ParsedAddressData {
  location: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  latitude: string;
  longitude: string;
}

interface AddressLookupFieldProps {
  value?: string;
  onValueChange: (value: string) => void;
  onAddressParsed?: (data: ParsedAddressData) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const AddressLookupField: React.FC<AddressLookupFieldProps> = ({
  value,
  onValueChange,
  onAddressParsed,
  placeholder = "Enter location...",
  disabled = false,
}) => {
  const [inputValue, setInputValue] = useState(value || '');
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
      const { data, error } = await supabase.functions.invoke('geocode-search', {
        body: { query }
      });
      
      if (error) {
        console.error('Geocoding error:', error);
        setSuggestions([]);
      } else {
        setSuggestions(data || []);
        setShowSuggestions(true);
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
      if (inputValue && inputValue.length >= 3) {
        searchAddresses(inputValue);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [inputValue, searchAddresses]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const newValue = e.target.value;
    setInputValue(newValue);
    onValueChange(newValue);
  };

  const handleSelect = (suggestion: AddressSuggestion) => {
    onValueChange(suggestion.display_name);
    setInputValue(suggestion.display_name);
    setShowSuggestions(false);
    
    // If callback provided and we have parsed data, send it
    if (onAddressParsed && suggestion.parsed_address) {
      onAddressParsed({
        location: suggestion.display_name,
        address: suggestion.parsed_address || '',
        city: suggestion.parsed_city || '',
        state: suggestion.parsed_state || '',
        zip: suggestion.parsed_zip || '',
        latitude: suggestion.parsed_latitude || '',
        longitude: suggestion.parsed_longitude || '',
      });
    }
  };

  const handleInputFocus = () => {
    if (disabled || suggestions.length === 0) return;
    setShowSuggestions(true);
  };

  const formatAddress = (suggestion: AddressSuggestion) => {
    return suggestion.name || suggestion.display_name;
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          className="pl-10"
          disabled={disabled}
        />
      </div>
      
      {!disabled && showSuggestions && (suggestions.length > 0 || isLoading || inputValue.length >= 3) && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border border-border rounded-md shadow-lg">
          <Command>
            <CommandList className="max-h-[200px]">
              {isLoading ? (
                <CommandEmpty>Searching...</CommandEmpty>
              ) : suggestions.length === 0 && inputValue.length >= 3 ? (
                <CommandEmpty>No addresses found.</CommandEmpty>
              ) : (
                <>
                  {suggestions.length > 0 && (
                    <CommandGroup>
                      {suggestions.map((suggestion, index) => (
                        <CommandItem
                          key={`${suggestion.display_name}-${index}`}
                          value={suggestion.display_name}
                          onSelect={() => handleSelect(suggestion)}
                          className="flex items-start cursor-pointer"
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
                </>
              )}
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  );
};