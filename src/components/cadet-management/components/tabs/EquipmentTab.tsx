import React from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package } from 'lucide-react';
import { useCadetEquipment } from '@/hooks/useCadetRecords';

interface EquipmentTabProps {
  cadetId: string;
}

export const EquipmentTab: React.FC<EquipmentTabProps> = ({ cadetId }) => {
  const { data: equipment = [], isLoading } = useCadetEquipment(cadetId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Equipment Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading equipment records...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Equipment Records
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          No equipment records found for this cadet.
        </div>
      </CardContent>
    </Card>
  );
};