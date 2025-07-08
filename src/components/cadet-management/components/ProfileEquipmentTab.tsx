import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface ProfileEquipmentTabProps {
  profileId: string;
}

interface EquipmentItem {
  id: string;
  item_id: string | null;
  item: string;
  description: string | null;
  category: string | null;
  sub_category: string | null;
  checkout_info?: {
    checked_out_at: string;
    expected_return_date: string | null;
    notes: string | null;
  }[];
}

export const ProfileEquipmentTab = ({ profileId }: ProfileEquipmentTabProps) => {
  const { data: equipment = [], isLoading } = useQuery({
    queryKey: ['profile-equipment', profileId],
    queryFn: async () => {
      // Get all inventory items where this profile is in the issued_to array
      const { data, error } = await supabase
        .from('inventory_items')
        .select(`
          id,
          item_id,
          item,
          description,
          category,
          sub_category,
          checkout_info:inventory_checkout(
            checked_out_at,
            expected_return_date,
            notes
          )
        `)
        .contains('issued_to', [profileId]);

      if (error) {
        console.error('Error fetching equipment:', error);
        throw error;
      }

      return data as EquipmentItem[];
    },
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'issued':
        return 'bg-blue-100 text-blue-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      case 'retired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
        <CardTitle>Assigned Equipment</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        {equipment.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No equipment currently assigned</p>
          </div>
        ) : (
          <div className="h-full overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item ID</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Sub Category</TableHead>
                  <TableHead>Item</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {equipment.map((item) => {
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-xs">
                        {item.item_id || '-'}
                      </TableCell>
                      <TableCell>{item.category || '-'}</TableCell>
                      <TableCell>{item.sub_category || '-'}</TableCell>
                      <TableCell className="font-medium">
                        <div>
                          <p className="font-medium">{item.item}</p>
                          {item.description && (
                            <p className="text-xs text-muted-foreground">{item.description}</p>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};