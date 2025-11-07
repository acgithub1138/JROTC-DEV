import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem, useSidebar } from '@/components/ui/sidebar';
import { ChevronDown, ChevronRight, Trophy, Users, FileText, School, Calendar, Award, ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

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
}


export const CompetitionDetailsSidebar = ({ competitionId, permissions }: CompetitionDetailsSidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const { isMobile } = useSidebar();

  const [judgesOpen, setJudgesOpen] = useState(currentPath.includes('/judges'));
  const [applicationsOpen, setApplicationsOpen] = useState(currentPath.includes('/applications'));
  const [schedulesOpen, setSchedulesOpen] = useState(currentPath.includes('/schedules'));

  const navigateTo = (path: string) => {
    navigate(`/app/competition-portal/competition-details/${competitionId}${path}`);
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

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Competition Details</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Back to Competitions */}
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => navigate('/app/competition-portal/competitions')}>
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Competitions</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

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
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton>
                            {item.icon && <item.icon className="h-4 w-4" />}
                            <span>{item.label}</span>
                            {isOpen ? <ChevronDown className="ml-auto h-4 w-4" /> : <ChevronRight className="ml-auto h-4 w-4" />}
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.children.map((child) => {
                              // Nested children (applications)
                              if (child.children) {
                                return (
                                  <Collapsible key={child.id} open={applicationsOpen} onOpenChange={setApplicationsOpen}>
                                    <SidebarMenuSubItem>
                                      <CollapsibleTrigger asChild>
                                        <SidebarMenuSubButton>
                                          <span>{child.label}</span>
                                          {applicationsOpen ? <ChevronDown className="ml-auto h-3 w-3" /> : <ChevronRight className="ml-auto h-3 w-3" />}
                                        </SidebarMenuSubButton>
                                      </CollapsibleTrigger>
                                      <CollapsibleContent>
                                        <SidebarMenuSub>
                                          {child.children.map((subChild) => (
                                            <SidebarMenuSubItem key={subChild.id}>
                                              <SidebarMenuSubButton
                                                onClick={() => navigateTo(subChild.path)}
                                                isActive={isActive(subChild.path)}
                                              >
                                                <span>{subChild.label}</span>
                                              </SidebarMenuSubButton>
                                            </SidebarMenuSubItem>
                                          ))}
                                        </SidebarMenuSub>
                                      </CollapsibleContent>
                                    </SidebarMenuSubItem>
                                  </Collapsible>
                                );
                              }

                              // Regular child item
                              return (
                                <SidebarMenuSubItem key={child.id}>
                                  <SidebarMenuSubButton
                                    onClick={() => navigateTo(child.path)}
                                    isActive={isActive(child.path)}
                                  >
                                    <span>{child.label}</span>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              );
                            })}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  );
                }

                // Simple menu item
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => navigateTo(item.path)}
                      isActive={isActive(item.path)}
                    >
                      {item.icon && <item.icon className="h-4 w-4" />}
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};
