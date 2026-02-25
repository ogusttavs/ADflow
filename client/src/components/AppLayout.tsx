import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  LayoutDashboard,
  Users,
  Calendar,
  MessageSquare,
  Settings,
  Plug,
  Bell,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  Contact,
  FlaskConical,
  FileText,
  BarChart3,
  Link2,
  Wallet,
  Gift,
  Clock,
  TrendingUp,
  SlidersHorizontal,
  Eye,
  EyeOff,
  MoonStar,
  Sun,
  BookOpen,
  Star,
  MailCheck,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import { VoiceCommandButton } from "@/components/VoiceCommand";
import { DailyBriefingPopup } from "@/components/DailyBriefingPopup";
import { FEATURE_FLAGS } from "@/const";

const HIDDEN_KEY = "orbita_sidebar_hidden";

// To re-enable a "disabled" item, remove the `disabled: true` property.
type NavItem = {
  href: string;
  icon: LucideIcon;
  label: string;
  disabled?: boolean;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const ALL_NAV_SECTIONS: NavSection[] = [
  {
    title: "Visão Geral",
    items: [
      { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
      { href: "/clients", icon: Users, label: "Clientes" },
      // Campanhas: oculto até sistema de planos — { href: "/campaigns", icon: Megaphone, label: "Campanhas" },
    ],
  },
  {
    title: "Vida & Rotina",
    items: [
      { href: "/routine", icon: Clock, label: "Minha Rotina" },
      { href: "/agenda", icon: Calendar, label: "Agenda" },
      { href: "/diary", icon: BookOpen, label: "Diário" },
      { href: "/dreams", icon: Star, label: "Quadro dos Sonhos" },
    ],
  },
  {
    title: "Comercial",
    items: [
      { href: "/crm", icon: Contact, label: "CRM / Leads" },
      { href: "/prospecting", icon: TrendingUp, label: "Prospecção" },
      { href: "/referrals", icon: Gift, label: "Indicações", disabled: true },
    ],
  },
  {
    title: "Financeiro",
    items: [
      { href: "/financeiro", icon: Wallet, label: "Financeiro" },
      { href: "/performance", icon: BarChart3, label: "Performance", disabled: true },
      { href: "/ab-tests", icon: FlaskConical, label: "Testes A/B", disabled: true },
      { href: "/reports", icon: FileText, label: "Relatórios", disabled: true },
      { href: "/budget", icon: BarChart3, label: "Orçamento", disabled: true },
      { href: "/utm", icon: Link2, label: "UTM Builder", disabled: true },
    ],
  },
  {
    title: "Conta",
    items: [
      { href: "/whatsapp", icon: MessageSquare, label: "WhatsApp Bot", disabled: true },
      { href: "/integrations", icon: Plug, label: "Integrações", disabled: true },
      { href: "/settings", icon: Settings, label: "Configurações" },
    ],
  },
];

function loadHiddenItems(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(HIDDEN_KEY) ?? "[]"));
  } catch {
    return new Set();
  }
}

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [location, navigate] = useLocation();
  const { user, loading, isAuthenticated, logout } = useAuth();
  const utils = trpc.useUtils();
  const { theme, toggleTheme, switchable } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [showEmailVerificationPopup, setShowEmailVerificationPopup] = useState(false);
  const [hiddenItems, setHiddenItems] = useState<Set<string>>(loadHiddenItems);

  const { data: unreadCount } = trpc.notifications.unreadCount.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });
  const resendVerificationMutation = trpc.auth.resendVerification.useMutation({
    onSuccess: (result) => {
      if (result.alreadyVerified) {
        toast.success("Seu email já está verificado.");
        setShowEmailVerificationPopup(false);
        void utils.auth.me.invalidate();
        return;
      }
      toast.success("Enviamos um novo link de verificação para seu email.");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  const requiresEmailVerification = Boolean(user?.email) && !user?.emailVerified;

  useEffect(() => {
    if (!loading && !isAuthenticated) navigate("/login");
  }, [loading, isAuthenticated, navigate]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  useEffect(() => {
    if (requiresEmailVerification) {
      setShowEmailVerificationPopup(true);
      return;
    }
    setShowEmailVerificationPopup(false);
  }, [requiresEmailVerification, user?.id]);

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  const toggleHidden = (href: string) => {
    setHiddenItems((prev) => {
      const next = new Set(prev);
      if (next.has(href)) next.delete(href);
      else next.add(href);
      localStorage.setItem(HIDDEN_KEY, JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const visibleSections = ALL_NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => !item.disabled && !hiddenItems.has(item.href)),
  })).filter((section) => section.items.length > 0);

  const customizableItems = ALL_NAV_SECTIONS.flatMap((section) =>
    section.items.filter((item) => !item.disabled).map((item) => ({ ...item, section: section.title }))
  );

  const currentNav = ALL_NAV_SECTIONS.flatMap((section) => section.items).find(
    (item) => location === item.href || (item.href !== "/dashboard" && location.startsWith(item.href))
  );

  const currentPage = currentNav?.label ?? "Dashboard";

  const currentSection =
    ALL_NAV_SECTIONS.find((section) =>
      section.items.some(
        (item) => location === item.href || (item.href !== "/dashboard" && location.startsWith(item.href))
      )
    )?.title ?? "Visão Geral";

  const todayLabel = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });

  const renderThemeToggle = (compact = false) => {
    if (!switchable) return null;

    const isLight = theme === "light";
    return (
      <Button
        variant="outline"
        size={compact ? "icon" : "sm"}
        onClick={() => toggleTheme?.()}
        className={compact ? "h-9 w-9" : "h-9 gap-2"}
      >
        {isLight ? <MoonStar className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        {!compact && <span>{isLight ? "Modo escuro" : "Modo claro"}</span>}
      </Button>
    );
  };

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      <div
        className={`relative flex items-center gap-3 border-b border-sidebar-border/80 px-4 py-5 ${
          collapsed && !mobile ? "justify-center" : ""
        }`}
      >
        <div className="absolute inset-x-4 bottom-0 h-px bg-gradient-to-r from-transparent via-sidebar-border to-transparent" />
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 ring-1 ring-primary/30 shadow-sm shadow-primary/20 flex items-center justify-center shrink-0">
          <img src="/logo-icon.svg" className="h-5 w-5 brightness-0 invert" alt="" />
        </div>
        {(!collapsed || mobile) && (
          <div className="min-w-0">
            <p className="truncate font-['Space_Grotesk'] text-lg font-bold leading-none text-sidebar-foreground">Orbita</p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-sidebar-foreground/55">Tudo na sua órbita</p>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {visibleSections.map((section) => (
          <div key={section.title}>
            {(!collapsed || mobile) && (
              <p className="px-2.5 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-sidebar-foreground/45">
                {section.title}
              </p>
            )}
            <div className="space-y-1">
              {section.items.map(({ href, icon: Icon, label }) => {
                const isActive = location === href || (href !== "/dashboard" && location.startsWith(href));

                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-150 ${
                      isActive
                        ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm shadow-primary/20"
                        : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    } ${collapsed && !mobile ? "justify-center" : ""}`}
                  >
                    <span
                      className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                        isActive
                          ? "bg-sidebar-primary-foreground/15"
                          : "bg-sidebar-accent/70 text-sidebar-foreground/80 group-hover:bg-sidebar-accent"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    {(!collapsed || mobile) && <span className="text-sm font-medium truncate">{label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border px-3 py-4 space-y-1.5">
        <Link
          href="/notifications"
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${
            collapsed && !mobile ? "justify-center" : ""
          }`}
        >
          <div className="relative h-7 w-7 rounded-lg bg-sidebar-accent/70 flex items-center justify-center">
            <Bell className="h-4 w-4" />
            {(unreadCount ?? 0) > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
                {unreadCount}
              </span>
            )}
          </div>
          {(!collapsed || mobile) && <span className="text-sm font-medium">Notificações</span>}
        </Link>

        <button
          onClick={() => setShowCustomize(true)}
          className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground/62 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${
            collapsed && !mobile ? "justify-center" : ""
          }`}
        >
          <span className="h-7 w-7 rounded-lg bg-sidebar-accent/70 flex items-center justify-center shrink-0">
            <SlidersHorizontal className="h-4 w-4" />
          </span>
          {(!collapsed || mobile) && <span className="text-sm font-medium">Personalizar menu</span>}
        </button>

        {(!collapsed || mobile) ? (
          <div className="mt-2 rounded-xl border border-sidebar-border/80 bg-sidebar-accent/60 p-2.5">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-primary/18 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-primary">{user?.name?.charAt(0)?.toUpperCase() ?? "U"}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-sidebar-foreground">{user?.name ?? "Usuário"}</p>
                <p className="truncate text-[11px] text-sidebar-foreground/55">{user?.email ?? ""}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-sidebar-foreground/65 hover:text-sidebar-foreground"
                onClick={() => { void logout(); }}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="mx-auto h-8 w-8 text-sidebar-foreground/65 hover:text-sidebar-foreground"
            onClick={() => { void logout(); }}
            title="Sair"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        )}
      </div>
    </>
  );

  return (
    <div className="flex min-h-[100dvh] bg-background overflow-hidden">
      <DailyBriefingPopup />

      <Dialog open={showEmailVerificationPopup} onOpenChange={setShowEmailVerificationPopup}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MailCheck className="h-4 w-4" />
              Verifique seu email
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              Para aumentar a segurança da sua conta, confirme seu email.
            </p>
            <p className="font-medium break-all">{user?.email}</p>
            <div className="pt-2 space-y-2">
              <Button
                className="w-full"
                onClick={() => resendVerificationMutation.mutate()}
                disabled={resendVerificationMutation.isPending}
              >
                {resendVerificationMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Reenviar email de verificação"
                )}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  void utils.auth.me.invalidate();
                }}
              >
                Já confirmei meu email
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => setShowEmailVerificationPopup(false)}
              >
                Continuar sem verificar agora
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showCustomize} onOpenChange={setShowCustomize}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Personalizar Menu
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-96 space-y-1 overflow-y-auto">
            {customizableItems.map((item) => {
              const isHidden = hiddenItems.has(item.href);
              const Icon = item.icon;
              return (
                <button
                  key={item.href}
                  onClick={() => toggleHidden(item.href)}
                  className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/65"
                >
                  <Icon className={`h-4 w-4 shrink-0 ${isHidden ? "text-muted-foreground/45" : "text-foreground"}`} />
                  <div className="min-w-0 flex-1 text-left">
                    <p className={`truncate text-sm font-medium ${isHidden ? "text-muted-foreground/45 line-through" : ""}`}>
                      {item.label}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{item.section}</p>
                  </div>
                  {isHidden ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground/45" />
                  ) : (
                    <Eye className="h-4 w-4 text-primary/75" />
                  )}
                </button>
              );
            })}
          </div>
          <p className="pt-1 text-[10px] text-muted-foreground">
            Clique em um item para mostrar ou ocultar na barra lateral.
          </p>
        </DialogContent>
      </Dialog>

      <aside
        className={`hidden md:relative md:flex md:flex-col border-r border-sidebar-border/85 bg-sidebar/88 backdrop-blur-xl z-20 transition-[width] duration-300 ${
          collapsed ? "w-[5.25rem]" : "w-[17rem]"
        }`}
      >
        <SidebarContent />
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="absolute -right-3 top-20 h-8 w-6 rounded-full border border-sidebar-border bg-sidebar text-sidebar-foreground/75 shadow-sm transition-colors hover:text-sidebar-foreground"
          title={collapsed ? "Expandir menu" : "Recolher menu"}
        >
          {collapsed ? <ChevronRight className="mx-auto h-3.5 w-3.5" /> : <ChevronLeft className="mx-auto h-3.5 w-3.5" />}
        </button>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-[1.5px]" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-[86vw] max-w-[22rem] border-r border-sidebar-border bg-sidebar/98 shadow-2xl">
            <div className="h-full flex flex-col">
              <SidebarContent mobile />
            </div>
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="md:hidden sticky top-0 z-30 border-b border-border/80 bg-card/92 backdrop-blur-xl">
          <div className="flex items-center gap-2.5 px-3.5 py-3">
            <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <div className="min-w-0 flex-1 flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shrink-0">
                <img src="/logo-icon.svg" className="h-4 w-4 brightness-0 invert" alt="" />
              </div>
              <div className="min-w-0">
                <p className="truncate font-['Space_Grotesk'] text-base font-bold leading-none">{currentPage}</p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{currentSection}</p>
              </div>
            </div>
            {renderThemeToggle(true)}
            {FEATURE_FLAGS.voiceAssistant && <VoiceCommandButton />}
          </div>
        </header>

        <div className="hidden md:flex sticky top-0 z-20 items-center justify-between gap-4 border-b border-border/85 bg-card/85 px-6 py-3.5 backdrop-blur-xl">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{currentSection}</p>
            <h2 className="truncate font-['Space_Grotesk'] text-xl font-bold leading-tight">{currentPage}</h2>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="hidden lg:block text-right">
              <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Hoje</p>
              <p className="text-sm font-medium capitalize">{todayLabel}</p>
            </div>
            {renderThemeToggle()}
            {FEATURE_FLAGS.voiceAssistant && <VoiceCommandButton />}
          </div>
        </div>

        <main className="flex-1 overflow-y-auto">
          <div className="min-h-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
