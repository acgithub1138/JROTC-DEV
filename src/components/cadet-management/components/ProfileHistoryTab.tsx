import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface ProfileHistoryTabProps {
  profileId: string;
}

interface ProfileHistoryItem {
  id: string;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
  changed_by: string | null;
  changed_by_profile?: {
    first_name: string;
    last_name: string;
  };
}

export const ProfileHistoryTab = ({ profileId }: ProfileHistoryTabProps) => {
  const { data: history = [], isLoading } = useQuery({
    queryKey: ['profile-history', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profile_history')
        .select(`
          id,
          field_name,
          old_value,
          new_value,
          created_at,
          changed_by,
          changed_by_profile:profiles!changed_by(first_name, last_name)
        `)
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching profile history:', error);
        throw error;
      }

      return data as ProfileHistoryItem[];
    },
  });

  const formatFieldName = (fieldName: string) => {
    return fieldName
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatValue = (value: string | null) => {
    if (!value || value === 'null') return 'None';
    return value;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle>Profile Change History</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        {history.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No profile changes recorded yet</p>
          </div>
        ) : (
          <div className="h-full overflow-y-auto space-y-4">
            {history.map((item) => (
              <div 
                key={item.id} 
                className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <Badge variant="outline" className="text-xs">
                    {formatFieldName(item.field_name)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(item.created_at), 'MM/dd/yyyy HH:mm:ss')}
                  </span>
                </div>
                <div className="text-sm mb-2">
                  <span className="text-muted-foreground">Changed from </span>
                  <span className="font-medium text-red-600">
                    "{formatValue(item.old_value)}"
                  </span>
                  <span className="text-muted-foreground"> to </span>
                  <span className="font-medium text-green-600">
                    "{formatValue(item.new_value)}"
                  </span>
                </div>
                {item.changed_by_profile && (
                  <div className="text-xs text-muted-foreground">
                    Changed by: {item.changed_by_profile.first_name} {item.changed_by_profile.last_name}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};