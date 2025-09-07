import React, { useMemo } from 'react';
import { 
  CheckSquare, 
  Users, 
  AlertTriangle, 
  Calendar,
  DollarSign,
  Package,
  Building,
  Smartphone,
  Heart
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useDashboardPermissions } from '@/hooks/useModuleSpecificPermissions';
import { useCapacitor } from '@/hooks/useCapacitor';
import { useEvents } from '@/components/calendar/hooks/useEvents';
import { MobileNotificationCenter } from '@/components/mobile/MobileNotificationCenter';
import { MobileEnhancements } from '@/components/mobile/MobileEnhancements';

export const MobileDashboard: React.FC = () => {
  const { userProfile } = useAuth();
  const { canView: canViewDashboard } = useDashboardPermissions();
  const { isNative, platform } = useCapacitor();
  const {
    data: stats,
    isLoading: statsLoading
  } = useDashboardStats();

  const {
    canViewStatsCadets,
    canViewStatsTasks,
    canViewStatsInventory,
    canViewStatsIncidents,
    canViewStatsCommunityService,
    canViewStatsSchools,
    canViewUpcomingEvents,
    canViewMobileFeatures
  } = useDashboardPermissions();

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

  // Permission-based stats configuration for mobile
  const getStatsConfig = () => {
    const baseStats = [];

    // Schools Statistics (Admin only)
    if (canViewStatsSchools) {
      baseStats.push({
        title: 'Total Schools',
        value: statsLoading ? '...' : stats?.schools.total.toString() || '0',
        change: statsLoading ? '...' : 'Registered schools',
        icon: Building,
        color: 'text-blue-600'
      });
    }

    // Incidents Statistics (Admin only)
    if (canViewStatsIncidents && userProfile?.role === 'admin') {
      baseStats.push({
        title: 'Active Incidents',
        value: statsLoading ? '...' : stats?.incidents.active.toString() || '0',
        change: statsLoading ? '...' : `${stats?.incidents.urgentCritical || 0} urgent/critical`,
        icon: AlertTriangle,
        color: 'text-red-600'
      });
    }

    // Cadets Statistics
    if (canViewStatsCadets && !isCadet && userProfile?.role !== 'parent') {
      baseStats.push({
        title: 'Total Cadets',
        value: statsLoading ? '...' : stats?.cadets.total.toString() || '0',
        change: statsLoading ? '...' : stats?.cadets.change || 'No data',
        icon: Users,
        color: 'text-blue-600'
      });
    }

    // Tasks Statistics - Overdue for instructors, active for others
    if (canViewStatsTasks) {
      const showOverdue = userProfile?.role === 'instructor';
      baseStats.push({
        title: showOverdue ? 'Overdue Tasks' : 'Active Tasks',
        value: statsLoading ? '...' : (showOverdue ? stats?.tasks.overdue : stats?.tasks.active)?.toString() || '0',
        change: statsLoading ? '...' : showOverdue ? 'Past due date' : `${stats?.tasks.overdue || 0} overdue`,
        icon: CheckSquare,
        color: showOverdue ? 'text-red-600' : 'text-green-600'
      });
    }

    // Inventory Statistics (for instructors)
    if (canViewStatsInventory && userProfile?.role === 'instructor') {
      baseStats.push({
        title: 'Equipment',
        value: statsLoading ? '...' : stats?.inventory.total.toString() || '0',
        change: statsLoading ? '...' : `${stats?.inventory.issued || 0} issued`,
        icon: Package,
        color: 'text-purple-600'
      });
    }

    // Community Service Statistics
    if (canViewStatsCommunityService) {
      baseStats.push({
        title: 'Service Hours',
        value: statsLoading ? '...' : (stats?.communityService.totalHours || 0).toString(),
        change: statsLoading ? '...' : `${stats?.communityService.totalRecords || 0} records this year`,
        icon: Heart,
        color: 'text-pink-600'
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

      {/* Mobile Notification Center and Features */}
      {canViewMobileFeatures && <MobileNotificationCenter />}
      {canViewMobileFeatures && <MobileEnhancements />}

      {/* Upcoming Events - Only show if permission allows */}
      {canViewUpcomingEvents && (
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