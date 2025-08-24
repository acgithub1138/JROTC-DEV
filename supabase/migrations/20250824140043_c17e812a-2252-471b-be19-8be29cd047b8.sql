-- Get all missing icons from lucide-react and add them to the database
-- First create a temporary function to add missing icons

CREATE OR REPLACE FUNCTION add_missing_lucide_icons()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  missing_icons text[] := ARRAY[
    'AArrowDown','AArrowUp','ALargeSmall','Accessibility','Activity','AirVent','Airplay','AlarmCheck','AlarmClock','AlarmClockOff','AlarmMinus','AlarmPlus','AlarmSmoke','Album','AlignCenter','AlignCenterHorizontal','AlignCenterVertical','AlignEndHorizontal','AlignEndVertical','AlignHorizontalDistributeCenter','AlignHorizontalDistributeEnd','AlignHorizontalDistributeStart','AlignHorizontalJustifyCenter','AlignHorizontalJustifyEnd','AlignHorizontalJustifyStart','AlignHorizontalSpaceAround','AlignHorizontalSpaceBetween','AlignJustify','AlignLeft','AlignRight','AlignStartHorizontal','AlignStartVertical','AlignVerticalDistributeCenter','AlignVerticalDistributeEnd','AlignVerticalDistributeStart','AlignVerticalJustifyCenter','AlignVerticalJustifyEnd','AlignVerticalJustifyStart','AlignVerticalSpaceAround','AlignVerticalSpaceBetween','Ambulance','Ampersand','Ampersands','Anchor','Angry','Annoyed','Antenna','Anvil','Aperture','AppWindow','AppWindowMac','Apple','Archive','ArchiveRestore','ArchiveX','AreaChart','Armchair','ArrowBigDown','ArrowBigDownDash','ArrowBigLeft','ArrowBigLeftDash','ArrowBigRight','ArrowBigRightDash','ArrowBigUp','ArrowBigUpDash','ArrowDown','ArrowDown01','ArrowDown10','ArrowDownAZ','ArrowDownFromLine','ArrowDownLeft','ArrowDownNarrowWide','ArrowDownRight','ArrowDownToDot','ArrowDownToLine','ArrowDownUp','ArrowDownWideNarrow','ArrowDownZA','ArrowLeft','ArrowLeftFromLine','ArrowLeftRight','ArrowLeftToLine','ArrowRight','ArrowRightFromLine','ArrowRightLeft','ArrowRightToLine','ArrowUp','ArrowUp01','ArrowUp10','ArrowUpAZ','ArrowUpDown','ArrowUpFromDot','ArrowUpFromLine','ArrowUpLeft','ArrowUpNarrowWide','ArrowUpRight','ArrowUpToLine','ArrowUpWideNarrow','ArrowUpZA','ArrowsUpFromLine','Asterisk','AtSign','Atom','AudioLines','AudioWaveform','Award','Axe','Axis3d','Baby','Badge','BadgeAlert','BadgeCent','BadgeCheck','BadgeDollarSign','BadgeEuro','BadgeHelp','BadgeIndianRupee','BadgeInfo','BadgeJapaneseYen','BadgeMinus','BadgePercent','BadgePlus','BadgePoundSterling','BadgeRussianRuble','BadgeSwissFranc','BadgeX','BaggageClaim','Ban','Banana','Bandage','Banknote','Barcode','Baseline','Bath','Battery','BatteryCharging','BatteryFull','BatteryLow','BatteryMedium','BatteryWarning','Beaker','Bean','BeanOff','Bed','BedDouble','BedSingle','Beef','Beer','Bell','BellDot','BellElectric','BellMinus','BellOff','BellPlus','BellRing','BetweenHorizontalEnd','BetweenHorizontalStart','BetweenVerticalEnd','BetweenVerticalStart','BicepsFlexed','Bike','Binary','Binoculars','Biohazard','Bird','Bitcoin','Blend','Blinds','Blocks','Bluetooth','BluetoothConnected','BluetoothOff','BluetoothSearching','Bold','Bolt','Bomb','Bone','Book','BookA','BookAudio','BookCheck','BookCopy','BookDashed','BookDown','BookHeadphones','BookHeart','BookImage','BookKey','BookLock','BookMarked','BookMinus','BookOpen','BookOpenCheck','BookOpenText','BookPlus','BookText','BookType','BookUp','BookUp2','BookUser','BookX','Bookmark','BookmarkCheck','BookmarkMinus','BookmarkPlus','BookmarkX','BoomBox','Bot','BotMessageSquare','Box','BoxSelect','Boxes','Braces','Brackets','Brain','BrainCircuit','BrainCog','Bread','BrickWall','Briefcase','BriefcaseBusiness','BriefcaseConveyorBelt','BriefcaseMedical','BringToFront','Brush','Bug','BugOff','BugPlay','Building','Building2','Bus','BusFront','Cable','CableCar','Cake','CakeSlice','Calculator','Calendar1','Calendar2','Calendar3','CalendarArrowDown','CalendarArrowUp','CalendarCheck','CalendarCheck2','CalendarClock','CalendarDays','CalendarFold','CalendarHeart','CalendarMinus','CalendarOff','CalendarPlus','CalendarRange','CalendarSearch','CalendarX','CalendarX2','Camera','CameraOff','CandlestickChart','Candy','CandyCane','CandyOff','Cannabis','Captions','CaptionsOff','Car','CarFront','CarTaxiFront','Caravan','Carrot','CaseLower','CaseSensitive','CaseUpper','CassetteTape','Cast','Castle','Cat','Cctv','ChartArea','ChartBar','ChartBarBig','ChartBarDecreasing','ChartBarIncreasing','ChartBarStacked','ChartCandlestick','ChartColumn','ChartColumnBig','ChartColumnDecreasing','ChartColumnIncreasing','ChartColumnStacked','ChartGantt','ChartLine','ChartNetwork','ChartNoAxesColumn','ChartNoAxesColumnDecreasing','ChartNoAxesColumnIncreasing','ChartNoAxesCombined','ChartNoAxesGantt','ChartPie','ChartScatter','ChartSpline','Check','CheckCheck','ChefHat','Cherry','ChevronDown','ChevronFirst','ChevronLast','ChevronLeft','ChevronRight','ChevronUp','ChevronsDown','ChevronsDownUp','ChevronsLeft','ChevronsLeftRight','ChevronsLeftRightEllipsis','ChevronsRight','ChevronsRightLeft','ChevronsUp','ChevronsUpDown','Chrome','Church','Cigarette','CigaretteOff','Circle','CircleAlert','CircleArrowDown','CircleArrowLeft','CircleArrowOutDownLeft','CircleArrowOutDownRight','CircleArrowOutUpLeft','CircleArrowOutUpRight','CircleArrowRight','CircleArrowUp','CircleCheck','CircleCheckBig','CircleChevronDown','CircleChevronLeft','CircleChevronRight','CircleChevronUp','CircleDashed','CircleDivide','CircleDollarSign','CircleDot','CircleDotDashed','CircleEllipsis','CircleEqual','CircleFadingArrowUp','CircleFadingPlus','CircleGauge','CircleHelp','CircleMinus','CircleOff','CircleParking','CircleParkingOff','CirclePause','CirclePercent','CirclePlay','CirclePlus','CirclePower','CircleSlash','CircleSlash2','CircleStop','CircleUser','CircleUserRound','CircleX','CircuitBoard','Citrus','Clapperboard','Clipboard','ClipboardCheck','ClipboardCopy','ClipboardList','ClipboardMinus','ClipboardPaste','ClipboardPen','ClipboardPenLine','ClipboardPlus','ClipboardType','ClipboardX','Clock','Clock1','Clock10','Clock11','Clock12','Clock2','Clock3','Clock4','Clock5','Clock6','Clock7','Clock8','Clock9','ClockAlert','ClockArrowDown','ClockArrowUp','Cloud','CloudCog','CloudDownload','CloudDrizzle','CloudFog','CloudHail','CloudLightning','CloudMoon','CloudMoonRain','CloudOff','CloudRain','CloudRainWind','CloudSnow','CloudSun','CloudSunRain','CloudUpload','Cloudy','Clover','Club','Code','Code2','CodeXml','Codepen','Codesandbox','Coffee','Cog','Coins','Columns2','Columns3','Columns4','Combine','Command','Compass','Component','Computer','ConciergeBell','Cone','Construction','Contact','Contact2','Container','Contrast','Cookie','CookingPot','Copy','CopyCheck','CopyMinus','CopyPlus','CopySlash','CopyX','Copyleft','Copyright','CornerDownLeft','CornerDownRight','CornerLeftDown','CornerLeftUp','CornerRightDown','CornerRightUp','CornerUpLeft','CornerUpRight','Cpu','CreativeCommons','CreditCard','Croissant','Crop','Cross','Crosshair','Crown','Cuboid','CupSoda','Currency','Cylinder','Dam','Database','DatabaseBackup','DatabaseZap','Delete','Dessert','Diameter','Diamond','DiamondMinus','DiamondPercent','DiamondPlus','Dice1','Dice2','Dice3','Dice4','Dice5','Dice6','Dices','Diff','Disc','Disc2','Disc3','DiscAlbum','Divide','Dna','DnaOff','Dock','Dog','DollarSign','Donut','DoorClosed','DoorOpen','Dot','Download','DraftingCompass','Drama','Dribbble','Drill','Droplet','Droplets','Drum','Drumstick','Dumbbell','Ear','EarOff','Earth','EarthLock','Eclipse','Edit','Edit2','Edit3','Egg','EggFried','EggOff','Ellipsis','EllipsisVertical','Equal','EqualNot','EqualSquare','Eraser','Euro','Expand','ExternalLink','Eye','EyeClosed','EyeOff','Facebook','Factory','Fan','FastForward','Feather','Fence','FerrisWheel','Figma','File','FileArchive','FileAudio','FileAudio2','FileAxis3d','FileBadge','FileBadge2','FileBarChart','FileBarChart2','FileBox','FileCheck','FileCheck2','FileClock','FileCode','FileCode2','FileCog','FileDiff','FileDigit','FileDown','FileEdit','FileHeart','FileImage','FileInput','FileKey','FileKey2','FileLock','FileLock2','FileMinus','FileMinus2','FileMusic','FileOutput','FilePen','FilePenLine','FilePlus','FilePlus2','FileQuestion','FileScan','FileSearch','FileSearch2','FileSliders','FileSpreadsheet','FileStack','FileSymlink','FileTerminal','FileText','FileType','FileType2','FileUp','FileVideo','FileVideo2','FileVolume','FileVolume2','FileWarning','FileX','FileX2','Files','Film','Filter','FilterX','Fingerprint','FireExtinguisher','Fish','FishOff','FishSymbol','Flag','FlagOff','FlagTriangleLeft','FlagTriangleRight','Flame','FlameKindling','Flashlight','FlashlightOff','FlaskConical','FlaskConicalOff','FlaskRound','FlipHorizontal','FlipHorizontal2','FlipVertical','FlipVertical2','Flower','Flower2','Focus','FoldHorizontal','FoldVertical','Folder','FolderArchive','FolderCheck','FolderClosed','FolderCog','FolderDot','FolderDown','FolderEdit','FolderHeart','FolderInput','FolderKey','FolderLock','FolderMinus','FolderOpen','FolderOpenDot','FolderOutput','FolderPen','FolderPlus','FolderRoot','FolderSearch','FolderSearch2','FolderSymlink','FolderSync','FolderTree','FolderUp','FolderX','Folders','Footprints','Forklift','Forward','Frame','Framer','Frown','Fuel','Fullscreen','FunctionSquare','GalleryHorizontal','GalleryHorizontalEnd','GalleryThumbnails','GalleryVertical','GalleryVerticalEnd','Gamepad','Gamepad2','GanttChart','Gauge','Gavel','Gem','Ghost','Gift','GitBranch','GitBranchPlus','GitCommitHorizontal','GitCommitVertical','GitCompare','GitCompareArrows','GitFork','GitGraph','GitMerge','GitPullRequest','GitPullRequestArrow','GitPullRequestClosed','GitPullRequestCreate','GitPullRequestCreateArrow','GitPullRequestDraft','Github','Gitlab','GlassWater','Glasses','Globe','GlobeLock','Goal','Grab','GraduationCap','Grape','Grid2x2','Grid2x2Check','Grid2x2Plus','Grid2x2X','Grid3x3','Grip','GripHorizontal','GripVertical','Group','Guitar','Ham','Hammer','Hand','HandCoins','HandHeart','HandHelping','HandMetal','HandPlatter','HardDrive','HardDriveDownload','HardDriveUpload','HardHat','Hash','Haze','HdmiPort','Heading','Heading1','Heading2','Heading3','Heading4','Heading5','Heading6','Headphones','Headset','Heart','HeartCrack','HeartHandshake','HeartOff','HeartPulse','Heater','Hexagon','Highlighter','History','Home','Hop','HopOff','Hospital','Hotel','Hourglass','House','HousePlug','HousePlus','IceCream','IceCream2','Image','ImageDown','ImageMinus','ImageOff','ImagePlay','ImagePlus','ImageUp','ImageUpscale','Images','Import','Inbox','IndentDecrease','IndentIncrease','IndianRupee','Infinity','Info','InspectionPanel','Instagram','Italic','IterationCcw','IterationCw','JapaneseYen','Joystick','Kanban','Key','KeyRound','KeySquare','Keyboard','KeyboardMusic','Lamp','LampCeiling','LampDesk','LampFloor','LampWallDown','LampWallUp','LandPlot','Landmark','Languages','Laptop','LaptopMinimal','Lasso','LassoSelect','Laugh','Layers','Layers2','Layers3','LayoutDashboard','LayoutGrid','LayoutList','LayoutPanelLeft','LayoutPanelTop','LayoutTemplate','Leaf','LeafyGreen','Library','LibraryBig','LifeBuoy','Ligature','Lightbulb','LightbulbOff','LineChart','Link','Link2','Link2Off','LinkOff','Linkedin','List','ListCheck','ListChecks','ListCollapse','ListEnd','ListFilter','ListMinus','ListMusic','ListOrdered','ListPlus','ListRestart','ListStart','ListTodo','ListTree','ListVideo','ListX','Loader','LoaderCircle','LoaderPinwheel','Locate','LocateFixed','LocateOff','Lock','LockKeyhole','LockKeyholeOpen','LockOpen','LogIn','LogOut','Logs','Lollipop','Luggage','MSquare','Magnet','Mail','MailCheck','MailMinus','MailOpen','MailPlus','MailQuestion','MailSearch','MailWarning','MailX','Mailbox','Mails','Map','MapPin','MapPinCheck','MapPinCheckInside','MapPinHouse','MapPinMinus','MapPinMinusInside','MapPinOff','MapPinPlus','MapPinPlusInside','MapPinX','MapPinXInside','Martini','Maximize','Maximize2','Medal','Megaphone','MegaphoneOff','Meh','MemoryStick','Menu','Merge','MessageCircle','MessageCircleCode','MessageCircleDashed','MessageCircleHeart','MessageCircleMore','MessageCircleOff','MessageCirclePlus','MessageCircleQuestion','MessageCircleReply','MessageCircleWarning','MessageCircleX','MessageSquare','MessageSquareCode','MessageSquareDashed','MessageSquareDiff','MessageSquareDot','MessageSquareHeart','MessageSquareLock','MessageSquareMore','MessageSquareOff','MessageSquarePlus','MessageSquareQuote','MessageSquareReply','MessageSquareShare','MessageSquareText','MessageSquareWarning','MessageSquareX','MessagesSquare','Mic','Mic2','MicOff','MicVocal','Microscope','Microwave','Milestone','Milk','MilkOff','Minimize','Minimize2','Minus','Mirror','MobilePhone','Modifier','Monitor','MonitorCheck','MonitorDot','MonitorDown','MonitorOff','MonitorPause','MonitorPlay','MonitorSpeaker','MonitorStop','MonitorUp','MonitorX','Moon','MoonStar','MoreHorizontal','MoreVertical','Mountain','MountainSnow','Mouse','MouseOff','MousePointer','MousePointer2','MousePointerBan','MousePointerClick','Move','Move3d','MoveDiagonal','MoveDiagonal2','MoveDown','MoveDownLeft','MoveDownRight','MoveHorizontal','MoveLeft','MoveRight','MoveUp','MoveUpLeft','MoveUpRight','MoveVertical','Music','Music2','Music3','Music4','Navigation','Navigation2','Navigation2Off','NavigationOff','Network','Newspaper','Nfc','Notebook','NotebookPen','NotebookTabs','NotebookText','NotepadText','NotepadTextDashed','Nut','NutOff','Octagon','OctagonAlert','OctagonMinus','OctagonPause','OctagonStop','OctagonX','Option','Orbit','Origami','Package','Package2','PackageCheck','PackageMinus','PackageOpen','PackagePlus','PackageSearch','PackageX','PaintBucket','PaintRoller','Paintbrush','Paintbrush2','Palette','Palmtree','PanelBottom','PanelBottomClose','PanelBottomDashed','PanelBottomOpen','PanelLeft','PanelLeftClose','PanelLeftDashed','PanelLeftOpen','PanelRight','PanelRightClose','PanelRightDashed','PanelRightOpen','PanelTop','PanelTopClose','PanelTopDashed','PanelTopOpen','PanelsLeftBottom','PanelsRightBottom','PanelsTopLeft','Paperclip','Parentheses','ParkingMeter','PartyPopper','Pause','PawPrint','PcCase','Pen','PenLine','PenTool','Pentagon','Percent','PersonStanding','Phone','PhoneCall','PhoneForwarded','PhoneIncoming','PhoneMissed','PhoneOff','PhoneOutgoing','Pi','Piano','Pickaxe','PictureInPicture','PictureInPicture2','PieChart','PiggyBank','Pilcrow','Pill','PillBottle','Pin','PinOff','Pineapple','Pipette','Pizza','Plane','PlaneLanding','PlaneTakeoff','Play','Plug','Plug2','PlugZap','PlugZap2','Plus','Pocket','PocketKnife','Podcast','Pointer','PointerOff','Popcorn','Popsicle','PoundSterling','Power','PowerOff','Presentation','Printer','PrinterCheck','Projector','Proportions','Puzzle','Pyramid','QrCode','Quote','Rabbit','Radar','Radiation','Radical','Radio','RadioReceiver','Rainbow','Rat','Ratio','Receipt','ReceiptCent','ReceiptEuro','ReceiptIndianRupee','ReceiptJapaneseYen','ReceiptPoundSterling','ReceiptRussianRuble','ReceiptSwissFranc','ReceiptText','RectangleEllipsis','RectangleHorizontal','RectangleVertical','Recycle','Redo','Redo2','RedoDot','RefreshCcw','RefreshCcwDot','RefreshCw','RefreshCwOff','Refrigerator','Regex','RemoveFormatting','Repeat','Repeat1','Repeat2','Replace','ReplaceAll','Reply','ReplyAll','Rewind','Ribbon','Rocket','RockingChair','RollerCoaster','Rotate3d','RotateCcw','RotateCcwSquare','RotateCw','RotateCwSquare','Route','RouteOff','Router','Rows2','Rows3','Rows4','Rss','Ruler','RussianRuble','Sailboat','Salad','Sandwich','Satellite','SatelliteDish','Save','SaveAll','Scale','Scale3d','Scaling','Scan','ScanBarcode','ScanEye','ScanFace','ScanLine','ScanQrCode','ScanSearch','ScanText','Scatter','School','Scissors','ScreenShare','ScreenShareOff','Scroll','ScrollText','Search','SearchCheck','SearchCode','SearchSlash','SearchX','Section','Send','SendHorizontal','SendToBack','SeparatorHorizontal','SeparatorVertical','Server','ServerCog','ServerCrash','ServerOff','Settings','Settings2','Shapes','Share','Share2','Sheet','Shell','Shield','ShieldAlert','ShieldBan','ShieldCheck','ShieldEllipsis','ShieldHalf','ShieldMinus','ShieldOff','ShieldPlus','ShieldQuestion','ShieldX','Ship','ShipWheel','Shirt','ShoppingBag','ShoppingBasket','ShoppingCart','Shovel','ShowerHead','Shrink','Shrub','Shuffle','Sigma','Signal','SignalHigh','SignalLow','SignalMedium','SignalZero','Signpost','SignpostBig','Siren','SkipBack','SkipForward','Skull','Slack','Slash','Slice','Sliders','SlidersHorizontal','SlidersVertical','Smartphone','SmartphoneCharging','SmartphoneNfc','Smile','SmilePlus','Snail','Snowflake','Sofa','SolarPanel','SortAsc','SortDesc','Soup','Space','Spade','Sparkle','Sparkles','Speaker','Speech','SpellCheck','SpellCheck2','Sphere','Split','SprayCan','Sprout','Square','SquareActivity','SquareArrowDown','SquareArrowDownLeft','SquareArrowDownRight','SquareArrowLeft','SquareArrowOutDownLeft','SquareArrowOutDownRight','SquareArrowOutUpLeft','SquareArrowOutUpRight','SquareArrowRight','SquareArrowUp','SquareArrowUpLeft','SquareArrowUpRight','SquareAsterisk','SquareBottomDashedScissors','SquareCheck','SquareCheckBig','SquareChevronDown','SquareChevronLeft','SquareChevronRight','SquareChevronUp','SquareCode','SquareDashedBottom','SquareDashedBottomCode','SquareDashedKanban','SquareDashedMousePointer','SquareDivide','SquareDot','SquareEqual','SquareFunction','SquareGanttChart','SquareKanban','SquareLibrary','SquareM','SquareMenu','SquareMinus','SquareMousePointer','SquareParking','SquareParkingOff','SquarePen','SquarePercent','SquarePi','SquarePilcrow','SquarePlay','SquarePlus','SquarePower','SquareRadical','SquareScissors','SquareSigma','SquareSlash','SquareSplitHorizontal','SquareSplitVertical','SquareStack','SquareTerminal','SquareUser','SquareUserRound','SquareX','Squircle','Squirrel','Stairs','Stamp','Star','StarHalf','StarOff','StepBack','StepForward','Stethoscope','Sticker','StickyNote','StopCircle','Store','StretchHorizontal','StretchVertical','Strikethrough','Subscript','Subtitles','Sun','SunDim','SunMedium','SunMoon','SunSnow','Sunrise','Sunset','Superscript','SwatchBook','SwissFranc','SwitchCamera','Sword','Swords','Syringe','Table','Table2','TableCellsMerge','TableCellsSplit','TableColumnsSplit','TableProperties','TableRowsSplit','Tablet','TabletSmartphone','Tablets','Tag','Tags','Tally1','Tally2','Tally3','Tally4','Tally5','Tangent','Target','Taxi','TeaCup','TeapotSelect','Telescope','Tent','TentTree','Terminal','TestTube','TestTubeDiagonal','TestTubes','Text','TextCursor','TextCursorInput','TextQuote','TextSearch','TextSelect','Theater','Thermometer','ThermometerSnowflake','ThermometerSun','ThumbsDown','ThumbsUp','Ticket','TicketCheck','TicketMinus','TicketPercent','TicketPlus','TicketSlash','TicketX','Timer','TimerOff','TimerReset','Toggle','ToggleLeft','ToggleRight','Toilet','Tomato','Tongue','Toolbox','Tornado','Torus','TouchpadOff','TowerControl','ToyBrick','Tractor','TrafficCone','Train','TrainFront','TrainFrontTunnel','TrainTrack','TramFront','Trash','Trash2','TreeDeciduous','TreePalm','TreePine','Trees','Trello','TrendingDown','TrendingUp','TrendingUpDown','Triangle','TriangleAlert','TriangleRight','Trophy','Truck','Turtle','Tv','Tv2','Twitch','Twitter','Type','TypeOutline','Umbrella','UmbrellaOff','Underline','Undo','Undo2','UndoDot','UnfoldHorizontal','UnfoldVertical','Ungroup','University','Unlink','Unlink2','Unlock','UnlockKeyhole','Unplug','Upload','Usb','User','User2','UserCheck','UserCheck2','UserCog','UserCog2','UserMinus','UserMinus2','UserPen','UserPlus','UserPlus2','UserRound','UserRoundCheck','UserRoundCog','UserRoundMinus','UserRoundPen','UserRoundPlus','UserRoundSearch','UserRoundX','UserSearch','UserX','UserX2','Users','Users2','UsersRound','UtensilsCrossed','UtensilsRound','UtilityPole','Variable','Vault','Vegan','VenetianMask','Vibrate','VibrateOff','Video','VideoOff','View','Voicemail','Volume','Volume1','Volume2','VolumeOff','VolumeX','Vote','Wallet','WalletCards','WalletMinimal','Wallpaper','Wand','WandSparkles','Warehouse','WashingMachine','Watch','Waves','Waypoints','Webcam','Webhook','WebhookOff','Weight','Wheat','WheatOff','WholeWord','Wifi','WifiHigh','WifiLow','WifiOff','WifiZero','Wind','Wine','WineOff','Workflow','Worm','WrapText','Wrench','X','Youtube','Zap','ZapOff','ZoomIn','ZoomOut'
  ];
  icon_name text;
  icon_category text;
  inserted_count integer := 0;
BEGIN
  FOREACH icon_name IN ARRAY missing_icons
  LOOP
    -- Categorize the icon
    icon_category := CASE 
      WHEN icon_name ILIKE '%Computer%' OR icon_name ILIKE '%Laptop%' OR icon_name ILIKE '%Desktop%' OR 
           icon_name ILIKE '%Server%' OR icon_name ILIKE '%Database%' OR icon_name ILIKE '%Wifi%' OR 
           icon_name ILIKE '%Bluetooth%' OR icon_name ILIKE '%Usb%' OR icon_name ILIKE '%Cpu%' OR
           icon_name ILIKE '%HardDrive%' OR icon_name ILIKE '%Monitor%' OR icon_name ILIKE '%Keyboard%' OR
           icon_name ILIKE '%Mouse%' OR icon_name ILIKE '%Smartphone%' OR icon_name ILIKE '%Tablet%' OR
           icon_name ILIKE '%Battery%' OR icon_name ILIKE '%Power%' OR icon_name ILIKE '%Plug%' OR 
           icon_name ILIKE '%QrCode%' OR icon_name ILIKE '%Scan%' OR icon_name ILIKE '%Code%' OR
           icon_name ILIKE '%Terminal%' OR icon_name ILIKE '%Command%' OR icon_name ILIKE '%Git%' THEN 'technology'
      
      WHEN icon_name ILIKE '%Play%' OR icon_name ILIKE '%Pause%' OR icon_name ILIKE '%Stop%' OR 
           icon_name ILIKE '%Music%' OR icon_name ILIKE '%Volume%' OR icon_name ILIKE '%Speaker%' OR
           icon_name ILIKE '%Headphones%' OR icon_name ILIKE '%Microphone%' OR icon_name ILIKE '%Video%' OR
           icon_name ILIKE '%Camera%' OR icon_name ILIKE '%Film%' OR icon_name ILIKE '%Image%' OR
           icon_name ILIKE '%Photo%' OR icon_name ILIKE '%Picture%' OR icon_name ILIKE '%Gallery%' OR
           icon_name ILIKE '%Tv%' OR icon_name ILIKE '%Radio%' OR icon_name ILIKE '%Podcast%' OR
           icon_name ILIKE '%Youtube%' OR icon_name ILIKE '%Instagram%' OR icon_name ILIKE '%Facebook%' OR 
           icon_name ILIKE '%Twitter%' OR icon_name ILIKE '%Linkedin%' THEN 'media'
      
      WHEN icon_name ILIKE '%Arrow%' OR icon_name ILIKE '%Chevron%' OR icon_name ILIKE '%Navigate%' OR
           icon_name ILIKE '%Direction%' OR icon_name ILIKE '%Compass%' OR icon_name ILIKE '%Map%' OR
           icon_name ILIKE '%Location%' OR icon_name ILIKE '%Route%' OR icon_name ILIKE '%Move%' OR 
           icon_name ILIKE '%Corner%' OR icon_name ILIKE '%Expand%' OR icon_name ILIKE '%Minimize%' OR 
           icon_name ILIKE '%Maximize%' OR icon_name ILIKE '%Fullscreen%' THEN 'navigation'
      
      WHEN icon_name ILIKE '%Mail%' OR icon_name ILIKE '%Message%' OR icon_name ILIKE '%Chat%' OR 
           icon_name ILIKE '%Phone%' OR icon_name ILIKE '%Contact%' OR icon_name ILIKE '%Send%' OR 
           icon_name ILIKE '%Bell%' OR icon_name ILIKE '%Share%' OR icon_name ILIKE '%AtSign%' OR 
           icon_name ILIKE '%Reply%' THEN 'communication'
      
      WHEN icon_name ILIKE '%File%' OR icon_name ILIKE '%Folder%' OR icon_name ILIKE '%Document%' OR
           icon_name ILIKE '%Download%' OR icon_name ILIKE '%Upload%' OR icon_name ILIKE '%Cloud%' OR 
           icon_name ILIKE '%Save%' OR icon_name ILIKE '%Copy%' OR icon_name ILIKE '%Clipboard%' THEN 'files'
      
      WHEN icon_name ILIKE '%Plus%' OR icon_name ILIKE '%Minus%' OR icon_name ILIKE '%Delete%' OR 
           icon_name ILIKE '%Trash%' OR icon_name ILIKE '%Edit%' OR icon_name ILIKE '%Pencil%' OR 
           icon_name ILIKE '%Check%' OR icon_name ILIKE '%X%' OR icon_name ILIKE '%Search%' OR 
           icon_name ILIKE '%Filter%' OR icon_name ILIKE '%Settings%' OR icon_name ILIKE '%Menu%' OR
           icon_name ILIKE '%List%' OR icon_name ILIKE '%Grid%' OR icon_name ILIKE '%Eye%' OR
           icon_name ILIKE '%Refresh%' OR icon_name ILIKE '%Sync%' OR icon_name ILIKE '%Home%' THEN 'actions'
      
      WHEN icon_name ILIKE '%Layout%' OR icon_name ILIKE '%Sidebar%' OR icon_name ILIKE '%Panel%' OR
           icon_name ILIKE '%Columns%' OR icon_name ILIKE '%Rows%' OR icon_name ILIKE '%Align%' OR
           icon_name ILIKE '%Square%' OR icon_name ILIKE '%Rectangle%' OR icon_name ILIKE '%Circle%' OR
           icon_name ILIKE '%Triangle%' THEN 'layout'
      
      WHEN icon_name ILIKE '%Chart%' OR icon_name ILIKE '%Graph%' OR icon_name ILIKE '%Bar%' OR
           icon_name ILIKE '%Line%' OR icon_name ILIKE '%Pie%' OR icon_name ILIKE '%Trending%' THEN 'charts'
      
      WHEN icon_name ILIKE '%Calendar%' OR icon_name ILIKE '%Clock%' OR icon_name ILIKE '%Timer%' OR
           icon_name ILIKE '%Watch%' OR icon_name ILIKE '%Schedule%' OR icon_name ILIKE '%Alarm%' THEN 'time'
      
      WHEN icon_name ILIKE '%User%' OR icon_name ILIKE '%Person%' OR icon_name ILIKE '%People%' OR
           icon_name ILIKE '%Profile%' OR icon_name ILIKE '%Avatar%' OR icon_name ILIKE '%Team%' OR
           icon_name ILIKE '%Group%' THEN 'people'
      
      WHEN icon_name ILIKE '%Lock%' OR icon_name ILIKE '%Unlock%' OR icon_name ILIKE '%Key%' OR
           icon_name ILIKE '%Shield%' THEN 'security'
      
      WHEN icon_name ILIKE '%Alert%' OR icon_name ILIKE '%Warning%' OR icon_name ILIKE '%Error%' OR
           icon_name ILIKE '%Info%' OR icon_name ILIKE '%Help%' OR icon_name ILIKE '%Question%' THEN 'status'
      
      WHEN icon_name ILIKE '%Sun%' OR icon_name ILIKE '%Moon%' OR icon_name ILIKE '%Cloud%' OR
           icon_name ILIKE '%Rain%' OR icon_name ILIKE '%Snow%' OR icon_name ILIKE '%Storm%' OR
           icon_name ILIKE '%Wind%' THEN 'weather'
      
      WHEN icon_name ILIKE '%Car%' OR icon_name ILIKE '%Truck%' OR icon_name ILIKE '%Bus%' OR
           icon_name ILIKE '%Train%' OR icon_name ILIKE '%Plane%' OR icon_name ILIKE '%Bike%' OR
           icon_name ILIKE '%Ship%' OR icon_name ILIKE '%Taxi%' THEN 'transportation'
      
      WHEN icon_name ILIKE '%Food%' OR icon_name ILIKE '%Coffee%' OR icon_name ILIKE '%Pizza%' OR
           icon_name ILIKE '%Apple%' OR icon_name ILIKE '%Banana%' OR icon_name ILIKE '%Cherry%' OR
           icon_name ILIKE '%Grape%' OR icon_name ILIKE '%Cake%' OR icon_name ILIKE '%Cookie%' OR
           icon_name ILIKE '%Utensils%' OR icon_name ILIKE '%Wine%' OR icon_name ILIKE '%Beer%' THEN 'food'
      
      WHEN icon_name ILIKE '%Shop%' OR icon_name ILIKE '%Cart%' OR icon_name ILIKE '%Basket%' OR
           icon_name ILIKE '%Dollar%' OR icon_name ILIKE '%Euro%' OR icon_name ILIKE '%Pound%' OR
           icon_name ILIKE '%Currency%' OR icon_name ILIKE '%Wallet%' OR icon_name ILIKE '%Card%' OR
           icon_name ILIKE '%Receipt%' THEN 'commerce'
      
      WHEN icon_name ILIKE '%Tool%' OR icon_name ILIKE '%Wrench%' OR icon_name ILIKE '%Hammer%' OR
           icon_name ILIKE '%Scissors%' OR icon_name ILIKE '%Brush%' OR icon_name ILIKE '%Pen%' THEN 'tools'
      
      WHEN icon_name ILIKE '%Game%' OR icon_name ILIKE '%Dice%' OR icon_name ILIKE '%Trophy%' OR
           icon_name ILIKE '%Award%' OR icon_name ILIKE '%Star%' OR icon_name ILIKE '%Heart%' THEN 'games'
      
      WHEN icon_name ILIKE '%Book%' OR icon_name ILIKE '%School%' OR icon_name ILIKE '%University%' OR
           icon_name ILIKE '%GraduationCap%' THEN 'education'
      
      WHEN icon_name ILIKE '%Dog%' OR icon_name ILIKE '%Cat%' OR icon_name ILIKE '%Bird%' OR
           icon_name ILIKE '%Fish%' OR icon_name ILIKE '%Rabbit%' THEN 'animals'
      
      WHEN icon_name ILIKE '%Tree%' OR icon_name ILIKE '%Leaf%' OR icon_name ILIKE '%Flower%' OR 
           icon_name ILIKE '%Plant%' THEN 'plants'
      
      WHEN icon_name ILIKE '%Building%' OR icon_name ILIKE '%House%' OR icon_name ILIKE '%Construction%' OR
           icon_name ILIKE '%Hammer%' THEN 'construction'
      
      WHEN icon_name ILIKE '%Text%' OR icon_name ILIKE '%Font%' OR icon_name ILIKE '%Bold%' OR
           icon_name ILIKE '%Italic%' OR icon_name ILIKE '%Underline%' THEN 'typography'
      
      WHEN icon_name ILIKE '%Social%' OR icon_name ILIKE '%Network%' OR icon_name ILIKE '%Follow%' THEN 'social'
      
      WHEN icon_name ILIKE '%Chair%' OR icon_name ILIKE '%Sofa%' OR icon_name ILIKE '%Bed%' THEN 'furniture'
      
      WHEN icon_name ILIKE '%Plus%' OR icon_name ILIKE '%Minus%' OR icon_name ILIKE '%Equal%' OR
           icon_name ILIKE '%Percent%' THEN 'math'
      
      WHEN icon_name ILIKE '%Note%' OR icon_name ILIKE '%Piano%' OR icon_name ILIKE '%Guitar%' THEN 'music'
      
      WHEN icon_name ILIKE '%Box%' OR icon_name ILIKE '%Package%' OR icon_name ILIKE '%Gift%' OR
           icon_name ILIKE '%Bag%' OR icon_name ILIKE '%Briefcase%' THEN 'objects'
      
      WHEN icon_name ILIKE '%Sport%' OR icon_name ILIKE '%Dumbbell%' THEN 'sports'
      
      WHEN icon_name ILIKE '%Stethoscope%' OR icon_name ILIKE '%Pill%' OR icon_name ILIKE '%Syringe%' THEN 'medical'
      
      WHEN icon_name ILIKE '%Smile%' OR icon_name ILIKE '%Laugh%' OR icon_name ILIKE '%Frown%' THEN 'emoji'
      
      WHEN icon_name ILIKE '%Symbol%' OR icon_name ILIKE '%Hash%' OR icon_name ILIKE '%Ampersand%' THEN 'symbols'
      
      WHEN icon_name ILIKE '%Ban%' OR icon_name ILIKE '%Stop%' THEN 'safety'
      
      ELSE 'misc'
    END;
    
    -- Insert the icon if it doesn't exist
    INSERT INTO public.icons (name, category, description, is_active, usage_count)
    VALUES (icon_name, icon_category, 'Lucide React icon: ' || icon_name, true, 0)
    ON CONFLICT (name) DO NOTHING;
    
    -- Check if the icon was actually inserted
    IF FOUND THEN
      inserted_count := inserted_count + 1;
    END IF;
  END LOOP;
  
  RETURN inserted_count;
END;
$$;

-- Execute the function to add missing icons
SELECT add_missing_lucide_icons() as icons_added;

-- Drop the temporary function
DROP FUNCTION add_missing_lucide_icons();