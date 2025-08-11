import React from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const MobileNotificationCenter: React.FC = () => {
  const { 
    isRegistered, 
    isSupported, 
    permissionStatus, 
    requestPermissions, 
    register 
  } = usePushNotifications();
  
  const { networkStatus, offlineQueue } = useOfflineSync();
  const { toast } = useToast();

  const handleSetupNotifications = async () => {
    const granted = await requestPermissions();
    if (granted) {
      const registered = await register();
      if (registered) {
        toast({
          title: "Notifications Enabled",
          description: "You'll now receive push notifications for important updates.",
        });
      }
    } else {
      toast({
        title: "Permission Denied",
        description: "Push notifications require permission to function properly.",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = () => {
    if (!isSupported) return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    if (isRegistered) return <CheckCircle className="w-5 h-5 text-green-500" />;
    return <Bell className="w-5 h-5 text-gray-500" />;
  };

  const getStatusText = () => {
    if (!isSupported) return 'Not supported on this device';
    if (isRegistered) return 'Notifications are active';
    if (permissionStatus === 'denied') return 'Permission denied';
    return 'Not configured';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          Notification Center
        </CardTitle>
        <CardDescription>
          Manage push notifications and app alerts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Push Notifications</p>
            <p className="text-sm text-muted-foreground">
              {getStatusText()}
            </p>
          </div>
          <Badge variant={isRegistered ? 'default' : 'secondary'}>
            {isRegistered ? 'Active' : 'Inactive'}
          </Badge>
        </div>

        {isSupported && !isRegistered && (
          <Button onClick={handleSetupNotifications} className="w-full">
            <Bell className="w-4 h-4 mr-2" />
            Enable Notifications
          </Button>
        )}

        {/* Network Status */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Network Status</p>
              <p className="text-sm text-muted-foreground">
                {networkStatus.connected ? 'Online' : 'Offline'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${networkStatus.connected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-xs text-muted-foreground">
                {networkStatus.connectionType}
              </span>
            </div>
          </div>
        </div>

        {/* Offline Queue Status */}
        {offlineQueue.length > 0 && (
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-800">
                {offlineQueue.length} pending sync{offlineQueue.length !== 1 ? 's' : ''}
              </span>
            </div>
            <p className="text-xs text-orange-700 mt-1">
              Actions will sync when connection is restored
            </p>
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Task assignments and updates</p>
          <p>• Incident alerts and notifications</p>
          <p>• Schedule changes and reminders</p>
          <p>• Emergency communications</p>
        </div>
      </CardContent>
    </Card>
  );
};