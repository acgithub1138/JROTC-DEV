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

// Complete list of Lucide icons (alphabetically sorted)
const iconOptions = [
  'Activity', 'Airplay', 'AlertCircle', 'AlertOctagon', 'AlertTriangle', 'AlignCenter', 'AlignJustify', 'AlignLeft', 'AlignRight', 'Anchor', 'Aperture', 'Archive', 'ArrowDown', 'ArrowDownCircle', 'ArrowDownLeft', 'ArrowDownRight', 'ArrowLeft', 'ArrowLeftCircle', 'ArrowRight', 'ArrowRightCircle', 'ArrowUp', 'ArrowUpCircle', 'ArrowUpLeft', 'ArrowUpRight', 'AtSign', 'Award', 'BarChart', 'BarChart2', 'BarChart3', 'Battery', 'BatteryCharging', 'Bell', 'BellOff', 'Bluetooth', 'Bold', 'Book', 'BookOpen', 'Bookmark', 'Box', 'Briefcase', 'Calendar', 'Camera', 'CameraOff', 'Car', 'Cast', 'Check', 'CheckCircle', 'CheckCircle2', 'CheckSquare', 'ChevronDown', 'ChevronLeft', 'ChevronRight', 'ChevronUp', 'ChevronsDown', 'ChevronsLeft', 'ChevronsRight', 'ChevronsUp', 'Chrome', 'Circle', 'Clipboard', 'Clock', 'Cloud', 'CloudDrizzle', 'CloudLightning', 'CloudOff', 'CloudRain', 'CloudSnow', 'Code', 'Coffee', 'Cog', 'Columns', 'Command', 'Compass', 'Copy', 'CornerDownLeft', 'CornerDownRight', 'CornerLeftDown', 'CornerLeftUp', 'CornerRightDown', 'CornerRightUp', 'CornerUpLeft', 'CornerUpRight', 'Cpu', 'CreditCard', 'Crop', 'Crosshair', 'Database', 'Delete', 'Disc', 'DollarSign', 'Download', 'DownloadCloud', 'Droplet', 'Edit', 'Edit2', 'Edit3', 'ExternalLink', 'Eye', 'EyeOff', 'Facebook', 'FastForward', 'Feather', 'File', 'FileImage', 'FileMinus', 'FileMusic', 'FilePlus', 'FileText', 'FileVideo', 'Film', 'Filter', 'Flag', 'Folder', 'FolderMinus', 'FolderPlus', 'Framer', 'Frown', 'Gift', 'GitBranch', 'GitCommit', 'GitMerge', 'GitPullRequest', 'GitHub', 'Gitlab', 'Globe', 'Grid', 'HardDrive', 'Hash', 'Headphones', 'Heart', 'HelpCircle', 'Hexagon', 'Home', 'Image', 'Inbox', 'Info', 'Instagram', 'Italic', 'Key', 'Keyboard', 'Layers', 'Layout', 'LifeBuoy', 'Link', 'Link2', 'Linkedin', 'List', 'Loader', 'Lock', 'LogIn', 'LogOut', 'Mail', 'Map', 'MapPin', 'Maximize', 'Maximize2', 'Meh', 'Menu', 'MessageCircle', 'MessageSquare', 'Mic', 'MicOff', 'Minimize', 'Minimize2', 'Minus', 'MinusCircle', 'MinusSquare', 'Monitor', 'Moon', 'MoreHorizontal', 'MoreVertical', 'MousePointer', 'Move', 'Music', 'Navigation', 'Navigation2', 'Octagon', 'Package', 'Paperclip', 'Pause', 'PauseCircle', 'PenTool', 'Percent', 'Phone', 'PhoneCall', 'PhoneForwarded', 'PhoneIncoming', 'PhoneMissed', 'PhoneOff', 'PhoneOutgoing', 'PieChart', 'Play', 'PlayCircle', 'Plus', 'PlusCircle', 'PlusSquare', 'Pocket', 'Power', 'Printer', 'Radio', 'RefreshCcw', 'RefreshCw', 'Repeat', 'Repeat1', 'Rewind', 'RotateCcw', 'RotateCw', 'Rss', 'Save', 'Scissors', 'Search', 'Send', 'Server', 'Settings', 'Share', 'Share2', 'Shield', 'ShieldOff', 'ShoppingBag', 'ShoppingCart', 'Shuffle', 'Sidebar', 'SkipBack', 'SkipForward', 'Slack', 'Slash', 'Sliders', 'Smartphone', 'Smile', 'Speaker', 'Square', 'Star', 'StopCircle', 'Sun', 'Sunrise', 'Sunset', 'Tablet', 'Tag', 'Target', 'Terminal', 'Thermometer', 'ThumbsDown', 'ThumbsUp', 'ToggleLeft', 'ToggleRight', 'Tool', 'Trash', 'Trash2', 'Triangle', 'Truck', 'Tv', 'Twitch', 'Twitter', 'Type', 'Umbrella', 'Underline', 'Unlock', 'Upload', 'UploadCloud', 'User', 'UserCheck', 'UserMinus', 'UserPlus', 'UserX', 'Users', 'Video', 'VideoOff', 'Volume', 'Volume1', 'Volume2', 'VolumeX', 'Watch', 'Wifi', 'WifiOff', 'Wind', 'Wrench', 'X', 'XCircle', 'XSquare', 'Youtube', 'Zap', 'ZapOff', 'ZoomIn', 'ZoomOut'
];

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

  const filteredIcons = useMemo(() => {
    if (!searchTerm) return iconOptions;
    return iconOptions.filter(icon => 
      icon.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

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
              {filteredIcons.length} icon{filteredIcons.length !== 1 ? 's' : ''} found
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