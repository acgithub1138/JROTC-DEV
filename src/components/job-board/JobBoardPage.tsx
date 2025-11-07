import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search } from 'lucide-react';
import { JobBoardTable } from './components/JobBoardTable';
import { JobBoardChart } from './components/JobBoardChart';
import { DeleteJobDialog } from './components/DeleteJobDialog';
import { JobRoleEmailConfirmModal } from './components/JobRoleEmailConfirmModal';
import { useJobBoard } from './hooks/useJobBoard';
import { getFilteredJobs } from './utils/jobBoardFilters';
import { JobBoardWithCadet } from './types';
import { useJobBoardPermissions } from '@/hooks/useModuleSpecificPermissions';
import { useIsMobile } from '@/hooks/use-mobile';
const JobBoardPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingJob, setDeletingJob] = useState<JobBoardWithCadet | null>(null);
  const [activeTab, setActiveTab] = useState('table');
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const {
    canManageHierarchy,
    canCreate,
    canUpdate,
    canDelete
  } = useJobBoardPermissions();
  const {
    jobs,
    isLoading,
    deleteJob,
    updateJob,
    refetch,
    emailConfirmModal,
    setEmailConfirmModal
  } = useJobBoard();
  const filteredJobs = getFilteredJobs(jobs, searchTerm);
  
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

  const handleUpdateJob = (jobId: string, updates: Partial<JobBoardWithCadet>, suppressToast = false) => {
    updateJob.mutate({ id: jobId, updates, suppressToast }, {
      onError: (error) => {
        console.error('Failed to update job:', error);
      }
    });
  };
  if (isLoading) {
    return <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>;
  }
  return <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
            <h1 className="text-3xl font-bold text-gray-900">Chain of Command</h1>
            {canCreate && <Button onClick={() => navigate('/app/job-board/coc_record?mode=create')} className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Add Role
              </Button>}
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input placeholder="Search by cadet name or role..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
              <div className="flex text-right">If the Chart disappears, click the Chain of Command tab then Chain of Command Chart tab again.</div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="table">{isMobile ? 'COC' : 'Chain of Command'}</TabsTrigger>
                <TabsTrigger value="chart">{isMobile ? 'COC Chart' : 'Chain of Command Chart'}</TabsTrigger>
              </TabsList>
              
              <TabsContent value="table" className="mt-4">
                <JobBoardTable 
                  jobs={filteredJobs} 
                  onEditJob={canUpdate ? (job) => navigate(`/app/job-board/coc_record?mode=edit&id=${job.id}`) : undefined} 
                  onDeleteJob={canDelete ? setDeletingJob : undefined} 
                  readOnly={!canUpdate && !canDelete} 
                />
              </TabsContent>

              <TabsContent value="chart" className="mt-4">
                <JobBoardChart 
                  jobs={filteredJobs} 
                  onRefresh={handleRefresh} 
                  onUpdateJob={canUpdate ? handleUpdateJob : undefined} 
                  readOnly={!canUpdate} 
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {canDelete && <DeleteJobDialog open={!!deletingJob} onOpenChange={open => !open && setDeletingJob(null)} job={deletingJob} onConfirm={handleDeleteJob} loading={deleteJob.isPending} />}

        <JobRoleEmailConfirmModal open={emailConfirmModal.open} onOpenChange={open => setEmailConfirmModal(prev => ({
        ...prev,
        open
      }))} currentEmail={emailConfirmModal.currentEmail} newEmail={emailConfirmModal.newEmail} cadetName={emailConfirmModal.cadetName} onReplace={emailConfirmModal.onReplace} onKeep={emailConfirmModal.onKeep} />

      </div>
    </div>;
};
export default JobBoardPage;