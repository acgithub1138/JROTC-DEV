
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings } from 'lucide-react';
import BusinessRulesPage from './BusinessRulesPage';

const BusinessRulesMainPage: React.FC = () => {
  return (
    <div className="h-full">
      <Tabs defaultValue="rules" className="h-full">
        <div className="border-b">
          <TabsList className="grid w-full grid-cols-1 max-w-md">
            <TabsTrigger value="rules" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Rules
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="rules" className="h-full mt-0">
          <BusinessRulesPage />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BusinessRulesMainPage;
