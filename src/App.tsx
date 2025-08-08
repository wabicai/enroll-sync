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
import { useAppStore } from "@/store/useAppStore";
import { mockUsers } from "@/mock";

const queryClient = new QueryClient();

const App = () => {
  const { setUser, isAuthenticated } = useAppStore();

  // 模拟登录状态，实际项目中应该从后端验证
  React.useEffect(() => {
    if (!isAuthenticated) {
      // 模拟登录用户为总经理
      setUser(mockUsers[0]);
    }
  }, [setUser, isAuthenticated]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AppLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="users" element={<Users />} />
              <Route path="students" element={<Students />} />
              <Route path="exams" element={<Exams />} />
              <Route path="rewards" element={<Rewards />} />
              <Route path="assessments" element={<div>考核管理页面</div>} />
              <Route path="settings" element={<div>系统设置页面</div>} />
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
