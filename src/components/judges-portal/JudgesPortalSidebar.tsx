import { Link, useLocation } from "react-router-dom";
import { Gavel, LogOut, LayoutDashboard, Trophy, FileText, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { getRoleIcon, getRoleColor } from "@/components/user-management/components/UserRoleUtils";
interface JudgesPortalSidebarProps {
  isMobile?: boolean;
  sidebarOpen?: boolean;
  setSidebarOpen?: (open: boolean) => void;
}
export const JudgesPortalSidebar = ({
  isMobile = false,
  sidebarOpen = false,
  setSidebarOpen
}: JudgesPortalSidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    userProfile
  } = useAuth();
  const handleSignOut = async () => {
    const {
      error
    } = await supabase.auth.signOut();
    if (error) {
      toast.error("Failed to sign out");
      return;
    }
    toast.success("Signed out successfully");
    navigate("/app/user-type");
  };
  const navItems = [{
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/app/judges-portal"
  }, {
    title: "Open Competitions",
    icon: Trophy,
    href: "/app/judges-portal/open-competitions"
  }, {
    title: "My Applications",
    icon: FileText,
    href: "/app/judges-portal/applications"
  }, {
    title: "My Profile",
    icon: User,
    href: "/app/judges-portal/my_profile"
  }];
  const handleNavClick = (href: string) => {
    navigate(href);
    if (isMobile) {
      setSidebarOpen?.(false);
    }
  };

  // Mobile view with Sheet
  if (isMobile) {
    return <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="p-6 border-b border-sidebar-border">
            <SheetTitle className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-judge to-judge/70 flex items-center justify-center shadow-md">
                <Gavel className="h-5 w-5 text-white" />
              </div>
              <div className="text-left">
                <div className="font-bold text-sidebar-foreground">Judges Portal</div>
                <div className="text-xs text-sidebar-foreground/60">Manage your judging</div>
              </div>
            </SheetTitle>
          </SheetHeader>

          <nav className="p-4 space-y-1">
            {navItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return <Button key={item.href} variant={isActive ? "secondary" : "ghost"} className="w-full justify-start" onClick={() => handleNavClick(item.href)}>
                  <Icon className="h-5 w-5 mr-3" />
                  {item.title}
                </Button>;
          })}
          </nav>

          <div className="absolute bottom-0 left-0 right-0 border-t border-sidebar-border">
            {userProfile && <div className="p-4 border-b border-sidebar-border">
                <div className="text-sm font-medium text-sidebar-foreground">
                  {userProfile.last_name}, {userProfile.first_name}
                </div>
                <Badge variant="secondary" className={`${getRoleColor(userProfile.user_roles?.role_name || userProfile.role)} flex items-center gap-1 w-fit mt-1`}>
                  {getRoleIcon(userProfile.user_roles?.role_name || userProfile.role)}
                  {(userProfile.user_roles?.role_name || userProfile.role).replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                </Badge>
              </div>}
            <div className="p-4">
              <Button variant="ghost" className="w-full justify-start" onClick={handleSignOut}>
                <LogOut className="h-5 w-5 mr-3" />
                Sign Out
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>;
  }

  // Desktop view
  return <div className="fixed left-0 top-0 h-screen w-64 flex flex-col bg-sidebar border-r border-sidebar-border">
      {/* Header */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-judge to-judge/70 flex items-center justify-center shadow-md">
            <Gavel className="h-5 w-5 text-black" />
          </div>
          <div>
            <h2 className="font-bold text-sidebar-foreground">Judges Portal</h2>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map(item => {
        const Icon = item.icon;
        const isActive = location.pathname === item.href;
        return <Link key={item.href} to={item.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${isActive ? "bg-judge/10 text-judge font-medium" : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"}`}>
              <Icon className="h-5 w-5 shrink-0" />
              <span>{item.title}</span>
            </Link>;
      })}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border">
        {userProfile}
        <div className="p-4">
          <button onClick={handleSignOut} className="flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all">
            <LogOut className="h-5 w-5 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>;
};