
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useBusinessRuleLogs } from '@/hooks/useBusinessRuleLogs';
import { LogsStats } from './logs/LogsStats';
import { LogsFilters } from './logs/LogsFilters';
import { LogItem } from './logs/LogItem';
import { Skeleton } from '@/components/ui/skeleton';

const BusinessRuleLogsPage: React.FC = () => {
  const [filters, setFilters] = useState({
    ruleId: '',
    success: '',
    dateRange: ''
  });

  const { logs, loading, stats } = useBusinessRuleLogs(filters);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-12" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-96" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Business Rule Execution Logs</h1>
        <p className="text-gray-600 mt-2">Monitor and analyze business rule executions</p>
      </div>

      <LogsStats stats={stats} />

      <LogsFilters filters={filters} onFiltersChange={setFilters} />

      <Card>
        <CardHeader>
          <CardTitle>Execution History</CardTitle>
          <CardDescription>Recent business rule executions and their results</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {logs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No execution logs found
            </div>
          ) : (
            logs.map((log) => (
              <LogItem key={log.id} log={log} />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BusinessRuleLogsPage;
