
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBusinessRuleLogs, BusinessRuleLog } from '@/hooks/useBusinessRuleLogs';
import { useBusinessRules } from '@/hooks/useBusinessRules';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Search, 
  Filter,
  Activity,
  Database,
  Zap,
  TrendingUp
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

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

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-500" />
              Total Executions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalExecutions}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.successRate.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" />
              Failed Executions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.failedExecutions}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-500" />
              Avg. Execution Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatExecutionTime(stats.averageExecutionTime)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedRule} onValueChange={setSelectedRule}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by rule" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Rules</SelectItem>
                {rules.map(rule => (
                  <SelectItem key={rule.id} value={rule.id}>
                    {rule.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedTable} onValueChange={setSelectedTable}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by table" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tables</SelectItem>
                {uniqueTables.map(table => (
                  <SelectItem key={table} value={table}>
                    {table}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
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
                <div key={log.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant={log.success ? 'default' : 'destructive'}>
                        {log.success ? (
                          <CheckCircle className="w-3 h-3 mr-1" />
                        ) : (
                          <XCircle className="w-3 h-3 mr-1" />
                        )}
                        {log.success ? 'Success' : 'Failed'}
                      </Badge>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Database className="w-3 h-3" />
                        {log.target_table}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Clock className="w-3 h-3" />
                        {formatExecutionTime(log.execution_time_ms)}
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(log.executed_at).toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h4 className="font-medium mb-1">Rule & Action</h4>
                      <p className="text-gray-600">{log.business_rule?.name || 'Unknown Rule'}</p>
                      <p className="text-gray-500">{log.action_type} - {log.trigger_event}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-1">Target Record</h4>
                      <p className="text-gray-600 font-mono text-xs">
                        {log.target_record_id || 'N/A'}
                      </p>
                    </div>
                  </div>
                  
                  {log.error_message && !log.success && (
                    <div className="bg-red-50 border border-red-200 rounded p-3">
                      <h4 className="font-medium text-red-800 mb-1">Error Message</h4>
                      <p className="text-red-700 text-sm">{log.error_message}</p>
                    </div>
                  )}
                  
                  {log.action_details && (
                    <div className="bg-gray-50 border rounded p-3">
                      <h4 className="font-medium mb-1">Action Details</h4>
                      <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                        {formatJsonPreview(log.action_details)}
                      </pre>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BusinessRuleLogsPage;
