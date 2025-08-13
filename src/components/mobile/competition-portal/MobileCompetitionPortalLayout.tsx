import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Award, Search, Target, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
const competitionNavItems = [{
  name: 'Hosting',
  path: '/mobile/competition-portal/hosting',
  icon: Award
}, {
  name: 'Open',
  path: '/mobile/competition-portal/open',
  icon: Search
}, {
  name: 'My Comps',
  path: '/mobile/competition-portal/my-competitions',
  icon: Target
}];
interface MobileCompetitionPortalLayoutProps {
  children: React.ReactNode;
}
export const MobileCompetitionPortalLayout: React.FC<MobileCompetitionPortalLayoutProps> = ({
  children
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const handleBackClick = () => {
    navigate('/mobile/dashboard');
  };
  return <div className="min-h-screen bg-background pb-16">

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Competition Portal Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
        <div className="flex justify-around">
          {competitionNavItems.map(item => {
          const isActive = location.pathname.startsWith(item.path);
          const Icon = item.icon;
          return <NavLink key={item.name} to={item.path} className={cn("flex flex-col items-center justify-center py-2 px-3 min-w-0 flex-1", "transition-colors duration-200", isActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground")}>
                <Icon size={20} className="mb-1" />
                <span className="text-xs font-medium truncate">{item.name}</span>
              </NavLink>;
        })}
          <button onClick={handleBackClick} className="flex flex-col items-center justify-center py-2 px-3 min-w-0 flex-1 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={20} className="mb-1" />
            <span className="text-xs font-medium">Back</span>
          </button>
        </div>
      </nav>
    </div>;
};