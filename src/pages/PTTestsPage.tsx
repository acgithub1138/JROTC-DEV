import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { PTTestsTab } from '@/components/cadet-management/components/PTTestsTab';

const PTTestsPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">PT Tests</h1>
          <p className="text-muted-foreground">
            View and manage Physical Training test records
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search cadets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <PTTestsTab 
            onOpenBulkDialog={() => navigate('/app/cadets/pt_test_create?mode=bulk')} 
            searchTerm={searchTerm}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default PTTestsPage;
