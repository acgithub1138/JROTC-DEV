
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search } from 'lucide-react';
import { JobBoardTable } from './components/JobBoardTable';
import { JobBoardChart } from './components/JobBoardChart';
import { AddJobDialog } from './components/AddJobDialog';
import { EditJobDialog } from './components/EditJobDialog';
import { DeleteJobDialog } from './components/DeleteJobDialog';

import { useJobBoard } from './hooks/useJobBoard';
import { getFilteredJobs } from './utils/jobBoardFilters';
import { JobBoardWithCadet } from './types';
import { useJobBoardPermissions } from '@/hooks/useModuleSpecificPermissions';

const JobBoardPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingJob, setEditingJob] = useState<JobBoardWithCadet | null>(null);
  const [deletingJob, setDeletingJob] = useState<JobBoardWithCadet | null>(null);
  
  const [activeTab, setActiveTab] = useState('table');
  const { canManageHierarchy, canCreate } = useJobBoardPermissions();

  const {
    jobs,
    isLoading,
    createJob,
    updateJob,
    deleteJob,
    refetch
  } = useJobBoard();

  const filteredJobs = getFilteredJobs(jobs, searchTerm);

  const handleAddJob = (newJob: any) => {
    createJob.mutate(newJob, {
      onSuccess: () => {
        setShowAddDialog(false);
      }
    });
  };

  const handleEditJob = (id: string, updates: any) => {
    updateJob.mutate({
      id,
      updates
    }, {
      onSuccess: () => {
        setEditingJob(null);
      }
    });
  };

  const handleDeleteJob = () => {
    if (deletingJob) {
      deleteJob.mutate(deletingJob.id, {
        onSuccess: () => {
          setDeletingJob(null);
        }
      });
    }
  };

  const handleRefresh = () => {
    refetch();
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Job Board</h1>
          {canCreate && (
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Job
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by cadet name or role..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="table">Job Board</TabsTrigger>
                <TabsTrigger value="chart">Job Board Chart</TabsTrigger>
              </TabsList>
              
              <TabsContent value="table" className="mt-4">
                <JobBoardTable
                  jobs={filteredJobs}
                  onEditJob={canManageHierarchy ? setEditingJob : undefined}
                  onDeleteJob={canManageHierarchy ? setDeletingJob : undefined}
                  readOnly={!canManageHierarchy}
                />
              </TabsContent>

              <TabsContent value="chart" className="mt-4">
                <JobBoardChart
                  jobs={filteredJobs}
                  onRefresh={handleRefresh}
                  onUpdateJob={canManageHierarchy ? handleEditJob : undefined}
                  readOnly={!canManageHierarchy}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {canManageHierarchy && (
          <>
            <AddJobDialog
              open={showAddDialog}
              onOpenChange={setShowAddDialog}
              onSubmit={handleAddJob}
              loading={createJob.isPending}
              jobs={jobs}
            />

            <EditJobDialog
              open={!!editingJob}
              onOpenChange={(open) => !open && setEditingJob(null)}
              job={editingJob}
              onSubmit={handleEditJob}
              loading={updateJob.isPending}
              jobs={jobs}
            />

            <DeleteJobDialog
              open={!!deletingJob}
              onOpenChange={(open) => !open && setDeletingJob(null)}
              job={deletingJob}
              onConfirm={handleDeleteJob}
              loading={deleteJob.isPending}
            />
          </>
        )}

      </div>
    </div>
  );
};

export default JobBoardPage;
