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

// Safe list of commonly used Lucide icons (will expand to full list once working)
const safeIconList = [
  'Activity', 'AlertCircle', 'AlertTriangle', 'Archive', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowUp',
  'Award', 'BarChart', 'BarChart2', 'BarChart3', 'Bell', 'Book', 'BookOpen', 'Briefcase', 'Calendar',
  'Camera', 'Check', 'CheckCircle', 'ChevronDown', 'ChevronLeft', 'ChevronRight', 'ChevronUp', 'Clock',
  'Cloud', 'Code', 'Cog', 'Copy', 'CreditCard', 'Database', 'Download', 'Edit', 'Edit2', 'Eye', 'EyeOff',
  'File', 'FileText', 'Filter', 'Folder', 'Globe', 'Grid', 'Hash', 'Heart', 'HelpCircle', 'Home', 'Image',
  'Inbox', 'Info', 'Key', 'Layout', 'Link', 'List', 'Lock', 'LogIn', 'LogOut', 'Mail', 'Map', 'MapPin',
  'Menu', 'MessageCircle', 'MessageSquare', 'Minus', 'Monitor', 'MoreHorizontal', 'MoreVertical', 'Music',
  'Package', 'Phone', 'PieChart', 'Play', 'Plus', 'PlusCircle', 'Save', 'Search', 'Send', 'Settings',
  'Share', 'Shield', 'Star', 'Target', 'Trash', 'Trash2', 'Trophy', 'Upload', 'User', 'Users', 'Video',
  'Wifi', 'X', 'Zap'
];

// Get all available Lucide icons with fallback
const getAllIconNames = () => {
  try {
    const iconNames: string[] = [];
    
    // First, try to get all icons dynamically
    Object.keys(Icons).forEach(key => {
      const component = (Icons as any)[key];
      
      // Check if it looks like a React component
      if (
        typeof component === 'function' || // Function component
        (typeof component === 'object' && 
         component !== null && 
         (component.$$typeof || component.render)) // React forwardRef or element
      ) {
        // Additional checks to filter out non-icon exports
        if (
          key !== 'createLucideIcon' &&
          key !== 'icons' &&
          !key.startsWith('create') &&
          /^[A-Z]/.test(key) // Component naming convention
        ) {
          iconNames.push(key);
        }
      }
    });
    
    // If we got a reasonable number of icons, use the dynamic list
    if (iconNames.length > 50) {
      console.log(`Loaded ${iconNames.length} icons dynamically`);
      return iconNames.sort();
    } else {
      console.warn('Dynamic icon loading returned too few icons, falling back to safe list');
      return safeIconList;
    }
  } catch (error) {
    console.error('Error loading icons dynamically, falling back to safe list:', error);
    return safeIconList;
  }
};

// Get icon component from name with error handling
const getIconComponent = (iconName: string) => {
  try {
    const IconComponent = (Icons as any)[iconName];
    if (IconComponent) {
      return IconComponent;
    }
  } catch (error) {
    console.error(`Error loading icon ${iconName}:`, error);
  }
  return Icons.FileText; // Safe fallback
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