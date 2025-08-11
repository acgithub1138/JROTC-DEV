import React from 'react';
import { useCapacitor } from '@/hooks/useCapacitor';
import { useNativeFeatures } from '@/hooks/useNativeFeatures';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AdvancedMobileFeatures } from './AdvancedMobileFeatures';
import { AppInfo } from './AppInfo';
import { Camera, Share2, Smartphone, Settings } from 'lucide-react';

interface MobileEnhancementsProps {
  onCameraCapture?: (imageData: string) => void;
}

export const MobileEnhancements: React.FC<MobileEnhancementsProps> = ({
  onCameraCapture
}) => {
  const { isNative, platform, isLoading } = useCapacitor();
  const { 
    openCamera, 
    shareContent, 
    hapticFeedback, 
    getDeviceInfo, 
    openAppSettings 
  } = useNativeFeatures();

  const handleCameraCapture = async () => {
    await hapticFeedback('light');
    const image = await openCamera();
    if (image?.dataUrl && onCameraCapture) {
      onCameraCapture(image.dataUrl);
    }
  };

  const handleShare = async () => {
    await hapticFeedback('light');
    await shareContent(
      'JROTC Command Center', 
      'Check out this awesome JROTC management app!',
      'https://jrotc-ccc.app'
    );
  };

  const handleGetDeviceInfo = async () => {
    await hapticFeedback('medium');
    const info = await getDeviceInfo();
    console.log('Device Info:', info);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mobile Features</CardTitle>
          <CardDescription>Loading mobile capabilities...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!isNative) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mobile Features</CardTitle>
          <CardDescription>
            These features are available when running on mobile devices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Badge variant="outline">Web Platform</Badge>
          <p className="text-sm text-muted-foreground mt-2">
            Install the mobile app to access camera, haptic feedback, and native sharing features.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            Mobile Features
          </CardTitle>
          <CardDescription>
            Native mobile capabilities for enhanced user experience
          </CardDescription>
          <Badge variant="secondary">{platform} Platform</Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button 
            onClick={handleCameraCapture}
            className="w-full"
            variant="outline"
          >
            <Camera className="w-4 h-4 mr-2" />
            Open Camera
          </Button>
          
          <Button 
            onClick={handleShare}
            className="w-full"
            variant="outline"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share App
          </Button>
          
          <Button 
            onClick={handleGetDeviceInfo}
            className="w-full"
            variant="outline"
          >
            <Smartphone className="w-4 h-4 mr-2" />
            Device Info
          </Button>
          
          <Button 
            onClick={openAppSettings}
            className="w-full"
            variant="outline"
          >
            <Settings className="w-4 h-4 mr-2" />
            App Settings
          </Button>
        </CardContent>
      </Card>

      {/* Advanced Mobile Features */}
      <AdvancedMobileFeatures />
      
      {/* App Information */}
      <AppInfo />
    </div>
  );
};