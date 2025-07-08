import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, CheckSquare, DollarSign, Plus, Trophy, Calendar, Package } from 'lucide-react';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useEvents } from '@/components/calendar/hooks/useEvents';
import { useBudgetTransactions } from '@/components/budget-management/hooks/useBudgetTransactions';
import { AddCadetDialog } from '@/components/cadet-management/components/AddCadetDialog';
import { TaskForm } from '@/components/tasks/TaskForm';
import { AddIncomeDialog } from '@/components/budget-management/components/AddIncomeDialog';
import { AddExpenseDialog } from '@/components/budget-management/components/AddExpenseDialog';
import { EventDialog } from '@/components/calendar/components/EventDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MyTasksWidget } from './widgets/MyTasksWidget';
import { useAuth } from '@/contexts/AuthContext';
import { useRolePermissions } from '@/hooks/useRolePermissions';
const DashboardOverview = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const { canCreateTasks, canCreateEvents, isCommandStaffOrAbove, isCadet } = useRolePermissions();
  const {
    data: stats,
    isLoading: statsLoading
  } = useDashboardStats();

  // Memoize filters to prevent infinite re-renders
  const eventFilters = useMemo(() => ({
    eventType: '',
    assignedTo: ''
  }), []);
  const {
    events,
    isLoading: eventsLoading
  } = useEvents(eventFilters);

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
  const [isAddCadetOpen, setIsAddCadetOpen] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isAddIncomeOpen, setIsAddIncomeOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
  const handleCreateTransaction = (data: any) => {
    // This will be handled by the individual dialogs
    console.log('Transaction created:', data);
  };
  // Configure stats based on user role
  const getStatsConfig = () => {
    const baseStats = [{
      title: 'Total Cadets',
      value: statsLoading ? '...' : stats?.cadets.total.toString() || '0',
      change: statsLoading ? '...' : stats?.cadets.change || 'No data',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    }];

    // Show additional stats only for command staff and above
    if (isCommandStaffOrAbove()) {
      baseStats.push({
        title: 'Active Tasks',
        value: statsLoading ? '...' : stats?.tasks.active.toString() || '0',
        change: statsLoading ? '...' : `${stats?.tasks.overdue || 0} overdue`,
        icon: CheckSquare,
        color: 'text-green-600',
        bgColor: 'bg-green-100'
      });

      // Show inventory only for command staff (not cadets)
      if (!isCadet()) {
        baseStats.push({
          title: 'Equipment',
          value: statsLoading ? '...' : stats?.inventory.total.toString() || '0',
          change: statsLoading ? '...' : `${stats?.inventory.issued || 0} issued`,
          icon: Package,
          color: 'text-purple-600',
          bgColor: 'bg-purple-100'
        });
      }
    }

    // Budget is only for instructors and admins
    if (userProfile?.role === 'instructor' || userProfile?.role === 'admin') {
      baseStats.push({
        title: 'Net Budget',
        value: statsLoading ? '...' : `$${(stats?.budget.netBudget || 0).toLocaleString()}`,
        change: statsLoading ? '...' : `${(stats?.budget.totalIncome || 0).toLocaleString()} income, ${(stats?.budget.totalExpenses || 0).toLocaleString()} expenses`,
        icon: DollarSign,
        color: stats?.budget.netBudget && stats.budget.netBudget >= 0 ? 'text-green-600' : 'text-red-600',
        bgColor: stats?.budget.netBudget && stats.budget.netBudget >= 0 ? 'bg-green-100' : 'bg-red-100'
      });
    }

    return baseStats;
  };

  const statsConfig = getStatsConfig();
  return <div className="p-6 space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsConfig.map(stat => {
        const Icon = stat.icon;
        return <Card key={stat.title} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6 py-[12px]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-sm text-gray-500 mt-1">{stat.change}</p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>;
      })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Tasks Widget */}
        <MyTasksWidget />

        {/* Upcoming Events */}
        <Card>
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
                      <p className="font-medium text-foreground text-base">{event.title}</p>
                      <p className="text-muted-foreground capitalize text-sm">{event.event_type.replace('_', ' ')} • {event.location || 'No location'}</p>
                      <p className="text-muted-foreground mt-1 text-sm">
                        {new Date(event.start_date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: event.is_all_day ? undefined : 'numeric',
                    minute: event.is_all_day ? undefined : '2-digit'
                  })}
                      </p>
                    </div>
                  </div>) : <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">No upcoming events</p>
                </div>}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions - Only for Command Staff and above */}
        {isCommandStaffOrAbove() && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Trophy className="w-5 h-5 mr-2 text-blue-600" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {canCreateTasks() && (
                  <button onClick={() => setIsCreateTaskOpen(true)} className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <CheckSquare className="w-6 h-6 text-green-600 mb-2" />
                    <p className="font-medium text-sm">Create Task</p>
                    <p className="text-xs text-gray-500">Assign new task</p>
                  </button>
                )}
                {canCreateEvents() && (
                  <button onClick={() => setIsCreateEventOpen(true)} className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <Calendar className="w-6 h-6 text-purple-600 mb-2" />
                    <p className="font-medium text-sm">Create Event</p>
                    <p className="text-xs text-gray-500">Schedule new event</p>
                  </button>
                )}
                {/* Instructor-only actions */}
                {userProfile?.role === 'instructor' && (
                  <>
                    <button onClick={() => setIsAddCadetOpen(true)} className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <Users className="w-6 h-6 text-blue-600 mb-2" />
                      <p className="font-medium text-sm">Add Cadet</p>
                      <p className="text-xs text-gray-500">Enroll new cadet</p>
                    </button>
                    <button onClick={() => setIsAddIncomeOpen(true)} className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <Plus className="w-6 h-6 text-green-600 mb-2" />
                      <p className="font-medium text-sm">Add Income</p>
                      <p className="text-xs text-gray-500">Record income</p>
                    </button>
                    <button onClick={() => setIsAddExpenseOpen(true)} className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <DollarSign className="w-6 h-6 text-red-600 mb-2" />
                      <p className="font-medium text-sm">Add Expense</p>
                      <p className="text-xs text-gray-500">Record expense</p>
                    </button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modals - Only show for roles that can use them */}
      {userProfile?.role === 'instructor' && (
        <>
          <AddCadetDialog open={isAddCadetOpen} onOpenChange={setIsAddCadetOpen} newCadet={{
            first_name: '',
            last_name: '',
            email: '',
            grade: '',
            rank: '',
            flight: '',
            role: 'cadet'
          }} setNewCadet={() => {}} onSubmit={() => {}} />

          <AddIncomeDialog open={isAddIncomeOpen} onOpenChange={setIsAddIncomeOpen} onSubmit={handleCreateTransaction} />

          <AddExpenseDialog open={isAddExpenseOpen} onOpenChange={setIsAddExpenseOpen} onSubmit={handleCreateTransaction} />
        </>
      )}

      {canCreateTasks() && (
        <TaskForm open={isCreateTaskOpen} onOpenChange={setIsCreateTaskOpen} mode="create" />
      )}

      {canCreateEvents() && (
        <EventDialog open={isCreateEventOpen} onOpenChange={setIsCreateEventOpen} event={null} selectedDate={null} onSubmit={async () => {
          setIsCreateEventOpen(false);
        }} />
      )}
    </div>;
};
export default DashboardOverview;