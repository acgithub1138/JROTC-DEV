import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Search, Plus, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { PTTestsTab } from '@/components/cadet-management/components/PTTestsTab';

const PTTestsPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">PT Tests</h1>
            <p className="text-muted-foreground">
              View and manage Physical Training test records
            </p>
          </div>
          {/* Desktop button */}
          <Button 
            variant="outline" 
            onClick={() => navigate('/app/cadets/pt_test_create?mode=bulk')}
            className="hidden md:flex"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add PT Tests
          </Button>
        </div>
        
        {/* Mobile button */}
        <Button 
          variant="outline" 
          onClick={() => navigate('/app/cadets/pt_test_create?mode=bulk')}
          className="md:hidden w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add PT Tests
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search cadets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-[240px] justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : <span>Filter by date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus className="p-3 pointer-events-auto" />
                <div className="p-3 border-t">
                  <Button variant="outline" size="sm" onClick={() => setSelectedDate(undefined)} className="w-full">
                    Clear Filter
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>
        <CardContent>
          <PTTestsTab 
            onOpenBulkDialog={() => navigate('/app/cadets/pt_test_create?mode=bulk')} 
            searchTerm={searchTerm}
            selectedDate={selectedDate}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default PTTestsPage;
