
import React, { useState, useMemo } from 'react';
import { Search, Check, FileText, Loader2 } from 'lucide-react';
import * as Icons from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useIcons } from '@/hooks/useIcons';

// Safe function to get icon component
const getIconComponent = (iconName: string) => {
  try {
    const IconComponent = (Icons as any)[iconName];
    
    // Validate that it's a valid React component
    if (typeof IconComponent === 'function' || 
        (typeof IconComponent === 'object' && IconComponent !== null && IconComponent.$$typeof)) {
      return IconComponent;
    }
    
    console.warn(`Icon ${iconName} is not a valid component, using fallback`);
    return FileText;
  } catch (error) {
    console.error(`Error loading icon ${iconName}:`, error);
    return FileText;
  }
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
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { icons, categories, loading, incrementUsage } = useIcons();

  const filteredIcons = useMemo(() => {
    let filtered = icons;
    
    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(icon => icon.category === selectedCategory);
    }
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(icon => 
        icon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        icon.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  }, [icons, searchTerm, selectedCategory]);

  const handleIconClick = async (iconName: string) => {
    await incrementUsage(iconName);
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
          {/* Search and Filter Bar */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search icons..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2 text-sm text-muted-foreground">Loading icons...</span>
            </div>
          )}

          {/* Icons Grid */}
          {!loading && (
            <div className="max-h-96 overflow-y-auto">
              <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
                {filteredIcons.map((icon) => {
                  const IconComponent = getIconComponent(icon.name);
                  const isSelected = selectedIcon === icon.name;
                  
                  return (
                    <button
                      key={icon.id}
                      onClick={() => handleIconClick(icon.name)}
                      className={`
                        relative p-3 rounded-lg border-2 transition-all duration-200 group
                        hover:bg-accent hover:border-primary/50
                        focus:outline-none focus:ring-2 focus:ring-ring
                        ${isSelected 
                          ? 'border-primary bg-accent' 
                          : 'border-border'
                        }
                      `}
                      title={`${icon.name} - ${icon.description || 'No description'}`}
                    >
                      {isSelected && (
                        <Check className="absolute -top-1 -right-1 h-4 w-4 text-primary bg-background rounded-full border border-primary" />
                      )}
                      <IconComponent className="h-5 w-5 mx-auto text-foreground" />
                      <div className="text-xs mt-1 truncate text-muted-foreground">
                        {icon.name}
                      </div>
                      {icon.usage_count > 0 && (
                        <Badge variant="secondary" className="absolute -top-1 -left-1 text-xs px-1 py-0 h-4 min-w-4 opacity-0 group-hover:opacity-100 transition-opacity">
                          {icon.usage_count}
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {!loading && filteredIcons.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              No icons found {searchTerm && `matching "${searchTerm}"`}
              {selectedCategory !== 'all' && ` in ${selectedCategory} category`}
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {!loading && `${filteredIcons.length} of ${icons.length} icons found`}
              {selectedCategory !== 'all' && ` • ${selectedCategory} category`}
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
