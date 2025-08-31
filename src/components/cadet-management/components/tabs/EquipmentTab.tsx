import React from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package } from 'lucide-react';
import { useCadetEquipment } from '@/hooks/useCadetRecords';
interface EquipmentTabProps {
  cadetId: string;
}
export const EquipmentTab: React.FC<EquipmentTabProps> = ({
  cadetId
}) => {
  const {
    data: equipment = [],
    isLoading
  } = useCadetEquipment(cadetId);
  if (isLoading) {
    return <Card>
        <CardHeader>
          <CardTitle>Equipment Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading equipment records...</div>
        </CardContent>
      </Card>;
  }
  return <Card>
      
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3 font-semibold px-[8px] py-[8px]">Item</th>
                <th className="text-left p-3 font-semibold px-[8px] py-[8px]">Serial Number</th>
                <th className="text-left p-3 font-semibold px-[8px] py-[8px]">Condition</th>
                <th className="text-left p-3 font-semibold px-[8px] py-[8px]">Assigned Date</th>
                <th className="text-left p-3 font-semibold px-[8px] py-[8px]">Notes</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td colSpan={5} className="p-8 text-center text-muted-foreground">
                  No equipment records found for this cadet.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>;
};