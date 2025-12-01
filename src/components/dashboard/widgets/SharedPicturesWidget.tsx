import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Image, ExternalLink, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

export const SharedPicturesWidget = () => {
  const { userProfile } = useAuth();
  
  const { data: sharedPicturesUrl, isLoading, error } = useQuery({
    queryKey: ['school-shared-pictures', userProfile?.school_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schools')
        .select('shared_pictures_url')
        .eq('id', userProfile?.school_id)
        .single();
      
      if (error) throw error;
      return data?.shared_pictures_url;
    },
    enabled: !!userProfile?.school_id,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Shared Pictures
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Shared Pictures
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <p className="text-sm">Failed to load shared pictures link</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!sharedPicturesUrl) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Shared Pictures
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No shared pictures folder configured
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image className="h-5 w-5" />
          Shared Pictures
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => window.open(sharedPicturesUrl, '_blank')}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          View Shared Pictures
        </Button>
      </CardContent>
    </Card>
  );
};
