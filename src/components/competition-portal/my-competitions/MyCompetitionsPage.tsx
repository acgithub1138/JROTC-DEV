import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useModuleTabs } from '@/hooks/useModuleTabs';
import { supabase } from '@/integrations/supabase/client';
import { CompetitionsTab } from './tabs/CompetitionsTab';
import { ReportsTab } from './tabs/ReportsTab';
import { useCompetitionPermissions } from '@/hooks/useModuleSpecificPermissions';

const MyCompetitionsPage = () => {
  const [myCompetitionsModuleId, setMyCompetitionsModuleId] = useState<string | null>(null);
  const { tabs, isLoading: tabsLoading } = useModuleTabs(myCompetitionsModuleId);
  const [activeTab, setActiveTab] = useState('');
  const {
    canCreate,
    canUpdate
  } = useCompetitionPermissions();

  // Get the my competitions module ID
  useEffect(() => {
    const fetchMyCompetitionsModule = async () => {
      const { data, error } = await supabase
        .from('permission_modules')
        .select('id')
        .eq('name', 'my_competitions')
        .eq('is_active', true)
        .maybeSingle();
      
      if (data && !error) {
        setMyCompetitionsModuleId(data.id);
      }
    };

    fetchMyCompetitionsModule();
  }, []);

  // Set default active tab when tabs are loaded
  useEffect(() => {
    if (tabs.length > 0 && !activeTab) {
      setActiveTab(tabs[0].name);
    }
  }, [tabs, activeTab]);

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
      ) : tabs.length > 0 ? (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={`grid w-full grid-cols-${Math.min(tabs.length, 6)}`}>
            {tabs.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.name}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {tabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.name} className="space-y-6">
              {/* Render tab content based on tab name */}
              {tab.name === 'competitions' && <CompetitionsTab readOnly={!canCreate} />}
              {tab.name === 'reports' && <ReportsTab />}
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No tabs available for My Competitions.</p>
        </div>
      )}
    </div>
  );
};

export default MyCompetitionsPage;