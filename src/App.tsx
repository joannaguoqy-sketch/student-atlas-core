import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import Dashboard from "@/pages/Dashboard";
import CoursesPage from "@/pages/CoursesPage";
import SectionsPage from "@/pages/SectionsPage";
import AnalysisPage from "@/pages/AnalysisPage";
import StudentsPage from "@/pages/StudentsPage";
import StudentProfilePage from "@/pages/StudentProfilePage";
import ImportPage from "@/pages/ImportPage";
import ExportPage from "@/pages/ExportPage";
import SettingsPage from "@/pages/SettingsPage";
import DigitalPortraitPage from "@/pages/DigitalPortraitPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/courses" element={<CoursesPage />} />
            <Route path="/sections" element={<SectionsPage />} />
            <Route path="/analysis" element={<AnalysisPage />} />
            <Route path="/students" element={<StudentsPage />} />
            <Route path="/students/:id" element={<StudentProfilePage />} />
            <Route path="/students/:id/portrait" element={<DigitalPortraitPage />} />
            <Route path="/import" element={<ImportPage />} />
            <Route path="/export" element={<ExportPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
