import React, { useMemo } from 'react';
import { ArrowLeft, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useBudgetTransactions } from './hooks/useBudgetTransactions';
import { BudgetFilters } from './BudgetManagementPage';
import { useIsMobile } from '@/hooks/use-mobile';

// Color palette for pie charts
const INCOME_COLORS = ['#10B981', '#059669', '#047857', '#065F46', '#064E3B', '#022C22'];
const EXPENSE_COLORS = ['#EF4444', '#DC2626', '#B91C1C', '#991B1B', '#7F1D1D', '#450A0A'];
const BudgetReportPage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Fetch only active, non-archived transactions
  const filters: BudgetFilters = {
    search: '',
    category: '',
    type: '',
    paymentMethod: '',
    status: '',
    showArchived: false,
    // Only show non-archived
    budgetYear: ''
  };
  const {
    transactions,
    isLoading
  } = useBudgetTransactions(filters);

  // Filter for active transactions only
  const activeTransactions = useMemo(() => {
    return transactions.filter(transaction => transaction.active === true);
  }, [transactions]);

  // Prepare data for income pie chart
  const incomeData = useMemo(() => {
    const incomeTransactions = activeTransactions.filter(t => t.category === 'income');
    const incomeByType = incomeTransactions.reduce((acc, transaction) => {
      const type = transaction.type || 'Other';
      acc[type] = (acc[type] || 0) + Number(transaction.amount);
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(incomeByType).map(([type, amount]) => ({
      name: type,
      value: amount,
      formatted: `$${amount.toFixed(2)}`
    })).sort((a, b) => b.value - a.value);
  }, [activeTransactions]);

  // Prepare data for expense pie chart
  const expenseData = useMemo(() => {
    const expenseTransactions = activeTransactions.filter(t => t.category === 'expense');
    const expenseByType = expenseTransactions.reduce((acc, transaction) => {
      const type = transaction.type || 'Other';
      acc[type] = (acc[type] || 0) + Number(transaction.amount);
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(expenseByType).map(([type, amount]) => ({
      name: type,
      value: amount,
      formatted: `$${amount.toFixed(2)}`
    })).sort((a, b) => b.value - a.value);
  }, [activeTransactions]);

  // Calculate totals
  const totalIncome = incomeData.reduce((sum, item) => sum + item.value, 0);
  const totalExpenses = expenseData.reduce((sum, item) => sum + item.value, 0);
  const netBudget = totalIncome - totalExpenses;
  const CustomTooltip = ({
    active,
    payload
  }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-primary">{data.formatted}</p>
          <p className="text-sm text-muted-foreground">
            {(data.value / (payload[0].payload.category === 'income' ? totalIncome : totalExpenses) * 100).toFixed(1)}%
          </p>
        </div>;
    }
    return null;
  };
  if (isLoading) {
    return <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate('/app/budget')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Budget
          </Button>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading budget report...</div>
        </div>
      </div>;
  }
  return <div className="p-6 space-y-6">
      {/* Mobile Back Button - Above Header */}
      {isMobile && (
        <Button variant="ghost" size="sm" onClick={() => navigate('/app/budget')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Budget
        </Button>
      )}

      {/* Header */}
      <div className={isMobile ? "" : "flex items-center gap-4"}>
        {/* Desktop Back Button - Inline with Header */}
        {!isMobile && (
          <Button variant="ghost" size="sm" onClick={() => navigate('/app/budget')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Budget
          </Button>
        )}
        <div>
          <h1 className="text-3xl font-bold">Budget Report</h1>
          <p className="text-muted-foreground">Visual breakdown of income and expenses by type</p>
        </div>
      </div>

      {/* Summary Cards */}
      

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Income Breakdown
            </CardTitle>
            <CardDescription>
              Distribution of income by type (${totalIncome.toFixed(2)} total)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {incomeData.length > 0 ? <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={incomeData} cx="50%" cy="50%" innerRadius={60} outerRadius={120} paddingAngle={2} dataKey="value">
                      {incomeData.map((entry, index) => <Cell key={`cell-${index}`} fill={INCOME_COLORS[index % INCOME_COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div> : <div className="h-80 flex items-center justify-center text-muted-foreground">
                No income data available
              </div>}
          </CardContent>
        </Card>

        {/* Expense Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              Expense Breakdown
            </CardTitle>
            <CardDescription>
              Distribution of expenses by type (${totalExpenses.toFixed(2)} total)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {expenseData.length > 0 ? <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={expenseData} cx="50%" cy="50%" innerRadius={60} outerRadius={120} paddingAngle={2} dataKey="value">
                      {expenseData.map((entry, index) => <Cell key={`cell-${index}`} fill={EXPENSE_COLORS[index % EXPENSE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div> : <div className="h-80 flex items-center justify-center text-muted-foreground">
                No expense data available
              </div>}
          </CardContent>
        </Card>
      </div>

      {/* Data Summary Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Income Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {incomeData.map((item, index) => <div key={item.name} className="flex justify-between items-center py-2 border-b last:border-b-0">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{
                  backgroundColor: INCOME_COLORS[index % INCOME_COLORS.length]
                }} />
                    <span className="font-medium">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{item.formatted}</div>
                    <div className="text-sm text-muted-foreground">
                      {(item.value / totalIncome * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>)}
            </div>
          </CardContent>
        </Card>

        {/* Expense Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Expense Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {expenseData.map((item, index) => <div key={item.name} className="flex justify-between items-center py-2 border-b last:border-b-0">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{
                  backgroundColor: EXPENSE_COLORS[index % EXPENSE_COLORS.length]
                }} />
                    <span className="font-medium">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{item.formatted}</div>
                    <div className="text-sm text-muted-foreground">
                      {(item.value / totalExpenses * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>)}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>;
};
export default BudgetReportPage;