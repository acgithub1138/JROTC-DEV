
import React, { useState, useMemo } from 'react';
import { Search, Check, FileText } from 'lucide-react';
import * as Icons from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// Comprehensive list of all Lucide icons organized by category
const iconCategories = {
  'General': [
    'Activity', 'Airplay', 'AlertCircle', 'AlertOctagon', 'AlertTriangle', 'AlignCenter', 'AlignJustify',
    'AlignLeft', 'AlignRight', 'Anchor', 'Aperture', 'Archive', 'Award', 'Bell', 'BellOff', 'Bookmark',
    'Box', 'Briefcase', 'Calendar', 'Camera', 'CameraOff', 'Cast', 'Check', 'CheckCircle', 'CheckCircle2',
    'CheckSquare', 'Circle', 'Clipboard', 'Clock', 'Cloud', 'Code', 'Code2', 'Coffee', 'Command',
    'Compass', 'Copy', 'CreditCard', 'Crop', 'Crosshair', 'Database', 'Delete', 'Disc', 'DollarSign',
    'Download', 'DownloadCloud', 'Droplets', 'Edit', 'Edit2', 'Edit3', 'ExternalLink', 'Eye', 'EyeOff',
    'Feather', 'File', 'FileText', 'Film', 'Filter', 'Flag', 'Folder', 'FolderOpen', 'FolderPlus',
    'Gift', 'Globe', 'Grid', 'HardDrive', 'Hash', 'Headphones', 'Heart', 'HelpCircle', 'Hexagon',
    'Home', 'Image', 'Inbox', 'Info', 'Key', 'Keyboard', 'Layers', 'Layout', 'LifeBuoy', 'Link',
    'Link2', 'List', 'Loader', 'Lock', 'Mail', 'Map', 'MapPin', 'Menu', 'MessageCircle', 'MessageSquare',
    'Mic', 'MicOff', 'Monitor', 'Moon', 'MoreHorizontal', 'MoreVertical', 'MousePointer', 'Move',
    'Music', 'Navigation', 'Navigation2', 'Octagon', 'Package', 'Paperclip', 'PenTool', 'Percent',
    'Phone', 'PhoneCall', 'PhoneIncoming', 'PhoneOff', 'PhoneOutgoing', 'PieChart', 'Pocket', 'Power',
    'Printer', 'Radio', 'Save', 'Scissors', 'Search', 'Send', 'Server', 'Settings', 'Share', 'Share2',
    'Shield', 'ShieldOff', 'ShoppingBag', 'ShoppingCart', 'Smartphone', 'Speaker', 'Square', 'Star',
    'Sun', 'Sunrise', 'Sunset', 'Tablet', 'Tag', 'Target', 'Terminal', 'Thermometer', 'Tool', 'Trash',
    'Trash2', 'Triangle', 'Trophy', 'Truck', 'Tv', 'Type', 'Umbrella', 'Upload', 'UploadCloud',
    'User', 'UserCheck', 'UserMinus', 'UserPlus', 'Users', 'UserX', 'Video', 'VideoOff', 'Voicemail',
    'Volume', 'Volume1', 'Volume2', 'VolumeX', 'Watch', 'Wifi', 'WifiOff', 'Wind', 'X', 'XCircle',
    'XSquare', 'Zap', 'ZapOff', 'ZoomIn', 'ZoomOut'
  ],
  'Arrows': [
    'ArrowDown', 'ArrowDownCircle', 'ArrowDownLeft', 'ArrowDownRight', 'ArrowLeft', 'ArrowLeftCircle',
    'ArrowRight', 'ArrowRightCircle', 'ArrowUp', 'ArrowUpCircle', 'ArrowUpLeft', 'ArrowUpRight',
    'ChevronDown', 'ChevronLeft', 'ChevronRight', 'ChevronUp', 'ChevronsDown', 'ChevronsLeft',
    'ChevronsRight', 'ChevronsUp', 'CornerDownLeft', 'CornerDownRight', 'CornerLeftDown', 'CornerLeftUp',
    'CornerRightDown', 'CornerRightUp', 'CornerUpLeft', 'CornerUpRight', 'FastForward', 'Maximize',
    'Maximize2', 'Minimize', 'Minimize2', 'RefreshCcw', 'RefreshCw', 'Repeat', 'Repeat1', 'Rewind',
    'RotateCcw', 'RotateCw', 'Shuffle', 'SkipBack', 'SkipForward', 'TrendingDown', 'TrendingUp'
  ],
  'Media': [
    'Camera', 'CameraOff', 'Film', 'Headphones', 'Image', 'Mic', 'MicOff', 'Music', 'Pause',
    'PauseCircle', 'Play', 'PlayCircle', 'Speaker', 'StopCircle', 'Video', 'VideoOff', 'Volume',
    'Volume1', 'Volume2', 'VolumeX'
  ],
  'Social': [
    'AtSign', 'Facebook', 'Github', 'Gitlab', 'Instagram', 'Linkedin', 'MessageCircle', 'MessageSquare',
    'Slack', 'Twitch', 'Twitter', 'Youtube'
  ],
  'Text': [
    'AlignCenter', 'AlignJustify', 'AlignLeft', 'AlignRight', 'Bold', 'Italic', 'Type', 'Underline'
  ],
  'Weather': [
    'Cloud', 'CloudDrizzle', 'CloudLightning', 'CloudRain', 'CloudSnow', 'Moon', 'Sun', 'Sunrise',
    'Sunset', 'Thermometer', 'Umbrella', 'Wind'
  ],
  'Expressions': [
    'Frown', 'Meh', 'Smile', 'ThumbsDown', 'ThumbsUp'
  ],
  'Charts': [
    'BarChart', 'BarChart2', 'BarChart3', 'PieChart', 'TrendingDown', 'TrendingUp'
  ],
  'Technology': [
    'Battery', 'BatteryCharging', 'Bluetooth', 'Chrome', 'Codepen', 'Codesandbox', 'Cpu', 'Figma',
    'Framer', 'HardDrive', 'Monitor', 'Radio', 'Server', 'Smartphone', 'Tablet', 'Tv', 'Watch',
    'Wifi', 'WifiOff'
  ],
  'Interface': [
    'Columns', 'Grid', 'Layout', 'Layers', 'Menu', 'MoreHorizontal', 'MoreVertical', 'MousePointer',
    'Sidebar', 'Sliders', 'ToggleLeft', 'ToggleRight'
  ]
};

// Flatten all icons for easy access
const availableIcons = Object.values(iconCategories).flat();

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
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const filteredIcons = useMemo(() => {
    let iconsToFilter = availableIcons;
    
    // Filter by category first
    if (selectedCategory !== 'All') {
      iconsToFilter = iconCategories[selectedCategory as keyof typeof iconCategories] || [];
    }
    
    // Then filter by search term
    if (!searchTerm) return iconsToFilter;
    return iconsToFilter.filter(icon => 
      icon.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, selectedCategory]);

  const handleIconClick = (iconName: string) => {
    onIconSelect(iconName);
    onClose();
  };

  const categories = ['All', ...Object.keys(iconCategories)];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Select an Icon ({availableIcons.length} available)</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search and Category Filter */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search icons..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border rounded-md bg-background text-foreground"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* Icons Table */}
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">Icon</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="w-[100px]">Category</TableHead>
                  <TableHead className="w-[80px]">Select</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIcons.map((iconName) => {
                  const IconComponent = getIconComponent(iconName);
                  const isSelected = selectedIcon === iconName;
                  const category = Object.entries(iconCategories).find(([, icons]) => 
                    icons.includes(iconName)
                  )?.[0] || 'General';
                  
                  return (
                    <TableRow 
                      key={iconName}
                      className={`cursor-pointer hover:bg-accent/50 ${isSelected ? 'bg-accent' : ''}`}
                      onClick={() => handleIconClick(iconName)}
                    >
                      <TableCell className="p-4">
                        <div className="flex justify-center">
                          <IconComponent className="h-5 w-5 text-foreground" />
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {iconName}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {category}
                      </TableCell>
                      <TableCell className="text-center">
                        {isSelected && (
                          <Check className="h-4 w-4 text-primary mx-auto" />
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>

          {filteredIcons.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              No icons found matching "{searchTerm}" in category "{selectedCategory}"
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Showing {filteredIcons.length} of {availableIcons.length} icons
              {selectedCategory !== 'All' && ` in ${selectedCategory}`}
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
