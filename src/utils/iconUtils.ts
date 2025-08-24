import * as Icons from 'lucide-react';

// Get all available Lucide React icons
export const getAllLucideIcons = () => {
  const iconNames = Object.keys(Icons).filter(key => {
    const component = (Icons as any)[key];
    // Filter out non-component exports like 'createLucideIcon', 'icons', etc.
    return typeof component === 'function' && 
           key !== 'createLucideIcon' && 
           key !== 'Icon' &&
           !key.startsWith('use') &&
           // Check if it's a valid React component (has displayName or starts with uppercase)
           (key[0] === key[0].toUpperCase() || component.displayName);
  });
  
  console.log(`Found ${iconNames.length} Lucide React icons`);
  return iconNames.sort();
};

// Categorize icons based on their names
export const categorizeIcon = (iconName: string): string => {
  const name = iconName.toLowerCase();
  
  // Technology and computing
  if (name.includes('computer') || name.includes('laptop') || name.includes('desktop') || 
      name.includes('server') || name.includes('database') || name.includes('wifi') || 
      name.includes('bluetooth') || name.includes('usb') || name.includes('cpu') ||
      name.includes('hard') || name.includes('monitor') || name.includes('keyboard') ||
      name.includes('mouse') || name.includes('smartphone') || name.includes('tablet') ||
      name.includes('device') || name.includes('screen') || name.includes('battery') ||
      name.includes('power') || name.includes('plug') || name.includes('cable') ||
      name.includes('qr') || name.includes('scan') || name.includes('code') ||
      name.includes('git') || name.includes('terminal') || name.includes('command')) {
    return 'technology';
  }
  
  // Media and entertainment
  if (name.includes('play') || name.includes('pause') || name.includes('stop') || 
      name.includes('music') || name.includes('volume') || name.includes('speaker') ||
      name.includes('headphones') || name.includes('microphone') || name.includes('video') ||
      name.includes('camera') || name.includes('film') || name.includes('image') ||
      name.includes('photo') || name.includes('picture') || name.includes('gallery') ||
      name.includes('tv') || name.includes('radio') || name.includes('podcast') ||
      name.includes('media') || name.includes('youtube') || name.includes('instagram') ||
      name.includes('facebook') || name.includes('twitter') || name.includes('linkedin')) {
    return 'media';
  }
  
  // Navigation and arrows
  if (name.includes('arrow') || name.includes('chevron') || name.includes('navigate') ||
      name.includes('direction') || name.includes('compass') || name.includes('map') ||
      name.includes('location') || name.includes('gps') || name.includes('route') ||
      name.includes('move') || name.includes('corner') || name.includes('expand') ||
      name.includes('minimize') || name.includes('maximize') || name.includes('fullscreen')) {
    return 'navigation';
  }
  
  // Communication
  if (name.includes('mail') || name.includes('message') || name.includes('chat') || 
      name.includes('phone') || name.includes('call') || name.includes('contact') ||
      name.includes('send') || name.includes('inbox') || name.includes('bell') ||
      name.includes('notification') || name.includes('alert') || name.includes('share') ||
      name.includes('at') || name.includes('mention') || name.includes('reply') ||
      name.includes('forward')) {
    return 'communication';
  }
  
  // Files and documents
  if (name.includes('file') || name.includes('folder') || name.includes('document') ||
      name.includes('page') || name.includes('sheet') || name.includes('pdf') ||
      name.includes('doc') || name.includes('text') || name.includes('archive') ||
      name.includes('zip') || name.includes('download') || name.includes('upload') ||
      name.includes('cloud') || name.includes('save') || name.includes('copy') ||
      name.includes('paste') || name.includes('clipboard')) {
    return 'files';
  }
  
  // Actions and interface
  if (name.includes('add') || name.includes('plus') || name.includes('minus') ||
      name.includes('delete') || name.includes('trash') || name.includes('remove') ||
      name.includes('edit') || name.includes('pencil') || name.includes('write') ||
      name.includes('create') || name.includes('new') || name.includes('check') ||
      name.includes('close') || name.includes('cancel') || name.includes('confirm') ||
      name.includes('ok') || name.includes('yes') || name.includes('no') ||
      name.includes('search') || name.includes('filter') || name.includes('sort') ||
      name.includes('menu') || name.includes('settings') || name.includes('gear') ||
      name.includes('options') || name.includes('more') || name.includes('list') ||
      name.includes('grid') || name.includes('view') || name.includes('eye') ||
      name.includes('refresh') || name.includes('reload') || name.includes('sync') ||
      name.includes('undo') || name.includes('redo') || name.includes('back') ||
      name.includes('forward') || name.includes('home') || name.includes('dashboard')) {
    return 'actions';
  }
  
  // Layout and design
  if (name.includes('layout') || name.includes('sidebar') || name.includes('panel') ||
      name.includes('columns') || name.includes('rows') || name.includes('align') ||
      name.includes('justify') || name.includes('center') || name.includes('left') ||
      name.includes('right') || name.includes('top') || name.includes('bottom') ||
      name.includes('spacing') || name.includes('margin') || name.includes('padding') ||
      name.includes('border') || name.includes('frame') || name.includes('box') ||
      name.includes('container') || name.includes('wrap') || name.includes('flex') ||
      name.includes('square') || name.includes('rectangle') || name.includes('circle') ||
      name.includes('triangle')) {
    return 'layout';
  }
  
  // Charts and data
  if (name.includes('chart') || name.includes('graph') || name.includes('bar') ||
      name.includes('line') || name.includes('pie') || name.includes('trend') ||
      name.includes('analytics') || name.includes('data') || name.includes('statistics') ||
      name.includes('report') || name.includes('dashboard')) {
    return 'charts';
  }
  
  // Time and calendar
  if (name.includes('calendar') || name.includes('date') || name.includes('time') ||
      name.includes('clock') || name.includes('watch') || name.includes('schedule') ||
      name.includes('timer') || name.includes('alarm') || name.includes('event') ||
      name.includes('today') || name.includes('tomorrow') || name.includes('yesterday')) {
    return 'time';
  }
  
  // People and users
  if (name.includes('user') || name.includes('person') || name.includes('people') ||
      name.includes('profile') || name.includes('account') || name.includes('avatar') ||
      name.includes('team') || name.includes('group') || name.includes('friends') ||
      name.includes('contact') || name.includes('admin') || name.includes('role')) {
    return 'people';
  }
  
  // Security and privacy
  if (name.includes('lock') || name.includes('unlock') || name.includes('key') ||
      name.includes('password') || name.includes('secure') || name.includes('shield') ||
      name.includes('protect') || name.includes('private') || name.includes('public') ||
      name.includes('permission') || name.includes('access') || name.includes('auth') ||
      name.includes('login') || name.includes('logout') || name.includes('signin') ||
      name.includes('signup')) {
    return 'security';
  }
  
  // Status and indicators
  if (name.includes('status') || name.includes('indicator') || name.includes('badge') ||
      name.includes('dot') || name.includes('circle') && (name.includes('filled') || name.includes('check') || name.includes('x')) ||
      name.includes('warning') || name.includes('error') || name.includes('success') ||
      name.includes('info') || name.includes('help') || name.includes('question') ||
      name.includes('exclamation') || name.includes('alert')) {
    return 'status';
  }
  
  // Weather
  if (name.includes('sun') || name.includes('moon') || name.includes('cloud') ||
      name.includes('rain') || name.includes('snow') || name.includes('storm') ||
      name.includes('thunder') || name.includes('lightning') || name.includes('wind') ||
      name.includes('temperature') || name.includes('thermometer') || name.includes('weather')) {
    return 'weather';
  }
  
  // Transportation
  if (name.includes('car') || name.includes('truck') || name.includes('bus') ||
      name.includes('train') || name.includes('plane') || name.includes('bike') ||
      name.includes('motorcycle') || name.includes('ship') || name.includes('boat') ||
      name.includes('transport') || name.includes('vehicle') || name.includes('fuel') ||
      name.includes('traffic') || name.includes('road') || name.includes('parking')) {
    return 'transportation';
  }
  
  // Food and drink
  if (name.includes('food') || name.includes('eat') || name.includes('drink') ||
      name.includes('coffee') || name.includes('tea') || name.includes('wine') ||
      name.includes('beer') || name.includes('restaurant') || name.includes('kitchen') ||
      name.includes('chef') || name.includes('utensils') || name.includes('fork') ||
      name.includes('knife') || name.includes('spoon') || name.includes('plate') ||
      name.includes('cup') || name.includes('glass') || name.includes('bottle') ||
      name.includes('apple') || name.includes('banana') || name.includes('fruit') ||
      name.includes('pizza') || name.includes('hamburger') || name.includes('cake')) {
    return 'food';
  }
  
  // Shopping and commerce
  if (name.includes('shop') || name.includes('store') || name.includes('cart') ||
      name.includes('basket') || name.includes('buy') || name.includes('sell') ||
      name.includes('price') || name.includes('tag') || name.includes('receipt') ||
      name.includes('payment') || name.includes('card') || name.includes('cash') ||
      name.includes('dollar') || name.includes('euro') || name.includes('pound') ||
      name.includes('currency') || name.includes('wallet') || name.includes('bank') ||
      name.includes('credit') || name.includes('debit') || name.includes('paypal') ||
      name.includes('stripe')) {
    return 'commerce';
  }
  
  // Tools and utilities
  if (name.includes('tool') || name.includes('wrench') || name.includes('hammer') ||
      name.includes('screwdriver') || name.includes('ruler') || name.includes('calculator') ||
      name.includes('scissors') || name.includes('brush') || name.includes('palette') ||
      name.includes('paint') || name.includes('pen') || name.includes('marker') ||
      name.includes('eraser') || name.includes('crop') || name.includes('resize') ||
      name.includes('rotate') || name.includes('flip') || name.includes('transform')) {
    return 'tools';
  }
  
  // Games and entertainment
  if (name.includes('game') || name.includes('dice') || name.includes('puzzle') ||
      name.includes('trophy') || name.includes('award') || name.includes('medal') ||
      name.includes('star') || name.includes('heart') || name.includes('like') ||
      name.includes('love') || name.includes('smile') || name.includes('laugh') ||
      name.includes('fun') || name.includes('entertainment')) {
    return 'games';
  }
  
  // Health and medical
  if (name.includes('health') || name.includes('medical') || name.includes('hospital') ||
      name.includes('doctor') || name.includes('nurse') || name.includes('medicine') ||
      name.includes('pill') || name.includes('syringe') || name.includes('bandage') ||
      name.includes('stethoscope') || name.includes('heartbeat') || name.includes('pulse') ||
      name.includes('temperature') || name.includes('thermometer') || name.includes('cross') ||
      name.includes('emergency') || name.includes('ambulance')) {
    return 'medical';
  }
  
  // Education and learning
  if (name.includes('book') || name.includes('education') || name.includes('school') ||
      name.includes('university') || name.includes('college') || name.includes('learn') ||
      name.includes('study') || name.includes('student') || name.includes('teacher') ||
      name.includes('graduation') || name.includes('degree') || name.includes('diploma') ||
      name.includes('certificate') || name.includes('library') || name.includes('research')) {
    return 'education';
  }
  
  // Animals and nature
  if (name.includes('dog') || name.includes('cat') || name.includes('bird') ||
      name.includes('fish') || name.includes('animal') || name.includes('pet') ||
      name.includes('tree') || name.includes('leaf') || name.includes('flower') ||
      name.includes('plant') || name.includes('nature') || name.includes('garden') ||
      name.includes('forest') || name.includes('mountain') || name.includes('river') ||
      name.includes('ocean') || name.includes('beach') || name.includes('water')) {
    return name.includes('tree') || name.includes('leaf') || name.includes('flower') || name.includes('plant') ? 'plants' : 'animals';
  }
  
  // Sports and fitness
  if (name.includes('sport') || name.includes('fitness') || name.includes('gym') ||
      name.includes('exercise') || name.includes('run') || name.includes('walk') ||
      name.includes('bike') || name.includes('swim') || name.includes('football') ||
      name.includes('basketball') || name.includes('tennis') || name.includes('golf') ||
      name.includes('baseball') || name.includes('soccer') || name.includes('target') ||
      name.includes('dumbbell') || name.includes('weight')) {
    return 'sports';
  }
  
  // Math and science
  if (name.includes('math') || name.includes('plus') || name.includes('minus') ||
      name.includes('multiply') || name.includes('divide') || name.includes('equal') ||
      name.includes('percent') || name.includes('infinity') || name.includes('pi') ||
      name.includes('formula') || name.includes('equation') || name.includes('calculate') ||
      name.includes('science') || name.includes('atom') || name.includes('molecule') ||
      name.includes('lab') || name.includes('experiment') || name.includes('microscope') ||
      name.includes('telescope') || name.includes('dna') || name.includes('bacteria')) {
    return 'math';
  }
  
  // Music and audio
  if (name.includes('music') || name.includes('note') || name.includes('song') ||
      name.includes('audio') || name.includes('sound') || name.includes('speaker') ||
      name.includes('headphones') || name.includes('microphone') || name.includes('record') ||
      name.includes('playlist') || name.includes('album') || name.includes('artist') ||
      name.includes('band') || name.includes('guitar') || name.includes('piano') ||
      name.includes('drum') || name.includes('violin') || name.includes('trumpet')) {
    return 'music';
  }
  
  // Objects and items
  if (name.includes('bag') || name.includes('suitcase') || name.includes('backpack') ||
      name.includes('box') || name.includes('package') || name.includes('gift') ||
      name.includes('present') || name.includes('lamp') || name.includes('light') ||
      name.includes('bulb') || name.includes('candle') || name.includes('fire') ||
      name.includes('flame') || name.includes('umbrella') || name.includes('glasses') ||
      name.includes('watch') || name.includes('ring') || name.includes('necklace') ||
      name.includes('jewelry') || name.includes('crown') || name.includes('hat') ||
      name.includes('shirt') || name.includes('dress') || name.includes('shoe') ||
      name.includes('sock') || name.includes('glove') || name.includes('coat') ||
      name.includes('jacket') || name.includes('pants') || name.includes('skirt')) {
    return 'objects';
  }
  
  // Construction and building
  if (name.includes('building') || name.includes('house') || name.includes('home') ||
      name.includes('office') || name.includes('factory') || name.includes('warehouse') ||
      name.includes('construction') || name.includes('crane') || name.includes('brick') ||
      name.includes('cement') || name.includes('drill') || name.includes('saw') ||
      name.includes('nail') || name.includes('screw') || name.includes('bolt')) {
    return 'construction';
  }
  
  // Shapes and geometry
  if (name.includes('shape') || name.includes('geometry') || name.includes('square') ||
      name.includes('circle') || name.includes('triangle') || name.includes('rectangle') ||
      name.includes('diamond') || name.includes('hexagon') || name.includes('pentagon') ||
      name.includes('octagon') || name.includes('polygon') || name.includes('line') ||
      name.includes('curve') || name.includes('angle') || name.includes('corner')) {
    return 'shapes';
  }
  
  // Typography and text
  if (name.includes('text') || name.includes('font') || name.includes('type') ||
      name.includes('bold') || name.includes('italic') || name.includes('underline') ||
      name.includes('strikethrough') || name.includes('align') || name.includes('size') ||
      name.includes('format') || name.includes('style') || name.includes('paragraph') ||
      name.includes('heading') || name.includes('quote') || name.includes('list') ||
      name.includes('bullet') || name.includes('number') || name.includes('indent')) {
    return 'typography';
  }
  
  // Social and community
  if (name.includes('social') || name.includes('community') || name.includes('network') ||
      name.includes('follow') || name.includes('friend') || name.includes('group') ||
      name.includes('team') || name.includes('organization') || name.includes('company') ||
      name.includes('business') || name.includes('corporate') || name.includes('meeting') ||
      name.includes('conference') || name.includes('presentation') || name.includes('handshake')) {
    return 'social';
  }
  
  // Design and creative
  if (name.includes('design') || name.includes('creative') || name.includes('art') ||
      name.includes('draw') || name.includes('sketch') || name.includes('illustration') ||
      name.includes('graphic') || name.includes('color') || name.includes('palette') ||
      name.includes('brush') || name.includes('pen') || name.includes('pencil') ||
      name.includes('marker') || name.includes('paint') || name.includes('canvas') ||
      name.includes('layer') || name.includes('mask') || name.includes('select') ||
      name.includes('crop') || name.includes('rotate') || name.includes('flip') ||
      name.includes('zoom') || name.includes('pan')) {
    return 'design';
  }
  
  // Safety and warning
  if (name.includes('safety') || name.includes('warning') || name.includes('danger') ||
      name.includes('hazard') || name.includes('caution') || name.includes('stop') ||
      name.includes('forbidden') || name.includes('prohibited') || name.includes('ban') ||
      name.includes('block') || name.includes('restrict') || name.includes('limit')) {
    return 'safety';
  }
  
  // Symbols and icons
  if (name.includes('symbol') || name.includes('icon') || name.includes('sign') ||
      name.includes('logo') || name.includes('brand') || name.includes('trademark') ||
      name.includes('copyright') || name.includes('registered') || name.includes('patent') ||
      name.includes('infinity') || name.includes('hash') || name.includes('at') ||
      name.includes('ampersand') || name.includes('percent') || name.includes('degree')) {
    return 'symbols';
  }
  
  // Emoji and expressions
  if (name.includes('smile') || name.includes('laugh') || name.includes('cry') ||
      name.includes('sad') || name.includes('happy') || name.includes('angry') ||
      name.includes('surprised') || name.includes('confused') || name.includes('worried') ||
      name.includes('excited') || name.includes('love') || name.includes('heart') ||
      name.includes('kiss') || name.includes('wink') || name.includes('tongue') ||
      name.includes('face') || name.includes('expression') || name.includes('emotion')) {
    return 'emoji';
  }
  
  // Furniture and home
  if (name.includes('furniture') || name.includes('chair') || name.includes('table') ||
      name.includes('desk') || name.includes('bed') || name.includes('sofa') ||
      name.includes('couch') || name.includes('cabinet') || name.includes('shelf') ||
      name.includes('drawer') || name.includes('closet') || name.includes('wardrobe') ||
      name.includes('mirror') || name.includes('door') || name.includes('window') ||
      name.includes('curtain') || name.includes('blind') || name.includes('rug') ||
      name.includes('carpet') || name.includes('pillow') || name.includes('blanket')) {
    return 'furniture';
  }
  
  // Default to misc if no category matches
  return 'misc';
};