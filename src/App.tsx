
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
import { MobileIncidentReporting } from "@/components/mobile/pages/MobileIncidentReporting";
import { MobileMore } from "@/components/mobile/pages/MobileMore";
import { MobileRouteDetector } from "@/components/mobile/MobileRouteDetector";
import { MobileCreateTask } from "@/components/mobile/pages/MobileCreateTask";
import { MobileTaskDetail } from "@/components/mobile/pages/MobileTaskDetail";
import { MobileSubtaskDetail } from "@/components/mobile/pages/MobileSubtaskDetail";
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
                  <Route path="incidents" element={
                    <ProtectedRoute module="incident_management" requirePermission="sidebar">
                      <MobileIncidentReporting />
                    </ProtectedRoute>
                  } />
                  <Route path="more" element={<MobileMore />} />
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
