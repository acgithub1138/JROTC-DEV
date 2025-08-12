import React, { useMemo } from 'react';
import { 
  CheckSquare, 
  Users, 
  AlertTriangle, 
  Calendar,
  DollarSign,
  Package,
  Building,
  Smartphone
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useTaskPermissions, useDashboardPermissions } from '@/hooks/useModuleSpecificPermissions';
import { useCapacitor } from '@/hooks/useCapacitor';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useEvents } from '@/components/calendar/hooks/useEvents';
import { MyTasksWidget } from '@/components/dashboard/widgets/MyTasksWidget';
import { MobileNotificationCenter } from '@/components/mobile/MobileNotificationCenter';
import { MobileEnhancements } from '@/components/mobile/MobileEnhancements';

export const MobileDashboard: React.FC = () => {
  const { userProfile } = useAuth();
  const { canView: canViewTasks } = useTaskPermissions();
  const { canView: canViewDashboard } = useDashboardPermissions();
  const { isNative, platform } = useCapacitor();
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
    if (!events || events.length === 0) {
      return [];
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const filtered = events.filter(event => {
      const eventDate = new Date(event.start_date);
      return eventDate >= today;
    }).sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()).slice(0, 5);
    return filtered;
  }, [events, eventsLoading]);

  // Derived permissions for UI logic
  const isCommandStaffOrAbove = userProfile?.role === 'admin' || userProfile?.role === 'instructor' || userProfile?.role === 'command_staff';
  const isCadet = userProfile?.role === 'cadet';

  // Configure stats based on user role - same logic as web dashboard
  const getStatsConfig = () => {
    const baseStats = [];

    // Admin-specific dashboard
    if (userProfile?.role === 'admin') {
      baseStats.push({
        title: 'Total Schools',
        value: statsLoading ? '...' : stats?.schools.total.toString() || '0',
        change: statsLoading ? '...' : 'Registered schools',
        icon: Building,
        color: 'text-blue-600'
      });
      baseStats.push({
        title: 'Active Incidents',
        value: statsLoading ? '...' : stats?.incidents.active.toString() || '0',
        change: statsLoading ? '...' : `${stats?.incidents.urgentCritical || 0} urgent/critical`,
        icon: AlertTriangle,
        color: 'text-red-600'
      });
      return baseStats;
    }

    // For instructors, show Overdue Tasks instead of Total Cadets
    if (userProfile?.role === 'instructor') {
      baseStats.push({
        title: 'Overdue Tasks',
        value: statsLoading ? '...' : stats?.tasks.overdue.toString() || '0',
        change: statsLoading ? '...' : 'Past due date',
        icon: CheckSquare,
        color: 'text-red-600'
      });
    } else if (!isCadet) {
      // Only show Total Cadets widget for non-cadet, non-instructor roles
      baseStats.push({
        title: 'Total Cadets',
        value: statsLoading ? '...' : stats?.cadets.total.toString() || '0',
        change: statsLoading ? '...' : stats?.cadets.change || 'No data',
        icon: Users,
        color: 'text-blue-600'
      });
    }

    // Show additional stats only for command staff and above
    if (isCommandStaffOrAbove) {
      baseStats.push({
        title: 'Active Tasks',
        value: statsLoading ? '...' : stats?.tasks.active.toString() || '0',
        change: statsLoading ? '...' : `${stats?.tasks.overdue || 0} overdue`,
        icon: CheckSquare,
        color: 'text-green-600'
      });

      // Show equipment only for non-command staff (instructors)
      if (userProfile?.role === 'instructor') {
        baseStats.push({
          title: 'Equipment',
          value: statsLoading ? '...' : stats?.inventory.total.toString() || '0',
          change: statsLoading ? '...' : `${stats?.inventory.issued || 0} issued`,
          icon: Package,
          color: 'text-purple-600'
        });
      }
    }

    // Budget is only for instructors
    if (userProfile?.role === 'instructor') {
      baseStats.push({
        title: 'Net Budget',
        value: statsLoading ? '...' : `$${(stats?.budget.netBudget || 0).toLocaleString()}`,
        change: statsLoading ? '...' : `${(stats?.budget.totalIncome || 0).toLocaleString()} income, ${(stats?.budget.totalExpenses || 0).toLocaleString()} expenses`,
        icon: DollarSign,
        color: stats?.budget.netBudget && stats.budget.netBudget >= 0 ? 'text-green-600' : 'text-red-600'
      });
    }

    return baseStats;
  };

  const statsConfig = getStatsConfig();

  return (
    <div className="p-4 space-y-6">
      {/* Welcome Header with Mobile Status */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-foreground mb-1">Dashboard</h1>
        <p className="text-sm text-muted-foreground mb-2">
          Welcome back, {userProfile?.first_name}!
        </p>
        {isNative && (
          <Badge variant="secondary" className="text-xs">
            <Smartphone className="w-3 h-3 mr-1" />
            Mobile App - {platform}
          </Badge>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {statsConfig.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-muted-foreground truncate">{stat.title}</p>
                    <p className="text-xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{stat.change}</p>
                  </div>
                  <Icon className={`h-6 w-6 ${stat.color} flex-shrink-0 ml-2`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Mobile Notification Center - Only show on native platforms */}
      {isNative && <MobileNotificationCenter />}
      
      {/* Mobile Features Widget - Show for all mobile-relevant features */}
      {isNative && <MobileEnhancements />}

      {/* My Tasks Widget - Hide for admin users and check task permissions */}
      {userProfile?.role !== 'admin' && canViewTasks && <MyTasksWidget />}

      {/* Upcoming Events - hidden for admin users */}
      {userProfile?.role !== 'admin' && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground flex items-center">
              <Calendar className="mr-2 h-5 w-5 text-primary" />
              Upcoming Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {eventsLoading ? (
                [...Array(3)].map((_, index) => (
                  <div key={index} className="flex items-start space-x-3 p-2 rounded-lg">
                    <div className="w-2 h-2 bg-muted rounded-full mt-2 flex-shrink-0 animate-pulse"></div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="h-3 bg-muted rounded animate-pulse"></div>
                      <div className="h-2 bg-muted rounded animate-pulse w-3/4"></div>
                    </div>
                  </div>
                ))
              ) : upcomingEvents.length > 0 ? (
                upcomingEvents.map((event) => (
                  <div key={event.id} className="flex items-start space-x-3 p-2 hover:bg-muted/50 transition-colors rounded-lg">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm line-clamp-2">
                        {new Date(event.start_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: event.is_all_day ? undefined : 'numeric',
                          minute: event.is_all_day ? undefined : '2-digit'
                        })} - {event.title}
                      </p>
                      <p className="text-muted-foreground capitalize text-xs line-clamp-1">
                        {event.event_type.replace('_', ' ')} • {event.description || ''}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <p className="text-sm">No upcoming events</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};