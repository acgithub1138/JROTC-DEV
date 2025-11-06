
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CadetTable } from './CadetTable';
import { CadetCards } from './CadetCards';
import { BulkCadetActions } from './BulkCadetActions';
import { Profile } from '../types';
import { useIsMobile } from '@/hooks/use-mobile';
import { useCadetPermissions } from '@/hooks/useModuleSpecificPermissions';
import { SortConfig } from '@/components/ui/sortable-table';

interface CadetTabsContentProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  activeSubTab: string;
  onSubTabChange: (value: string) => void;
  profiles: Profile[];
  paginatedProfiles: Profile[];
  sortConfig: SortConfig | null;
  onSort: (key: string) => void;
  selectedCadets: string[];
  massOperationLoading: boolean;
  onEditProfile: (profile: Profile) => void;
  onViewProfile: (profile: Profile) => void;
  onToggleStatus: (profile: Profile) => void;
  onSelectCadet: (cadetId: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  onRefresh: () => void;
  onOpenPTTestDialog: () => void;
  searchTerm?: string;
  onOpenDeactivateDialog: () => void;
}
export const CadetTabsContent = ({
  activeTab,
  onTabChange,
  activeSubTab,
  onSubTabChange,
  profiles,
  paginatedProfiles,
  sortConfig,
  onSort,
  selectedCadets,
  massOperationLoading,
  onEditProfile,
  onViewProfile,
  onToggleStatus,
  onSelectCadet,
  onSelectAll,
  onRefresh,
  onOpenPTTestDialog,
  searchTerm,
  onOpenDeactivateDialog
}: CadetTabsContentProps) => {
  const isMobile = useIsMobile();
  const {
    canUpdate,
    canDelete
  } = useCadetPermissions();
  const renderCadetDisplay = () => {
    if (isMobile) {
      return <CadetCards profiles={paginatedProfiles} activeTab={activeSubTab} onEditProfile={onEditProfile} onViewProfile={onViewProfile} onToggleStatus={onToggleStatus} selectedCadets={selectedCadets} onSelectCadet={onSelectCadet} />;
    }
    return <CadetTable profiles={paginatedProfiles} activeTab={activeSubTab} sortConfig={sortConfig} onSort={onSort} onEditProfile={onEditProfile} onViewProfile={onViewProfile} onToggleStatus={onToggleStatus} selectedCadets={selectedCadets} onSelectCadet={onSelectCadet} onSelectAll={checked => onSelectAll(checked)} />;
  };
  return <Tabs value={activeSubTab} onValueChange={onSubTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="active">
          Active ({profiles.filter(p => p.active && p.role !== 'parent').length})
        </TabsTrigger>
        <TabsTrigger value="inactive">
          Non-Active ({profiles.filter(p => !p.active && p.role !== 'parent').length})
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="active" className="mt-4">
        {!isMobile && (
          <div className="flex justify-end p-4 border-b py-[4px]">
            <BulkCadetActions 
              selectedCadets={selectedCadets} 
              onSelectionClear={() => onSelectAll(false)} 
              canEdit={canUpdate} 
              canDelete={canDelete} 
              onRefresh={onRefresh} 
              onOpenDeactivateDialog={onOpenDeactivateDialog}
            />
          </div>
        )}
        {renderCadetDisplay()}
      </TabsContent>

      <TabsContent value="inactive" className="mt-4">
        {!isMobile && (
          <div className="flex justify-end p-4 border-b">
            <BulkCadetActions 
              selectedCadets={selectedCadets} 
              onSelectionClear={() => onSelectAll(false)} 
              canEdit={canUpdate} 
              canDelete={canDelete} 
              onRefresh={onRefresh} 
              onOpenDeactivateDialog={onOpenDeactivateDialog}
            />
          </div>
        )}
        {renderCadetDisplay()}
      </TabsContent>
    </Tabs>;
};