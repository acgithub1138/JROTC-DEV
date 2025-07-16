import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useEmailRuleAnalytics } from "@/hooks/email/useEmailRuleAnalytics";
import { formatDistanceToNow } from "date-fns";
import { TrendingUp, TrendingDown, Clock, Mail, Users, AlertTriangle } from "lucide-react";

export const RuleAnalytics = () => {
  const { usageStats, recentLogs, isLoading } = useEmailRuleAnalytics();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Rule Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-4 bg-muted animate-pulse rounded" />
            <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
            <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalTriggers = usageStats.reduce((sum, stat) => sum + stat.total_triggers, 0);
  const totalSuccessful = usageStats.reduce((sum, stat) => sum + stat.successful_triggers, 0);
  const totalFailed = usageStats.reduce((sum, stat) => sum + stat.failed_triggers, 0);
  const overallSuccessRate = totalTriggers > 0 ? (totalSuccessful / totalTriggers) * 100 : 0;
  const avgProcessingTime = usageStats.length > 0 
    ? usageStats.reduce((sum, stat) => sum + stat.avg_processing_time_ms, 0) / usageStats.length 
    : 0;

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{totalTriggers}</p>
                <p className="text-sm text-muted-foreground">Total Emails Sent</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{overallSuccessRate.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">Success Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{avgProcessingTime.toFixed(0)}ms</p>
                <p className="text-sm text-muted-foreground">Avg Processing Time</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">
                  {new Set(usageStats.flatMap(stat => stat.recipient_emails)).size}
                </p>
                <p className="text-sm text-muted-foreground">Unique Recipients</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rule Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Rule Performance (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {usageStats.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No email rule activity in the last 30 days
              </p>
            ) : (
              usageStats.map((stat) => (
                <div key={stat.rule_id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {stat.rule_type.replace('_', ' ')}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {stat.total_triggers} triggers
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {stat.success_rate >= 95 ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : stat.success_rate < 80 ? (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-yellow-500" />
                      )}
                      <span className="text-sm font-medium">
                        {stat.success_rate.toFixed(1)}% success
                      </span>
                    </div>
                  </div>
                  
                  <Progress value={stat.success_rate} className="mb-2" />
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {stat.successful_triggers} successful • {stat.failed_triggers} failed
                    </span>
                    <span>
                      Last triggered {formatDistanceToNow(new Date(stat.last_triggered), { addSuffix: true })}
                    </span>
                  </div>
                  
                  <div className="mt-2 text-xs text-muted-foreground">
                    Avg processing: {stat.avg_processing_time_ms.toFixed(0)}ms • 
                    Recipients: {stat.recipient_emails.length}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Email Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentLogs.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                No recent email activity
              </p>
            ) : (
              recentLogs.slice(0, 10).map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {log.success ? (
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                    ) : (
                      <div className="w-2 h-2 bg-red-500 rounded-full" />
                    )}
                    <div>
                      <p className="text-sm font-medium">
                        {log.trigger_operation.toLowerCase()} on {log.trigger_table}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        to {log.recipient_email}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(log.triggered_at), { addSuffix: true })}
                    </p>
                    {log.processing_time_ms && (
                      <p className="text-xs text-muted-foreground">
                        {log.processing_time_ms}ms
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};