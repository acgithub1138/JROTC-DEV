
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
import { usePermissionContext } from '@/contexts/PermissionContext';
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
  const { hasPermission } = usePermissionContext();
  
  // Check permissions for each module
  const canAccessCadets = hasPermission('cadets', 'read');
  const canAccessPTTests = hasPermission('pt_tests', 'sidebar');
  const canAccessUniformInspection = hasPermission('uniform_inspection', 'sidebar');
  const canAccessCommunityService = hasPermission('community_service', 'sidebar');
  
  // Filter available tabs based on permissions
  const availableTabs = [
    { value: 'cadets', label: `Cadets (${profiles.length})`, canAccess: canAccessCadets },
    { value: 'pt-tests', label: 'PT Tests', canAccess: canAccessPTTests },
    { value: 'uniform-inspection', label: 'Uniform Inspection', canAccess: canAccessUniformInspection },
    { value: 'community-service', label: 'Community Service', canAccess: canAccessCommunityService }
  ].filter(tab => tab.canAccess);
  
  const gridCols = availableTabs.length === 1 ? 'grid-cols-1' : 
                   availableTabs.length === 2 ? 'grid-cols-2' : 
                   availableTabs.length === 3 ? 'grid-cols-3' : 'grid-cols-4';
  const renderCadetDisplay = () => {
    if (isMobile) {
      return <CadetCards profiles={paginatedProfiles} activeTab={activeTab} onEditProfile={onEditProfile} onViewProfile={onViewProfile} onToggleStatus={onToggleStatus} selectedCadets={selectedCadets} onSelectCadet={onSelectCadet} />;
    }
    return <CadetTable profiles={paginatedProfiles} activeTab={activeTab} onEditProfile={onEditProfile} onViewProfile={onViewProfile} onToggleStatus={onToggleStatus} selectedCadets={selectedCadets} onSelectCadet={onSelectCadet} onSelectAll={checked => onSelectAll(checked)} />;
  };
  return <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <TabsList className={`grid w-full ${gridCols}`}>
        {availableTabs.map(tab => (
          <TabsTrigger key={tab.value} value={tab.value}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      
      {canAccessCadets && (
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
      )}

      {canAccessPTTests && (
        <TabsContent value="pt-tests" className="mt-4">
          <PTTestsTab onOpenBulkDialog={onOpenPTTestDialog} searchTerm={searchTerm} />
        </TabsContent>
      )}

      {canAccessUniformInspection && (
        <TabsContent value="uniform-inspection" className="mt-4">
          <UniformInspectionTab searchTerm={searchTerm} />
        </TabsContent>
      )}

      {canAccessCommunityService && (
        <TabsContent value="community-service" className="mt-4">
          <CommunityServiceTab searchTerm={searchTerm} />
        </TabsContent>
      )}
    </Tabs>;
};