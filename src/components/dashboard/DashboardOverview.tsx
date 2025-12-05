import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, CheckSquare, DollarSign, Plus, Zap, Calendar, Package, AlertTriangle, Building, Smartphone, Heart } from 'lucide-react';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useEvents } from '@/components/calendar/hooks/useEvents';
import { useBudgetTransactions } from '@/components/budget-management/hooks/useBudgetTransactions';
import { useToast } from '@/hooks/use-toast';
import { TaskForm } from '@/components/tasks/TaskForm';
import { EventDialog } from '@/components/calendar/components/EventDialog';
import IncidentForm from '@/components/incident-management/IncidentForm';
import { CreateUserDialog } from '@/components/admin/CreateUserDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MyCadetsWidget } from './widgets/MyCadetsWidget';
import { MyTasksWidget } from './widgets/MyTasksWidget';
import { SharedPicturesWidget } from './widgets/SharedPicturesWidget';
import { useAuth } from '@/contexts/AuthContext';
import { useTaskPermissions, useEventPermissions, useDashboardPermissions, useUserPermissions, useAnnouncementPermissions } from '@/hooks/useModuleSpecificPermissions';
import { AnnouncementsWidget } from './widgets/AnnouncementsWidget';
import { AnnouncementDialog } from '@/components/announcements/AnnouncementDialog';
import { useCreateAnnouncement } from '@/hooks/useAnnouncements';
const DashboardOverview = () => {
  const navigate = useNavigate();
  const {
    userProfile
  } = useAuth();
  const {
    toast
  } = useToast();
  const {
    canCreate: canCreateTasks
  } = useTaskPermissions();
  const {
    canCreate: canCreateEvents
  } = useEventPermissions();
  const {
    canViewAnalytics,
    canViewStatsCadets,
    canViewStatsTasks,
    canViewStatsBudget,
    canViewStatsInventory,
    canViewStatsIncidents,
    canViewStatsCommunityService,
    canViewStatsSchools,
    canViewMyTasks,
    canViewMyCadets,
    canViewUpcomingEvents,
    canViewQuickActions,
    canViewAnnouncements,
    canViewSharedPictures
  } = useDashboardPermissions();
  const {
    canCreate: canCreateUsers
  } = useUserPermissions();
  const {
    canCreate: canCreateAnnouncements
  } = useAnnouncementPermissions();

  // Memoize filters to prevent infinite re-renders
  const eventFilters = useMemo(() => ({
    eventType: '',
    assignedTo: ''
  }), []);
  const {
    data: stats,
    isLoading: statsLoading
  } = useDashboardStats();
  const {
    events,
    isLoading: eventsLoading,
    createEvent
  } = useEvents(eventFilters);

  // Import budget hooks for transaction creation
  const budgetFilters = useMemo(() => ({
    search: '',
    category: '',
    type: '',
    paymentMethod: '',
    status: '',
    showArchived: false,
    budgetYear: ''
  }), []);
  const {
    createTransaction
  } = useBudgetTransactions(budgetFilters);
  const createAnnouncement = useCreateAnnouncement();

  // Filter and sort upcoming events
  const upcomingEvents = useMemo(() => {
    console.log('Processing events for upcoming events widget:', events);
    console.log('Events loading status:', eventsLoading);
    if (!events || events.length === 0) {
      console.log('No events found or events array is empty');
      return [];
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of today
    console.log('Today date for filtering:', today);
    const filtered = events.filter(event => {
      const eventDate = new Date(event.start_date);
      const isUpcoming = eventDate >= today;
      console.log(`Event "${event.title}" on ${event.start_date} is upcoming:`, isUpcoming);
      return isUpcoming;
    }).sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()).slice(0, 5);
    console.log('Filtered upcoming events:', filtered);
    return filtered;
  }, [events, eventsLoading]);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
  const [isCreateIncidentOpen, setIsCreateIncidentOpen] = useState(false);
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [isCreateAnnouncementOpen, setIsCreateAnnouncementOpen] = useState(false);
  const handleCreateTransaction = async (data: any) => {
    try {
      await createTransaction(data);
      toast({
        title: "Success",
        description: `${data.category === 'income' ? 'Income' : 'Expense'} created successfully`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to create ${data.category === 'income' ? 'income' : 'expense'}`,
        variant: "destructive"
      });
    }
  };
  const handleCreateAnnouncement = async (data: any) => {
    try {
      await createAnnouncement.mutateAsync(data);
      toast({
        title: "Success",
        description: "Announcement created successfully"
      });
      setIsCreateAnnouncementOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create announcement",
        variant: "destructive"
      });
    }
  };
  // Permission-based stats configuration
  const getStatsConfig = () => {
    const baseStats = [];

    // Schools Statistics (Admin only)
    if (canViewStatsSchools) {
      baseStats.push({
        title: 'Total Schools',
        value: statsLoading ? '...' : stats?.schools.total.toString() || '0',
        change: statsLoading ? '...' : 'Registered schools',
        icon: Building,
        color: 'text-blue-600',
        bgColor: 'bg-blue-100'
      });
    }

    // Incidents Statistics
    if (canViewStatsIncidents) {
      baseStats.push({
        title: 'Active Incidents',
        value: statsLoading ? '...' : stats?.incidents.active.toString() || '0',
        change: statsLoading ? '...' : `${stats?.incidents.urgentCritical || 0} urgent/critical`,
        icon: AlertTriangle,
        color: 'text-red-600',
        bgColor: 'bg-red-100'
      });
    }

    // Cadets Statistics
    if (canViewStatsCadets) {
      baseStats.push({
        title: 'Total Cadets',
        value: statsLoading ? '...' : stats?.cadets.total.toString() || '0',
        change: statsLoading ? '...' : stats?.cadets.change || 'No data',
        icon: Users,
        color: 'text-blue-600',
        bgColor: 'bg-blue-100'
      });
    }

    // Tasks Statistics
    if (canViewStatsTasks) {
      // Show overdue tasks for instructors, active tasks for others
      const showOverdue = userProfile?.role === 'instructor';
      baseStats.push({
        title: showOverdue ? 'Overdue Tasks' : 'Active Tasks',
        value: statsLoading ? '...' : (showOverdue ? stats?.tasks.overdue : stats?.tasks.active)?.toString() || '0',
        change: statsLoading ? '...' : showOverdue ? 'Past due date' : `${stats?.tasks.overdue || 0} overdue`,
        icon: CheckSquare,
        color: showOverdue ? 'text-red-600' : 'text-green-600',
        bgColor: showOverdue ? 'bg-red-100' : 'bg-green-100',
        onClick: showOverdue ? () => navigate('/app/tasks?tab=alltasks&overdue=true') : undefined
      });
    }

    // Inventory Statistics  
    if (canViewStatsInventory) {
      baseStats.push({
        title: 'Equipment',
        value: statsLoading ? '...' : stats?.inventory.total?.toString() || '0',
        change: statsLoading ? 'Loading...' : <div className="flex items-center gap-2 text-xs mt-2">
            <Badge title="In Stock" variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400">
              {stats?.inventory.inStock || 0}
            </Badge>
            <Badge title="Out of Stock" variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
              {stats?.inventory.outOfStock || 0}
            </Badge>
          </div>,
        icon: Package,
        color: 'text-purple-600',
        bgColor: 'bg-purple-100'
      });
    }

    // Budget Statistics
    if (canViewStatsBudget) {
      baseStats.push({
        title: 'Net Budget',
        value: statsLoading ? '...' : `$${(stats?.budget.netBudget || 0).toLocaleString()}`,
        change: statsLoading ? '...' : `${(stats?.budget.totalIncome || 0).toLocaleString()} income, ${(stats?.budget.totalExpenses || 0).toLocaleString()} expenses`,
        icon: DollarSign,
        color: stats?.budget.netBudget && stats.budget.netBudget >= 0 ? 'text-green-600' : 'text-red-600',
        bgColor: stats?.budget.netBudget && stats.budget.netBudget >= 0 ? 'bg-green-100' : 'bg-red-100'
      });
    }

    // Community Service Statistics
    if (canViewStatsCommunityService) {
      baseStats.push({
        title: 'Service Hours',
        value: statsLoading ? '...' : (stats?.communityService.totalHours || 0).toString(),
        change: statsLoading ? '...' : `${stats?.communityService.totalRecords || 0} records this year`,
        icon: Heart,
        color: 'text-pink-600',
        bgColor: 'bg-pink-100'
      });
    }
    return baseStats;
  };
  const statsConfig = getStatsConfig();

  // Permission-based Quick Actions widget
  const renderQuickActionsWidget = () => {
    if (!canViewQuickActions) return null;
    return <Card className="hover:shadow-md transition-shadow col-span-2">
        <CardContent className="p-6 py-[12px]">
          <div className="space-y-3">
            <div className="flex items-center mb-3">
              <Zap className="w-4 h-4 mr-2 text-primary" />
              <p className="text-sm font-medium text-gray-600">Quick Actions</p>
            </div>
            <div className="space-y-2">
              {/* Row 1: Admin actions */}
              {userProfile?.role === 'admin' && <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => navigate('/app/admin/school_record?mode=create')} className="p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center">
                    <Building className="w-4 h-4 text-blue-600 mr-2" />
                    <p className="font-medium text-sm">Create School</p>
                  </button>
                  {canCreateUsers && <button onClick={() => navigate('/app/admin/user_record?mode=create')} className="p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center">
                    <Users className="w-4 h-4 text-green-600 mr-2" />
                    <p className="font-medium text-sm">Create User</p>
                  </button>}
                </div>}
              
              {/* Row 2: General actions + Instructor-specific */}
              {userProfile?.role !== 'admin' && <div className="grid grid-cols-2 gap-2">
                  {canCreateTasks && <button onClick={() => navigate('/app/tasks/task_record?mode=create')} className="p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center">
                    <CheckSquare className="w-4 h-4 text-green-600 mr-2" />
                    <p className="font-medium text-sm">Create Task</p>
                  </button>}
                  {canCreateEvents && <button onClick={() => navigate('/app/calendar/calendar_record')} className="p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center">
                    <Calendar className="w-4 h-4 text-purple-600 mr-2" />
                    <p className="font-medium text-sm">Create Event</p>
                  </button>}
                </div>}
              
              {/* Row 3: Instructor actions */}
              {userProfile?.role === 'instructor' && <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => navigate('/app/incidents/incident_record?mode=create')} className="p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center">
                    <AlertTriangle className="w-4 h-4 text-orange-600 mr-2" />
                    <p className="font-medium text-sm">Get Help</p>
                  </button>
                  {canCreateAnnouncements && <button onClick={() => navigate('/app/announcements/announcements_record?mode=create')} className="p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center">
                    <Users className="w-4 h-4 text-blue-600 mr-2" />
                    <p className="font-medium text-sm">Create Announcement</p>
                  </button>}
                </div>}
              
              {/* Row 4: Budget actions */}
              {userProfile?.role === 'instructor' && <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => navigate('/app/budget/income_record?mode=create')} className="p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center">
                    <Plus className="w-4 h-4 text-green-600 mr-2" />
                    <p className="font-medium text-sm">Add Income</p>
                  </button>
                  <button onClick={() => navigate('/app/budget/expense_record?mode=create')} className="p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center">
                    <DollarSign className="w-4 h-4 text-red-600 mr-2" />
                    <p className="font-medium text-sm">Add Expense</p>
                  </button>
                </div>}
            </div>
          </div>
        </CardContent>
      </Card>;
  };
  return <div className="p-6 space-y-6">
      {/* Welcome Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
        </div>
      </div>

      {/* Announcements Widget - Top of Dashboard */}
      {canViewAnnouncements && <AnnouncementsWidget />}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsConfig.map(stat => {
        const Icon = stat.icon;
        const isClickable = !!stat.onClick;
        const CardElement = isClickable ? 'button' : 'div';
        return <Card key={stat.title} className={`hover:shadow-md transition-shadow ${isClickable ? 'cursor-pointer' : ''}`}>
              <CardElement className={`w-full ${isClickable ? 'text-left' : ''}`} onClick={stat.onClick}>
                <CardContent className="p-6 py-[12px]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                      {stat.change && <div className="text-sm text-muted-foreground mt-1">
                          {stat.change}
                        </div>}
                    </div>
                    <div className={`p-3 rounded-full ${stat.bgColor}`}>
                      <Icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </CardElement>
            </Card>;
      })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: My Tasks and Quick Actions for non-command staff */}
        <div className="space-y-6">
          {/* My Cadets Widget for parents, My Tasks for others */}
          {canViewMyCadets && userProfile?.role === 'parent' ? <MyCadetsWidget /> : canViewMyTasks && userProfile?.role !== 'admin' ? <MyTasksWidget /> : null}
          {/* Shared Pictures Widget - below My Cadets */}
          {canViewSharedPictures && <SharedPicturesWidget />}
          {/* Quick Actions Widget - moved back below My Tasks */}
          {canViewQuickActions && renderQuickActionsWidget()}
        </div>

        {/* Right Column: Events */}
        <div className="space-y-6">
          {/* Upcoming Events */}
          {canViewUpcomingEvents && <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-primary" />
                Upcoming Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {eventsLoading ? [...Array(3)].map((_, index) => <div key={index} className="flex items-start space-x-3 p-3 rounded-lg">
                      <div className="w-2 h-2 bg-muted rounded-full mt-2 flex-shrink-0 animate-pulse"></div>
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="h-4 bg-muted rounded animate-pulse"></div>
                        <div className="h-3 bg-muted rounded animate-pulse w-3/4"></div>
                        <div className="h-3 bg-muted rounded animate-pulse w-1/2"></div>
                      </div>
                    </div>) : upcomingEvents.length > 0 ? upcomingEvents.map(event => <div key={event.id} className="flex items-start space-x-3 p-3 hover:bg-muted/50 transition-colors px-[6px] py-[2px] rounded-lg">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-base">
                          {new Date(event.start_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: event.is_all_day ? undefined : 'numeric',
                      minute: event.is_all_day ? undefined : '2-digit'
                    })} - {event.title}</p>
                        <p className="text-muted-foreground capitalize text-sm">{event.event_types?.label || 'Event'} • {event.description || ''}</p>
                      </div>
                    </div>) : <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">No upcoming events</p>
                  </div>}
              </div>
            </CardContent>
          </Card>}
        </div>
      </div>

      {/* Modals - Only show for roles that can use them */}
      {userProfile?.role === 'instructor' && <>
          <IncidentForm isOpen={isCreateIncidentOpen} onClose={() => setIsCreateIncidentOpen(false)} />
        </>}

      {canCreateTasks && <TaskForm open={isCreateTaskOpen} onOpenChange={setIsCreateTaskOpen} mode="create" />}

      {canCreateEvents && <EventDialog open={isCreateEventOpen} onOpenChange={setIsCreateEventOpen} event={null} selectedDate={null} onSubmit={async (eventData: any) => {
      try {
        await createEvent(eventData);
        toast({
          title: "Success",
          description: "Event created successfully"
        });
        setIsCreateEventOpen(false);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to create event",
          variant: "destructive"
        });
      }
    }} />}


      {/* Admin-only modals */}
      {userProfile?.role === 'admin' && <>
          <CreateUserDialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen} />
        </>}

      {/* Announcement Dialog */}
      {canCreateAnnouncements && <AnnouncementDialog open={isCreateAnnouncementOpen} onOpenChange={setIsCreateAnnouncementOpen} onSubmit={handleCreateAnnouncement} mode="create" announcement={null} />}
    </div>;
};
export default DashboardOverview;