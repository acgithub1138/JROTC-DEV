import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Smartphone, X } from 'lucide-react';
import { useMobileRedirect } from '@/hooks/useMobileRedirect';

export const MobileSuggestionBanner: React.FC = () => {
  const { showMobileSuggestion, goToMobile, dismissSuggestion } = useMobileRedirect();

  if (!showMobileSuggestion) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 p-4">
      <Card className="bg-primary text-primary-foreground border-0 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1">
              <Smartphone className="h-5 w-5" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">Mobile-optimized interface available</p>
                <p className="text-xs opacity-90">Switch to our touch-friendly mobile version</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 ml-4">
              <Button
                size="sm"
                variant="secondary"
                onClick={goToMobile}
                className="text-xs"
              >
                Switch
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={dismissSuggestion}
                className="p-1 h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};