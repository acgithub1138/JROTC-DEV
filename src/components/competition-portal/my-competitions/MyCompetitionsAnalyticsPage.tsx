import React from 'react';
import { ReportsTab } from './tabs/ReportsTab';

const MyCompetitionsAnalyticsPage = () => {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Competition Analytics</h1>
        <p className="text-muted-foreground">Track performance trends and analyze scoring criteria</p>
      </div>

      <ReportsTab />
    </div>
  );
};

export default MyCompetitionsAnalyticsPage;
