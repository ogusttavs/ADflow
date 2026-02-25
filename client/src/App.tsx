import { useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import ClientDetail from "./pages/ClientDetail";
import Campaigns from "./pages/Campaigns";
import CampaignDetail from "./pages/CampaignDetail";
import NewCampaign from "./pages/NewCampaign";
import Calendar from "./pages/Calendar";
import Agenda from "./pages/Agenda";
import WhatsApp from "./pages/WhatsApp";
import Settings from "./pages/Settings";
import Integrations from "./pages/Integrations";
import Notifications from "./pages/Notifications";
import CRM from "./pages/CRM";
import ABTests from "./pages/ABTests";
import Reports from "./pages/Reports";
import Performance from "./pages/Performance";
import UTMBuilder from "./pages/UTMBuilder";
import Budget from "./pages/Budget";
import Referrals from "./pages/Referrals";
import Routine from "./pages/Routine";
import Prospecting from "./pages/Prospecting";
import Financeiro from "./pages/Financeiro";
import IntakeForm from "./pages/IntakeForm";
import Diary from "./pages/Diary";
import Dreams from "./pages/Dreams";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import { FEATURE_FLAGS } from "./const";

function normalizeLocationPath(location: string) {
  const [pathPart, queryPart] = location.split("?");
  let normalizedPath = (pathPart || "/").replace(/\/{2,}/g, "/");
  if (!normalizedPath.startsWith("/")) {
    normalizedPath = `/${normalizedPath}`;
  }
  if (normalizedPath.length > 1) {
    normalizedPath = normalizedPath.replace(/\/+$/, "");
  }
  if (!queryPart) return normalizedPath;
  return `${normalizedPath}?${queryPart}`;
}

function PathNormalizer() {
  const [location, navigate] = useLocation();

  useEffect(() => {
    const normalized = normalizeLocationPath(location);
    if (normalized !== location) {
      navigate(normalized, { replace: true });
    }
  }, [location, navigate]);

  return null;
}

function Router() {
  return (
    <>
      <PathNormalizer />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/login" component={Login} />
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route path="/reset-password" component={ResetPassword} />
        <Route path="/verify-email" component={VerifyEmail} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/clients" component={Clients} />
        <Route path="/clients/:id" component={ClientDetail} />
        {FEATURE_FLAGS.campaigns && <Route path="/campaigns" component={Campaigns} />}
        {FEATURE_FLAGS.campaigns && <Route path="/campaigns/new" component={NewCampaign} />}
        {FEATURE_FLAGS.campaigns && <Route path="/campaigns/:id" component={CampaignDetail} />}
        <Route path="/calendar" component={Calendar} />
        <Route path="/agenda" component={Agenda} />
        <Route path="/whatsapp" component={WhatsApp} />
        <Route path="/integrations" component={Integrations} />
        <Route path="/settings" component={Settings} />
        <Route path="/notifications" component={Notifications} />
        <Route path="/crm" component={CRM} />
        <Route path="/ab-tests" component={ABTests} />
        <Route path="/reports" component={Reports} />
        <Route path="/performance" component={Performance} />
        <Route path="/utm" component={UTMBuilder} />
        <Route path="/budget" component={Budget} />
        <Route path="/referrals" component={Referrals} />
        <Route path="/routine" component={Routine} />
        <Route path="/prospecting" component={Prospecting} />
        <Route path="/financeiro" component={Financeiro} />
        <Route path="/intake/:token" component={IntakeForm} />
        <Route path="/diary" component={Diary} />
        <Route path="/dreams" component={Dreams} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" switchable>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
