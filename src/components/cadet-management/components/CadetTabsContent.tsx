
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CadetTable } from './CadetTable';
import { CadetCards } from './CadetCards';
import { BulkCadetActions } from './BulkCadetActions';
import { PTTestsTab } from './PTTestsTab';
import { UniformInspectionTab } from './UniformInspectionTab';
import { CommunityServiceTab } from './CommunityServiceTab';
import { Profile } from '../types';
import { useIsMobile } from '@/hooks/use-mobile';
import { useCadetPermissions } from '@/hooks/useModuleSpecificPermissions';
interface CadetTabsContentProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  activeSubTab: string;
  onSubTabChange: (value: string) => void;
  profiles: Profile[];
  paginatedProfiles: Profile[];
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
}
export const CadetTabsContent = ({
  activeTab,
  onTabChange,
  activeSubTab,
  onSubTabChange,
  profiles,
  paginatedProfiles,
  selectedCadets,
  massOperationLoading,
  onEditProfile,
  onViewProfile,
  onToggleStatus,
  onSelectCadet,
  onSelectAll,
  onRefresh,
  onOpenPTTestDialog,
  searchTerm
}: CadetTabsContentProps) => {
  const isMobile = useIsMobile();
  const {
    canUpdate,
    canDelete
  } = useCadetPermissions();
  const renderCadetDisplay = () => {
    if (isMobile) {
      return <CadetCards profiles={paginatedProfiles} activeTab={activeTab} onEditProfile={onEditProfile} onViewProfile={onViewProfile} onToggleStatus={onToggleStatus} selectedCadets={selectedCadets} onSelectCadet={onSelectCadet} />;
    }
    return <CadetTable profiles={paginatedProfiles} activeTab={activeTab} onEditProfile={onEditProfile} onViewProfile={onViewProfile} onToggleStatus={onToggleStatus} selectedCadets={selectedCadets} onSelectCadet={onSelectCadet} onSelectAll={checked => onSelectAll(checked)} />;
  };
  return <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="cadets">
          Cadets ({profiles.length})
        </TabsTrigger>
        <TabsTrigger value="pt-tests">
          PT Tests
        </TabsTrigger>
        <TabsTrigger value="uniform-inspection">
          Uniform Inspection
        </TabsTrigger>
        <TabsTrigger value="community-service">
          Community Service
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="cadets" className="mt-4">
        <Tabs value={activeSubTab} onValueChange={onSubTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="active">
              Active ({profiles.filter(p => p.active).length})
            </TabsTrigger>
            <TabsTrigger value="inactive">
              Non-Active ({profiles.filter(p => !p.active).length})
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
                />
              </div>
            )}
            {renderCadetDisplay()}
          </TabsContent>
        </Tabs>
      </TabsContent>

      <TabsContent value="pt-tests" className="mt-4">
        <PTTestsTab onOpenBulkDialog={onOpenPTTestDialog} searchTerm={searchTerm} />
      </TabsContent>

      <TabsContent value="uniform-inspection" className="mt-4">
        <UniformInspectionTab searchTerm={searchTerm} />
      </TabsContent>

      <TabsContent value="community-service" className="mt-4">
        <CommunityServiceTab searchTerm={searchTerm} />
      </TabsContent>
    </Tabs>;
};