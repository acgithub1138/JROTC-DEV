
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { PermissionProvider } from "@/contexts/PermissionContext";
import { PortalProvider } from "@/contexts/PortalContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import MainApplication from "@/components/MainApplication";
import MarketingLayout from "@/components/marketing/MarketingLayout";
import LandingPage from "@/components/marketing/LandingPage";
import ProductPage from "@/components/marketing/ProductPage";
import PricingPage from "@/components/marketing/PricingPage";
import AboutPage from "@/components/marketing/AboutPage";
import ContactPage from "@/components/marketing/ContactPage";
import PrivacyPolicyPage from "@/components/marketing/PrivacyPolicyPage";
import TermsConditionsPage from "@/components/marketing/TermsConditionsPage";
import LoginPage from "@/components/marketing/LoginPage";
import NotFound from "./pages/NotFound";
import { MobileLayout } from "@/components/mobile/MobileLayout";
import { MobileDashboard } from "@/components/mobile/pages/MobileDashboard";
import { MobileTaskList } from "@/components/mobile/pages/MobileTaskList";
import { MobileCadetDirectory } from "@/components/mobile/pages/MobileCadetDirectory";
import { MobileCadetDetail } from "@/components/mobile/pages/MobileCadetDetail";
import { MobileIncidentReporting } from "@/components/mobile/pages/MobileIncidentReporting";
import { MobileCalendar } from "@/components/mobile/pages/MobileCalendar";
import { MobileEditEvent } from "@/components/mobile/competition-portal/pages/MobileEditEvent";
import { MobileAddEvent } from "@/components/mobile/pages/MobileAddEvent";
import { MobileAddEvent as MobileCompetitionAddEvent } from "@/components/mobile/competition-portal/pages/MobileAddEvent";
import { MobileMore } from "@/components/mobile/pages/MobileMore";
import { MobileRouteDetector } from "@/components/mobile/MobileRouteDetector";
import { MobileCreateTask } from "@/components/mobile/pages/MobileCreateTask";
import { MobileTaskDetail } from "@/components/mobile/pages/MobileTaskDetail";
import { MobileSubtaskDetail } from "@/components/mobile/pages/MobileSubtaskDetail";
import { MobileBudget } from "@/components/mobile/pages/MobileBudget";
import { MobileCompetitionPortalLayout } from "@/components/mobile/competition-portal/MobileCompetitionPortalLayout";
import { MobileCompetitionDashboard } from "@/components/mobile/competition-portal/pages/MobileCompetitionDashboard";
import { MobileHostingCompetitions } from "@/components/mobile/competition-portal/pages/MobileHostingCompetitions";
import { MobileOpenCompetitions } from "@/components/mobile/competition-portal/pages/MobileOpenCompetitions";
import { MobileMyCompetitions } from "@/components/mobile/competition-portal/pages/MobileMyCompetitions";
import { MobileHostCompetitionDetails } from "@/components/mobile/competition-portal/pages/MobileHostCompetitionDetails";
import { MobileHostEvents } from "@/components/mobile/competition-portal/pages/MobileHostEvents";
import { MobileHostResources } from "@/components/mobile/competition-portal/pages/MobileHostResources";
import { MobileAddResource } from "@/components/mobile/competition-portal/pages/MobileAddResource";
import { MobileEditResource } from "@/components/mobile/competition-portal/pages/MobileEditResource";
import { MobileHostSchools } from "@/components/mobile/competition-portal/pages/MobileHostSchools";
import { MobileAddSchool } from "@/components/mobile/competition-portal/pages/MobileAddSchool";
import { MobileEditSchool } from "@/components/mobile/competition-portal/pages/MobileEditSchool";
import { MobileAddSchoolEventScoreSheet } from "@/components/mobile/competition-portal/pages/MobileAddSchoolEventScoreSheet";
import { MobileHostSchedule } from "@/components/mobile/competition-portal/pages/MobileHostSchedule";
import { MobileScheduleEdit } from "@/components/mobile/competition-portal/pages/MobileScheduleEdit";
import { MobileHostResults } from "@/components/mobile/competition-portal/pages/MobileHostResults";
import { MobileEventResultsView } from "@/components/mobile/competition-portal/pages/MobileEventResultsView";
import { MobileManageCompetition } from "@/components/mobile/competition-portal/pages/MobileManageCompetition";
import { MobileCompetitionRegistration } from "@/components/mobile/competition-portal/pages/MobileCompetitionRegistration";
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <PermissionProvider>
          <PortalProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
            <Routes>
              {/* Public Marketing Routes */}
              <Route path="/" element={<MarketingLayout />}>
                <Route index element={<LandingPage />} />
                <Route path="features" element={<LandingPage />} />
                <Route path="pricing" element={<PricingPage />} />
                <Route path="about" element={<AboutPage />} />
                <Route path="contact" element={<ContactPage />} />
                <Route path="privacy-policy" element={<PrivacyPolicyPage />} />
                <Route path="terms-conditions" element={<TermsConditionsPage />} />
                <Route path="login" element={<LoginPage />} />
                
                {/* Product Module Pages */}
                <Route path="products/cadet-management" element={<ProductPage module="cadet" />} />
                <Route path="products/task-management" element={<ProductPage module="task" />} />
                <Route path="products/competition-management" element={<ProductPage module="competition" />} />
              </Route>
              
              {/* Mobile Application Routes */}
              <Route path="/mobile" element={<MobileRouteDetector />}>
                <Route path="" element={<MobileLayout />}>
                  <Route index element={
                    <ProtectedRoute>
                      <MobileDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="dashboard" element={
                    <ProtectedRoute>
                      <MobileDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="tasks" element={
                    <ProtectedRoute module="tasks" requirePermission="sidebar">
                      <MobileTaskList />
                    </ProtectedRoute>
                  } />
                  <Route path="tasks/create" element={
                    <ProtectedRoute module="tasks" requirePermission="sidebar">
                      <MobileCreateTask />
                    </ProtectedRoute>
                  } />
                  <Route path="tasks/:id" element={
                    <ProtectedRoute module="tasks" requirePermission="sidebar">
                      <MobileTaskDetail />
                    </ProtectedRoute>
                  } />
                  <Route path="subtasks/:id" element={
                    <ProtectedRoute module="tasks" requirePermission="sidebar">
                      <MobileSubtaskDetail />
                    </ProtectedRoute>
                  } />
                  <Route path="cadets" element={
                    <ProtectedRoute module="cadets" requirePermission="sidebar">
                      <MobileCadetDirectory />
                    </ProtectedRoute>
                  } />
                  <Route path="cadets/:cadetId" element={
                    <ProtectedRoute module="cadets" requirePermission="sidebar">
                      <MobileCadetDetail />
                    </ProtectedRoute>
                  } />
                  <Route path="budget" element={
                    <ProtectedRoute module="budget" requirePermission="sidebar">
                      <MobileBudget />
                    </ProtectedRoute>
                  } />
                  <Route path="calendar" element={
                    <ProtectedRoute module="calendar" requirePermission="sidebar">
                      <MobileCalendar />
                    </ProtectedRoute>
                  } />
                  <Route path="calendar/add" element={
                    <ProtectedRoute module="calendar" requirePermission="sidebar">
                      <MobileAddEvent />
                    </ProtectedRoute>
                  } />
                  <Route path="incidents" element={
                    <ProtectedRoute module="incident_management" requirePermission="sidebar">
                      <MobileIncidentReporting />
                    </ProtectedRoute>
                  } />
                  <Route path="more" element={<MobileMore />} />
                  
                  {/* Mobile Competition Portal Routes */}
                  <Route path="competition-portal" element={<MobileCompetitionPortalLayout><MobileCompetitionDashboard /></MobileCompetitionPortalLayout>} />
                  <Route path="competition-portal/hosting" element={
                    <ProtectedRoute>
                      <MobileCompetitionPortalLayout>
                        <MobileHostingCompetitions />
                      </MobileCompetitionPortalLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="competition-portal/open" element={
                    <ProtectedRoute>
                      <MobileCompetitionPortalLayout>
                        <MobileOpenCompetitions />
                      </MobileCompetitionPortalLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="competition-portal/register" element={
                    <ProtectedRoute>
                      <MobileCompetitionRegistration />
                    </ProtectedRoute>
                  } />
                  <Route path="competition-portal/my-competitions" element={
                    <ProtectedRoute>
                      <MobileCompetitionPortalLayout>
                        <MobileMyCompetitions />
                      </MobileCompetitionPortalLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="competition-portal/host" element={
                    <ProtectedRoute>
                      <MobileHostCompetitionDetails />
                    </ProtectedRoute>
                  } />
                   <Route path="competition-portal/manage/:competitionId/events/:eventId/edit" element={
                     <ProtectedRoute>
                       <MobileEditEvent />
                     </ProtectedRoute>
                   } />
                   <Route path="competition-portal/manage/:competitionId/events/add" element={
                     <ProtectedRoute>
                       <MobileCompetitionAddEvent />
                     </ProtectedRoute>
                   } />
                   <Route path="competition-portal/manage/:competitionId/events" element={
                     <ProtectedRoute>
                       <MobileHostEvents />
                     </ProtectedRoute>
                   } />
                    <Route path="competition-portal/manage/:competitionId/resources" element={
                      <ProtectedRoute>
                        <MobileHostResources />
                      </ProtectedRoute>
                    } />
                    <Route path="competition-portal/manage/:competitionId/resource/add" element={
                      <ProtectedRoute>
                        <MobileAddResource />
                      </ProtectedRoute>
                    } />
                    <Route path="competition-portal/manage/:competitionId/resource/:resourceId/edit" element={
                      <ProtectedRoute>
                        <MobileEditResource />
                      </ProtectedRoute>
                    } />
                   <Route path="competition-portal/manage/:competitionId/schools" element={
                     <ProtectedRoute>
                       <MobileHostSchools />
                     </ProtectedRoute>
                   } />
                   <Route path="competition-portal/manage/:competitionId/schools/add" element={
                     <ProtectedRoute>
                       <MobileAddSchool />
                     </ProtectedRoute>
                   } />
                    <Route path="competition-portal/manage/:competitionId/schools/:schoolId/edit" element={
                      <ProtectedRoute>
                        <MobileEditSchool />
                      </ProtectedRoute>
                    } />
                    <Route path="competition-portal/manage/:competitionId/schools/:schoolId/addschooleventscoresheet" element={
                      <ProtectedRoute>
                        <MobileAddSchoolEventScoreSheet />
                      </ProtectedRoute>
                    } />
                   <Route path="competition-portal/manage/:competitionId/schedule" element={
                     <ProtectedRoute>
                       <MobileHostSchedule />
                     </ProtectedRoute>
                   } />
                   <Route path="competition-portal/manage/:competitionId/schedule/edit/:eventId" element={
                     <ProtectedRoute>
                       <MobileScheduleEdit />
                     </ProtectedRoute>
                   } />
                     <Route path="competition-portal/manage/:competitionId/results" element={
                       <ProtectedRoute>
                         <MobileHostResults />
                       </ProtectedRoute>
                     } />
                     <Route path="competition-portal/manage/:competitionId/results/:eventName" element={
                       <ProtectedRoute>
                         <MobileEventResultsView />
                       </ProtectedRoute>
                     } />
                    <Route path="competition-portal/manage/:competitionId" element={
                      <ProtectedRoute>
                        <MobileManageCompetition />
                      </ProtectedRoute>
                    } />
                </Route>
              </Route>

              {/* Protected Application Routes */}
              <Route 
                path="/app/*" 
                element={
                  <ProtectedRoute>
                    <MainApplication />
                  </ProtectedRoute>
                } 
              />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          </PortalProvider>
        </PermissionProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
