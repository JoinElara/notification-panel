import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import NotificationList from "@/pages/notifications/NotificationList";
import CreateNotification from "@/pages/notifications/CreateNotification";
import NotificationDetail from "@/pages/notifications/NotificationDetail";
import EditNotification from "@/pages/notifications/EditNotification";
import TemplateList from "@/pages/templates/TemplateList";
import SegmentEstimator from "@/pages/segments/SegmentEstimator";
import DeviceTokens from "@/pages/DeviceTokens";
import Automations from "@/pages/automations/Automations";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster richColors closeButton />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />

              <Route path="/dashboard" element={
                <ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>
              } />
              <Route path="/notifications" element={
                <ProtectedRoute><AppLayout><NotificationList /></AppLayout></ProtectedRoute>
              } />
              <Route path="/notifications/create" element={
                <ProtectedRoute><AppLayout><CreateNotification /></AppLayout></ProtectedRoute>
              } />
              <Route path="/notifications/:id/edit" element={
                <ProtectedRoute><AppLayout><EditNotification /></AppLayout></ProtectedRoute>
              } />
              <Route path="/notifications/:id" element={
                <ProtectedRoute><AppLayout><NotificationDetail /></AppLayout></ProtectedRoute>
              } />
              <Route path="/templates" element={
                <ProtectedRoute><AppLayout><TemplateList /></AppLayout></ProtectedRoute>
              } />
              <Route path="/segments" element={
                <ProtectedRoute><AppLayout><SegmentEstimator /></AppLayout></ProtectedRoute>
              } />
              <Route path="/device-tokens" element={
                <ProtectedRoute><AppLayout><DeviceTokens /></AppLayout></ProtectedRoute>
              } />
              <Route path="/automations" element={
                <ProtectedRoute><AppLayout><Automations /></AppLayout></ProtectedRoute>
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
