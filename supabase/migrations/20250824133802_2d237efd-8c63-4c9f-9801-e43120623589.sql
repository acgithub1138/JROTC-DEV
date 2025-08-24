-- Create icons table to store all available Lucide icons
CREATE TABLE public.icons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category TEXT DEFAULT 'general',
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.icons ENABLE ROW LEVEL SECURITY;

-- Create policies - icons are readable by everyone
CREATE POLICY "Icons are viewable by everyone" 
ON public.icons 
FOR SELECT 
USING (is_active = true);

-- Create indexes for better performance
CREATE INDEX idx_icons_name ON public.icons(name);
CREATE INDEX idx_icons_category ON public.icons(category);
CREATE INDEX idx_icons_active ON public.icons(is_active);

-- Insert all common Lucide icons with categories
INSERT INTO public.icons (name, category, description) VALUES
-- Navigation & UI
('Home', 'navigation', 'Home icon'),
('Menu', 'navigation', 'Menu hamburger icon'),
('Search', 'navigation', 'Search magnifying glass'),
('Settings', 'navigation', 'Settings gear icon'),
('User', 'navigation', 'User profile icon'),
('Users', 'navigation', 'Multiple users icon'),
('Bell', 'navigation', 'Notification bell'),
('Mail', 'navigation', 'Email envelope'),
('Calendar', 'navigation', 'Calendar icon'),
('Clock', 'navigation', 'Time clock'),
('MapPin', 'navigation', 'Location pin'),
('Globe', 'navigation', 'World globe'),

-- Actions
('Plus', 'actions', 'Add/create new'),
('PlusCircle', 'actions', 'Add in circle'),
('Minus', 'actions', 'Remove/subtract'),
('MinusCircle', 'actions', 'Remove in circle'),
('Edit', 'actions', 'Edit pencil'),
('Edit2', 'actions', 'Edit pencil alt'),
('Edit3', 'actions', 'Edit pencil square'),
('Trash', 'actions', 'Delete trash can'),
('Trash2', 'actions', 'Delete trash can alt'),
('Save', 'actions', 'Save floppy disk'),
('Download', 'actions', 'Download arrow'),
('Upload', 'actions', 'Upload arrow'),
('Copy', 'actions', 'Copy duplicate'),
('Share', 'actions', 'Share arrow'),
('Share2', 'actions', 'Share network'),
('Send', 'actions', 'Send paper plane'),
('RefreshCw', 'actions', 'Refresh clockwise'),
('RefreshCcw', 'actions', 'Refresh counter-clockwise'),
('RotateCw', 'actions', 'Rotate clockwise'),
('RotateCcw', 'actions', 'Rotate counter-clockwise'),

-- Arrows & Chevrons
('ArrowUp', 'arrows', 'Arrow pointing up'),
('ArrowDown', 'arrows', 'Arrow pointing down'),
('ArrowLeft', 'arrows', 'Arrow pointing left'),
('ArrowRight', 'arrows', 'Arrow pointing right'),
('ArrowUpCircle', 'arrows', 'Up arrow in circle'),
('ArrowDownCircle', 'arrows', 'Down arrow in circle'),
('ArrowLeftCircle', 'arrows', 'Left arrow in circle'),
('ArrowRightCircle', 'arrows', 'Right arrow in circle'),
('ChevronUp', 'arrows', 'Chevron pointing up'),
('ChevronDown', 'arrows', 'Chevron pointing down'),
('ChevronLeft', 'arrows', 'Chevron pointing left'),
('ChevronRight', 'arrows', 'Chevron pointing right'),
('ChevronsUp', 'arrows', 'Double chevron up'),
('ChevronsDown', 'arrows', 'Double chevron down'),
('ChevronsLeft', 'arrows', 'Double chevron left'),
('ChevronsRight', 'arrows', 'Double chevron right'),

-- Media & Files
('Play', 'media', 'Play button'),
('PlayCircle', 'media', 'Play in circle'),
('Pause', 'media', 'Pause button'),
('PauseCircle', 'media', 'Pause in circle'),
('StopCircle', 'media', 'Stop in circle'),
('SkipBack', 'media', 'Skip backward'),
('SkipForward', 'media', 'Skip forward'),
('FastForward', 'media', 'Fast forward'),
('Rewind', 'media', 'Rewind'),
('Volume', 'media', 'Volume speaker'),
('Volume1', 'media', 'Volume low'),
('Volume2', 'media', 'Volume high'),
('VolumeX', 'media', 'Volume muted'),
('Mic', 'media', 'Microphone'),
('MicOff', 'media', 'Microphone off'),
('Camera', 'media', 'Camera'),
('CameraOff', 'media', 'Camera off'),
('Video', 'media', 'Video camera'),
('VideoOff', 'media', 'Video camera off'),
('Image', 'media', 'Picture image'),
('Film', 'media', 'Film strip'),
('Music', 'media', 'Music note'),

-- Files & Documents
('File', 'files', 'Generic file'),
('FileText', 'files', 'Text document'),
('Folder', 'files', 'Folder closed'),
('FolderOpen', 'files', 'Folder open'),
('FolderPlus', 'files', 'Add to folder'),
('Archive', 'files', 'Archive box'),
('Bookmark', 'files', 'Bookmark'),
('Clipboard', 'files', 'Clipboard'),
('Database', 'files', 'Database'),
('HardDrive', 'files', 'Hard drive'),
('Server', 'files', 'Server'),

-- Status & Alerts
('Check', 'status', 'Checkmark'),
('CheckCircle', 'status', 'Check in circle'),
('CheckCircle2', 'status', 'Check in circle alt'),
('CheckSquare', 'status', 'Check in square'),
('X', 'status', 'X close'),
('XCircle', 'status', 'X in circle'),
('XSquare', 'status', 'X in square'),
('AlertCircle', 'status', 'Alert in circle'),
('AlertTriangle', 'status', 'Warning triangle'),
('AlertOctagon', 'status', 'Stop octagon'),
('Info', 'status', 'Information i'),
('HelpCircle', 'status', 'Help question mark'),
('Loader', 'status', 'Loading spinner'),

-- Communication
('Phone', 'communication', 'Phone'),
('PhoneCall', 'communication', 'Phone call'),
('PhoneIncoming', 'communication', 'Incoming call'),
('PhoneOutgoing', 'communication', 'Outgoing call'),
('PhoneOff', 'communication', 'Phone off'),
('MessageCircle', 'communication', 'Message bubble'),
('MessageSquare', 'communication', 'Message square'),
('Voicemail', 'communication', 'Voicemail'),

-- Security & Privacy
('Lock', 'security', 'Lock closed'),
('Unlock', 'security', 'Lock open'),
('Key', 'security', 'Key'),
('Shield', 'security', 'Shield'),
('ShieldOff', 'security', 'Shield off'),
('Eye', 'security', 'Eye visible'),
('EyeOff', 'security', 'Eye hidden'),

-- Commerce & Business
('ShoppingCart', 'commerce', 'Shopping cart'),
('ShoppingBag', 'commerce', 'Shopping bag'),
('CreditCard', 'commerce', 'Credit card'),
('DollarSign', 'commerce', 'Dollar sign'),
('Package', 'commerce', 'Package box'),
('Truck', 'commerce', 'Delivery truck'),
('Award', 'commerce', 'Award medal'),
('Trophy', 'commerce', 'Trophy cup'),
('Target', 'commerce', 'Target bullseye'),
('TrendingUp', 'commerce', 'Trending up'),
('TrendingDown', 'commerce', 'Trending down'),
('BarChart', 'commerce', 'Bar chart'),
('BarChart2', 'commerce', 'Bar chart alt'),
('BarChart3', 'commerce', 'Bar chart alt 2'),
('PieChart', 'commerce', 'Pie chart'),

-- Technology & Devices
('Smartphone', 'technology', 'Mobile phone'),
('Tablet', 'technology', 'Tablet device'),
('Monitor', 'technology', 'Computer monitor'),
('Tv', 'technology', 'Television'),
('Watch', 'technology', 'Wristwatch'),
('Headphones', 'technology', 'Headphones'),
('Speaker', 'technology', 'Speaker'),
('Battery', 'technology', 'Battery'),
('BatteryCharging', 'technology', 'Battery charging'),
('Wifi', 'technology', 'WiFi signal'),
('WifiOff', 'technology', 'WiFi off'),
('Bluetooth', 'technology', 'Bluetooth'),
('Cpu', 'technology', 'CPU processor'),
('Code', 'technology', 'Code brackets'),
('Code2', 'technology', 'Code alt'),
('Terminal', 'technology', 'Command terminal'),
('Command', 'technology', 'Command key'),

-- Weather & Nature
('Sun', 'weather', 'Sun'),
('Moon', 'weather', 'Moon'),
('Cloud', 'weather', 'Cloud'),
('CloudRain', 'weather', 'Rain cloud'),
('CloudSnow', 'weather', 'Snow cloud'),
('CloudLightning', 'weather', 'Storm cloud'),
('CloudDrizzle', 'weather', 'Drizzle cloud'),
('Droplets', 'weather', 'Water droplets'),
('Wind', 'weather', 'Wind'),
('Thermometer', 'weather', 'Temperature'),
('Sunrise', 'weather', 'Sunrise'),
('Sunset', 'weather', 'Sunset'),

-- Social & Brands
('Heart', 'social', 'Heart like'),
('Star', 'social', 'Star favorite'),
('Smile', 'social', 'Happy face'),
('Frown', 'social', 'Sad face'),
('Meh', 'social', 'Neutral face'),
('ThumbsUp', 'social', 'Thumbs up'),
('ThumbsDown', 'social', 'Thumbs down'),
('Github', 'social', 'GitHub'),
('Twitter', 'social', 'Twitter'),
('Facebook', 'social', 'Facebook'),
('Instagram', 'social', 'Instagram'),
('Linkedin', 'social', 'LinkedIn'),
('Youtube', 'social', 'YouTube'),

-- Tools & Utilities
('Tool', 'tools', 'Wrench tool'),
('Wrench', 'tools', 'Wrench'),
('Hammer', 'tools', 'Hammer'),
('Scissors', 'tools', 'Scissors'),
('Paperclip', 'tools', 'Paper clip'),
('PenTool', 'tools', 'Pen tool'),
('Brush', 'tools', 'Paint brush'),
('Palette', 'tools', 'Color palette'),
('Compass', 'tools', 'Compass'),
('Ruler', 'tools', 'Ruler'),

-- Miscellaneous
('Coffee', 'misc', 'Coffee cup'),
('Gift', 'misc', 'Gift box'),
('Flag', 'misc', 'Flag'),
('Anchor', 'misc', 'Anchor'),
('Umbrella', 'misc', 'Umbrella'),
('Zap', 'misc', 'Lightning bolt'),
('ZapOff', 'misc', 'Lightning off'),
('Activity', 'misc', 'Activity pulse'),
('Hash', 'misc', 'Hash symbol'),
('AtSign', 'misc', 'At symbol'),
('Percent', 'misc', 'Percent symbol'),
('Circle', 'misc', 'Circle'),
('Square', 'misc', 'Square'),
('Triangle', 'misc', 'Triangle'),
('Hexagon', 'misc', 'Hexagon'),
('Octagon', 'misc', 'Octagon');