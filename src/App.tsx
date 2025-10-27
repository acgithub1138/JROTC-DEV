
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
const JudgesAuthPage = lazy(() => import("@/components/judges-portal/JudgesAuthPage").then(m => ({ default: m.JudgesAuthPage })));


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

              {/* Password Reset Route - Now inside AuthProvider */}
              <Route path="/reset-password" element={<Suspense fallback={<PageLoader />}><ResetPasswordPage /></Suspense>} />
              
              {/* Parent Registration Route */}
              <Route path="/parent-register" element={<Suspense fallback={<PageLoader />}><ParentRegistrationPage /></Suspense>} />
              
              {/* External Competition Registration Routes */}
              <Route path="/external/register" element={<Suspense fallback={<PageLoader />}><ExternalSchoolRegistration /></Suspense>} />

              {/* Judges Portal Auth Route - Public */}
              <Route path="/app/judges/auth" element={<Suspense fallback={<PageLoader />}><JudgesAuthPage /></Suspense>} />

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
