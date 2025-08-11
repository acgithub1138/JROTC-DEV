import React from 'react';
import { useCapacitor } from '@/hooks/useCapacitor';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { platformConfig } from '@/config/platform-config';
import { getBuildConfig, buildInfo } from '@/config/build-config';
import { Info, Smartphone, Settings } from 'lucide-react';

export const AppInfo: React.FC = () => {
  const { isNative, platform } = useCapacitor();
  const buildConfig = getBuildConfig();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="w-5 h-5" />
          App Information
        </CardTitle>
        <CardDescription>
          Build and platform information for debugging
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-sm">Platform</h4>
            <div className="flex items-center gap-2 mt-1">
              <Smartphone className="w-4 h-4" />
              <span className="text-sm">{platform}</span>
              <Badge variant={isNative ? "default" : "outline"}>
                {isNative ? "Native" : "Web"}
              </Badge>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-sm">Version</h4>
            <p className="text-sm text-muted-foreground">
              {buildInfo.version} ({buildInfo.buildNumber})
            </p>
          </div>
          
          <div>
            <h4 className="font-medium text-sm">Environment</h4>
            <Badge variant="secondary">
              {buildConfig.environment}
            </Badge>
          </div>
          
          <div>
            <h4 className="font-medium text-sm">App ID</h4>
            <p className="text-xs text-muted-foreground font-mono">
              {platformConfig.appId}
            </p>
          </div>
        </div>

        {isNative && (
          <div className="pt-4 border-t">
            <h4 className="font-medium text-sm mb-2">Native Capabilities</h4>
            <div className="flex flex-wrap gap-1">
              {platformConfig.capabilities[platform as keyof typeof platformConfig.capabilities]?.map((capability) => (
                <Badge key={capability} variant="outline" className="text-xs">
                  {capability}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="pt-4 border-t">
          <h4 className="font-medium text-sm mb-2">Build Information</h4>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>Built: {new Date(buildInfo.buildDate).toLocaleString()}</p>
            <p>Debug Mode: {buildConfig.debugMode ? 'Enabled' : 'Disabled'}</p>
            <p>Analytics: {buildConfig.enableAnalytics ? 'Enabled' : 'Disabled'}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};