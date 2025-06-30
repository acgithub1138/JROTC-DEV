
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useBusinessRuleLogs } from '@/hooks/useBusinessRuleLogs';
import { useBusinessRules } from '@/hooks/useBusinessRules';
import { Activity } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { LogsStats } from './logs/LogsStats';
import { LogsFilters } from './logs/LogsFilters';
import { LogItem } from './logs/LogItem';

const BusinessRuleLogsPage: React.FC = () => {
  const { logs, loading, fetchLogs, getExecutionStats } = useBusinessRuleLogs();
  const { rules } = useBusinessRules();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRule, setSelectedRule] = useState<string>('all');
  const [selectedTable, setSelectedTable] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const stats = getExecutionStats();

  const filteredLogs = logs.filter(log => {
    const matchesSearch = searchTerm === '' || 
      log.business_rule?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.target_table.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRule = selectedRule === 'all' || log.business_rule_id === selectedRule;
    const matchesTable = selectedTable === 'all' || log.target_table === selectedTable;
    const matchesStatus = selectedStatus === 'all' || 
      (selectedStatus === 'success' && log.success) ||
      (selectedStatus === 'failed' && !log.success);

    return matchesSearch && matchesRule && matchesTable && matchesStatus;
  });

  const uniqueTables = Array.from(new Set(logs.map(log => log.target_table)));

  const formatExecutionTime = (ms: number | null) => {
    if (!ms) return 'N/A';
    return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(2)}s`;
  };

  const formatJsonPreview = (obj: any) => {
    if (!obj) return 'N/A';
    const str = JSON.stringify(obj, null, 2);
    return str.length > 100 ? str.substring(0, 100) + '...' : str;
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Business Rule Execution Logs</h1>
          <p className="text-gray-600 mt-2">Monitor and analyze business rule executions</p>
        </div>
        <Button onClick={() => fetchLogs()} className="flex items-center gap-2">
          <Activity className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      <LogsStats stats={stats} formatExecutionTime={formatExecutionTime} />

      <LogsFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedRule={selectedRule}
        setSelectedRule={setSelectedRule}
        selectedTable={selectedTable}
        setSelectedTable={setSelectedTable}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        rules={rules}
        uniqueTables={uniqueTables}
      />

      <Card>
        <CardHeader>
          <CardTitle>Execution Logs</CardTitle>
          <CardDescription>
            {filteredLogs.length} of {logs.length} logs shown
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No logs found matching your filters.</p>
              </div>
            ) : (
              filteredLogs.map((log) => (
                <LogItem
                  key={log.id}
                  log={log}
                  formatExecutionTime={formatExecutionTime}
                  formatJsonPreview={formatJsonPreview}
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BusinessRuleLogsPage;
