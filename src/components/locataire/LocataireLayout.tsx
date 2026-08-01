import { useState, useEffect } from "react";
import { Link, NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  Building2,
  House,
  LayoutDashboard,
  LogOut,
  User,
  ArrowUpRight,
  Search,
  TrendingUp,
  UserCog,
  History,
  FileText,
  ClipboardList,
  PanelLeft,
  PanelLeftClose,
} from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useLocataireAuth } from "@/context/LocataireAuthContext";
import { socketService, SOCKET_EVENTS, type NotificationPayload } from "@/services/socketService";
import { useIsMobile } from "@/hooks/useIsMobile";
import { MobileHeader } from "@/components/ui/MobileHeader";
import { MobileDrawer } from "@/components/ui/MobileDrawer";
import { BottomNav, type BottomNavItem } from "@/components/ui/BottomNav";
import { NotificationPanel } from "@/components/ui/NotificationPanel";
import { useLocataireNotifications, useMarkLocataireNotificationsRead } from "@/hooks/useNotificationInApp";

const LOCATAIRE_BOTTOM_NAV: BottomNavItem[] = [
  { to: "/locataire/dashboard",         label: "Mon espace",    icon: LayoutDashboard },
  { to: "/locataire/paiements",         label: "Paiements",     icon: TrendingUp },
  { to: "/locataire/etats-des-lieux",   label: "États des lieux", icon: ClipboardList },
  { to: "/locataire/documents",         label: "Documents",     icon: FileText },
  { to: "/locataire/profil",            label: "Profil",        icon: User },
];

// ─── Navigation ───────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { to: "/locataire/dashboard",         label: "Mon espace",         icon: LayoutDashboard },
  { to: "/locataire/paiements",         label: "Mes paiements",      icon: TrendingUp },
  { to: "/locataire/etats-des-lieux",   label: "États des lieux",    icon: ClipboardList },
  { to: "/locataire/historique",        label: "Mes logements",      icon: History },
  { to: "/locataire/documents",         label: "Documents",          icon: FileText },
  { to: "/locataire/proprietaire",      label: "Mon propriétaire",   icon: UserCog },
];

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({ isOpen }: { isOpen: boolean }) {
  const { locataire, logout } = useLocataireAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/locataire/login", { replace: true });
  };

  const initiales =
    `${locataire?.prenom?.[0] ?? ""}${locataire?.nom?.[0] ?? ""}`.toUpperCase() || "L";

  return (
    <aside className={`fixed top-0 left-0 h-screen bg-white border-r border-slate-100 flex flex-col z-40 transition-all duration-300 ${
      isOpen ? "w-60" : "w-16"
    }`}>

      {/* Logo */}
      <div className={`h-16 flex items-center border-b border-slate-100 flex-shrink-0 ${
        isOpen ? "px-5" : "px-3 justify-center"
      }`}>
        <Link to="/locataire/dashboard" className={`flex items-center gap-2.5 ${
          isOpen ? "" : "justify-center"
        }`}>
          <div className="w-8 h-8 rounded-lg bg-[#D4A843] flex items-center justify-center flex-shrink-0">
            <House className="w-4 h-4 text-white" />
          </div>
          {isOpen && (
            <div>
              <span className="font-display font-bold text-[#0C1A35] text-base tracking-wide leading-none">
                Seek
              </span>
              <span className="block text-[10px] text-slate-400 leading-none mt-0.5 font-medium tracking-wide">
                Locataires
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className={`flex-1 overflow-y-auto py-4 ${isOpen ? "px-3" : "px-1"}`}>
        <ul className="space-y-0.5">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                  transition-colors duration-150 ${
                    isActive
                      ? "bg-[#D4A843] text-white shadow-sm shadow-[#D4A843]/30"
                      : "text-slate-500 hover:bg-slate-50 hover:text-[#0C1A35]"
                  }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {isOpen && label}
              </NavLink>
            </li>
          ))}

          {/* Mon profil */}
          <li>
            <NavLink
              to="/locataire/profil"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                transition-colors duration-150 ${
                  isActive
                    ? "bg-[#D4A843] text-white shadow-sm shadow-[#D4A843]/30"
                    : "text-slate-500 hover:bg-slate-50 hover:text-[#0C1A35]"
                }`}
            >
              <User className="w-4 h-4 flex-shrink-0" />
              {isOpen && "Mon profil"}
            </NavLink>
          </li>
        </ul>
      </nav>

      {/* Profil + déconnexion */}
      <div className={`border-t border-slate-100 p-4 flex-shrink-0 ${
        isOpen ? "" : "p-2"
      }`}>
        <div className={`flex items-center gap-3 mb-3 ${
          isOpen ? "" : "justify-center"
        }`}>
          <div className="w-8 h-8 rounded-full bg-[#0C1A35] flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-semibold">{initiales}</span>
          </div>
          {isOpen && (
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#0C1A35] truncate">
                {locataire?.prenom} {locataire?.nom}
              </p>
              <p className="text-[10px] text-slate-400 font-medium">Locataire</p>
            </div>
          )}
        </div>
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium
            text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors ${
              isOpen ? "" : "justify-center px-2"
            }`}
        >
          <LogOut className="w-3.5 h-3.5 flex-shrink-0" />
          {isOpen && "Déconnexion"}
        </button>
      </div>
    </aside>
  );
}

// ─── Topbar avec cloche de notifications ──────────────────────────────────────

function Topbar({ sidebarOpen, onToggleSidebar }: { sidebarOpen: boolean; onToggleSidebar: () => void }) {
  const { data } = useLocataireNotifications();
  const { mutate: markRead } = useMarkLocataireNotificationsRead();
  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  return (
    <header className={`fixed top-0 h-16 bg-white border-b border-slate-100
      flex items-center justify-between px-6 z-30 transition-all duration-300 ${
        sidebarOpen ? "left-60" : "left-16"
      } right-0`}>
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-[#0C1A35] transition-colors"
          aria-label={sidebarOpen ? "Masquer le sidebar" : "Afficher le sidebar"}
        >
          {sidebarOpen ? (
            <PanelLeftClose className="w-5 h-5" />
          ) : (
            <PanelLeft className="w-5 h-5" />
          )}
        </button>
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
          <input
            type="text"
            placeholder="Rechercher..."
            className="w-full h-9 pl-9 pr-3 rounded-xl bg-slate-50 border border-slate-200
              text-sm text-slate-700 placeholder:text-slate-300 outline-none
              focus:border-slate-300 focus:bg-white transition-all"
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <NotificationPanel
          role="locataire"
          notifications={notifications}
          unreadCount={unreadCount}
          onMarkAllRead={() => markRead()}
          allNotificationsPath="/locataire/notifications"
        />
        <Link
          to="/"
          className="flex items-center gap-1.5 text-sm font-medium text-slate-500
            hover:text-[#0C1A35] transition-colors"
        >
          Retour au site
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>
    </header>
  );
}

// ─── Hook temps réel locataire ────────────────────────────────────────────────

function useLocataireRealtime(locataireId?: string) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!locataireId) return;

    const unsubNotif = socketService.on(SOCKET_EVENTS.NOTIFICATION_NEW, (data: NotificationPayload) => {
      if (data.locataireId && data.locataireId !== locataireId) return;
      if (data.type !== "CONFIRMATION_PAIEMENT") {
        toast.info(data.titre);
      }
      qc.invalidateQueries({ queryKey: ["locataire-messages"] });
      qc.invalidateQueries({ queryKey: ["locataire-notifications"] });
    });

    const unsubBailUpdated = socketService.on(SOCKET_EVENTS.BAIL_UPDATED, (data) => {
      qc.invalidateQueries({ queryKey: ["bail", data.bienId] });
      qc.invalidateQueries({ queryKey: ["echeancier"] });
      qc.invalidateQueries({ queryKey: ["locataire-echeancier"] });
      qc.invalidateQueries({ queryKey: ["locataire-notifications"] });
    });

    return () => {
      unsubNotif();
      unsubBailUpdated();
    };
  }, [qc, locataireId]);
}

// ─── Drawer mobile locataire ──────────────────────────────────────────────────

function LocataireMobileNav({ onClose }: { onClose: () => void }) {
  const { locataire, logout } = useLocataireAuth();
  const navigate = useNavigate();

  const initiales =
    `${locataire?.prenom?.[0] ?? ""}${locataire?.nom?.[0] ?? ""}`.toUpperCase() || "L";

  const handleLogout = async () => {
    await logout();
    navigate("/locataire/login", { replace: true });
  };

  const linkClass = (isActive: boolean) =>
    `flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium min-h-[44px]
    transition-colors duration-150 ${
      isActive
        ? "bg-[#D4A843] text-white shadow-sm shadow-[#D4A843]/30"
        : "text-slate-600 hover:bg-slate-50 active:bg-slate-100"
    }`;

  return (
    <ul className="space-y-1">
      {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
        <li key={to}>
          <NavLink to={to} onClick={onClose} className={({ isActive }) => linkClass(isActive)}>
            <Icon className="w-5 h-5 flex-shrink-0" />
            {label}
          </NavLink>
        </li>
      ))}

      {/* Mon profil */}
      <li>
        <NavLink to="/locataire/profil" onClick={onClose} className={({ isActive }) => linkClass(isActive)}>
          <User className="w-5 h-5 flex-shrink-0" />
          Mon profil
        </NavLink>
      </li>

      {/* Notifications */}
      <li>
        <NavLink to="/locataire/notifications" onClick={onClose} className={({ isActive }) => linkClass(isActive)}>
          <span className="w-5 h-5 flex-shrink-0 flex items-center justify-center text-base">🔔</span>
          Notifications
        </NavLink>
      </li>

      {/* Déconnexion */}
      <li className="pt-4 border-t border-slate-100 mt-4">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-[#0C1A35] flex items-center justify-center">
            <span className="text-white text-xs font-semibold">{initiales}</span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-[#0C1A35] truncate">
              {locataire?.prenom} {locataire?.nom}
            </p>
            <p className="text-[10px] text-slate-400 font-medium">Locataire</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-3 rounded-xl text-sm font-medium min-h-[44px]
            text-red-500 hover:bg-red-50 active:bg-red-100 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Déconnexion
        </button>
      </li>
    </ul>
  );
}

// ─── Layout principal ─────────────────────────────────────────────────────────

export default function LocataireLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isMobile = useIsMobile();
  const { locataire } = useLocataireAuth();
  useLocataireRealtime(locataire?.id);

  const location = useLocation();
  useEffect(() => { setDrawerOpen(false); }, [location.pathname]);

  if (isMobile) {
    return (
      <div className="min-h-screen bg-[#F8F5EE] overflow-x-clip">
        <MobileHeader onMenuOpen={() => setDrawerOpen(true)} homePath="/locataire/dashboard" />
        <MobileDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          roleLabel="Locataires"
          homePath="/locataire/dashboard"
        >
          <LocataireMobileNav onClose={() => setDrawerOpen(false)} />
        </MobileDrawer>
        <main className="pt-20 pb-24 px-4 overflow-x-clip">
          <Outlet />
        </main>
        <BottomNav items={LOCATAIRE_BOTTOM_NAV} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F5EE] overflow-x-clip">
      <Sidebar isOpen={sidebarOpen} />
      <Topbar sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className={`pt-16 overflow-x-clip transition-all duration-300 ${
        sidebarOpen ? "ml-60" : "ml-16"
      }`}>
        <main className="p-6 overflow-x-clip">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
