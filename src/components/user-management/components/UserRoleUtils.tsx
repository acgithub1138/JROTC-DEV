import { Shield, Users, GraduationCap } from 'lucide-react';

export const getRoleIcon = (role: string) => {
  switch (role?.toLowerCase()) {
    case 'admin': return <Shield className="w-4 h-4" />;
    case 'instructor': return <Shield className="w-4 h-4" />;
    case 'command_staff': return <Users className="w-4 h-4" />;
    case 'cadet': return <GraduationCap className="w-4 h-4" />;
    case 'parent': return <Users className="w-4 h-4" />;
    case 'special_staff': return <Users className="w-4 h-4" />;
    default: return <Users className="w-4 h-4" />;
  }
};

export const getRoleColor = (role: string) => {
  switch (role?.toLowerCase()) {
    case 'admin': return 'bg-red-100 text-red-800';
    case 'instructor': return 'bg-blue-100 text-blue-800';
    case 'command_staff': return 'bg-green-100 text-green-800';
    case 'cadet': return 'bg-gray-100 text-gray-800';
    case 'parent': return 'bg-purple-100 text-purple-800';
    case 'special_staff': return 'bg-yellow-100 text-yellow-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};