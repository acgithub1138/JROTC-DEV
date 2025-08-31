import React from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit } from 'lucide-react';
import { useCadetPTTests } from '@/hooks/useCadetRecords';
interface PTTestsTabProps {
  cadetId: string;
}
export const PTTestsTab: React.FC<PTTestsTabProps> = ({
  cadetId
}) => {
  const navigate = useNavigate();
  const {
    data: ptTests = [],
    isLoading
  } = useCadetPTTests(cadetId);
  if (isLoading) {
    return <Card>
        <CardHeader>
          <CardTitle>PT Test Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading PT test records...</div>
        </CardContent>
      </Card>;
  }
  if (ptTests.length === 0) {
    return <Card>
        <CardHeader>
          <CardTitle>PT Test Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No PT test records found for this cadet.
          </div>
        </CardContent>
      </Card>;
  }
  const formatTime = (seconds: number | null) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  return <Card>
      
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b py-[6px] px-[8px]">
                <th className="text-left p-3 font-semibold px-[8px] py-[8px]">Date</th>
                <th className="text-left p-3 font-semibold px-[8px] py-[8px]">Push-ups</th>
                <th className="text-left p-3 font-semibold px-[8px] py-[6px]">Sit-ups</th>
                <th className="text-left p-3 font-semibold px-[8px] py-[6px]">Plank</th>
                <th className="text-left p-3 font-semibold px-[8px] py-[6px]">Mile Run</th>
                <th className="text-left p-3 font-semibold px-[8px] py-[6px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {ptTests.map(test => <tr key={test.id} className="border-b hover:bg-muted/50">
                  <td className="p-3 font-medium px-[8px] py-[4px]">
                    {format(new Date(test.date), 'PPP')}
                  </td>
                  <td className="p-3 px-[8px] py-[4px]">{test.push_ups || 'N/A'}</td>
                  <td className="p-3 px-[8px] py-[4px]">{test.sit_ups || 'N/A'}</td>
                  <td className="p-3 px-[8px] py-[4px]">{formatTime(test.plank_time)}</td>
                  <td className="p-3 px-[8px] py-[4px]">{formatTime(test.mile_time)}</td>
                  <td className="p-3 px-[8px] py-[4px]">
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/app/cadets/pt_test_edit?id=${test.id}`)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  </td>
                </tr>)}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>;
};