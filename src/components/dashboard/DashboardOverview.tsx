
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, CheckSquare, DollarSign, Plus, Trophy, Calendar, Package } from 'lucide-react';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useBudgetTransactions } from '@/components/budget-management/hooks/useBudgetTransactions';
import { AddCadetDialog } from '@/components/cadet-management/components/AddCadetDialog';
import { TaskForm } from '@/components/tasks/TaskForm';
import { AddIncomeDialog } from '@/components/budget-management/components/AddIncomeDialog';
import { AddExpenseDialog } from '@/components/budget-management/components/AddExpenseDialog';
import { EventDialog } from '@/components/calendar/components/EventDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const DashboardOverview = () => {
  const navigate = useNavigate();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  
  const [isAddCadetOpen, setIsAddCadetOpen] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isAddIncomeOpen, setIsAddIncomeOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);

  const handleCreateTransaction = (data: any) => {
    // This will be handled by the individual dialogs
    console.log('Transaction created:', data);
  };

  const statsConfig = [
    {
      title: 'Total Cadets',
      value: statsLoading ? '...' : stats?.cadets.total.toString() || '0',
      change: statsLoading ? '...' : stats?.cadets.change || 'No data',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Active Tasks',
      value: statsLoading ? '...' : stats?.tasks.active.toString() || '0',
      change: statsLoading ? '...' : `${stats?.tasks.overdue || 0} overdue`,
      icon: CheckSquare,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Net Budget',
      value: statsLoading ? '...' : `$${(stats?.budget.netBudget || 0).toLocaleString()}`,
      change: statsLoading ? '...' : (
        <>
          ${(stats?.budget.totalIncome || 0).toLocaleString()} income
          <br />
          ${(stats?.budget.totalExpenses || 0).toLocaleString()} expenses
        </>
      ),
      icon: DollarSign,
      color: stats?.budget.netBudget && stats.budget.netBudget >= 0 ? 'text-green-600' : 'text-red-600',
      bgColor: stats?.budget.netBudget && stats.budget.netBudget >= 0 ? 'bg-green-100' : 'bg-red-100',
    },
    {
      title: 'Equipment',
      value: statsLoading ? '...' : stats?.inventory.total.toString() || '0',
      change: statsLoading ? '...' : `${stats?.inventory.issued || 0} issued`,
      icon: Package,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsConfig.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-sm text-gray-500 mt-1">{stat.change}</p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Trophy className="w-5 h-5 mr-2 text-blue-600" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setIsAddCadetOpen(true)}
                className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Users className="w-6 h-6 text-blue-600 mb-2" />
                <p className="font-medium text-sm">Add Cadet</p>
                <p className="text-xs text-gray-500">Enroll new cadet</p>
              </button>
              <button 
                onClick={() => setIsCreateTaskOpen(true)}
                className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <CheckSquare className="w-6 h-6 text-green-600 mb-2" />
                <p className="font-medium text-sm">Create Task</p>
                <p className="text-xs text-gray-500">Assign new task</p>
              </button>
              <button 
                onClick={() => setIsAddIncomeOpen(true)}
                className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Plus className="w-6 h-6 text-green-600 mb-2" />
                <p className="font-medium text-sm">Add Income</p>
                <p className="text-xs text-gray-500">Record income</p>
              </button>
              <button 
                onClick={() => setIsAddExpenseOpen(true)}
                className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <DollarSign className="w-6 h-6 text-red-600 mb-2" />
                <p className="font-medium text-sm">Add Expense</p>
                <p className="text-xs text-gray-500">Record expense</p>
              </button>
              <button 
                onClick={() => setIsCreateEventOpen(true)}
                className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Calendar className="w-6 h-6 text-purple-600 mb-2" />
                <p className="font-medium text-sm">Create Event</p>
                <p className="text-xs text-gray-500">Schedule new event</p>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <AddCadetDialog 
        open={isAddCadetOpen} 
        onOpenChange={setIsAddCadetOpen}
        newCadet={{
          first_name: '',
          last_name: '',
          email: '',
          grade: '',
          rank: '',
          flight: '',
          role: 'cadet'
        }}
        setNewCadet={() => {}}
        onSubmit={() => {}}
      />

      <TaskForm
        open={isCreateTaskOpen} 
        onOpenChange={setIsCreateTaskOpen}
        mode="create"
      />

      <AddIncomeDialog 
        open={isAddIncomeOpen} 
        onOpenChange={setIsAddIncomeOpen}
        onSubmit={handleCreateTransaction}
      />

      <AddExpenseDialog 
        open={isAddExpenseOpen} 
        onOpenChange={setIsAddExpenseOpen}
        onSubmit={handleCreateTransaction}
      />

      <EventDialog
        open={isCreateEventOpen}
        onOpenChange={setIsCreateEventOpen}
        event={null}
        selectedDate={null}
        onSubmit={async () => {
          setIsCreateEventOpen(false);
        }}
      />
    </div>
  );
};

export default DashboardOverview;
