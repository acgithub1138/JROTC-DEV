
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CadetTable } from './CadetTable';
import { MassUpdateToolbar } from './MassUpdateToolbar';
import { Profile } from '../types';

interface CadetTabsContentProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  profiles: Profile[];
  paginatedProfiles: Profile[];
  selectedCadets: string[];
  massOperationLoading: boolean;
  onEditProfile: (profile: Profile) => void;
  onToggleStatus: (profile: Profile) => void;
  onSelectCadet: (cadetId: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  onUpdateGrade: () => void;
  onUpdateRank: () => void;
  onUpdateFlight: () => void;
  onUpdateRole: () => void;
  onDeactivate: () => void;
}

export const CadetTabsContent = ({
  activeTab,
  onTabChange,
  profiles,
  paginatedProfiles,
  selectedCadets,
  massOperationLoading,
  onEditProfile,
  onToggleStatus,
  onSelectCadet,
  onSelectAll,
  onUpdateGrade,
  onUpdateRank,
  onUpdateFlight,
  onUpdateRole,
  onDeactivate
}: CadetTabsContentProps) => {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="active">
          Active ({profiles.filter(p => p.active).length})
        </TabsTrigger>
        <TabsTrigger value="inactive">
          Non-Active ({profiles.filter(p => !p.active).length})
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="active" className="mt-4">
        <MassUpdateToolbar
          selectedCount={selectedCadets.length}
          onUpdateGrade={onUpdateGrade}
          onUpdateRank={onUpdateRank}
          onUpdateFlight={onUpdateFlight}
          onUpdateRole={onUpdateRole}
          onDeactivate={onDeactivate}
          loading={massOperationLoading}
        />
        <CadetTable
          profiles={paginatedProfiles}
          activeTab={activeTab}
          onEditProfile={onEditProfile}
          onToggleStatus={onToggleStatus}
          selectedCadets={selectedCadets}
          onSelectCadet={onSelectCadet}
          onSelectAll={(checked) => onSelectAll(checked)}
        />
      </TabsContent>

      <TabsContent value="inactive" className="mt-4">
        <CadetTable
          profiles={paginatedProfiles}
          activeTab={activeTab}
          onEditProfile={onEditProfile}
          onToggleStatus={onToggleStatus}
          selectedCadets={selectedCadets}
          onSelectCadet={onSelectCadet}
          onSelectAll={(checked) => onSelectAll(checked)}
        />
      </TabsContent>
    </Tabs>
  );
};
