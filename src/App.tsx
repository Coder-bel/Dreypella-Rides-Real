import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Layout from "./components/Layout";
import AdminRoute from "./components/AdminRoute";
import BikerRoute from "./components/BikerRoute";
import UserRoute from "./components/UserRoute";
import Index from "./pages/Index";
import BookRide from "./pages/BookRide";
import SendPackage from "./pages/SendPackage";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import Auth from "./pages/Auth";
import BikersLogin from "./pages/BikersLogin";
import BikersSignup from "./pages/BikersSignup";
import BikersDashboard from "./pages/BikersDashboard";
import AdminSignup from "./pages/AdminSignup";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Layout>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/book-ride" element={<UserRoute><BookRide /></UserRoute>} />
              <Route path="/send-package" element={<UserRoute><SendPackage /></UserRoute>} />
              <Route path="/dashboard" element={<UserRoute><Dashboard /></UserRoute>} />
              <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
              <Route path="/bikers-login" element={<BikersLogin />} />
              <Route path="/bikers-signup" element={<BikersSignup />} />
              <Route path="/bikers" element={<BikerRoute><BikersDashboard /></BikerRoute>} />
              <Route path="/admin-signup" element={<AdminSignup />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
