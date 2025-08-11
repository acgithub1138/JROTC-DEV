import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { useFileSystem } from '@/hooks/useFileSystem';
import { Bell, Wifi, WifiOff, Download, FileText, Share, Database } from 'lucide-react';

export const AdvancedMobileFeatures: React.FC = () => {
  const { 
    isRegistered, 
    isSupported: pushSupported, 
    permissionStatus, 
    requestPermissions, 
    register 
  } = usePushNotifications();
  
  const { 
    networkStatus, 
    offlineQueue, 
    isSyncing, 
    processOfflineQueue, 
    clearOfflineQueue 
  } = useOfflineSync();
  
  const { saveFile, listFiles, downloadFile, shareFile } = useFileSystem();

  const handleEnablePushNotifications = async () => {
    const granted = await requestPermissions();
    if (granted) {
      await register();
    }
  };

  const handleTestFileOperations = async () => {
    // Test file operations
    const testData = JSON.stringify({
      message: 'Test file from JROTC CCC',
      timestamp: new Date().toISOString(),
      user: 'Mobile User'
    }, null, 2);

    const savedFile = await saveFile('test-file.json', testData);
    if (savedFile) {
      console.log('Test file saved successfully');
      
      // List files to verify
      const files = await listFiles();
      console.log('Files in Documents:', files);
    }
  };

  const handleSyncOfflineData = async () => {
    await processOfflineQueue();
  };

  return (
    <div className="space-y-6">
      {/* Push Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Push Notifications
          </CardTitle>
          <CardDescription>
            Receive notifications for new tasks, incidents, and updates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Notification Status</p>
              <p className="text-sm text-muted-foreground">
                {pushSupported ? 'Supported on this device' : 'Not supported'}
              </p>
            </div>
            <div className="text-right">
              <Badge variant={isRegistered ? 'default' : 'secondary'}>
                {isRegistered ? 'Enabled' : 'Disabled'}
              </Badge>
              <p className="text-xs text-muted-foreground mt-1">
                Permission: {permissionStatus}
              </p>
            </div>
          </div>
          
          {pushSupported && !isRegistered && (
            <Button onClick={handleEnablePushNotifications} className="w-full">
              Enable Push Notifications
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Network & Offline Sync */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {networkStatus.connected ? (
              <Wifi className="w-5 h-5 text-green-600" />
            ) : (
              <WifiOff className="w-5 h-5 text-red-600" />
            )}
            Network & Sync
          </CardTitle>
          <CardDescription>
            Offline capabilities and data synchronization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Connection Status</p>
              <p className="text-sm text-muted-foreground">
                {networkStatus.connected ? 'Online' : 'Offline'} 
                {networkStatus.connectionType && ` (${networkStatus.connectionType})`}
              </p>
            </div>
            <Badge variant={networkStatus.connected ? 'default' : 'destructive'}>
              {networkStatus.connected ? 'Connected' : 'Disconnected'}
            </Badge>
          </div>

          {offlineQueue.length > 0 && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Offline Queue</p>
                  <p className="text-sm text-muted-foreground">
                    {offlineQueue.length} pending actions
                  </p>
                </div>
                <Database className="w-5 h-5 text-orange-500" />
              </div>
              
              <div className="flex gap-2 mt-3">
                <Button 
                  size="sm" 
                  onClick={handleSyncOfflineData}
                  disabled={!networkStatus.connected || isSyncing}
                >
                  {isSyncing ? 'Syncing...' : 'Sync Now'}
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={clearOfflineQueue}
                >
                  Clear Queue
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* File System */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            File Management
          </CardTitle>
          <CardDescription>
            Save, download, and share files on your device
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button 
            onClick={handleTestFileOperations}
            variant="outline" 
            className="w-full"
          >
            <Download className="w-4 h-4 mr-2" />
            Test File Operations
          </Button>
          
          <div className="text-xs text-muted-foreground">
            Files are saved to your device's Documents folder and can be accessed by other apps.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};