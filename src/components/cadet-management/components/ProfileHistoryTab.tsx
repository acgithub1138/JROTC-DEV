import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSchoolTimezone } from '@/hooks/useSchoolTimezone';
import { formatTimeForDisplay, TIME_FORMATS } from '@/utils/timeDisplayUtils';
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
export const ProfileHistoryTab = ({
  profileId
}: ProfileHistoryTabProps) => {
  const {
    timezone
  } = useSchoolTimezone();
  const {
    data: history = [],
    isLoading
  } = useQuery({
    queryKey: ['profile-history', profileId],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('profile_history').select(`
          id,
          field_name,
          old_value,
          new_value,
          created_at,
          changed_by,
          changed_by_profile:profiles!changed_by(first_name, last_name)
        `).eq('profile_id', profileId).order('created_at', {
        ascending: false
      });
      if (error) {
        console.error('Error fetching profile history:', error);
        throw error;
      }
      return data as ProfileHistoryItem[];
    }
  });
  const formatFieldName = (fieldName: string) => {
    return fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };
  const formatValue = (value: string | null) => {
    if (!value || value === 'null') return 'None';
    return value;
  };
  if (isLoading) {
    return <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-muted rounded"></div>)}
          </div>
        </CardContent>
      </Card>;
  }
  return <Card>
      <CardHeader className="py-[6px]">
        <CardTitle>Profile Change History</CardTitle>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? <div className="text-center py-8 text-muted-foreground">
            <p>No profile changes recorded yet</p>
          </div> : <ScrollArea className="h-[250px]">
            <div className="space-y-3 pr-4">
              {history.map(item => <div key={item.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">
                        {item.changed_by_profile ? `${item.changed_by_profile.first_name} ${item.changed_by_profile.last_name}` : 'System'}
                      </span>
                      {' '}changed{' '}
                      <span className="font-medium text-blue-600">
                        {formatFieldName(item.field_name)}
                      </span>
                      {' '}from{' '}
                      <span className="font-medium text-red-600">"{formatValue(item.old_value)}"</span>
                      {' '}to{' '}
                      <span className="font-medium text-green-600">"{formatValue(item.new_value)}"</span>
                    </p>
                    <span className="text-xs text-gray-500 ml-4 flex-shrink-0">
                      {formatTimeForDisplay(item.created_at, TIME_FORMATS.SHORT_DATETIME_24H, timezone)}
                    </span>
                  </div>
                </div>)}
            </div>
          </ScrollArea>}
      </CardContent>
    </Card>;
};