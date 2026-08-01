import React, { Suspense, useEffect, useRef } from "react";
import { Outlet } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import GlobalFloatingActions from "@/components/layout/GlobalFloatingActions";
import FeedbackWidget from "@/components/layout/FeedbackWidget";
import { AuthProvider } from "@/context/AuthContext";
import { OwnerAuthProvider } from "@/context/OwnerAuthContext";
import { LocataireAuthProvider } from "@/context/LocataireAuthContext";
import { ComptePublicAuthProvider } from "@/context/ComptePublicAuthContext";
import { FavorisAuthModalProvider } from "@/context/FavorisAuthModalContext";
import { ComparisonProvider } from "@/context/ComparisonContext";
import ComparisonBar from "@/components/comparison/ComparisonBar";
import { SocketProvider } from "@/context/SocketContext";
import { useComptePublicAuth } from "@/context/ComptePublicAuthContext";
import ProtectedRoute from "@/components/admin/ProtectedRoute";
import PageTitle from "@/components/PageTitle";
import GuestRoute from "@/components/admin/GuestRoute";
import AdminLayout from "@/components/admin/AdminLayout";
import OwnerGuestRoute from "@/components/owner/OwnerGuestRoute";
import OwnerProtectedRoute from "@/components/owner/OwnerProtectedRoute";
import OwnerLayout from "@/components/owner/OwnerLayout";
import { useOwnerAuth } from "@/context/OwnerAuthContext";
import LocataireGuestRoute from "@/components/locataire/LocataireGuestRoute";
import LocataireProtectedRoute from "@/components/locataire/LocataireProtectedRoute";
import LocataireLayout from "@/components/locataire/LocataireLayout";
import { useLocataireAuth } from "@/context/LocataireAuthContext";

// Lazy-loaded pages — chaque page est chargée à la demande
const Index = React.lazy(() => import("./pages/Index"));
const Proprietaires = React.lazy(() => import("./pages/Proprietaires"));
const PublicAnnonceDetail = React.lazy(() => import("./pages/public/AnnonceDetail"));
const RecherchePage = React.lazy(() => import("./pages/public/Recherche"));
const OwnerRegister = React.lazy(() => import("./pages/owner/Register"));
const OwnerLogin = React.lazy(() => import("./pages/owner/Login"));
const VerifyOwnerPhone = React.lazy(() => import("./pages/owner/VerifyPhone"));
const OwnerDashboard = React.lazy(() => import("./pages/owner/Dashboard"));
const OwnerVerification = React.lazy(() => import("./pages/owner/Verification"));
const HistoriquePaiements = React.lazy(() => import("./pages/owner/HistoriquePaiements"));
const Profile = React.lazy(() => import("./pages/owner/Profile"));
const BiensList = React.lazy(() => import("./pages/owner/biens/BiensList"));
const AddBien = React.lazy(() => import("./pages/owner/biens/AddBien"));
const BienDetail = React.lazy(() => import("./pages/owner/biens/BienDetail"));
const PaiementsPage = React.lazy(() => import("./pages/owner/biens/PaiementsPage"));
const AdminLogin = React.lazy(() => import("./pages/admin/Login"));
const AdminDashboard = React.lazy(() => import("./pages/admin/Dashboard"));
const AdminProfile = React.lazy(() => import("./pages/admin/Profile"));
const TypesLogement = React.lazy(() => import("./pages/admin/categories/TypesLogement"));
const TypesTransaction = React.lazy(() => import("./pages/admin/categories/TypesTransaction"));
const StatutsBien = React.lazy(() => import("./pages/admin/categories/StatutsBien"));
const MeubleEquipement = React.lazy(() => import("./pages/admin/categories/MeubleEquipement"));
const Annonces = React.lazy(() => import("./pages/admin/Annonces"));
const AdminAnnonceDetail = React.lazy(() => import("./pages/admin/AnnonceDetail"));
const AdminVerificationsPage = React.lazy(() => import("./pages/admin/Verifications"));
const ProprietairesStats = React.lazy(() => import("./pages/admin/ProprietairesStats"));
const PaysPage = React.lazy(() => import("./pages/admin/geo/PaysPage"));
const VillesPage = React.lazy(() => import("./pages/admin/geo/VillesPage"));
const QuartiersPage = React.lazy(() => import("./pages/admin/geo/QuartiersPage"));
const SuspensionsPage = React.lazy(() => import("./pages/admin/Suspensions"));
const UtilisateursPage = React.lazy(() => import("./pages/admin/Utilisateurs"));
const LocatairesList = React.lazy(() => import("./pages/owner/locataires/LocatairesList"));
const AddLocataire = React.lazy(() => import("./pages/owner/locataires/AddLocataire"));
const LocataireDetail = React.lazy(() => import("./pages/owner/locataires/LocataireDetail"));
const LocataireActivate = React.lazy(() => import("./pages/locataire/Activate"));
const LocataireLogin = React.lazy(() => import("./pages/locataire/Login"));
const LocataireForgotPassword = React.lazy(() => import("./pages/locataire/ForgotPassword"));
const LocataireResetPassword = React.lazy(() => import("./pages/locataire/ResetPassword"));
const LocataireDashboard = React.lazy(() => import("./pages/locataire/Dashboard"));
const LocataireProfil = React.lazy(() => import("./pages/locataire/Profil"));
const PaiementsLocatairePage = React.lazy(() => import("./pages/locataire/PaiementsLocatairePage"));
const ProprietaireLocatairePage = React.lazy(() => import("./pages/locataire/Proprietaire"));
const HistoriqueLogement = React.lazy(() => import("./pages/locataire/HistoriqueLogement"));
const DocumentsBien = React.lazy(() => import("./pages/locataire/DocumentsBien"));
const OwnerForgotPassword = React.lazy(() => import("./pages/owner/ForgotPassword"));
const OwnerResetPassword = React.lazy(() => import("./pages/owner/ResetPassword"));
const AdminTransactions = React.lazy(() => import("./pages/admin/TransactionsAdmin"));
const AdminPromotions = React.lazy(() => import("./pages/admin/PromotionsAdmin"));
const AdminFormulesPremium = React.lazy(() => import("./pages/admin/FormulesPremium"));
const AdminLocataireDocuments = React.lazy(() => import("./pages/admin/LocataireDocuments"));
const ModelesContratPage = React.lazy(() => import("./pages/admin/contrats/ModelesContratPage"));
const FavorisPage = React.lazy(() => import("./pages/public/Favoris"));
const ComparaisonPage = React.lazy(() => import("./pages/public/ComparaisonPage"));
const MonComptePage = React.lazy(() => import("./pages/public/MonCompte"));
const ConfigMonetisationPage = React.lazy(() => import("./pages/admin/monetisation/ConfigMonetisationPage"));
const ConfigSitePage = React.lazy(() => import("./pages/admin/parametres/ConfigSitePage"));
const LoyersEnRetardPage = React.lazy(() => import("./pages/owner/LoyersEnRetardPage"));
const SignalementsAdmin = React.lazy(() => import("./pages/admin/SignalementsAdmin"));
const EtatDesLieuxList = React.lazy(() => import("./pages/owner/etats-des-lieux/EtatDesLieuxList"));
const EtatDesLieuxForm = React.lazy(() => import("./pages/owner/etats-des-lieux/EtatDesLieuxForm"));
const EtatDesLieuxComparison = React.lazy(() => import("./pages/owner/etats-des-lieux/EtatDesLieuxComparison"));
const EtatDesLieuxReview = React.lazy(() => import("./pages/locataire/etats-des-lieux/EtatDesLieuxReview"));
const EtatsDesLieuxListLocataire = React.lazy(() => import("./pages/locataire/etats-des-lieux/EtatsDesLieuxList"));
const OwnerNotificationsPage = React.lazy(() => import("./pages/owner/NotificationsPage"));
const LocataireNotificationsPage = React.lazy(() => import("./pages/locataire/NotificationsPage"));
const AdminNotificationsPage = React.lazy(() => import("./pages/admin/NotificationsPage"));
const TemoignagesAdminPage = React.lazy(() => import("./pages/admin/TemoignagesAdmin"));
const FeedbacksAdminPage = React.lazy(() => import("./pages/admin/FeedbacksAdmin"));
const PagesLegalesAdminPage = React.lazy(() => import("./pages/admin/parametres/PagesLegalesAdmin"));
const PageLegalePage = React.lazy(() => import("./pages/public/PageLegale"));
const AProposPage = React.lazy(() => import("./pages/public/APropos"));
const CategoriesChampPage = React.lazy(() => import("./pages/admin/champs/CategoriesChampPage"));
const ChampsPage = React.lazy(() => import("./pages/admin/champs/ChampsPage"));
const TypeLogementChampsPage = React.lazy(() => import("./pages/admin/categories/TypeLogementChampsPage"));

const queryClient = new QueryClient();

const AuthSessionBridge = () => {
  const { isAuthenticated: isOwnerAuth, isLoading: isOwnerLoading } = useOwnerAuth();
  const { isAuthenticated: isLocataireAuth, isLoading: isLocataireLoading } = useLocataireAuth();
  const {
    isAuthenticated: isPublicAuth,
    isLoading: isPublicLoading,
    refreshMe: refreshPublicAccount,
  } = useComptePublicAuth();
  const isSyncingRef = useRef(false);

  useEffect(() => {
    const hasPrivateSession = isOwnerAuth || isLocataireAuth;
    const privateAuthReady = !isOwnerLoading && !isLocataireLoading;

    if (!privateAuthReady || !hasPrivateSession || isPublicAuth || isPublicLoading || isSyncingRef.current) {
      return;
    }

    isSyncingRef.current = true;

    void refreshPublicAccount().finally(() => {
      isSyncingRef.current = false;
    });
  }, [
    isLocataireAuth,
    isLocataireLoading,
    isOwnerAuth,
    isOwnerLoading,
    isPublicAuth,
    isPublicLoading,
    refreshPublicAccount,
  ]);

  return null;
};

// Layout pour les pages publiques avec Navbar + Footer
const PublicLayout = () => {
  const location = useLocation();
  const isHome = location.pathname === "/";
  return (
    <div className="overflow-x-clip relative">
      <Navbar />
      <main className={`min-h-screen ${isHome ? "" : "pt-16"}`}>
        <Outlet />
      </main>
      <Footer />
      <GlobalFloatingActions />
      <FeedbackWidget />
      <ComparisonBar />
    </div>
  );
};

const App = () => (
  <HelmetProvider>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SocketProvider>
        <AuthProvider>
          <ComptePublicAuthProvider>
          <FavorisAuthModalProvider>
          <ComparisonProvider>
          <OwnerAuthProvider>
            <LocataireAuthProvider>
              <AuthSessionBridge />
              <PageTitle />
              <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}>
              <Routes>
                {/* Routes publiques */}
                <Route element={<PublicLayout />}>
                  <Route path="/" element={<Index />} />
                  <Route path="/annonces" element={<RecherchePage />} />
                  <Route path="/recherche" element={<RecherchePage />} />
                  <Route path="/annonce/:id" element={<PublicAnnonceDetail />} />
                  <Route path="/favoris" element={<FavorisPage />} />
                  <Route path="/mon-compte" element={<MonComptePage />} />
                  <Route path="/comparaison" element={<ComparaisonPage />} />
                  <Route path="/politique-confidentialite" element={<PageLegalePage />} />
                  <Route path="/conditions-utilisation" element={<PageLegalePage />} />
                  <Route path="/conformite-donnees" element={<PageLegalePage />} />
                  <Route path="/a-propos" element={<AProposPage />} />
                </Route>

                {/* Espace propriétaires - landing */}
                <Route path="/proprietaires" element={<Proprietaires />} />

                {/* Owner - inaccessible si déjà connecté */}
                <Route element={<OwnerGuestRoute />}>
                  <Route path="/owner/register" element={<OwnerRegister />} />
                  <Route path="/owner/login" element={<OwnerLogin />} />
                </Route>

                <Route path="/owner/verify-phone" element={<VerifyOwnerPhone />} />

                {/* Owner - mot de passe (public) */}
                <Route path="/owner/forgot-password" element={<OwnerForgotPassword />} />
                <Route path="/owner/reset-password" element={<OwnerResetPassword />} />

                {/* Owner - protégées */}
                <Route element={<OwnerProtectedRoute />}>
                  <Route element={<OwnerLayout />}>
                    <Route path="/owner/dashboard" element={<OwnerDashboard />} />
                    <Route path="/owner/verification" element={<OwnerVerification />} />
                    <Route path="/owner/profile" element={<Profile />} />
                    <Route path="/owner/paiements" element={<HistoriquePaiements />} />
                    <Route path="/owner/biens" element={<BiensList />} />
                    <Route path="/owner/biens/ajouter" element={<AddBien />} />
                    <Route path="/owner/biens/:id" element={<BienDetail />} />
                    <Route path="/owner/biens/:id/paiements" element={<PaiementsPage />} />
                    <Route path="/owner/locataires" element={<LocatairesList />} />
                    <Route path="/owner/locataires/ajouter" element={<AddLocataire />} />
                    <Route path="/owner/locataires/:id" element={<LocataireDetail />} />
                    <Route path="/owner/loyers-retard" element={<LoyersEnRetardPage />} />
                    <Route path="/owner/notifications" element={<OwnerNotificationsPage />} />

                    {/* Etats des Lieux Owner */}
                    <Route path="/owner/bails/:bailId/etats-des-lieux" element={<EtatDesLieuxList />} />
                    <Route path="/owner/bails/:bailId/etats-des-lieux/creer" element={<EtatDesLieuxForm />} />
                    <Route path="/owner/bails/:bailId/etats-des-lieux/comparaison" element={<EtatDesLieuxComparison role="PROPRIETAIRE" />} />
                    <Route path="/owner/etats-des-lieux/:id" element={<EtatDesLieuxForm />} />
                  </Route>
                </Route>

                {/* Locataire - pages publiques */}
                <Route path="/locataire/activer" element={<LocataireActivate />} />
                <Route path="/locataire/reset-password" element={<LocataireResetPassword />} />

                {/* Locataire - inaccessible si déjà connecté */}
                <Route element={<LocataireGuestRoute />}>
                  <Route path="/locataire/login" element={<LocataireLogin />} />
                  <Route path="/locataire/forgot-password" element={<LocataireForgotPassword />} />
                </Route>

                {/* Locataire - protégées */}
                <Route element={<LocataireProtectedRoute />}>
                  <Route element={<LocataireLayout />}>
                    <Route path="/locataire/dashboard" element={<LocataireDashboard />} />
                    <Route path="/locataire/profil" element={<LocataireProfil />} />
                    <Route path="/locataire/paiements" element={<PaiementsLocatairePage />} />
                    <Route path="/locataire/proprietaire" element={<ProprietaireLocatairePage />} />
                    <Route path="/locataire/historique" element={<HistoriqueLogement />} />
                    <Route path="/locataire/documents" element={<DocumentsBien />} />

                    <Route path="/locataire/notifications" element={<LocataireNotificationsPage />} />

                    {/* Etats des Lieux Locataire */}
                    <Route path="/locataire/etats-des-lieux" element={<EtatsDesLieuxListLocataire />} />
                    <Route path="/locataire/etats-des-lieux/:id" element={<EtatDesLieuxReview />} />
                    <Route path="/locataire/bails/:bailId/etats-des-lieux/comparaison" element={<EtatDesLieuxComparison role="LOCATAIRE" />} />
                  </Route>
                </Route>

                {/* Auth admin - inaccessible si déjà connecté */}
                <Route element={<GuestRoute />}>
                  <Route path="/admin/login" element={<AdminLogin />} />
                </Route>

                {/* Routes admin protégées */}
                <Route path="/admin" element={<ProtectedRoute />}>
                  <Route element={<AdminLayout />}>
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="profile" element={<AdminProfile />} />
                    <Route path="biens/categories"        element={<TypesLogement />} />
                    <Route path="biens/transactions"      element={<TypesTransaction />} />
                    <Route path="biens/statuts"           element={<StatutsBien />} />
                    <Route path="biens/meuble-equipement" element={<MeubleEquipement />} />
                    <Route path="annonces"                element={<Annonces />} />
                    <Route path="annonces/:id"            element={<AdminAnnonceDetail />} />
                    <Route path="verifications"             element={<AdminVerificationsPage />} />
                    <Route path="proprietaires"          element={<ProprietairesStats />} />
                    <Route path="utilisateurs/:type" element={<UtilisateursPage />} />
                    <Route path="suspensions"           element={<SuspensionsPage />} />
                    <Route path="geo/pays"                element={<PaysPage />} />
                    <Route path="geo/villes"              element={<VillesPage />} />
                    <Route path="geo/quartiers"           element={<QuartiersPage />} />
                    <Route path="transactions"            element={<AdminTransactions />} />
                    <Route path="premium/historique"      element={<AdminPromotions />} />
                    <Route path="premium/formules"        element={<AdminFormulesPremium />} />
                    <Route path="locataires/:id/documents" element={<AdminLocataireDocuments />} />
                    <Route path="contrats/modeles"         element={<ModelesContratPage />} />
                    <Route path="monetisation/config"         element={<ConfigMonetisationPage />} />
                    <Route path="parametres/config-site"      element={<ConfigSitePage />} />
                    <Route path="signalements"         element={<SignalementsAdmin />} />
                    <Route path="notifications"         element={<AdminNotificationsPage />} />
                    <Route path="temoignages"           element={<TemoignagesAdminPage />} />
                    <Route path="feedbacks"             element={<FeedbacksAdminPage />} />
                    <Route path="parametres/pages-legales" element={<PagesLegalesAdminPage />} />
                    <Route path="champs/categories"        element={<CategoriesChampPage />} />
                    <Route path="champs"                   element={<ChampsPage />} />
                    <Route path="biens/types/:id/champs"   element={<TypeLogementChampsPage />} />
                  </Route>
                </Route>
              </Routes>
              </Suspense>
            </LocataireAuthProvider>
          </OwnerAuthProvider>
          </ComparisonProvider>
          </FavorisAuthModalProvider>
          </ComptePublicAuthProvider>
        </AuthProvider>
        </SocketProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </HelmetProvider>
);

export default App;
