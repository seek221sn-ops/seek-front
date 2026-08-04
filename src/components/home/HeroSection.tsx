import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, SlidersHorizontal, ChevronDown, Info, ArrowRight, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SearchableSelect from "@/components/ui/SearchableSelect";
import NominatimAutocomplete, { type NominatimPoint } from "@/components/ui/NominatimAutocomplete";
import herosection from "@/assets/herosection.png";
import { useTypeLogements } from "@/hooks/useTypeLogements";
import { useStats } from "@/hooks/useStats";
import { useLieux } from "@/hooks/useRecherche";

const HeroSection = () => {
  const navigate = useNavigate();
  const { data: typesLogement = [] } = useTypeLogements();
  const { data: statsData }          = useStats();
  const { data: lieux }              = useLieux();
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 768px)");
    setIsDesktop(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  // Champs de localisation séparés
  const [searchVille,    setSearchVille]    = useState("");
  const [searchQuartier, setSearchQuartier] = useState("");
  const [propertyType,   setPropertyType]   = useState("");
  const [budgetMin,      setBudgetMin]      = useState("");
  const [budgetMax,      setBudgetMax]      = useState("");
  const [advancedOpen,   setAdvancedOpen]   = useState(false);

  // Point de recherche précise (Nominatim)
  const [selectedPoint, setSelectedPoint] = useState<NominatimPoint | null>(null);
  const [radius,        setRadius]        = useState<number>(5);
  const [formError,     setFormError]     = useState<string | null>(null);

  const formatBudget = (value: string) => {
    const num = value.replace(/\D/g, "");
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0");
  };

  const handleSearch = () => {
    setFormError(null);

    // Validation : lieu précis exige un type de logement
    if (selectedPoint && !propertyType) {
      setFormError("Veuillez sélectionner un type de logement pour la recherche par point précis.");
      return;
    }
    // Validation : au moins un champ renseigné
    if (!selectedPoint && !searchVille && !searchQuartier && !propertyType) {
      setFormError("Veuillez renseigner au moins un critère (ville, quartier ou type de logement).");
      return;
    }

    const mn = parseInt(budgetMin.replace(/\u00a0/g, ""), 10);
    const mx = parseInt(budgetMax.replace(/\u00a0/g, ""), 10);

    if (!isNaN(mn) && !isNaN(mx) && mn > mx) {
      setFormError("Le budget minimum ne peut pas être supérieur au budget maximum.");
      return;
    }

    const params = new URLSearchParams();

    if (selectedPoint) {
      params.set("lat",        String(selectedPoint.lat));
      params.set("lng",        String(selectedPoint.lng));
      params.set("pointLabel", selectedPoint.label);
      params.set("radius",     String(radius));
      // Le quartier peut restreindre une recherche par point précis à sa zone
      if (searchQuartier) params.set("quartier", searchQuartier);
    } else {
      if (searchVille)    params.set("ville",    searchVille);
      if (searchQuartier) params.set("quartier", searchQuartier);
    }

    if (propertyType) params.set("typeLogement", propertyType);

    if (!isNaN(mn) && mn > 0) params.set("prixMin", String(mn));
    if (!isNaN(mx) && mx > 0) params.set("prixMax", String(mx));

    params.set("page", "1");
    navigate(`/annonces?${params.toString()}`);
  };

  const villeOptions        = (lieux?.villes    ?? []).map((v) => ({ value: v, label: v }));
  const quartierOptions     = (lieux?.quartiers ?? []).map((q) => ({ value: q, label: q }));
  const typeLogementOptions = typesLogement.map((t) => ({ value: t.slug, label: t.nom }));

  const inputClasses = "h-11 bg-white/10 border-white/20 text-white placeholder:text-white/35 focus:border-white/40 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm transition-all";
  const labelClasses = "text-white/50 text-xs font-medium block mb-1.5 ml-0.5";

  return (
    <section className={`relative transition-all duration-500 ${(isSearchVisible || isDesktop) ? 'min-h-[100dvh] py-20 md:h-screen md:max-h-screen md:py-0' : 'h-[100dvh] overflow-hidden'} flex flex-col ${(!isSearchVisible && !isDesktop) ? 'justify-start' : 'justify-center'}`}>
      <img
        src={herosection}
        alt="Architecture moderne à Dakar"
        className="absolute inset-0 w-full h-full object-cover object-top md:object-center"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0C1A35] via-[#0C1A35]/68 to-[#0C1A35]/15" />

      <div className={`relative z-10 container mx-auto px-5 md:px-8 ${(isSearchVisible || isDesktop) ? 'pt-12 md:pt-24' : 'pt-28'} pb-8 lg:pb-12`}>
        <div className={`grid gap-12 items-center transition-all duration-500 ${(isSearchVisible || isDesktop) ? 'grid-cols-1 md:grid-cols-2 opacity-100' : 'grid-cols-1 max-w-3xl mx-auto text-center'}`}>

          {/* ── Colonne gauche : textes + stats ── */}
          <div className={`${!isDesktop && isSearchVisible ? 'hidden' : 'block'}`}>
            <h1 className="font-display text-5xl md:text-6xl font-bold text-white mb-5 leading-[1.1]">
              Trouvez votre<br />
              <span className="text-[#D4A843]">propriété idéale</span><br />
              au Sénégal
            </h1>

            <p className="text-white/60 text-lg mb-8 leading-relaxed">
              Explorez des milliers d'annonces à Dakar et partout au Sénégal.
            </p>

            {/* Arguments de confiance */}
            <div className={`flex flex-wrap gap-4 mb-10 ${!isSearchVisible ? 'justify-center' : ''}`}>
              {["Annonces vérifiées", "Propriétaires certifiés", "Paiement sécurisé", "Contrats digitaux"].map((t) => (
                <div key={t} className="flex items-center gap-2 text-white">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D4A843]" />
                  <span className="text-sm font-medium">{t}</span>
                </div>
              ))}
            </div>

            {/* Stats */}
            {/* Stats */}
            {statsData && (
              <div className={`hidden md:grid pt-8 border-t border-white/10 grid-cols-3 gap-6 ${(!isSearchVisible && !isDesktop) ? 'max-w-md mx-auto' : ''}`}>
                <div>
                  <div className="text-2xl font-bold text-white">
                    {statsData.annoncesActives > 0 ? `${statsData.annoncesActives.toLocaleString("fr-FR")}+` : "--"}
                  </div>
                  <div className="text-white/40 text-sm mt-0.5">Annonces actives</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">
                    {statsData.proprietaires > 0 ? `${statsData.proprietaires.toLocaleString("fr-FR")}+` : ""}
                  </div>
                  <div className="text-white/40 text-sm mt-0.5">Propriétaires</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">
                    {statsData.villesCouvertes.toLocaleString("fr-FR")}
                  </div>
                  <div className="text-white/40 text-sm mt-0.5">Villes couvertes</div>
                </div>
              </div>
            )}

            {!isSearchVisible && !isDesktop && (
              <Button
                onClick={() => setIsSearchVisible(true)}
                size="lg"
                className="mt-10 bg-[#D4A843] hover:bg-[#C09535] text-white font-bold px-10 py-7 rounded-xl shadow-2xl shadow-[#D4A843]/30 transition-all hover:scale-[1.05] group text-lg mx-auto md:hidden"
              >
                Faire une recherche
                <Search className="w-6 h-6 ml-3 group-hover:rotate-12 transition-transform" />
              </Button>
            )}
          </div>

          {/* ── Colonne droite : formulaire de recherche ── */}
          <div className="relative min-h-[400px] flex flex-col justify-center">
            <AnimatePresence>
              {(isSearchVisible || isDesktop) && (
                <motion.div
                  initial={isDesktop ? false : { opacity: 0, x: 30, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 30, scale: 0.95 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-5 md:p-7 shadow-2xl"
                >
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-white font-semibold flex items-center gap-2 text-lg">
                      <Search className="w-5 h-5 text-[#D4A843]" />
                      Trouvez rapidement le bien qui vous correspond.

                    </h3>
                    {!isDesktop && (
                      <button 
                        onClick={() => setIsSearchVisible(false)}
                        className="text-white/40 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-2 rounded-full border border-white/10"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Ville / Région */}
                    <div>
                      <label className={labelClasses}>Ville / Région</label>
                      <SearchableSelect
                        value={searchVille}
                        onChange={setSearchVille}
                        options={villeOptions}
                        placeholder="Dakar"
                        searchPlaceholder="Rechercher une ville…"
                        dark
                      />
                    </div>

                    {/* Quartier */}
                    <div>
                      <label className={labelClasses}>Quartier</label>
                      <SearchableSelect
                        value={searchQuartier}
                        onChange={setSearchQuartier}
                        options={quartierOptions}
                        placeholder="Almadies"
                        searchPlaceholder="Rechercher un quartier…"
                        dark
                      />
                    </div>

                    {/* Type de logement */}
                    <div>
                      <label className={labelClasses}>Type de logement</label>
                      <SearchableSelect
                        value={propertyType}
                        onChange={setPropertyType}
                        options={typeLogementOptions}
                        searchPlaceholder="Rechercher un type…"
                        dark
                      />
                    </div>

                    {/* Budget min */}
                    <div>
                      <label className={labelClasses}>Budget min (FCFA)</label>
                      <Input
                        type="text"
                        placeholder="Min"
                        value={budgetMin}
                        onChange={(e) => setBudgetMin(formatBudget(e.target.value))}
                        className={inputClasses}
                      />
                    </div>

                    {/* Budget max */}
                    <div>
                      <label className={labelClasses}>Budget max (FCFA)</label>
                      <Input
                        type="text"
                        placeholder="Max"
                        value={budgetMax}
                        onChange={(e) => setBudgetMax(formatBudget(e.target.value))}
                        className={inputClasses}
                      />
                    </div>

                    {/* Bouton Rechercher */}
                    <div className="flex flex-col justify-end">
                      <Button
                        type="button"
                        onClick={handleSearch}
                        className="h-11 w-full bg-[#D4A843] hover:bg-[#C09535] text-white font-semibold shadow-lg shadow-[#D4A843]/20 transition-all hover:scale-[1.02]"
                      >
                        <Search className="w-4 h-4 mr-2" />
                        Rechercher
                      </Button>
                    </div>

                    {/* Message d'erreur validation */}
                    {formError && (
                      <div className="col-span-full">
                        <p className="text-xs text-red-300 bg-red-500/15 border border-red-400/30 rounded-lg px-3 py-2 leading-relaxed">
                          {formError}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Recherche par point précis */}
                  <div className="mt-5 pt-5 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setAdvancedOpen(!advancedOpen)}
                      className="flex items-center gap-1.5 text-white/45 hover:text-white/75 text-xs transition-colors"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      Recherche par point précis
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${advancedOpen ? "rotate-180" : ""}`} />
                    </button>

                    {advancedOpen && (
                      <div className="mt-3">
                        <label className="text-white/50 text-xs font-medium flex items-center gap-1.5 mb-1.5 ml-0.5">
                          Lieu précis
                          <div className="relative group/info">
                            <Info className="w-3.5 h-3.5 text-white/30 hover:text-white/60 cursor-default transition-colors" />
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-60 bg-[#0C1A35] border border-white/10 text-white/80 text-xs px-3 py-2 rounded-xl leading-relaxed opacity-0 group-hover/info:opacity-100 transition-opacity pointer-events-none z-30">
                              Saisissez un lieu précis et sélectionnez une suggestion. Le système trouvera les biens les plus proches de ce lieu, triés par distance.
                              <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#0C1A35]" />
                            </div>
                          </div>
                        </label>
                        <NominatimAutocomplete
                          onSelect={(point) => {
                            setSelectedPoint(point);
                            // Le quartier reste utilisable pour restreindre la zone du point précis
                            if (point) { setSearchVille(""); }
                          }}
                          placeholder="Université Cheikh Anta Diop"
                          dark
                        />

                        {/* Sélecteur de rayon — slider */}
                        <div className="mt-4">
                          {(() => {
                            const disabled = !propertyType;
                            const zone = disabled
                              ? { label: "Sélectionnez un type de logement", sub: "pour activer le rayon", color: "#ffffff40" }
                              : radius <= 5
                              ? { label: "Zone proche",           sub: "Autour du point sélectionné", color: "#4ade80" }
                              : radius <= 15
                              ? { label: "Zone intermédiaire",    sub: "10–15 min en voiture",        color: "#D4A843" }
                              : radius <= 20
                              ? { label: "Zone élargie",          sub: "15–20 min en voiture",        color: "#fb923c" }
                              :   { label: "Zone très élargie",   sub: "Au-delà de 20 km",            color: "#f87171" };
                            const pct = ((radius - 5) / 25) * 100;
                            const trackColor = disabled ? "rgba(255,255,255,0.1)" : zone.color;
                            return (
                              <div className={disabled ? "opacity-50" : ""}>
                                {/* En-tête : label zone + valeur km */}
                                <div className="flex items-center justify-between mb-2">
                                  <div>
                                    <span className="text-xs font-semibold" style={{ color: zone.color }}>
                                      {zone.label}
                                    </span>
                                    <span className="text-white/35 text-xs ml-1.5">· {zone.sub}</span>
                                  </div>
                                  {!disabled && (
                                    <span className="text-sm font-bold text-white tabular-nums">{radius} km</span>
                                  )}
                                </div>

                                {/* Slider */}
                                <div className="relative h-6 flex items-center">
                                  <div className="absolute inset-x-0 h-1.5 rounded-full bg-white/15" />
                                  <div
                                    className="absolute left-0 h-1.5 rounded-full transition-all duration-150"
                                    style={{ width: `${pct}%`, background: trackColor }}
                                  />
                                  <input
                                    type="range"
                                    min={5} max={30} step={5}
                                    value={radius}
                                    disabled={disabled}
                                    onChange={(e) => setRadius(Number(e.target.value))}
                                    className={`relative w-full appearance-none bg-transparent transition-opacity
                                      ${disabled ? "cursor-not-allowed" : "cursor-pointer"}
                                      [&::-webkit-slider-thumb]:appearance-none
                                      [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                                      [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white
                                      [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:border-2
                                      [&:not(:disabled)]::[&::-webkit-slider-thumb]:hover:scale-125
                                      [&::-webkit-slider-thumb]:transition-transform
                                      [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4
                                      [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white
                                      [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-transparent`}
                                  />
                                </div>

                                {/* Graduations */}
                                <div className="flex justify-between mt-1 px-0.5">
                                  {["5", "10", "15", "20", "25", "30"].map((t) => (
                                    <span key={t} className="text-[10px] text-white/25">{t}</span>
                                  ))}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>
    </section>
  );
};

export default HeroSection;
