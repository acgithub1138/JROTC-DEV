
import React, { Suspense, lazy } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { PermissionProvider } from "@/contexts/PermissionContext";
import { SidebarPreferencesProvider } from "@/contexts/SidebarPreferencesContext";
import { PortalProvider } from "@/contexts/PortalContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import MarketingLayout from "@/components/marketing/MarketingLayout";
import LandingPage from "@/components/marketing/LandingPage";
import NotFound from "./pages/NotFound";
import ErrorBoundary from "@/components/ErrorBoundary";

// Lazy load non-critical marketing pages
const ProductPage = lazy(() => import("@/components/marketing/ProductPage"));
const PricingPage = lazy(() => import("@/components/marketing/PricingPage"));
const AboutPage = lazy(() => import("@/components/marketing/AboutPage"));
const ContactPage = lazy(() => import("@/components/marketing/ContactPage"));
const PrivacyPolicyPage = lazy(() => import("@/components/marketing/PrivacyPolicyPage"));
const TermsConditionsPage = lazy(() => import("@/components/marketing/TermsConditionsPage"));
const ResetPasswordPage = lazy(() => import("@/pages/ResetPasswordPage"));
const ParentRegistrationPage = lazy(() => import("@/components/auth/ParentRegistrationPage"));
const ExternalSchoolRegistration = lazy(() => import("@/components/external/ExternalSchoolRegistration").then(m => ({ default: m.ExternalSchoolRegistration })));

// Lazy load main application
const MainApplication = lazy(() => import("@/components/MainApplication"));

// Lazy load mobile components
const MobileLayout = lazy(() => import("@/components/mobile/MobileLayout").then(m => ({ default: m.MobileLayout })));
const MobileDashboard = lazy(() => import("@/components/mobile/pages/MobileDashboard").then(m => ({ default: m.MobileDashboard })));
const MobileTaskList = lazy(() => import("@/components/mobile/pages/MobileTaskList").then(m => ({ default: m.MobileTaskList })));
const MobileCadetDirectory = lazy(() => import("@/components/mobile/pages/MobileCadetDirectory").then(m => ({ default: m.MobileCadetDirectory })));
const MobileCadetDetail = lazy(() => import("@/components/mobile/pages/MobileCadetDetail").then(m => ({ default: m.MobileCadetDetail })));
const MobileIncidentReporting = lazy(() => import("@/components/mobile/pages/MobileIncidentReporting").then(m => ({ default: m.MobileIncidentReporting })));
const MobileCalendar = lazy(() => import("@/components/mobile/pages/MobileCalendar").then(m => ({ default: m.MobileCalendar })));
const MobileEditEvent = lazy(() => import("@/components/mobile/competition-portal/pages/MobileEditEvent").then(m => ({ default: m.MobileEditEvent })));
const MobileAddEvent = lazy(() => import("@/components/mobile/pages/MobileAddEvent").then(m => ({ default: m.MobileAddEvent })));
const MobileCompetitionAddEvent = lazy(() => import("@/components/mobile/competition-portal/pages/MobileAddEvent").then(m => ({ default: m.MobileAddEvent })));
const MobileMore = lazy(() => import("@/components/mobile/pages/MobileMore").then(m => ({ default: m.MobileMore })));
const MobileRouteDetector = lazy(() => import("@/components/mobile/MobileRouteDetector").then(m => ({ default: m.MobileRouteDetector })));
const MobileCreateTask = lazy(() => import("@/components/mobile/pages/MobileCreateTask").then(m => ({ default: m.MobileCreateTask })));
const MobileBudget = lazy(() => import("@/components/mobile/pages/MobileBudget").then(m => ({ default: m.MobileBudget })));
const MobileCompetitionPortalLayout = lazy(() => import("@/components/mobile/competition-portal/MobileCompetitionPortalLayout").then(m => ({ default: m.MobileCompetitionPortalLayout })));
const MobileCompetitionDashboard = lazy(() => import("@/components/mobile/competition-portal/pages/MobileCompetitionDashboard").then(m => ({ default: m.MobileCompetitionDashboard })));
const MobileHostingCompetitions = lazy(() => import("@/components/mobile/competition-portal/pages/MobileHostingCompetitions").then(m => ({ default: m.MobileHostingCompetitions })));
const MobileOpenCompetitions = lazy(() => import("@/components/mobile/competition-portal/pages/MobileOpenCompetitions").then(m => ({ default: m.MobileOpenCompetitions })));
const MobileMyCompetitions = lazy(() => import("@/components/mobile/competition-portal/pages/MobileMyCompetitions").then(m => ({ default: m.MobileMyCompetitions })));
const MobileHostCompetitionDetails = lazy(() => import("@/components/mobile/competition-portal/pages/MobileHostCompetitionDetails").then(m => ({ default: m.MobileHostCompetitionDetails })));
const MobileHostEvents = lazy(() => import("@/components/mobile/competition-portal/pages/MobileHostEvents").then(m => ({ default: m.MobileHostEvents })));
const MobileHostResources = lazy(() => import("@/components/mobile/competition-portal/pages/MobileHostResources").then(m => ({ default: m.MobileHostResources })));
const MobileAddResource = lazy(() => import("@/components/mobile/competition-portal/pages/MobileAddResource").then(m => ({ default: m.MobileAddResource })));
const MobileEditResource = lazy(() => import("@/components/mobile/competition-portal/pages/MobileEditResource").then(m => ({ default: m.MobileEditResource })));
const MobileHostSchools = lazy(() => import("@/components/mobile/competition-portal/pages/MobileHostSchools").then(m => ({ default: m.MobileHostSchools })));
const MobileAddSchool = lazy(() => import("@/components/mobile/competition-portal/pages/MobileAddSchool").then(m => ({ default: m.MobileAddSchool })));
const MobileEditSchool = lazy(() => import("@/components/mobile/competition-portal/pages/MobileEditSchool").then(m => ({ default: m.MobileEditSchool })));
const MobileAddSchoolEventScoreSheet = lazy(() => import("@/components/mobile/competition-portal/pages/MobileAddSchoolEventScoreSheet").then(m => ({ default: m.MobileAddSchoolEventScoreSheet })));
const MobileHostSchedule = lazy(() => import("@/components/mobile/competition-portal/pages/MobileHostSchedule").then(m => ({ default: m.MobileHostSchedule })));
const MobileScheduleEdit = lazy(() => import("@/components/mobile/competition-portal/pages/MobileScheduleEdit").then(m => ({ default: m.MobileScheduleEdit })));
const MobileHostResults = lazy(() => import("@/components/mobile/competition-portal/pages/MobileHostResults").then(m => ({ default: m.MobileHostResults })));
const MobileEventResultsView = lazy(() => import("@/components/mobile/competition-portal/pages/MobileEventResultsView").then(m => ({ default: m.MobileEventResultsView })));
const MobileManageCompetition = lazy(() => import("@/components/mobile/competition-portal/pages/MobileManageCompetition").then(m => ({ default: m.MobileManageCompetition })));
const MobileCompetitionRegistration = lazy(() => import("@/components/mobile/competition-portal/pages/MobileCompetitionRegistration").then(m => ({ default: m.MobileCompetitionRegistration })));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <PermissionProvider>
            <SidebarPreferencesProvider>
              <PortalProvider>
              <Toaster />
              <Sonner />
            <BrowserRouter>
            <Routes>
              {/* Public Marketing Routes */}
              <Route path="/" element={<MarketingLayout />}>
                <Route index element={<LandingPage />} />
                <Route path="features" element={<LandingPage />} />
                <Route path="pricing" element={<Suspense fallback={<PageLoader />}><PricingPage /></Suspense>} />
                <Route path="about" element={<Suspense fallback={<PageLoader />}><AboutPage /></Suspense>} />
                <Route path="contact" element={<Suspense fallback={<PageLoader />}><ContactPage /></Suspense>} />
                <Route path="privacy-policy" element={<Suspense fallback={<PageLoader />}><PrivacyPolicyPage /></Suspense>} />
                <Route path="terms-conditions" element={<Suspense fallback={<PageLoader />}><TermsConditionsPage /></Suspense>} />
                <Route path="login" element={<Navigate to="/app/auth" replace />} />
                
                {/* Product Module Pages */}
                <Route path="products/cadet-management" element={<Suspense fallback={<PageLoader />}><ProductPage module="cadet" /></Suspense>} />
                <Route path="products/task-management" element={<Suspense fallback={<PageLoader />}><ProductPage module="task" /></Suspense>} />
                <Route path="products/competition-management" element={<Suspense fallback={<PageLoader />}><ProductPage module="competition" /></Suspense>} />
              </Route>
              
              {/* Mobile Application Routes */}
              <Route path="/mobile" element={<Suspense fallback={<PageLoader />}><MobileRouteDetector /></Suspense>}>
                <Route path="" element={<Suspense fallback={<PageLoader />}><MobileLayout /></Suspense>}>
                  <Route index element={
                    <ProtectedRoute>
                      <Suspense fallback={<PageLoader />}><MobileDashboard /></Suspense>
                    </ProtectedRoute>
                  } />
                  <Route path="dashboard" element={
                    <ProtectedRoute>
                      <Suspense fallback={<PageLoader />}><MobileDashboard /></Suspense>
                    </ProtectedRoute>
                  } />
                  <Route path="tasks" element={
                    <ProtectedRoute module="tasks" requirePermission="sidebar">
                      <Suspense fallback={<PageLoader />}><MobileTaskList /></Suspense>
                    </ProtectedRoute>
                  } />
                  <Route path="tasks/create" element={
                    <ProtectedRoute module="tasks" requirePermission="sidebar">
                      <Suspense fallback={<PageLoader />}><MobileCreateTask /></Suspense>
                    </ProtectedRoute>
                  } />
                  <Route path="cadets" element={
                    <ProtectedRoute module="cadets" requirePermission="sidebar">
                      <Suspense fallback={<PageLoader />}><MobileCadetDirectory /></Suspense>
                    </ProtectedRoute>
                  } />
                  <Route path="cadets/:cadetId" element={
                    <ProtectedRoute module="cadets" requirePermission="sidebar">
                      <Suspense fallback={<PageLoader />}><MobileCadetDetail /></Suspense>
                    </ProtectedRoute>
                  } />
                  <Route path="budget" element={
                    <ProtectedRoute module="budget" requirePermission="sidebar">
                      <Suspense fallback={<PageLoader />}><MobileBudget /></Suspense>
                    </ProtectedRoute>
                  } />
                  <Route path="calendar" element={
                    <ProtectedRoute module="calendar" requirePermission="sidebar">
                      <Suspense fallback={<PageLoader />}><MobileCalendar /></Suspense>
                    </ProtectedRoute>
                  } />
                  <Route path="calendar/add" element={
                    <ProtectedRoute module="calendar" requirePermission="sidebar">
                      <Suspense fallback={<PageLoader />}><MobileAddEvent /></Suspense>
                    </ProtectedRoute>
                  } />
                  <Route path="incidents" element={
                    <ProtectedRoute module="incident_management" requirePermission="sidebar">
                      <Suspense fallback={<PageLoader />}><MobileIncidentReporting /></Suspense>
                    </ProtectedRoute>
                  } />
                  <Route path="more" element={<Suspense fallback={<PageLoader />}><MobileMore /></Suspense>} />
                  
                  {/* Mobile Competition Portal Routes */}
                  <Route path="competition-portal" element={<Suspense fallback={<PageLoader />}><MobileCompetitionPortalLayout><MobileCompetitionDashboard /></MobileCompetitionPortalLayout></Suspense>} />
                  <Route path="competition-portal/hosting" element={
                    <ProtectedRoute>
                      <Suspense fallback={<PageLoader />}><MobileCompetitionPortalLayout><MobileHostingCompetitions /></MobileCompetitionPortalLayout></Suspense>
                    </ProtectedRoute>
                  } />
                  <Route path="competition-portal/open" element={
                    <ProtectedRoute>
                      <Suspense fallback={<PageLoader />}><MobileCompetitionPortalLayout><MobileOpenCompetitions /></MobileCompetitionPortalLayout></Suspense>
                    </ProtectedRoute>
                  } />
                  <Route path="competition-portal/register" element={
                    <ProtectedRoute>
                      <Suspense fallback={<PageLoader />}><MobileCompetitionRegistration /></Suspense>
                    </ProtectedRoute>
                  } />
                  <Route path="competition-portal/my-competitions" element={
                    <ProtectedRoute>
                      <Suspense fallback={<PageLoader />}><MobileCompetitionPortalLayout><MobileMyCompetitions /></MobileCompetitionPortalLayout></Suspense>
                    </ProtectedRoute>
                  } />
                  <Route path="competition-portal/host" element={
                    <ProtectedRoute>
                      <Suspense fallback={<PageLoader />}><MobileHostCompetitionDetails /></Suspense>
                    </ProtectedRoute>
                  } />
                   <Route path="competition-portal/manage/:competitionId/events/:eventId/edit" element={
                     <ProtectedRoute>
                       <Suspense fallback={<PageLoader />}><MobileEditEvent /></Suspense>
                     </ProtectedRoute>
                   } />
                   <Route path="competition-portal/manage/:competitionId/events/add" element={
                     <ProtectedRoute>
                       <Suspense fallback={<PageLoader />}><MobileCompetitionAddEvent /></Suspense>
                     </ProtectedRoute>
                   } />
                   <Route path="competition-portal/manage/:competitionId/events" element={
                     <ProtectedRoute>
                       <Suspense fallback={<PageLoader />}><MobileHostEvents /></Suspense>
                     </ProtectedRoute>
                   } />
                    <Route path="competition-portal/manage/:competitionId/resources" element={
                      <ProtectedRoute>
                        <Suspense fallback={<PageLoader />}><MobileHostResources /></Suspense>
                      </ProtectedRoute>
                    } />
                    <Route path="competition-portal/manage/:competitionId/resource/add" element={
                      <ProtectedRoute>
                        <Suspense fallback={<PageLoader />}><MobileAddResource /></Suspense>
                      </ProtectedRoute>
                    } />
                    <Route path="competition-portal/manage/:competitionId/resource/:resourceId/edit" element={
                      <ProtectedRoute>
                        <Suspense fallback={<PageLoader />}><MobileEditResource /></Suspense>
                      </ProtectedRoute>
                    } />
                   <Route path="competition-portal/manage/:competitionId/schools" element={
                     <ProtectedRoute>
                       <Suspense fallback={<PageLoader />}><MobileHostSchools /></Suspense>
                     </ProtectedRoute>
                   } />
                   <Route path="competition-portal/manage/:competitionId/schools/add" element={
                     <ProtectedRoute>
                       <Suspense fallback={<PageLoader />}><MobileAddSchool /></Suspense>
                     </ProtectedRoute>
                   } />
                    <Route path="competition-portal/manage/:competitionId/schools/:schoolId/edit" element={
                      <ProtectedRoute>
                        <Suspense fallback={<PageLoader />}><MobileEditSchool /></Suspense>
                      </ProtectedRoute>
                    } />
                    <Route path="competition-portal/manage/:competitionId/schools/:schoolId/addschooleventscoresheet" element={
                      <ProtectedRoute>
                        <Suspense fallback={<PageLoader />}><MobileAddSchoolEventScoreSheet /></Suspense>
                      </ProtectedRoute>
                    } />
                   <Route path="competition-portal/manage/:competitionId/schedule" element={
                     <ProtectedRoute>
                       <Suspense fallback={<PageLoader />}><MobileHostSchedule /></Suspense>
                     </ProtectedRoute>
                   } />
                   <Route path="competition-portal/manage/:competitionId/schedule/edit/:eventId" element={
                     <ProtectedRoute>
                       <Suspense fallback={<PageLoader />}><MobileScheduleEdit /></Suspense>
                     </ProtectedRoute>
                   } />
                     <Route path="competition-portal/manage/:competitionId/results" element={
                       <ProtectedRoute>
                         <Suspense fallback={<PageLoader />}><MobileHostResults /></Suspense>
                       </ProtectedRoute>
                     } />
                     <Route path="competition-portal/manage/:competitionId/results/:eventName" element={
                       <ProtectedRoute>
                         <Suspense fallback={<PageLoader />}><MobileEventResultsView /></Suspense>
                       </ProtectedRoute>
                     } />
                    <Route path="competition-portal/manage/:competitionId" element={
                      <ProtectedRoute>
                        <Suspense fallback={<PageLoader />}><MobileManageCompetition /></Suspense>
                      </ProtectedRoute>
                    } />
                </Route>
              </Route>

              {/* Password Reset Route - Now inside AuthProvider */}
              <Route path="/reset-password" element={<Suspense fallback={<PageLoader />}><ResetPasswordPage /></Suspense>} />
              
              {/* Parent Registration Route */}
              <Route path="/parent-register" element={<Suspense fallback={<PageLoader />}><ParentRegistrationPage /></Suspense>} />
              
              {/* External Competition Registration Routes */}
              <Route path="/external/register" element={<Suspense fallback={<PageLoader />}><ExternalSchoolRegistration /></Suspense>} />

              {/* Redirect /app/login to /app/auth */}
              <Route path="/app/login" element={<Navigate to="/app/auth" replace />} />
              
              {/* Protected Application Routes */}
              <Route 
                path="/app/*" 
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <MainApplication />
                    </Suspense>
                  </ProtectedRoute>
                } 
              />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
            </BrowserRouter>
            </PortalProvider>
            </SidebarPreferencesProvider>
          </PermissionProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
