import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useModuleTabs } from '@/hooks/useModuleTabs';
import { CompetitionsTab } from './tabs/CompetitionsTab';
import { useCompetitionPermissions, useMyCompetitionsPermissions } from '@/hooks/useModuleSpecificPermissions';

const MyCompetitionsPage = () => {
  // Use hardcoded parent module ID for now  
  const { tabs, isLoading: tabsLoading } = useModuleTabs('my-competitions');
  const [activeTab, setActiveTab] = useState('');
  const {
    canCreate,
    canUpdate
  } = useCompetitionPermissions();
  
  const { canAccess: canAccessMyCompetitions } = useMyCompetitionsPermissions();

  // Filter tabs based on permissions
  const filteredTabs = tabs.filter(tab => {
    if (tab.name === 'competitions') return canAccessMyCompetitions;
    return false; // Default to false for unknown tabs
  });

  // Set default active tab when tabs are loaded
  useEffect(() => {
    if (filteredTabs.length > 0 && !activeTab) {
      setActiveTab(filteredTabs[0].name);
    }
  }, [filteredTabs, activeTab]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Competitions</h1>
        <p className="text-muted-foreground">Track your competitions, score sheets, and performance</p>
      </div>

      {tabsLoading ? (
        <div className="space-y-4">
          <div className="h-10 bg-muted rounded animate-pulse" />
          <div className="h-64 bg-muted rounded animate-pulse" />
        </div>
      ) : filteredTabs.length > 0 ? (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={`grid w-full grid-cols-${Math.min(filteredTabs.length, 6)}`}>
            {filteredTabs.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.name}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {filteredTabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.name} className="space-y-6">
              {/* Render tab content based on tab name */}
              {tab.name === 'competitions' && canAccessMyCompetitions && <CompetitionsTab readOnly={!canCreate} />}
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No tabs available or you don't have permission to access My Competitions content.</p>
        </div>
      )}
    </div>
  );
};

export default MyCompetitionsPage;