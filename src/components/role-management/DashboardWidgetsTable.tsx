import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Users, CheckSquare, DollarSign, Package, AlertTriangle, Building, Calendar, Zap, Megaphone, Smartphone, Heart } from 'lucide-react';
interface DashboardWidget {
  name: string;
  label: string;
  description: string;
  icon: React.ComponentType<any>;
  category: 'Statistics' | 'Widgets' | 'Features';
}
const dashboardWidgets: DashboardWidget[] = [{
  name: 'view_stats_cadets',
  label: 'Cadets Statistics',
  description: 'Display total number of cadets',
  icon: Users,
  category: 'Statistics'
}, {
  name: 'view_stats_tasks',
  label: 'Tasks Statistics',
  description: 'Display active and overdue tasks',
  icon: CheckSquare,
  category: 'Statistics'
}, {
  name: 'view_stats_budget',
  label: 'Budget Statistics',
  description: 'Display net budget and financial info',
  icon: DollarSign,
  category: 'Statistics'
}, {
  name: 'view_stats_inventory',
  label: 'Inventory Statistics',
  description: 'Display equipment and issued items',
  icon: Package,
  category: 'Statistics'
}, {
  name: 'view_stats_incidents',
  label: 'Incidents Statistics',
  description: 'Display active incidents and urgent/critical',
  icon: AlertTriangle,
  category: 'Statistics'
}, {
  name: 'view_stats_community_service',
  label: 'Community Service Hours',
  description: 'Display accumulated service hours for current school year (Aug-June)',
  icon: Heart,
  category: 'Statistics'
}, {
  name: 'view_stats_schools',
  label: 'Schools Statistics',
  description: 'Display total registered schools (Admin only)',
  icon: Building,
  category: 'Statistics'
}, {
  name: 'view_my_tasks',
  label: 'My Tasks Widget',
  description: 'Display user\'s assigned tasks',
  icon: CheckSquare,
  category: 'Widgets'
}, {
  name: 'view_my_cadets',
  label: 'My Cadets Widget',
  description: 'Display user\'s assigned cadets (Parents)',
  icon: Users,
  category: 'Widgets'
}, {
  name: 'view_upcoming_events',
  label: 'Upcoming Events Widget',
  description: 'Display next 5 upcoming events',
  icon: Calendar,
  category: 'Widgets'
}, {
  name: 'view_quick_actions',
  label: 'Quick Actions Widget',
  description: 'Display action buttons for creating items',
  icon: Zap,
  category: 'Widgets'
}, {
  name: 'view_announcements_widget',
  label: 'Announcements Widget',
  description: 'Display school announcements at top of dashboard',
  icon: Megaphone,
  category: 'Widgets'
}, {
  name: 'view_mobile_features',
  label: 'Mobile Features Widget',
  description: 'Display mobile-specific features and notifications',
  icon: Smartphone,
  category: 'Features'
}];
interface DashboardWidgetsTableProps {
  modules: any[];
  actions: any[];
  rolePermissions: {
    [module: string]: {
      [action: string]: boolean;
    };
  };
  isCellPending: (moduleId: string, actionId: string) => boolean;
  handlePermissionChange: (moduleId: string, actionId: string, enabled: boolean) => void;
}
export const DashboardWidgetsTable: React.FC<DashboardWidgetsTableProps> = ({
  modules,
  actions,
  rolePermissions,
  isCellPending,
  handlePermissionChange
}) => {
  // Find the dashboard module
  const dashboardModule = modules.find(m => m.name === 'dashboard');
  if (!dashboardModule) {
    return <div className="text-center py-8 text-muted-foreground">
        Dashboard module not found. Please ensure the dashboard module exists in the system.
      </div>;
  }

  // Get dashboard widget actions
  const dashboardActions = actions.filter(action => dashboardWidgets.some(widget => widget.name === action.name));

  // Group widgets by category
  const widgetsByCategory = dashboardWidgets.reduce((acc, widget) => {
    if (!acc[widget.category]) acc[widget.category] = [];
    acc[widget.category].push(widget);
    return acc;
  }, {} as Record<string, DashboardWidget[]>);

  // Helper to check if a widget permission is enabled (using ID-based lookup)
  const isPermissionEnabled = (actionId: string) => {
    return rolePermissions[dashboardModule.id]?.[actionId] || false;
  };
  return <div className="space-y-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Dashboard Widget Permissions</h3>
        <p className="text-sm text-muted-foreground">
          Configure which dashboard widgets this role can see. These settings control the visibility of 
          statistics cards, widgets, and features on the main dashboard.
        </p>
      </div>

      {Object.entries(widgetsByCategory).map(([category, widgets]) => <div key={category} className="space-y-3">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-sm">{category}</h4>
            <Badge variant="outline" className="text-xs">
              {widgets.length} widget{widgets.length !== 1 ? 's' : ''}
            </Badge>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Icon</TableHead>
                <TableHead>Widget Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-20 text-center">Enabled</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {widgets.map(widget => {
            const action = dashboardActions.find(a => a.name === widget.name);
            if (!action) return null;
            const Icon = widget.icon;
            const isEnabled = isPermissionEnabled(action.id);
            return <TableRow key={widget.name} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex justify-center">
                        <Icon className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium py-[8px]">{widget.label}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {widget.description}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center">
                        <Checkbox checked={isEnabled} disabled={isCellPending(dashboardModule.id, action.id)} onCheckedChange={checked => handlePermissionChange(dashboardModule.id, action.id, !!checked)} />
                      </div>
                    </TableCell>
                  </TableRow>;
          })}
            </TableBody>
          </Table>
        </div>)}

      {dashboardActions.length === 0 && <div className="text-center py-8 text-muted-foreground">
          No dashboard widget permissions found. Please ensure the dashboard permissions are properly configured.
        </div>}
    </div>;
};