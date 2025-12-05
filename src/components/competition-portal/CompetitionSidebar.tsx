import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { usePortal } from "@/contexts/PortalContext";
import { usePermissionContext } from "@/contexts/PermissionContext";
import { filterCompetitionModulesByTier } from "@/utils/competitionPermissions";
import { useThemes } from "@/hooks/useThemes";
import { useNavigate } from "react-router-dom";
import { Trophy, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import * as LucideIcons from "lucide-react";
import { CompetitionTier } from "@/types/appAccess";
interface CompetitionSidebarProps {
  className?: string;
  activeModule: string;
  onModuleChange: (module: string) => void;
  isMobile?: boolean;
  sidebarOpen?: boolean;
  setSidebarOpen?: (open: boolean) => void;
}

// Default theme configuration
const DEFAULT_THEME = {
  primary_color: "#111827",
  // Sidebar background (gray-900)
  secondary_color: "#2563eb",
  // Selected link background (blue-600)
  link_text: "#d1d5db",
  // Link text (gray-300)
  link_selected_text: "#ffffff",
  // Selected link text (white)
  link_hover: "#1f2937" // Hover background (gray-800)
};

// Fetch competition portal menu items from database
const fetchCompetitionMenuItemsFromDatabase = async (hasPermission: (module: string, action: string) => boolean, competitionTier: CompetitionTier) => {
  try {
    const {
      data: modules,
      error
    } = await supabase.rpc("get_permission_modules_simple", {
      is_tab_param: false,
      parent_module_param: null,
      is_active_param: true
    });
    if (error) {
      console.error("Error fetching competition portal modules:", error);
      return [];
    }

    // Filter for competition portal modules only
    const allCompetitionModules = (modules || []).filter((module: any) => module.is_competition_portal).map((module: any) => ({
      id: module.name,
      name: module.name,
      label: module.label,
      icon: module.icon,
      path: module.path,
      sort_order: module.sort_order || 0
    }));
    console.log("All competition modules from DB:", allCompetitionModules);

    // First filter by tier, then by role permissions
    const tierFilteredModules = filterCompetitionModulesByTier(allCompetitionModules, competitionTier);
    const competitionModules = tierFilteredModules.filter((module: any) => hasPermission(module.name, "sidebar")).sort((a: any, b: any) => a.sort_order - b.sort_order);
    console.log("Loaded competition portal modules:", competitionModules);
    return competitionModules;
  } catch (error) {
    console.error("Error in fetchCompetitionMenuItemsFromDatabase:", error);
    return [];
  }
};

// Dynamic icon renderer component
const DynamicIcon: React.FC<{
  iconName: string;
  className?: string;
}> = ({
  iconName,
  className = ""
}) => {
  const iconKey = iconName as keyof typeof LucideIcons;
  const IconComponent = LucideIcons[iconKey];

  // Type guard to check if it's a valid React component
  const isValidComponent = (component: any): component is React.ComponentType<any> => {
    return typeof component === "function" || typeof component === "object" && component.$$typeof;
  };
  if (!IconComponent || !isValidComponent(IconComponent)) {
    console.warn(`Icon "${iconName}" not found in Lucide icons, using fallback`);
    return <Trophy className={className} />;
  }
  const ValidIcon = IconComponent as React.ComponentType<{
    className?: string;
  }>;
  return <ValidIcon className={className} />;
};
export const CompetitionSidebar: React.FC<CompetitionSidebarProps> = ({
  className,
  activeModule,
  onModuleChange,
  isMobile = false,
  sidebarOpen = false,
  setSidebarOpen
}) => {
  const {
    userProfile
  } = useAuth();
  const {
    setPortal,
    competitionTier,
    canAccessCCC
  } = usePortal();
  const {
    hasPermission,
    isLoading: permissionsLoading
  } = usePermissionContext();
  const {
    themes
  } = useThemes();
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load menu items from database
  useEffect(() => {
    const loadMenuItems = async () => {
      if (!userProfile?.role || permissionsLoading) {
        return;
      }
      setIsLoading(true);
      try {
        const items = await fetchCompetitionMenuItemsFromDatabase(hasPermission, competitionTier);
        setMenuItems(items);
      } catch (error) {
        console.error("Error loading competition menu items:", error);
        setMenuItems([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadMenuItems();
  }, [userProfile?.role, hasPermission, permissionsLoading, competitionTier]);

  // Get the active theme that matches the user's JROTC program or use default
  const activeTheme = themes.find(theme => theme.is_active && theme.jrotc_program === userProfile?.schools?.jrotc_program);

  // Use active theme or fallback to default theme
  const currentTheme = {
    primary_color: activeTheme?.primary_color || DEFAULT_THEME.primary_color,
    secondary_color: activeTheme?.secondary_color || DEFAULT_THEME.secondary_color,
    link_text: (activeTheme as any)?.link_text || DEFAULT_THEME.link_text,
    link_selected_text: (activeTheme as any)?.link_selected_text || DEFAULT_THEME.link_selected_text,
    link_hover: (activeTheme as any)?.link_hover || DEFAULT_THEME.link_hover
  };

  // Show loading state while menu items are being fetched
  if (isLoading) {
    return <div className={cn("fixed left-0 top-0 h-full w-64 text-white flex flex-col z-40", className)} style={{
      backgroundColor: DEFAULT_THEME.primary_color
    }}>
        <div className="p-6">
          <div className="flex items-center space-x-2">
            <Trophy className="w-8 h-8 text-blue-400" />
            <h1 className="text-xl font-bold">Competition Portal</h1>
          </div>
        </div>
        <ScrollArea className="flex-1 px-3">
          <div className="space-y-1">
            {[1, 2, 3].map(i => <div key={i} className="h-10 bg-gray-700 rounded animate-pulse" />)}
          </div>
        </ScrollArea>
      </div>;
  }
  const handleReturnToCCC = () => {
    setPortal("ccc");
    navigate("/app");
  };
  const handleMenuItemClick = (item: any) => {
    console.log("Menu item clicked:", item, "Current activeModule:", activeModule);
    onModuleChange(item.id);
    if (isMobile && setSidebarOpen) {
      setSidebarOpen(false);
    }
  };
  if (isMobile) {
    return <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="top" className="w-2/3 ml-0 bg-white">
          <SheetHeader>
            <SheetTitle className="flex items-center space-x-2 text-gray-900">
              {activeTheme?.theme_image_url ? <img src={activeTheme.theme_image_url} alt="JROTC Program Logo" className="w-6 h-6 object-contain" /> : <Trophy className="w-6 h-6 text-blue-400" />}
              <span>Competition Portal</span>
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-2">
            {menuItems.map(item => {
            const isActive = activeModule === item.id;
            return <Button key={item.id} variant={isActive ? "secondary" : "ghost"} className="w-full justify-start text-gray-900 hover:bg-gray-100" onClick={() => handleMenuItemClick(item)}>
                  <DynamicIcon iconName={item.icon} className="w-4 h-4 mr-2" />
                  {item.label}
                </Button>;
          })}

            {userProfile?.role !== "external" && canAccessCCC && <Button variant="outline" className="w-full justify-start text-gray-900 border-gray-300 hover:bg-gray-100" onClick={() => {
            handleReturnToCCC();
            setSidebarOpen?.(false);
          }}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Return to CCC
              </Button>}
          </div>
        </SheetContent>
      </Sheet>;
  }
  return <div className={cn("fixed left-0 top-0 h-full w-64 text-white flex flex-col z-40", className)} style={{
    backgroundColor: currentTheme.primary_color
  }}>
      <div className="p-6">
        <div className="flex items-center space-x-2">
          {activeTheme?.theme_image_url ? <img src={activeTheme.theme_image_url} alt="JROTC Program Logo" className="w-8 h-8 object-contain" /> : <Trophy className="w-8 h-8 text-blue-400" />}
          <div>
            <h1 className="text-xl font-bold">Competition Portal</h1>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 px-3">
        <div className="space-y-1">
          {menuItems.map(item => {
          const isActive = activeModule === item.id;
          return <Button key={item.id} variant="ghost" className="w-full justify-start text-left font-normal" style={{
            backgroundColor: isActive ? currentTheme.secondary_color : "transparent",
            color: isActive ? currentTheme.link_selected_text : currentTheme.link_text
          }} onMouseEnter={e => {
            if (!isActive) {
              e.currentTarget.style.backgroundColor = currentTheme.link_hover;
              e.currentTarget.style.color = "#ffffff";
            }
          }} onMouseLeave={e => {
            if (!isActive) {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = currentTheme.link_text;
            }
          }} onClick={() => handleMenuItemClick(item)}>
                <DynamicIcon iconName={item.icon} className="w-4 h-4 mr-3" />
                {item.label}
              </Button>;
        })}
        </div>
      </ScrollArea>

      {/* Return to CCC Button - Hidden for external users and users without CCC access */}
      {userProfile?.role !== "external" && canAccessCCC && <div className="p-3 border-t border-gray-700">
          <Button variant="outline" className="w-full justify-start text-left font-normal" style={{
        borderColor: currentTheme.link_text,
        color: currentTheme.link_text,
        backgroundColor: "transparent"
      }} onMouseEnter={e => {
        e.currentTarget.style.backgroundColor = currentTheme.link_hover;
        e.currentTarget.style.color = "#ffffff";
      }} onMouseLeave={e => {
        e.currentTarget.style.backgroundColor = "transparent";
        e.currentTarget.style.color = currentTheme.link_text;
      }} onClick={handleReturnToCCC}>
            <ArrowLeft className="w-4 h-4 mr-3" />
            CCC Portal 
          </Button>
        </div>}
    </div>;
};