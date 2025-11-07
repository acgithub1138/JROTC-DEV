import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ChevronDown, ChevronRight, Trophy, Users, FileText, School, Calendar, Award, ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface CompetitionDetailsSidebarProps {
  competitionId: string;
  permissions: {
    events: { canAccess: boolean };
    judges: { canAccess: boolean };
    resources: { canAccess: boolean };
    schools: { canAccess: boolean };
    schedule: { canAccess: boolean };
    results: { canAccess: boolean };
  };
  sidebarOpen?: boolean;
  setSidebarOpen?: (open: boolean) => void;
}

export const CompetitionDetailsSidebar = ({ competitionId, permissions, sidebarOpen, setSidebarOpen }: CompetitionDetailsSidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const isMobile = useIsMobile();

  const [judgesOpen, setJudgesOpen] = useState(currentPath.includes('/judges'));
  const [applicationsOpen, setApplicationsOpen] = useState(currentPath.includes('/applications'));
  const [schedulesOpen, setSchedulesOpen] = useState(currentPath.includes('/schedules'));

  const navigateTo = (path: string) => {
    navigate(`/app/competition-portal/competition-details/${competitionId}${path}`);
    if (isMobile && setSidebarOpen) {
      setSidebarOpen(false);
    }
  };

  const isActive = (path: string) => currentPath === `/app/competition-portal/competition-details/${competitionId}${path}`;

  const menuItems = [
    {
      id: 'events',
      label: 'Events',
      icon: Trophy,
      path: '/events',
      canAccess: permissions.events.canAccess,
    },
    {
      id: 'judges',
      label: 'Judges',
      icon: Users,
      canAccess: permissions.judges.canAccess,
      children: [
        { id: 'assigned', label: 'Assigned', path: '/judges/assigned' },
        {
          id: 'applications',
          label: 'Applications',
          path: '/judges/applications',
          children: [
            { id: 'pending', label: 'Pending', path: '/judges/applications/pending' },
            { id: 'approved', label: 'Approved', path: '/judges/applications/approved' },
            { id: 'declined', label: 'Declined', path: '/judges/applications/declined' },
          ],
        },
      ],
    },
    {
      id: 'resources',
      label: 'Resources',
      icon: FileText,
      path: '/resources',
      canAccess: permissions.resources.canAccess,
    },
    {
      id: 'schools',
      label: 'Schools',
      icon: School,
      path: '/schools',
      canAccess: permissions.schools.canAccess,
    },
    {
      id: 'schedules',
      label: 'Schedules',
      icon: Calendar,
      canAccess: permissions.schedule.canAccess,
      children: [
        { id: 'schools', label: 'Schools', path: '/schedules/schools' },
        { id: 'judges', label: 'Judges', path: '/schedules/judges' },
        { id: 'resources', label: 'Resources', path: '/schedules/resources' },
      ],
    },
    {
      id: 'results',
      label: 'Results',
      icon: Award,
      path: '/results',
      canAccess: permissions.results.canAccess,
    },
  ];

  const renderMenuContent = () => (
    <>
      {menuItems.map((item) => {
        if (!item.canAccess) return null;

        // Item with children (collapsible)
        if (item.children) {
          const isJudges = item.id === 'judges';
          const isSchedules = item.id === 'schedules';
          const isOpen = isJudges ? judgesOpen : isSchedules ? schedulesOpen : false;
          const setOpen = isJudges ? setJudgesOpen : isSchedules ? setSchedulesOpen : () => {};

          return (
            <Collapsible key={item.id} open={isOpen} onOpenChange={setOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between font-normal hover:bg-muted/50"
                >
                  <div className="flex items-center gap-2">
                    {item.icon && <item.icon className="h-4 w-4" />}
                    <span>{item.label}</span>
                  </div>
                  {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="ml-4 space-y-1 mt-1">
                {item.children.map((child) => {
                  // Nested children (applications)
                  if (child.children) {
                    return (
                      <Collapsible key={child.id} open={applicationsOpen} onOpenChange={setApplicationsOpen}>
                        <CollapsibleTrigger asChild>
                          <Button
                            variant="ghost"
                            className="w-full justify-between font-normal text-sm hover:bg-muted/50"
                          >
                            <span>{child.label}</span>
                            {applicationsOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="ml-4 space-y-1 mt-1">
                          {child.children.map((subChild) => (
                            <Button
                              key={subChild.id}
                              variant="ghost"
                              className={cn(
                                "w-full justify-start font-normal text-sm hover:bg-muted/50",
                                isActive(subChild.path) && "bg-muted text-primary font-medium"
                              )}
                              onClick={() => navigateTo(subChild.path)}
                            >
                              {subChild.label}
                            </Button>
                          ))}
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  }

                  // Regular child item
                  return (
                    <Button
                      key={child.id}
                      variant="ghost"
                      className={cn(
                        "w-full justify-start font-normal text-sm hover:bg-muted/50",
                        isActive(child.path) && "bg-muted text-primary font-medium"
                      )}
                      onClick={() => navigateTo(child.path)}
                    >
                      {child.label}
                    </Button>
                  );
                })}
              </CollapsibleContent>
            </Collapsible>
          );
        }

        // Simple menu item
        return (
          <Button
            key={item.id}
            variant="ghost"
            className={cn(
              "w-full justify-start font-normal hover:bg-muted/50",
              isActive(item.path) && "bg-muted text-primary font-medium"
            )}
            onClick={() => navigateTo(item.path)}
          >
            {item.icon && <item.icon className="h-4 w-4 mr-2" />}
            {item.label}
          </Button>
        );
      })}
    </>
  );

  if (isMobile) {
    return (
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="top" className="h-[80vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Competition Details
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-1">
            <Button 
              variant="outline" 
              onClick={() => {
                navigate('/app/competition-portal/competitions');
                if (setSidebarOpen) setSidebarOpen(false);
              }}
              className="w-full justify-start font-normal hover:bg-muted/50 mb-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Competitions
            </Button>
            {renderMenuContent()}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div className="w-64 border-r bg-background h-full">
      <ScrollArea className="h-full">
        <div className="p-4 space-y-1">
          <Button 
            variant="outline" 
            onClick={() => navigate('/app/competition-portal/competitions')} 
            className="w-full justify-start font-normal hover:bg-muted/50 mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Competitions
          </Button>
          {renderMenuContent()}
        </div>
      </ScrollArea>
    </div>
  );
};
