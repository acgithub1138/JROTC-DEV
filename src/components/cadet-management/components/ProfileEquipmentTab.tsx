import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
export const ProfileEquipmentTab = ({
  profileId
}: ProfileEquipmentTabProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  
  const {
    data: equipment = [],
    isLoading
  } = useQuery({
    queryKey: ['profile-equipment', profileId],
    queryFn: async () => {
      // Get all inventory items where this profile is in the issued_to array
      const {
        data,
        error
      } = await supabase.from('inventory_items').select(`
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
        `).contains('issued_to', [profileId]);
      if (error) {
        console.error('Error fetching equipment:', error);
        throw error;
      }
      return data as EquipmentItem[];
    }
  });

  // Calculate pagination
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return equipment.slice(startIndex, endIndex);
  }, [equipment, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(equipment.length / itemsPerPage);

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };
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
    return <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-muted rounded"></div>)}
          </div>
        </CardContent>
      </Card>;
  }
  return <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>
          Equipment Assigned
          {equipment.length > 0 && (
            <span className="text-sm font-normal text-muted-foreground ml-2">
              ({equipment.length} total items)
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        {equipment.length === 0 ? <div className="text-center py-8 text-muted-foreground">
            <p>No equipment currently assigned</p>
          </div> : <div>
            <div className="overflow-y-auto">
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
                  {paginatedData.map(item => {
                return <TableRow key={item.id}>
                        <TableCell>
                          {item.item_id || '-'}
                        </TableCell>
                        <TableCell>{item.category || '-'}</TableCell>
                        <TableCell>{item.sub_category || '-'}</TableCell>
                        <TableCell>
                          <div>
                            <p>{item.item}</p>
                            {item.description && <p className="text-muted-foreground">{item.description}</p>}
                          </div>
                        </TableCell>
                      </TableRow>;
              })}
                </TableBody>
              </Table>
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, equipment.length)} of {equipment.length} records
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <span className="text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </div>}
      </CardContent>
    </Card>;
};