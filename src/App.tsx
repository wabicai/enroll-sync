import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Students from "./pages/Students";
import Exams from "./pages/Exams";
import Rewards from "./pages/Rewards";
import NotFound from "./pages/NotFound";
import AuthLogin from "./pages/AuthLogin";
import AuthRegister from "./pages/AuthRegister";
import Approvals from "./pages/Approvals";
import Courses from "./pages/Courses";
import Schedules from "./pages/Schedules";
import { useAppStore } from "@/store/useAppStore";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import Exports from "./pages/Exports";
import Assessments from "./pages/Assessments";

import RequireAuth from "./components/auth/RequireAuth";

const Protected = ({ children }: { children: JSX.Element }) => (
  <RequireAuth>{children}</RequireAuth>
);

const queryClient = new QueryClient();

const App = () => {
  const { setUser, isAuthenticated } = useAppStore();

  // 模拟登录状态，实际项目中应该从后端验证
  React.useEffect(() => {
    // 不再在应用启动时强行模拟登录
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<AuthLogin />} />
            <Route path="/register" element={<AuthRegister />} />
            <Route path="/" element={<AppLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="approvals" element={<Protected><Approvals /></Protected>} />
              <Route path="users" element={<Protected><Users /></Protected>} />
              <Route path="students" element={<Protected><Students /></Protected>} />
              <Route path="courses" element={<Protected><Courses /></Protected>} />
              <Route path="schedules" element={<Protected><Schedules /></Protected>} />
              <Route path="exams" element={<Protected><Exams /></Protected>} />
              <Route path="rewards" element={<Protected><Rewards /></Protected>} />
              <Route path="assessments" element={<Protected><Assessments /></Protected>} />
              <Route path="notifications" element={<Protected><Notifications /></Protected>} />
              <Route path="settings" element={<Protected><Settings /></Protected>} />
              <Route path="exports" element={<Protected><Exports /></Protected>} />
              { /* 财务页已移除 */ }
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
