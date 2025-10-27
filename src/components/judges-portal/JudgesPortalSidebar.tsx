import { Link, useLocation } from 'react-router-dom';
import { Gavel, LogOut, LayoutDashboard, Trophy, FileText, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export const JudgesPortalSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('Failed to sign out');
      return;
    }
    toast.success('Signed out successfully');
    navigate('/app/judges/auth');
  };

  const navItems = [
    {
      title: 'Dashboard',
      icon: LayoutDashboard,
      href: '/app/judges-portal',
    },
    {
      title: 'Open Competitions',
      icon: Trophy,
      href: '/app/judges-portal/open-competitions',
    },
    {
      title: 'My Applications',
      icon: FileText,
      href: '/app/judges-portal/applications',
    },
    {
      title: 'Profile',
      icon: User,
      href: '/app/judges-portal/profile',
    },
  ];

  return (
    <div className="flex flex-col h-full bg-sidebar border-r border-sidebar-border">
      {/* Header */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-judge to-judge/70 flex items-center justify-center shadow-md">
            <Gavel className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-sidebar-foreground">Judges Portal</h2>
            <p className="text-xs text-sidebar-foreground/60">Manage your judging</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          
          return (
            <Link
              key={item.href}
              to={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                isActive
                  ? 'bg-judge/10 text-judge font-medium'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};
