import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CompetitionsTab } from './tabs/CompetitionsTab';
import { TemplatesTab } from './tabs/TemplatesTab';
import { useRolePermissions } from '@/hooks/useRolePermissions';

const CompetitionManagementPage = () => {
  const [activeTab, setActiveTab] = useState('competitions');
  const { canManageCompetitions } = useRolePermissions();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Competition Management</h1>
        <p className="text-muted-foreground">
          Manage competitions, score sheets, and track performance
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="competitions">Competitions</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>
        
        <TabsContent value="competitions" className="space-y-6">
          <CompetitionsTab readOnly={!canManageCompetitions()} />
        </TabsContent>
        
        <TabsContent value="templates" className="space-y-6">
          <TemplatesTab readOnly={!canManageCompetitions()} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CompetitionManagementPage;