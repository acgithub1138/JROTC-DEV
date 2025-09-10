import { Shield, Users, GraduationCap } from 'lucide-react';

// Role configuration - easy to maintain in one place
const ROLE_CONFIG = {
  // Administrative roles
  admin: { icon: Shield, color: 'bg-red-100 text-red-800' },
  instructor: { icon: Shield, color: 'bg-blue-100 text-blue-800' },
  help_desk: { icon: Shield, color: 'bg-cyan-100 text-cyan-800' },
  
  // Staff roles
  command_staff: { icon: Users, color: 'bg-green-100 text-green-800' },
  special_staff: { icon: Users, color: 'bg-yellow-100 text-yellow-800' },
  
  // Student roles
  cadet: { icon: GraduationCap, color: 'bg-gray-100 text-gray-800' },
  
  // External roles
  parent: { icon: Users, color: 'bg-purple-100 text-purple-800' },
  external: { icon: Users, color: 'bg-orange-100 text-orange-800' },
  booster: { icon: Users, color: 'bg-pink-100 text-pink-800' },
} as const;

// Default configuration for unknown roles
const DEFAULT_CONFIG = { icon: Users, color: 'bg-gray-100 text-gray-800' };

export const getRoleIcon = (role: string) => {
  const config = ROLE_CONFIG[role?.toLowerCase() as keyof typeof ROLE_CONFIG] || DEFAULT_CONFIG;
  const IconComponent = config.icon;
  return <IconComponent className="w-4 h-4" />;
};

export const getRoleColor = (role: string) => {
  const config = ROLE_CONFIG[role?.toLowerCase() as keyof typeof ROLE_CONFIG] || DEFAULT_CONFIG;
  return config.color;
};