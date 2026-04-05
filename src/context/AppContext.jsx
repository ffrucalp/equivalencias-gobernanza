import { createContext, useState, useEffect, useRef, useMemo, useContext } from "react";
import { getSupabaseClient, resetSupabaseClient } from "../supabaseClient";
import { MODELS, UCALP_PROGRAMS } from "../lib/constants";
import { C } from "../lib/styles";
import { loadData, saveData } from "../lib/utils";
import { initSIUCache } from "../lib/siuCache";

const AppContext = createContext(null);

export const useApp = () => useContext(AppContext);

export function AppProvider({ children }) {
  // ── Navigation ──
  const [tab, setTab] = useState(() => loadData("eq-current-tab", "dashboard"));

  // ── Config ──
  const [apiKey, setApiKey] = useState(import.meta.env.VITE_OPENROUTER_KEY || "");
  const [selectedModel, setSelectedModel] = useState(MODELS[0].id);
  const [supabaseUrl, setSupabaseUrl] = useState("");
  const [supabaseKey, setSupabaseKey] = useState("");

  // ── Auth ──
  const [authSession, setAuthSession] = useState(null);
  const [authProfile, setAuthProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // ── Data ──
  const [analyses, setAnalyses] = useState([]);
  const [savedPlans, setSavedPlans] = useState([]);
  const [savedReports, setSavedReports] = useState([]);
  const [savedTablas, setSavedTablas] = useState([]);
  const [tablaCache, setTablaCache] = useState({});
  const [programAttachments, setProgramAttachments] = useState({});
  const [loading, setLoading] = useState(true);
  const [tablaSelectedPlanId, setTablaSelectedPlanId] = useState(null);

  // ── UI ──
  const [error, setError] = useState(null);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // ── Auth helpers ──
  const rol = authProfile?.rol || "lectura";
  const canWrite = ["director", "decano", "secretaria"].includes(rol);
  const canAnalyze = ["director", "decano", "secretaria"].includes(rol);
  const isDirector = rol === "director";

  const ROL_LABELS = {
    director:      { label: "Director", color: C.red, bg: C.redSoft },
    secretaria:    { label: "Secretaría", color: "#6D28D9", bg: "#EDE9FE" },
    decano:        { label: "Decano", color: "#1565C0", bg: "#E3F2FD" },
    otro_director: { label: "Director. (lectura)", color: "#065F46", bg: "#D1FAE5" },
    lectura:       { label: "Lectura", color: C.textSecondary, bg: C.bg },
  };

  const sbConfigured = !!(import.meta.env.VITE_SUPABASE_URL || supabaseUrl || loadData("eq-supabase-url", ""));
  const needsLogin = sbConfigured && !authLoading && !authSession;

  // ── Persist tab ──
  useEffect(() => { saveData("eq-current-tab", tab); }, [tab]);

  // ── Initialization ──
  useEffect(() => {
    const saved = loadData("eq-analyses-v2", []);
    const key = import.meta.env.VITE_OPENROUTER_KEY || loadData("eq-apikey-v2", "");
    const model = loadData("eq-model-v2", MODELS[0].id);
    setAnalyses(saved); setApiKey(key); setSelectedModel(model); setLoading(false);
    const sbUrl = import.meta.env.VITE_SUPABASE_URL || loadData("eq-supabase-url", "");
    const sbKey = import.meta.env.VITE_SUPABASE_ANON_KEY || loadData("eq-supabase-key", "");
    const cache = loadData("eq-tabla-cache", {});
    if (sbUrl) setSupabaseUrl(sbUrl);
    if (sbKey) setSupabaseKey(sbKey);
    if (cache) setTablaCache(cache);
    const lastPlanId = loadData("eq-tabla-last-plan", null);
    const lastEdits = loadData("eq-tabla-last-edits", {});
    if (lastPlanId) setTablaSelectedPlanId(lastPlanId);

    // ── Auth init ──
    const loadPlansFromSupabase = async (sb) => {
      try {
        const { data: plans } = await sb.from("saved_plans").select("*").order("created_at", { ascending: false });
        if (plans) setSavedPlans(plans.map(r => ({
          ...r,
          subjects: typeof r.subjects === "string" ? JSON.parse(r.subjects) : r.subjects,
          url: r.plan_url
        })));
      } catch (e) { console.error("Error loading plans:", e); }
    };

    const loadProgramAttachments = async (sb) => {
      try {
        const { data } = await sb.from("programas_adjuntos").select("*");
        if (data) {
          const map = {};
          data.forEach(r => { map[r.subject_key] = r; });
          setProgramAttachments(map);
        }
      } catch (e) { console.error("Error loading program attachments:", e); }
    };

    const loadSavedReports = async (sb) => {
      try {
        const { data } = await sb.from("reportes_equivalencias").select("*").order("created_at", { ascending: false });
        if (data) setSavedReports(data.map(r => {
          const resultados = typeof r.resultados === "string" ? JSON.parse(r.resultados) : (r.resultados || {});
          return {
            id: r.id, student_name: r.alumno_nombre, student_dni: r.alumno_dni,
            origin_university: r.origin_university, origin_career: r.origin_career,
            analyses: resultados.analyses || [], summary: resultados.summary || {},
            estado: r.estado, firmado_por: r.firmado_por, notas_director: r.notas_director,
            created_at: r.created_at,
          };
        }));
      } catch (e) { console.error("Error loading reports:", e); }
    };

    const initAuth = async () => {
      const sb = getSupabaseClient();
      if (!sb) { setAuthLoading(false); return; }
      const { data: { session } } = await sb.auth.getSession();
      setAuthSession(session);
      if (session?.user) {
        const { data: profile } = await sb.from("profiles").select("*").eq("id", session.user.id).single();
        setAuthProfile(profile);
        if (profile?.openrouter_key && !import.meta.env.VITE_OPENROUTER_KEY) { setApiKey(profile.openrouter_key); saveData("eq-apikey-v2", profile.openrouter_key); }
        await loadPlansFromSupabase(sb);
        await loadProgramAttachments(sb);
        await loadSavedReports(sb);
        initSIUCache(getSupabaseClient).then(cache => {
          if (cache) console.log(`SIU cache listo: ${cache.universidades.length} universidades, ${cache.carreras.length} carreras`);
        });
      }
      setAuthLoading(false);

      // Listen for auth changes — with cleanup
      const { data: { subscription } } = sb.auth.onAuthStateChange(async (event, session) => {
        setAuthSession(session);
        if (session?.user) {
          const { data: profile } = await sb.from("profiles").select("*").eq("id", session.user.id).single();
          setAuthProfile(profile);
          if (profile?.openrouter_key && !import.meta.env.VITE_OPENROUTER_KEY) { setApiKey(profile.openrouter_key); saveData("eq-apikey-v2", profile.openrouter_key); }
          const { data: tablas } = await sb.from("equivalencias_tablas").select("*").order("updated_at", { ascending: false });
          if (tablas) setSavedTablas(tablas.map(r => ({ ...r, colors: typeof r.colors === "string" ? JSON.parse(r.colors) : r.colors })));
          await loadPlansFromSupabase(sb);
          await loadProgramAttachments(sb);
          await loadSavedReports(sb);
        } else {
          setAuthProfile(null);
        }
      });

      // Return cleanup function reference
      return subscription;
    };

    let subscription = null;
    initAuth().then(sub => { subscription = sub; });

    document.title = "Equivalencias · UCALP Gobernanza de Datos";
    let link = document.querySelector("link[rel~='icon']");
    if (!link) { link = document.createElement("link"); link.rel = "icon"; link.type = "image/png"; document.head.appendChild(link); }
    link.href = "/favicon-ucalp-180.png";
    let link2 = document.querySelector("link[rel='apple-touch-icon']");
    if (!link2) { link2 = document.createElement("link"); link2.rel = "apple-touch-icon"; document.head.appendChild(link2); }
    link2.href = "/favicon-ucalp-180.png";

    // Cleanup: unsubscribe auth listener
    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  // ── Shared functions ──
  const saveApiKey = (k) => {
    setApiKey(k); saveData("eq-apikey-v2", k);
    const sb = getSupabaseClient();
    if (sb && authSession?.user) {
      sb.from("profiles").update({ openrouter_key: k }).eq("id", authSession.user.id).then(() => {});
    }
  };
  const saveModel = (m) => { setSelectedModel(m); saveData("eq-model-v2", m); };

  const deleteAnalysis = (id) => { const u = analyses.filter(a => a.id !== id); setAnalyses(u); saveData("eq-analyses-v2", u); };
  const clearAll = () => { if (confirm("¿Eliminar TODAS las equivalencias guardadas?")) { setAnalyses([]); saveData("eq-analyses-v2", []); } };

  const savePlan = (university, career, subjects, url) => {
    const planId = Date.now().toString();
    const plan = { id: planId, date: new Date().toISOString(), university, career, url, subjects };
    setSavedPlans(prev => [plan, ...prev]);
    const sb = getSupabaseClient();
    if (sb) {
      sb.from("saved_plans").insert({
        id: planId, university, career, plan_url: url || "",
        subjects: JSON.stringify(subjects), created_at: plan.date
      }).then(({ error }) => {
        if (error) console.error("Supabase save error:", error.message);
      });
    }
    return plan;
  };

  const deletePlan = (id) => {
    setSavedPlans(prev => prev.filter(p => p.id !== id));
    const sb = getSupabaseClient();
    if (sb) {
      sb.from("saved_plans").delete().eq("id", id).then(({ error }) => {
        if (error) console.error("Delete error:", error.message);
      });
    }
  };

  const deleteReport = (id) => {
    if (!confirm("¿Eliminar este reporte?")) return;
    setSavedReports(prev => prev.filter(r => r.id !== id));
    const sb = getSupabaseClient();
    if (sb) {
      sb.from("reportes_equivalencias").delete().eq("id", id).then(({ error }) => {
        if (error) console.error("Delete report error:", error.message);
      });
    }
  };

  const exportCSV = () => {
    if (!analyses.length) return;
    const rows = [["Fecha","Universidad","Carrera","Materia Origen","Materia UCALP","Clasificación","% Cobertura","Unidades reconocidas","Unidades a rendir","Modelo IA"]];
    analyses.forEach(a => rows.push([new Date(a.date).toLocaleDateString("es-AR"), a.originUniversity, a.originCareer, a.originSubject, a.targetSubject, a.result.clasificacion, a.result.porcentaje_cobertura_global+"%", (a.result.unidades_reconocidas||[]).join("; "), (a.result.unidades_a_rendir||[]).join("; "), a.model]));
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF"+csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `equivalencias_ucalp_${new Date().toISOString().slice(0,10)}.csv`; a.click();
  };

  const handleLogout = async () => {
    const sb = getSupabaseClient();
    if (sb) { try { await sb.auth.signOut({ scope: "global" }); } catch (e) { console.error("Logout error:", e); } }
    setAuthSession(null); setAuthProfile(null);
    window.location.reload();
  };

  // ── Dashboard stats (memoized) ──
  const dashboardStats = useMemo(() => {
    let rTotal = 0, rParcial = 0, rSin = 0;
    const rUnis = new Set();
    savedReports.forEach(r => {
      rTotal += (r.summary?.total || 0); rParcial += (r.summary?.parcial || 0); rSin += (r.summary?.sin || 0);
      if (r.origin_university) rUnis.add(r.origin_university);
    });
    let tTotal = 0, tParcial = 0, tSin = 0;
    savedTablas.forEach(t => {
      if (t.colors && typeof t.colors === "object") {
        Object.values(t.colors).forEach(v => { if (v === "TOTAL") tTotal++; else if (v === "PARCIAL") tParcial++; else if (v === "SIN_EQUIVALENCIA") tSin++; });
      }
      if (t.origin_university) rUnis.add(t.origin_university);
    });
    const aTotal = analyses.filter(a => a.result?.clasificacion === "TOTAL").length;
    const aParcial = analyses.filter(a => a.result?.clasificacion === "PARCIAL").length;
    const aSin = analyses.filter(a => a.result?.clasificacion === "SIN_EQUIVALENCIA").length;
    analyses.forEach(a => { if (a.originUniversity) rUnis.add(a.originUniversity); });
    return {
      reportes: savedReports.length, tablas: savedTablas.length, planes: savedPlans.length,
      total: rTotal + tTotal + aTotal, parcial: rParcial + tParcial + aParcial, sin: rSin + tSin + aSin,
      universities: rUnis.size,
    };
  }, [savedReports, savedTablas, analyses, savedPlans]);

  const value = {
    // Navigation
    tab, setTab,
    // Config
    apiKey, selectedModel, saveApiKey, saveModel, supabaseUrl, supabaseKey, setSupabaseUrl, setSupabaseKey,
    // Auth
    authSession, authProfile, authLoading, rol, canWrite, canAnalyze, isDirector, ROL_LABELS, needsLogin, sbConfigured, handleLogout,
    showProfileMenu, setShowProfileMenu,
    // Data
    analyses, setAnalyses, savedPlans, setSavedPlans, savedReports, setSavedReports,
    savedTablas, setSavedTablas, tablaCache, setTablaCache,
    tablaSelectedPlanId, setTablaSelectedPlanId,
    programAttachments, setProgramAttachments,
    loading,
    // UI
    error, setError, showApiKeyModal, setShowApiKeyModal,
    // Functions
    deleteAnalysis, clearAll, savePlan, deletePlan, deleteReport, exportCSV, dashboardStats,
    // Supabase
    getSupabaseClient,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}