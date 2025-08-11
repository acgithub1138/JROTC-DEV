import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, Smartphone, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { useAppUpdates } from '@/hooks/useAppUpdates';
import { useCapacitor } from '@/hooks/useCapacitor';

export const UpdateManager: React.FC = () => {
  const { isNative, platform } = useCapacitor();
  const { 
    updateInfo, 
    isChecking, 
    isUpdating, 
    error, 
    checkForUpdates, 
    downloadUpdate, 
    installUpdate 
  } = useAppUpdates();

  if (!isNative && !updateInfo.available) {
    return null;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          App Updates
          {platform && (
            <Badge variant="outline" className="ml-auto">
              {platform.toUpperCase()}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Keep your app up to date with the latest features and security improvements
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {updateInfo.available ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">Update Available</h4>
                  {updateInfo.version && (
                    <Badge variant="secondary">v{updateInfo.version}</Badge>
                  )}
                  {updateInfo.mandatory && (
                    <Badge variant="destructive">Required</Badge>
                  )}
                </div>
                {updateInfo.releaseNotes && (
                  <p className="text-sm text-muted-foreground">
                    {updateInfo.releaseNotes}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadUpdate}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  {isUpdating ? 'Downloading...' : 'Download'}
                </Button>
                <Button
                  size="sm"
                  onClick={installUpdate}
                  disabled={isUpdating}
                >
                  Install
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="font-medium">Your app is up to date</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={checkForUpdates}
              disabled={isChecking}
            >
              {isChecking ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {isChecking ? 'Checking...' : 'Check for Updates'}
            </Button>
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Updates are downloaded automatically when available</p>
          <p>• Critical security updates may be installed automatically</p>
          {isNative && (
            <p>• App store updates require restart</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};