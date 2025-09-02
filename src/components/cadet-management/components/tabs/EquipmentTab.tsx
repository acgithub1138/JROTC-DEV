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
        {/* Desktop Table View */}
        <div className="overflow-x-auto hidden md:block">
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
              {equipment.length === 0 ? (
                <tr className="border-b">
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    No equipment records found for this cadet.
                  </td>
                </tr>
              ) : (
                equipment.map(item => (
                  <tr key={item.id} className="border-b hover:bg-muted/50">
                    <td className="p-3 font-medium px-[8px] py-[8px]">{item.item_name}</td>
                    <td className="p-3 px-[8px] py-[8px]">{item.serial_number || 'N/A'}</td>
                    <td className="p-3 px-[8px] py-[8px]">
                      <Badge variant="secondary">{item.condition}</Badge>
                    </td>
                    <td className="p-3 px-[8px] py-[8px]">
                      {item.assigned_date ? format(new Date(item.assigned_date), 'PPP') : 'N/A'}
                    </td>
                    <td className="p-3 px-[8px] py-[8px]">{item.notes || 'No notes'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden">
          {equipment.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No equipment records found for this cadet.
            </div>
          ) : (
            <div className="space-y-4">
              {equipment.map(item => (
                <Card key={item.id} className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="font-medium">{item.item_name}</div>
                    <Badge variant="secondary">{item.condition}</Badge>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Serial Number:</span>
                      <div className="font-medium">{item.serial_number || 'N/A'}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Assigned Date:</span>
                      <div className="font-medium">
                        {item.assigned_date ? format(new Date(item.assigned_date), 'PPP') : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Notes:</span>
                      <div className="mt-1">{item.notes || 'No notes'}</div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>;
};