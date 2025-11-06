import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CompetitionsTab } from './tabs/CompetitionsTab';
import { TemplatesTab } from './tabs/TemplatesTab';
import { useCompetitionPermissions } from '@/hooks/useModuleSpecificPermissions';
const CompetitionManagementPage = () => {
  const [activeTab, setActiveTab] = useState('competitions');
  const {
    canCreate,
    canUpdate
  } = useCompetitionPermissions();
  return <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Competitions</h1>
        <p className="text-muted-foreground">Track your competitions, score sheets, and performance</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="competitions">My Competitions</TabsTrigger>
          <TabsTrigger value="templates">Score Sheet Templates</TabsTrigger>
        </TabsList>
        
        <TabsContent value="competitions" className="space-y-6">
          <CompetitionsTab readOnly={!canCreate} />
        </TabsContent>
        
        <TabsContent value="templates" className="space-y-6">
          <TemplatesTab readOnly={!canCreate} />
        </TabsContent>
      </Tabs>
    </div>;
};
export default CompetitionManagementPage;