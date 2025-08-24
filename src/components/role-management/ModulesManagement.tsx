import React, { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit2, Save, X, Plus, Trash2, GripVertical, ChevronUp, ChevronDown, ChevronsUpDown, 
  // Navigation & Core
  Home, Menu, Settings, Search, Bell, Mail, User, Users, Contact, 
  // Content & Files
  FileText, File, Files, Folder, FolderOpen, Archive, Book, BookOpen, Clipboard, ClipboardList,
  // Data & Analytics
  Database, BarChart3, ChartBar, ChartLine, ChartPie, Activity, TrendingUp, Calculator,
  // Security & Access
  Shield, Lock, Unlock, Key, Eye, EyeOff, Fingerprint, UserCheck,
  // Communication & Social
  MessageSquare, MessageCircle, Phone, Video, Share, Share2, Globe,
  // Actions & Tools
  Edit, Edit3, Trash, Download, Upload, Copy, Move, Minus,
  // Status & Indicators
  Check, CheckCircle, XCircle, AlertTriangle, Info, Star, Flag,
  // Media & Content
  Image, Camera, Film, Music, Headphones, Volume2, Play, Pause,
  // Business & Finance
  DollarSign, CreditCard, Receipt, Briefcase, Building, Store,
  // Education & Competition
  Trophy, Award, Target, Medal, GraduationCap, BookA, Zap,
  // Time & Calendar
  Calendar, CalendarDays, Clock, Timer, AlarmClock, History,
  // Network & Connectivity
  Wifi, Cloud, Server, HardDrive, Monitor, Smartphone,
  // Sports & Activities
  Gamepad, Dumbbell, Bike, Car, Plane, MapPin, Map,
  // Misc Utilities
  Wrench, Cog, Sliders, Filter, Grid, List, Layout
} from 'lucide-react';
import * as Icons from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

// Complete list of Lucide icons (sorted A-Z)
const iconOptions = [
  'AArrowDown', 'AArrowUp', 'ALargeSmall', 'Accessibility', 'Activity', 'AirVent', 'Airplay', 'AlarmClock',
  'AlarmClockCheck', 'AlarmClockMinus', 'AlarmClockOff', 'AlarmClockPlus', 'AlarmSmoke', 'Album', 'AlignCenter',
  'AlignCenterHorizontal', 'AlignCenterVertical', 'AlignEndHorizontal', 'AlignEndVertical', 'AlignHorizontalDistributeCenter',
  'AlignHorizontalDistributeEnd', 'AlignHorizontalDistributeStart', 'AlignHorizontalJustifyCenter', 'AlignHorizontalJustifyEnd',
  'AlignHorizontalJustifyStart', 'AlignHorizontalSpaceAround', 'AlignHorizontalSpaceBetween', 'AlignJustify', 'AlignLeft',
  'AlignRight', 'AlignStartHorizontal', 'AlignStartVertical', 'AlignVerticalDistributeCenter', 'AlignVerticalDistributeEnd',
  'AlignVerticalDistributeStart', 'AlignVerticalJustifyCenter', 'AlignVerticalJustifyEnd', 'AlignVerticalJustifyStart',
  'AlignVerticalSpaceAround', 'AlignVerticalSpaceBetween', 'Ambulance', 'Ampersand', 'Ampersands', 'Amphora', 'Anchor',
  'Angry', 'Annoyed', 'Antenna', 'Anvil', 'Aperture', 'AppWindow', 'AppWindowMac', 'Apple', 'Archive', 'ArchiveRestore',
  'ArchiveX', 'Armchair', 'ArrowBigDown', 'ArrowBigDownDash', 'ArrowBigLeft', 'ArrowBigLeftDash', 'ArrowBigRight',
  'ArrowBigRightDash', 'ArrowBigUp', 'ArrowBigUpDash', 'ArrowDown', 'ArrowDown01', 'ArrowDown10', 'ArrowDownAZ',
  'ArrowDownFromLine', 'ArrowDownLeft', 'ArrowDownNarrowWide', 'ArrowDownRight', 'ArrowDownToDot', 'ArrowDownToLine',
  'ArrowDownUp', 'ArrowDownWideNarrow', 'ArrowDownZA', 'ArrowLeft', 'ArrowLeftFromLine', 'ArrowLeftRight', 'ArrowLeftToLine',
  'ArrowRight', 'ArrowRightFromLine', 'ArrowRightLeft', 'ArrowRightToLine', 'ArrowUp', 'ArrowUp01', 'ArrowUp10',
  'ArrowUpAZ', 'ArrowUpDown', 'ArrowUpFromDot', 'ArrowUpFromLine', 'ArrowUpLeft', 'ArrowUpNarrowWide', 'ArrowUpRight',
  'ArrowUpToLine', 'ArrowUpWideNarrow', 'ArrowUpZA', 'ArrowsUpFromLine', 'Asterisk', 'AtSign', 'Atom', 'AudioLines',
  'AudioWaveform', 'Award', 'Axe', 'Axis3d', 'Baby', 'Backpack', 'Badge', 'BadgeAlert', 'BadgeCent', 'BadgeCheck',
  'BadgeDollarSign', 'BadgeEuro', 'BadgeIndianRupee', 'BadgeInfo', 'BadgeJapaneseYen', 'BadgeMinus', 'BadgePercent',
  'BadgePlus', 'BadgePoundSterling', 'BadgeQuestionMark', 'BadgeRussianRuble', 'BadgeSwissFranc', 'BadgeTurkishLira',
  'BadgeX', 'BaggageClaim', 'Ban', 'Banana', 'Bandage', 'Banknote', 'BanknoteArrowDown', 'BanknoteArrowUp', 'BanknoteX',
  'Barcode', 'Barrel', 'Baseline', 'Bath', 'Battery', 'BatteryCharging', 'BatteryFull', 'BatteryLow', 'BatteryMedium',
  'BatteryPlus', 'BatteryWarning', 'Beaker', 'Bean', 'BeanOff', 'Bed', 'BedDouble', 'BedSingle', 'Beef', 'Beer', 'BeerOff',
  'Bell', 'BellDot', 'BellElectric', 'BellMinus', 'BellOff', 'BellPlus', 'BellRing', 'BetweenHorizontalEnd',
  'BetweenHorizontalStart', 'BetweenVerticalEnd', 'BetweenVerticalStart', 'BicepsFlexed', 'Bike', 'Binary', 'Binoculars',
  'Biohazard', 'Bird', 'Bitcoin', 'Blend', 'Blinds', 'Blocks', 'Bluetooth', 'BluetoothConnected', 'BluetoothOff',
  'BluetoothSearching', 'Bold', 'Bolt', 'Bomb', 'Bone', 'Book', 'BookA', 'BookAlert', 'BookAudio', 'BookCheck', 'BookCopy',
  'BookDashed', 'BookDown', 'BookHeadphones', 'BookHeart', 'BookImage', 'BookKey', 'BookLock', 'BookMarked', 'BookMinus',
  'BookOpen', 'BookOpenCheck', 'BookOpenText', 'BookPlus', 'BookText', 'BookType', 'BookUp', 'BookUp2', 'BookUser', 'BookX',
  'Bookmark', 'BookmarkCheck', 'BookmarkMinus', 'BookmarkPlus', 'BookmarkX', 'BoomBox', 'Bot', 'BotMessageSquare', 'BotOff',
  'BottleWine', 'BowArrow', 'Box', 'Boxes', 'Braces', 'Brackets', 'Brain', 'BrainCircuit', 'BrainCog', 'BrickWall',
  'BrickWallFire', 'BrickWallShield', 'Briefcase', 'BriefcaseBusiness', 'BriefcaseConveyorBelt', 'BriefcaseMedical',
  'BringToFront', 'Brush', 'BrushCleaning', 'Bubbles', 'Bug', 'BugOff', 'BugPlay', 'Building', 'Building2', 'Bus', 'BusFront',
  'Cable', 'CableCar', 'Cake', 'CakeSlice', 'Calculator', 'Calendar', 'Calendar1', 'CalendarArrowDown', 'CalendarArrowUp',
  'CalendarCheck', 'CalendarCheck2', 'CalendarClock', 'CalendarCog', 'CalendarDays', 'CalendarFold', 'CalendarHeart',
  'CalendarMinus', 'CalendarMinus2', 'CalendarOff', 'CalendarPlus', 'CalendarPlus2', 'CalendarRange', 'CalendarSearch',
  'CalendarSync', 'CalendarX', 'CalendarX2', 'Camera', 'CameraOff', 'Candy', 'CandyCane', 'CandyOff', 'Cannabis', 'Captions',
  'CaptionsOff', 'Car', 'CarFront', 'CarTaxiFront', 'Caravan', 'CardSim', 'Carrot', 'CaseLower', 'CaseSensitive', 'CaseUpper',
  'CassetteTape', 'Cast', 'Castle', 'Cat', 'Cctv', 'ChartArea', 'ChartBar', 'ChartBarBig', 'ChartBarDecreasing',
  'ChartBarIncreasing', 'ChartBarStacked', 'ChartCandlestick', 'ChartColumn', 'ChartColumnBig', 'ChartColumnDecreasing',
  'ChartColumnIncreasing', 'ChartColumnStacked', 'ChartGantt', 'ChartLine', 'ChartNetwork', 'ChartNoAxesColumn',
  'ChartNoAxesColumnDecreasing', 'ChartNoAxesColumnIncreasing', 'ChartNoAxesCombined', 'ChartNoAxesGantt', 'ChartPie',
  'ChartScatter', 'ChartSpline', 'Check', 'CheckCheck', 'CheckLine', 'ChefHat', 'Cherry', 'ChevronDown', 'ChevronFirst',
  'ChevronLast', 'ChevronLeft', 'ChevronRight', 'ChevronUp', 'ChevronsDown', 'ChevronsDownUp', 'ChevronsLeft',
  'ChevronsLeftRight', 'ChevronsLeftRightEllipsis', 'ChevronsRight', 'ChevronsRightLeft', 'ChevronsUp', 'ChevronsUpDown',
  'Chromium', 'Church', 'Cigarette', 'CigaretteOff', 'Circle', 'CircleAlert', 'CircleArrowDown', 'CircleArrowLeft',
  'CircleArrowOutDownLeft', 'CircleArrowOutDownRight', 'CircleArrowOutUpLeft', 'CircleArrowOutUpRight', 'CircleArrowRight',
  'CircleArrowUp', 'CircleCheck', 'CircleCheckBig', 'CircleChevronDown', 'CircleChevronLeft', 'CircleChevronRight',
  'CircleChevronUp', 'CircleDashed', 'CircleDivide', 'CircleDollarSign', 'CircleDot', 'CircleDotDashed', 'CircleEllipsis',
  'CircleEqual', 'CircleFadingArrowUp', 'CircleFadingPlus', 'CircleGauge', 'CircleMinus', 'CircleOff', 'CircleParking',
  'CircleParkingOff', 'CirclePause', 'CirclePercent', 'CirclePlay', 'CirclePlus', 'CirclePoundSterling', 'CirclePower',
  'CircleQuestionMark', 'CircleSlash', 'CircleSlash2', 'CircleSmall', 'CircleStar', 'CircleStop', 'CircleUser',
  'CircleUserRound', 'CircleX', 'CircuitBoard', 'Citrus', 'Clapperboard', 'Clipboard', 'ClipboardCheck', 'ClipboardClock',
  'ClipboardCopy', 'ClipboardList', 'ClipboardMinus', 'ClipboardPaste', 'ClipboardPen', 'ClipboardPenLine', 'ClipboardPlus',
  'ClipboardType', 'ClipboardX', 'Clock', 'Clock1', 'Clock10', 'Clock11', 'Clock12', 'Clock2', 'Clock3', 'Clock4', 'Clock5',
  'Clock6', 'Clock7', 'Clock8', 'Clock9', 'ClockAlert', 'ClockArrowDown', 'ClockArrowUp', 'ClockFading', 'ClockPlus',
  'ClosedCaption', 'Cloud', 'CloudAlert', 'CloudCheck', 'CloudCog', 'CloudDownload', 'CloudDrizzle', 'CloudFog', 'CloudHail',
  'CloudLightning', 'CloudMoon', 'CloudMoonRain', 'CloudOff', 'CloudRain', 'CloudRainWind', 'CloudSnow', 'CloudSun',
  'CloudSunRain', 'CloudUpload', 'Cloudy', 'Clover', 'Club', 'Code', 'CodeXml', 'Codepen', 'Codesandbox', 'Coffee', 'Cog',
  'Coins', 'Columns2', 'Columns3', 'Columns3Cog', 'Columns4', 'Combine', 'Command', 'Compass', 'Component', 'Computer',
  'ConciergeBell', 'Cone', 'Construction', 'Contact', 'ContactRound', 'Container', 'Contrast', 'Cookie', 'CookingPot',
  'Copy', 'CopyCheck', 'CopyMinus', 'CopyPlus', 'CopySlash', 'CopyX', 'Copyleft', 'Copyright', 'CornerDownLeft',
  'CornerDownRight', 'CornerLeftDown', 'CornerLeftUp', 'CornerRightDown', 'CornerRightUp', 'CornerUpLeft', 'CornerUpRight',
  'Cpu', 'CreativeCommons', 'CreditCard', 'Croissant', 'Crop', 'Cross', 'Crosshair', 'Crown', 'Cuboid', 'CupSoda',
  'Currency', 'Cylinder', 'Dam', 'Database', 'DatabaseBackup', 'DatabaseZap', 'DecimalsArrowLeft', 'DecimalsArrowRight',
  'Delete', 'Dessert', 'Diameter', 'Diamond', 'DiamondMinus', 'DiamondPercent', 'DiamondPlus', 'Dice1', 'Dice2', 'Dice3',
  'Dice4', 'Dice5', 'Dice6', 'Dices', 'Diff', 'Disc', 'Disc2', 'Disc3', 'DiscAlbum', 'Divide', 'Dna', 'DnaOff', 'Dock',
  'Dog', 'DollarSign', 'Donut', 'DoorClosed', 'DoorClosedLocked', 'DoorOpen', 'Dot', 'Download', 'DraftingCompass', 'Drama',
  'Dribbble', 'Drill', 'Drone', 'Droplet', 'DropletOff', 'Droplets', 'Drum', 'Drumstick', 'Dumbbell', 'Ear', 'EarOff',
  'Earth', 'EarthLock', 'Eclipse', 'Egg', 'EggFried', 'EggOff', 'Ellipsis', 'EllipsisVertical', 'Equal', 'EqualApproximately',
  'EqualNot', 'Eraser', 'EthernetPort', 'Euro', 'Expand', 'ExternalLink', 'Eye', 'EyeClosed', 'EyeOff', 'Facebook', 'Factory',
  'Fan', 'FastForward', 'Feather', 'Fence', 'FerrisWheel', 'Figma', 'File', 'FileArchive', 'FileAudio', 'FileAudio2',
  'FileAxis3d', 'FileBadge', 'FileBadge2', 'FileBox', 'FileChartColumn', 'FileChartColumnIncreasing', 'FileChartLine',
  'FileChartPie', 'FileCheck', 'FileCheck2', 'FileClock', 'FileCode', 'FileCode2', 'FileCog', 'FileDiff', 'FileDigit',
  'FileDown', 'FileHeart', 'FileImage', 'FileInput', 'FileJson', 'FileJson2', 'FileKey', 'FileKey2', 'FileLock',
  'FileLock2', 'FileMinus', 'FileMinus2', 'FileMusic', 'FileOutput', 'FilePen', 'FilePenLine', 'FilePlay', 'FilePlus',
  'FilePlus2', 'FileQuestionMark', 'FileScan', 'FileSearch', 'FileSearch2', 'FileSliders', 'FileSpreadsheet', 'FileStack',
  'FileSymlink', 'FileTerminal', 'FileText', 'FileType', 'FileType2', 'FileUp', 'FileUser', 'FileVideoCamera', 'FileVolume',
  'FileVolume2', 'FileWarning', 'FileX', 'FileX2', 'Files', 'Film', 'Fingerprint', 'FireExtinguisher', 'Fish', 'FishOff',
  'FishSymbol', 'Flag', 'FlagOff', 'FlagTriangleLeft', 'FlagTriangleRight', 'Flame', 'FlameKindling', 'Flashlight',
  'FlashlightOff', 'FlaskConical', 'FlaskConicalOff', 'FlaskRound', 'FlipHorizontal', 'FlipHorizontal2', 'FlipVertical',
  'FlipVertical2', 'Flower', 'Flower2', 'Focus', 'FoldHorizontal', 'FoldVertical', 'Folder', 'FolderArchive', 'FolderCheck',
  'FolderClock', 'FolderClosed', 'FolderCode', 'FolderCog', 'FolderDot', 'FolderDown', 'FolderGit', 'FolderGit2',
  'FolderHeart', 'FolderInput', 'FolderKanban', 'FolderKey', 'FolderLock', 'FolderMinus', 'FolderOpen', 'FolderOpenDot',
  'FolderOutput', 'FolderPen', 'FolderPlus', 'FolderRoot', 'FolderSearch', 'FolderSearch2', 'FolderSymlink', 'FolderSync',
  'FolderTree', 'FolderUp', 'FolderX', 'Folders', 'Footprints', 'Forklift', 'Forward', 'Frame', 'Framer', 'Frown', 'Fuel',
  'Fullscreen', 'Funnel', 'FunnelPlus', 'FunnelX', 'GalleryHorizontal', 'GalleryHorizontalEnd', 'GalleryThumbnails',
  'GalleryVertical', 'GalleryVerticalEnd', 'Gamepad', 'Gamepad2', 'Gauge', 'Gavel', 'Gem', 'GeorgianLari', 'Ghost', 'Gift',
  'GitBranch', 'GitBranchPlus', 'GitCommitHorizontal', 'GitCommitVertical', 'GitCompare', 'GitCompareArrows', 'GitFork',
  'GitGraph', 'GitMerge', 'GitPullRequest', 'GitPullRequestArrow', 'GitPullRequestClosed', 'GitPullRequestCreate',
  'GitPullRequestCreateArrow', 'GitPullRequestDraft', 'Github', 'Gitlab', 'GlassWater', 'Glasses', 'Globe', 'GlobeLock',
  'Goal', 'Gpu', 'GraduationCap', 'Grape', 'Grid2x2', 'Grid2x2Check', 'Grid2x2Plus', 'Grid2x2X', 'Grid3x2', 'Grid3x3',
  'Grip', 'GripHorizontal', 'GripVertical', 'Group', 'Guitar', 'Ham', 'Hamburger', 'Hammer', 'Hand', 'HandCoins', 'HandFist',
  'HandGrab', 'HandHeart', 'HandHelping', 'HandMetal', 'HandPlatter', 'Handbag', 'Handshake', 'HardDrive', 'HardDriveDownload',
  'HardDriveUpload', 'HardHat', 'Hash', 'HatGlasses', 'Haze', 'HdmiPort', 'Heading', 'Heading1', 'Heading2', 'Heading3',
  'Heading4', 'Heading5', 'Heading6', 'HeadphoneOff', 'Headphones', 'Headset', 'Heart', 'HeartCrack', 'HeartHandshake',
  'HeartMinus', 'HeartOff', 'HeartPlus', 'HeartPulse', 'Heater', 'Hexagon', 'Highlighter', 'History', 'Hop', 'HopOff',
  'Hospital', 'Hotel', 'Hourglass', 'House', 'HousePlug', 'HousePlus', 'HouseWifi', 'IceCreamBowl', 'IceCreamCone', 'IdCard',
  'IdCardLanyard', 'Image', 'ImageDown', 'ImageMinus', 'ImageOff', 'ImagePlay', 'ImagePlus', 'ImageUp', 'ImageUpscale',
  'Images', 'Import', 'Inbox', 'IndentDecrease', 'IndentIncrease', 'IndianRupee', 'Infinity', 'Info', 'InspectionPanel',
  'Instagram', 'Italic', 'IterationCcw', 'IterationCw', 'JapaneseYen', 'Joystick', 'Kanban', 'Kayak', 'Key', 'KeyRound',
  'KeySquare', 'Keyboard', 'KeyboardMusic', 'KeyboardOff', 'Lamp', 'LampCeiling', 'LampDesk', 'LampFloor', 'LampWallDown',
  'LampWallUp', 'LandPlot', 'Landmark', 'Languages', 'Laptop', 'LaptopMinimal', 'LaptopMinimalCheck', 'Lasso', 'LassoSelect',
  'Laugh', 'Layers', 'Layers2', 'LayoutDashboard', 'LayoutGrid', 'LayoutList', 'LayoutPanelLeft', 'LayoutPanelTop',
  'LayoutTemplate', 'Leaf', 'LeafyGreen', 'Lectern', 'LetterText', 'Library', 'LibraryBig', 'LifeBuoy', 'Ligature',
  'Lightbulb', 'LightbulbOff', 'LineSquiggle', 'Link', 'Link2', 'Link2Off', 'Linkedin', 'List', 'ListCheck', 'ListChecks',
  'ListCollapse', 'ListEnd', 'ListFilter', 'ListFilterPlus', 'ListMinus', 'ListMusic', 'ListOrdered', 'ListPlus',
  'ListRestart', 'ListStart', 'ListTodo', 'ListTree', 'ListVideo', 'ListX', 'Loader', 'LoaderCircle', 'LoaderPinwheel',
  'Locate', 'LocateFixed', 'LocateOff', 'Lock', 'LockKeyhole', 'LockKeyholeOpen', 'LockOpen', 'LogIn', 'LogOut', 'Logs',
  'Lollipop', 'Luggage', 'Magnet', 'Mail', 'MailCheck', 'MailMinus', 'MailOpen', 'MailPlus', 'MailQuestionMark', 'MailSearch',
  'MailWarning', 'MailX', 'Mailbox', 'Mails', 'Map', 'MapMinus', 'MapPin', 'MapPinCheck', 'MapPinCheckInside', 'MapPinHouse',
  'MapPinMinus', 'MapPinMinusInside', 'MapPinOff', 'MapPinPen', 'MapPinPlus', 'MapPinPlusInside', 'MapPinX', 'MapPinXInside',
  'MapPinned', 'MapPlus', 'Mars', 'MarsStroke', 'Martini', 'Maximize', 'Maximize2', 'Medal', 'Megaphone', 'MegaphoneOff',
  'Meh', 'MemoryStick', 'Menu', 'Merge', 'MessageCircle', 'MessageCircleCode', 'MessageCircleDashed', 'MessageCircleHeart',
  'MessageCircleMore', 'MessageCircleOff', 'MessageCirclePlus', 'MessageCircleQuestionMark', 'MessageCircleReply',
  'MessageCircleWarning', 'MessageCircleX', 'MessageSquare', 'MessageSquareCode', 'MessageSquareDashed', 'MessageSquareDiff',
  'MessageSquareDot', 'MessageSquareHeart', 'MessageSquareLock', 'MessageSquareMore', 'MessageSquareOff', 'MessageSquarePlus',
  'MessageSquareQuote', 'MessageSquareReply', 'MessageSquareShare', 'MessageSquareText', 'MessageSquareWarning',
  'MessageSquareX', 'MessagesSquare', 'Mic', 'MicOff', 'MicVocal', 'Microchip', 'Microscope', 'Microwave', 'Milestone',
  'Milk', 'MilkOff', 'Minimize', 'Minimize2', 'Minus', 'Monitor', 'MonitorCheck', 'MonitorCog', 'MonitorDot', 'MonitorDown',
  'MonitorOff', 'MonitorPause', 'MonitorPlay', 'MonitorSmartphone', 'MonitorSpeaker', 'MonitorStop', 'MonitorUp', 'MonitorX',
  'Moon', 'MoonStar', 'Mountain', 'MountainSnow', 'Mouse', 'MouseOff', 'MousePointer', 'MousePointer2', 'MousePointerBan',
  'MousePointerClick', 'Move', 'Move3d', 'MoveDiagonal', 'MoveDiagonal2', 'MoveDown', 'MoveDownLeft', 'MoveDownRight',
  'MoveHorizontal', 'MoveLeft', 'MoveRight', 'MoveUp', 'MoveUpLeft', 'MoveUpRight', 'MoveVertical', 'Music', 'Music2',
  'Music3', 'Music4', 'Navigation', 'Navigation2', 'Navigation2Off', 'NavigationOff', 'Network', 'Newspaper', 'Nfc',
  'NonBinary', 'Notebook', 'NotebookPen', 'NotebookTabs', 'NotebookText', 'NotepadText', 'NotepadTextDashed', 'Nut',
  'NutOff', 'Octagon', 'OctagonAlert', 'OctagonMinus', 'OctagonPause', 'OctagonX', 'Omega', 'Option', 'Orbit', 'Origami',
  'Package', 'Package2', 'PackageCheck', 'PackageMinus', 'PackageOpen', 'PackagePlus', 'PackageSearch', 'PackageX',
  'PaintBucket', 'PaintRoller', 'Paintbrush', 'PaintbrushVertical', 'Palette', 'Panda', 'PanelBottom', 'PanelBottomClose',
  'PanelBottomDashed', 'PanelBottomOpen', 'PanelLeft', 'PanelLeftClose', 'PanelLeftDashed', 'PanelLeftOpen',
  'PanelLeftRightDashed', 'PanelRight', 'PanelRightClose', 'PanelRightDashed', 'PanelRightOpen', 'PanelTop',
  'PanelTopBottomDashed', 'PanelTopClose', 'PanelTopDashed', 'PanelTopOpen', 'PanelsLeftBottom', 'PanelsRightBottom',
  'PanelsTopLeft', 'Paperclip', 'Parentheses', 'ParkingMeter', 'PartyPopper', 'Pause', 'PawPrint', 'PcCase', 'Pen',
  'PenLine', 'PenOff', 'PenTool', 'Pencil', 'PencilLine', 'PencilOff', 'PencilRuler', 'Pentagon', 'Percent',
  'PersonStanding', 'PhilippinePeso', 'Phone', 'PhoneCall', 'PhoneForwarded', 'PhoneIncoming', 'PhoneMissed', 'PhoneOff',
  'PhoneOutgoing', 'Pi', 'Piano', 'Pickaxe', 'PictureInPicture', 'PictureInPicture2', 'PiggyBank', 'Pilcrow',
  'PilcrowLeft', 'PilcrowRight', 'Pill', 'PillBottle', 'Pin', 'PinOff', 'Pipette', 'Pizza', 'Plane', 'PlaneLanding',
  'PlaneTakeoff', 'Play', 'Plug', 'Plug2', 'PlugZap', 'Plus', 'Pocket', 'PocketKnife', 'Podcast', 'Pointer', 'PointerOff',
  'Popcorn', 'Popsicle', 'PoundSterling', 'Power', 'PowerOff', 'Presentation', 'Printer', 'PrinterCheck', 'Projector',
  'Proportions', 'Puzzle', 'Pyramid', 'QrCode', 'Quote', 'Rabbit', 'Radar', 'Radiation', 'Radical', 'Radio', 'RadioReceiver',
  'RadioTower', 'Radius', 'RailSymbol', 'Rainbow', 'Rat', 'Ratio', 'Receipt', 'ReceiptCent', 'ReceiptEuro',
  'ReceiptIndianRupee', 'ReceiptJapaneseYen', 'ReceiptPoundSterling', 'ReceiptRussianRuble', 'ReceiptSwissFranc',
  'ReceiptText', 'ReceiptTurkishLira', 'RectangleCircle', 'RectangleEllipsis', 'RectangleGoggles', 'RectangleHorizontal',
  'RectangleVertical', 'Recycle', 'Redo', 'Redo2', 'RedoDot', 'RefreshCcw', 'RefreshCcwDot', 'RefreshCw', 'RefreshCwOff',
  'Refrigerator', 'Regex', 'RemoveFormatting', 'Repeat', 'Repeat1', 'Repeat2', 'Replace', 'ReplaceAll', 'Reply', 'ReplyAll',
  'Rewind', 'Ribbon', 'Rocket', 'RockingChair', 'RollerCoaster', 'Rose', 'Rotate3d', 'RotateCcw', 'RotateCcwKey',
  'RotateCcwSquare', 'RotateCw', 'RotateCwSquare', 'Route', 'RouteOff', 'Router', 'Rows2', 'Rows3', 'Rows4', 'Rss',
  'Ruler', 'RulerDimensionLine', 'RussianRuble', 'Sailboat', 'Salad', 'Sandwich', 'Satellite', 'SatelliteDish',
  'SaudiRiyal', 'Save', 'SaveAll', 'SaveOff', 'Scale', 'Scale3d', 'Scaling', 'Scan', 'ScanBarcode', 'ScanEye', 'ScanFace',
  'ScanHeart', 'ScanLine', 'ScanQrCode', 'ScanSearch', 'ScanText', 'School', 'Scissors', 'ScissorsLineDashed',
  'ScreenShare', 'ScreenShareOff', 'Scroll', 'ScrollText', 'Search', 'SearchCheck', 'SearchCode', 'SearchSlash', 'SearchX',
  'Section', 'Send', 'SendHorizontal', 'SendToBack', 'SeparatorHorizontal', 'SeparatorVertical', 'Server', 'ServerCog',
  'ServerCrash', 'ServerOff', 'Settings', 'Settings2', 'Shapes', 'Share', 'Share2', 'Sheet', 'Shell', 'Shield',
  'ShieldAlert', 'ShieldBan', 'ShieldCheck', 'ShieldEllipsis', 'ShieldHalf', 'ShieldMinus', 'ShieldOff', 'ShieldPlus',
  'ShieldQuestionMark', 'ShieldUser', 'ShieldX', 'Ship', 'ShipWheel', 'Shirt', 'ShoppingBag', 'ShoppingBasket',
  'ShoppingCart', 'Shovel', 'ShowerHead', 'Shredder', 'Shrimp', 'Shrink', 'Shrub', 'Shuffle', 'Sigma', 'Signal',
  'SignalHigh', 'SignalLow', 'SignalMedium', 'SignalZero', 'Signature', 'Signpost', 'SignpostBig', 'Siren', 'SkipBack',
  'SkipForward', 'Skull', 'Slack', 'Slash', 'Slice', 'SlidersHorizontal', 'SlidersVertical', 'Smartphone',
  'SmartphoneCharging', 'SmartphoneNfc', 'Smile', 'SmilePlus', 'Snail', 'Snowflake', 'SoapDispenserDroplet', 'Sofa',
  'Soup', 'Space', 'Spade', 'Sparkle', 'Sparkles', 'Speaker', 'Speech', 'SpellCheck', 'SpellCheck2', 'Spline',
  'SplinePointer', 'Split', 'Spool', 'Spotlight', 'SprayCan', 'Sprout', 'Square', 'SquareActivity', 'SquareArrowDown',
  'SquareArrowDownLeft', 'SquareArrowDownRight', 'SquareArrowLeft', 'SquareArrowOutDownLeft', 'SquareArrowOutDownRight',
  'SquareArrowOutUpLeft', 'SquareArrowOutUpRight', 'SquareArrowRight', 'SquareArrowUp', 'SquareArrowUpLeft',
  'SquareArrowUpRight', 'SquareAsterisk', 'SquareBottomDashedScissors', 'SquareChartGantt', 'SquareCheck',
  'SquareCheckBig', 'SquareChevronDown', 'SquareChevronLeft', 'SquareChevronRight', 'SquareChevronUp', 'SquareCode',
  'SquareDashed', 'SquareDashedBottom', 'SquareDashedBottomCode', 'SquareDashedKanban', 'SquareDashedMousePointer',
  'SquareDashedTopSolid', 'SquareDivide', 'SquareDot', 'SquareEqual', 'SquareFunction', 'SquareKanban', 'SquareLibrary',
  'SquareM', 'SquareMenu', 'SquareMinus', 'SquareMousePointer', 'SquareParking', 'SquareParkingOff', 'SquarePause',
  'SquarePen', 'SquarePercent', 'SquarePi', 'SquarePilcrow', 'SquarePlay', 'SquarePlus', 'SquarePower', 'SquareRadical',
  'SquareRoundCorner', 'SquareScissors', 'SquareSigma', 'SquareSlash', 'SquareSplitHorizontal', 'SquareSplitVertical',
  'SquareSquare', 'SquareStack', 'SquareStar', 'SquareStop', 'SquareTerminal', 'SquareUser', 'SquareUserRound', 'SquareX',
  'SquaresExclude', 'SquaresIntersect', 'SquaresSubtract', 'SquaresUnite', 'Squircle', 'SquircleDashed', 'Squirrel',
  'Stamp', 'Star', 'StarHalf', 'StarOff', 'StepBack', 'StepForward', 'Stethoscope', 'Sticker', 'StickyNote', 'Store',
  'StretchHorizontal', 'StretchVertical', 'Strikethrough', 'Subscript', 'Sun', 'SunDim', 'SunMedium', 'SunMoon', 'SunSnow',
  'Sunrise', 'Sunset', 'Superscript', 'SwatchBook', 'SwissFranc', 'SwitchCamera', 'Sword', 'Swords', 'Syringe', 'Table',
  'Table2', 'TableCellsMerge', 'TableCellsSplit', 'TableColumnsSplit', 'TableOfContents', 'TableProperties', 'TableRowsSplit',
  'Tablet', 'TabletSmartphone', 'Tablets', 'Tag', 'Tags', 'Tally1', 'Tally2', 'Tally3', 'Tally4', 'Tally5', 'Tangent',
  'Target', 'Telescope', 'Tent', 'TentTree', 'Terminal', 'TestTube', 'TestTubeDiagonal', 'TestTubes', 'Text', 'TextCursor',
  'TextCursorInput', 'TextQuote', 'TextSearch', 'TextSelect', 'Theater', 'Thermometer', 'ThermometerSnowflake',
  'ThermometerSun', 'ThumbsDown', 'ThumbsUp', 'Ticket', 'TicketCheck', 'TicketMinus', 'TicketPercent', 'TicketPlus',
  'TicketSlash', 'TicketX', 'Tickets', 'TicketsPlane', 'Timer', 'TimerOff', 'TimerReset', 'ToggleLeft', 'ToggleRight',
  'Toilet', 'ToolCase', 'Tornado', 'Torus', 'Touchpad', 'TouchpadOff', 'TowerControl', 'ToyBrick', 'Tractor', 'TrafficCone',
  'TrainFront', 'TrainFrontTunnel', 'TrainTrack', 'TramFront', 'Transgender', 'Trash', 'Trash2', 'TreeDeciduous',
  'TreePalm', 'TreePine', 'Trees', 'Trello', 'TrendingDown', 'TrendingUp', 'TrendingUpDown', 'Triangle', 'TriangleAlert',
  'TriangleDashed', 'TriangleRight', 'Trophy', 'Truck', 'TruckElectric', 'TurkishLira', 'Turntable', 'Turtle', 'Tv',
  'TvMinimal', 'TvMinimalPlay', 'Twitch', 'Twitter', 'Type', 'TypeOutline', 'Umbrella', 'UmbrellaOff', 'Underline',
  'Undo', 'Undo2', 'UndoDot', 'UnfoldHorizontal', 'UnfoldVertical', 'Ungroup', 'University', 'Unlink', 'Unlink2',
  'Unplug', 'Upload', 'Usb', 'User', 'UserCheck', 'UserCog', 'UserLock', 'UserMinus', 'UserPen', 'UserPlus', 'UserRound',
  'UserRoundCheck', 'UserRoundCog', 'UserRoundMinus', 'UserRoundPen', 'UserRoundPlus', 'UserRoundSearch', 'UserRoundX',
  'UserSearch', 'UserStar', 'UserX', 'Users', 'UsersRound', 'Utensils', 'UtensilsCrossed', 'UtilityPole', 'Variable',
  'Vault', 'VectorSquare', 'Vegan', 'VenetianMask', 'Venus', 'VenusAndMars', 'Vibrate', 'VibrateOff', 'Video', 'VideoOff',
  'Videotape', 'View', 'Voicemail', 'Volleyball', 'Volume', 'Volume1', 'Volume2', 'VolumeOff', 'VolumeX', 'Vote', 'Wallet',
  'WalletCards', 'WalletMinimal', 'Wallpaper', 'Wand', 'WandSparkles', 'Warehouse', 'WashingMachine', 'Watch', 'Waves',
  'WavesLadder', 'Waypoints', 'Webcam', 'Webhook', 'WebhookOff', 'Weight', 'Wheat', 'WheatOff', 'WholeWord', 'Wifi',
  'WifiCog', 'WifiHigh', 'WifiLow', 'WifiOff', 'WifiPen', 'WifiSync', 'WifiZero', 'Wind', 'WindArrowDown', 'Wine',
  'WineOff', 'Workflow', 'Worm', 'WrapText', 'Wrench', 'X', 'Youtube', 'Zap', 'ZapOff', 'ZoomIn', 'ZoomOut'
];

// Dynamic icon mapping using lucide-react icons
const getIconComponent = (iconName: string) => {
  // Use the already imported Icons from lucide-react
  const IconComponent = (Icons as any)[iconName];
  return IconComponent || Icons.FileText;
};


type SortColumn = 'sort_order' | 'label' | 'icon' | 'path' | 'is_competition_portal' | 'is_active';
type SortDirection = 'asc' | 'desc' | null;

export const ModulesManagement: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingModule, setEditingModule] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [sortColumn, setSortColumn] = useState<SortColumn>('sort_order');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Form state for new module
  const [formData, setFormData] = useState({
    name: '',
    label: '',
    icon: 'FileText',
    path: '',
    is_active: true,
    is_competition_portal: false,
    sort_order: 0
  });

  // Fetch modules
  const { data: modulesData = [], isLoading } = useQuery({
    queryKey: ['permission_modules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('permission_modules')
        .select('*')
        .order('sort_order');
      
      if (error) throw error;
      return data;
    }
  });

  // Sort modules based on current sort settings
  const modules = useMemo(() => {
    if (!sortColumn || !sortDirection) return modulesData;

    return [...modulesData].sort((a, b) => {
      const aVal = (a as any)[sortColumn];
      const bVal = (b as any)[sortColumn];

      if (sortColumn === 'sort_order') {
        const numA = aVal || 0;
        const numB = bVal || 0;
        return sortDirection === 'asc' ? numA - numB : numB - numA;
      }

      if (typeof aVal === 'boolean' && typeof bVal === 'boolean') {
        const result = aVal === bVal ? 0 : aVal ? 1 : -1;
        return sortDirection === 'asc' ? result : -result;
      }

      const strA = (aVal || '').toString().toLowerCase();
      const strB = (bVal || '').toString().toLowerCase();
      const result = strA.localeCompare(strB);
      return sortDirection === 'asc' ? result : -result;
    });
  }, [modulesData, sortColumn, sortDirection]);

  // Handle column sorting
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : sortDirection === 'desc' ? null : 'asc');
      if (sortDirection === 'desc') {
        setSortColumn('sort_order');
        setSortDirection('asc');
      }
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Get sort icon for column header
  const getSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) return <ChevronsUpDown className="w-4 h-4" />;
    if (sortDirection === 'asc') return <ChevronUp className="w-4 h-4" />;
    if (sortDirection === 'desc') return <ChevronDown className="w-4 h-4" />;
    return <ChevronsUpDown className="w-4 h-4" />;
  };

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...moduleData }: any) => {
      const { data, error } = await supabase
        .from('permission_modules')
        .update(moduleData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permission_modules'] });
      toast({ title: 'Module updated successfully' });
      setEditingModule(null);
      setEditForm({});
    },
    onError: (error: any) => {
      toast({
        title: 'Error updating module',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (moduleData: any) => {
      const { data, error } = await supabase
        .from('permission_modules')
        .insert([moduleData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permission_modules'] });
      toast({ title: 'Module created successfully' });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error creating module',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('permission_modules')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permission_modules'] });
      toast({ title: 'Module deleted successfully' });
    },
    onError: (error: any) => {
      toast({
        title: 'Error deleting module',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      label: '',
      icon: 'FileText',
      path: '',
      is_active: true,
      is_competition_portal: false,
      sort_order: 0
    });
  };

  const handleEdit = (module: any) => {
    setEditingModule(module.id);
    setEditForm({
      name: module.name,
      label: module.label,
      icon: (module as any).icon || 'FileText',
      path: (module as any).path || '',
      is_active: (module as any).is_active !== false,
      is_competition_portal: (module as any).is_competition_portal || false,
      sort_order: (module as any).sort_order || 0
    });
  };

  const handleSave = () => {
    if (!editingModule) return;

    updateMutation.mutate({ id: editingModule, ...editForm });
  };

  const handleCancel = () => {
    setEditingModule(null);
    setEditForm({});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Permission Modules</CardTitle>
          <CardDescription>Loading modules...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Permission Modules Management
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                Add Module
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Module</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Module Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="e.g., cadets, tasks, budget"
                  />
                </div>

                <div>
                  <Label htmlFor="label">Display Label</Label>
                  <Input
                    id="label"
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    required
                    placeholder="e.g., Cadets, Tasks, Budget"
                  />
                </div>
                
                <div>
                  <Label htmlFor="icon">Icon</Label>
                  <Select value={formData.icon} onValueChange={(value) => setFormData({ ...formData, icon: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {iconOptions.map(iconName => {
                        const IconComponent = getIconComponent(iconName);
                        return (
                          <SelectItem key={iconName} value={iconName}>
                            <div className="flex items-center space-x-2">
                              <IconComponent className="w-4 h-4" />
                              <span>{iconName}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="path">Path (optional)</Label>
                  <Input
                    id="path"
                    value={formData.path}
                    onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                    placeholder="/app/module-name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="sort_order">Sort Order</Label>
                  <Input
                    id="sort_order"
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                  />
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: !!checked })}
                    />
                    <Label htmlFor="is_active">Active</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_competition_portal"
                      checked={formData.is_competition_portal}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_competition_portal: !!checked })}
                    />
                    <Label htmlFor="is_competition_portal">Competition Portal</Label>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending || !formData.name.trim() || !formData.label.trim()}
                  >
                    Create
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardTitle>
        <CardDescription>
          Manage permission modules that appear in sidebars and role permissions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="w-[50px] cursor-pointer select-none"
                onClick={() => handleSort('sort_order')}
              >
                <div className="flex items-center space-x-1">
                  <span>Order</span>
                  {getSortIcon('sort_order')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer select-none"
                onClick={() => handleSort('label')}
              >
                <div className="flex items-center space-x-1">
                  <span>Module Label</span>
                  {getSortIcon('label')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer select-none"
                onClick={() => handleSort('icon')}
              >
                <div className="flex items-center space-x-1">
                  <span>Icon</span>
                  {getSortIcon('icon')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer select-none"
                onClick={() => handleSort('path')}
              >
                <div className="flex items-center space-x-1">
                  <span>Path</span>
                  {getSortIcon('path')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer select-none"
                onClick={() => handleSort('is_competition_portal')}
              >
                <div className="flex items-center space-x-1">
                  <span>Competition Portal</span>
                  {getSortIcon('is_competition_portal')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer select-none"
                onClick={() => handleSort('is_active')}
              >
                <div className="flex items-center space-x-1">
                  <span>Status</span>
                  {getSortIcon('is_active')}
                </div>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {modules.map((module) => (
              <TableRow key={module.id}>
                <TableCell>
                  {editingModule === module.id ? (
                    <Input
                      type="number"
                      value={editForm.sort_order || 0}
                      onChange={(e) => setEditForm(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                      className="w-20"
                      min="0"
                    />
                  ) : (
                    <div className="flex items-center">
                      <GripVertical className="w-4 h-4 text-muted-foreground" />
                      <span className="ml-2 text-sm">{(module as any).sort_order || 0}</span>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {editingModule === module.id ? (
                    <Input
                      value={editForm.label || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, label: e.target.value }))}
                      className="w-full"
                    />
                  ) : (
                    <span className="font-medium">{module.label}</span>
                  )}
                </TableCell>
                <TableCell>
                  {editingModule === module.id ? (
                    <Select 
                      value={editForm.icon || 'FileText'} 
                      onValueChange={(value) => setEditForm(prev => ({ ...prev, icon: value }))}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {iconOptions.map(iconName => {
                          const IconComponent = getIconComponent(iconName);
                          return (
                            <SelectItem key={iconName} value={iconName}>
                              <div className="flex items-center space-x-2">
                                <IconComponent className="w-4 h-4" />
                                <span>{iconName}</span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="flex items-center space-x-2">
                      {(() => {
                        const IconComponent = getIconComponent((module as any).icon || 'FileText');
                        return <IconComponent className="w-4 h-4" />;
                      })()}
                      <Badge variant="outline">{(module as any).icon || 'FileText'}</Badge>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {editingModule === module.id ? (
                    <Input
                      value={editForm.path || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, path: e.target.value }))}
                      className="w-full"
                      placeholder="/app/module-name"
                    />
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      {(module as any).path || 'Not set'}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {editingModule === module.id ? (
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={editForm.is_competition_portal || false}
                        onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, is_competition_portal: checked }))}
                      />
                      <Label className="text-sm">Competition</Label>
                    </div>
                  ) : (
                    <Badge variant={(module as any).is_competition_portal ? 'default' : 'secondary'}>
                      {(module as any).is_competition_portal ? 'Competition' : 'CCC'}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {editingModule === module.id ? (
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={editForm.is_active !== false}
                        onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, is_active: checked }))}
                      />
                      <Label className="text-sm">Active</Label>
                    </div>
                  ) : (
                    <Badge variant={(module as any).is_active !== false ? 'default' : 'secondary'}>
                      {(module as any).is_active !== false ? 'Active' : 'Inactive'}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {editingModule === module.id ? (
                    <div className="flex justify-end space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancel}
                        disabled={updateMutation.isPending}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={updateMutation.isPending || !editForm.label?.trim()}
                      >
                        <Save className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex justify-end space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(module)}
                        disabled={updateMutation.isPending}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteMutation.mutate(module.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};