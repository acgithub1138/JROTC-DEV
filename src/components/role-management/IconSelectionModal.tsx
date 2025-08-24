import React, { useState, useMemo } from 'react';
import { Search, Check } from 'lucide-react';
import * as Icons from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// Get all available Lucide icons dynamically
const getAllIconNames = () => {
  const iconNames = Object.keys(Icons).filter(key => {
    const value = (Icons as any)[key];
    // Filter out non-icon exports (like createLucideIcon, icons object, etc.)
    return typeof value === 'object' && 
           value !== null && 
           'displayName' in value &&
           key !== 'createLucideIcon' &&
           key !== 'icons' &&
           !key.startsWith('create');
  });
  return iconNames.sort();
};

// Get icon component from name
const getIconComponent = (iconName: string) => {
  const IconComponent = (Icons as any)[iconName];
  return IconComponent || Icons.FileText;
};

interface IconSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedIcon: string;
  onIconSelect: (iconName: string) => void;
}

export const IconSelectionModal: React.FC<IconSelectionModalProps> = ({
  isOpen,
  onClose,
  selectedIcon,
  onIconSelect,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Get all available icons
  const iconOptions = useMemo(() => getAllIconNames(), []);

  const filteredIcons = useMemo(() => {
    if (!searchTerm) return iconOptions;
    return iconOptions.filter(icon => 
      icon.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, iconOptions]);

  const handleIconClick = (iconName: string) => {
    onIconSelect(iconName);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Select an Icon</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search icons..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Icons Grid */}
          <div className="max-h-96 overflow-y-auto">
            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
              {filteredIcons.map((iconName) => {
                const IconComponent = getIconComponent(iconName);
                const isSelected = selectedIcon === iconName;
                
                return (
                  <button
                    key={iconName}
                    onClick={() => handleIconClick(iconName)}
                    className={`
                      relative p-3 rounded-lg border-2 transition-all duration-200
                      hover:bg-accent hover:border-primary/50
                      focus:outline-none focus:ring-2 focus:ring-ring
                      ${isSelected 
                        ? 'border-primary bg-accent' 
                        : 'border-border'
                      }
                    `}
                    title={iconName}
                  >
                    {isSelected && (
                      <Check className="absolute -top-1 -right-1 h-4 w-4 text-primary bg-background rounded-full border border-primary" />
                    )}
                    <IconComponent className="h-5 w-5 mx-auto text-foreground" />
                    <div className="text-xs mt-1 truncate text-muted-foreground">
                      {iconName}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {filteredIcons.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              No icons found matching "{searchTerm}"
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {filteredIcons.length} of {iconOptions.length} icons found
            </div>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};