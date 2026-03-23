import { useState, useEffect, useRef, useMemo } from "react";
import { getSupabaseClient, resetSupabaseClient } from "./supabaseClient";
import { UCALP_PLAN, UCALP_PROGRAMS, UCALP_ORDER, MODELS, COMMON_UNIVERSITIES, COMMON_CAREERS } from "./lib/constants";
import { C, cardStyle, inputStyle, selectStyle, btnPrimary, btnOutline } from "./lib/styles";
import { Badge, CoverageCircle, UnitDetail, AlertBox, InfoBox, SectionTitle, Label } from "./lib/components";
import { loadData, saveData, parseTextPlan, extractTextFromFile, importFromGoogleSheets, parseHtmlTable, aiExtractSubjects, scrapeStudyPlan, buildPrompt, runBatchQuickAnalysis } from "./lib/utils";
import { isGoogleDriveConfigured, pickFileFromDrive } from "./lib/googleDrive";
import { searchGmailAttachments, downloadGmailAttachment } from "./lib/gmail";

export default function EquivalenciasApp() {
  const [tab, setTab] = useState("dashboard");
  const [apiKey, setApiKey] = useState("");
  const [selectedModel, setSelectedModel] = useState(MODELS[0].id);
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  // ── Auth state ──
  const [authSession, setAuthSession] = useState(null);   // Supabase session
  const [authProfile, setAuthProfile] = useState(null);   // {rol, nombre, apellido, ...}
  const [authLoading, setAuthLoading] = useState(true);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(true); // true=login, false=reset pw
  const [error, setError] = useState(null);
  const [expandedAnalysis, setExpandedAnalysis] = useState(null);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [originUniversity, setOriginUniversity] = useState(COMMON_UNIVERSITIES[0]);
  const [customUniversity, setCustomUniversity] = useState("");
  const [originCareer, setOriginCareer] = useState(COMMON_CAREERS[0]);
  const [customCareer, setCustomCareer] = useState("");
  const [scrapeUrl, setScrapeUrl] = useState("");
  const [scraping, setScraping] = useState(false);
  const [scrapedPlan, setScrapedPlan] = useState(null);
  const [savedPlans, setSavedPlans] = useState([]);
  const [sheetsUrl, setSheetsUrl] = useState("");
  const [sheetsData, setSheetsData] = useState(null);
  const [sheetsLoading, setSheetsLoading] = useState(false);
  const [aiExtracting, setAiExtracting] = useState(false);
  const [driveLoading, setDriveLoading] = useState(false);
  // Programas adjuntos (stored in Supabase: programas_adjuntos table + storage bucket)
  const [programAttachments, setProgramAttachments] = useState({}); // { subject_key: { file_name, content_text, file_url, drive_url, updated_at } }
  const [programUploading, setProgramUploading] = useState(null); // subject_key being uploaded
  // Gmail search state
  const [gmailSearch, setGmailSearch] = useState(""); // search query
  const [gmailResults, setGmailResults] = useState(null); // search results
  const [gmailToken, setGmailToken] = useState(null); // access token for downloads
  const [gmailLoading, setGmailLoading] = useState(false);
  const [gmailTarget, setGmailTarget] = useState(null); // subject_key we're attaching to
  // Reporte tab state
  const [rStudentName, setRStudentName] = useState("");
  const [rStudentDni, setRStudentDni] = useState("");
  const [rStudentUni, setRStudentUni] = useState("Universidad Nacional de La Plata (UNLP)");
  const [rStudentCareer, setRStudentCareer] = useState("Ingeniería en Computación");
  // Unified Reporte Alumno state
  const [raStep, setRaStep] = useState("datos"); // datos | analisis | reporte
  const [raOriginSubjects, setRaOriginSubjects] = useState([{ name: "", program: "" }]); // multiple origin subjects
  const [raTargetSubjects, setRaTargetSubjects] = useState([]); // array of UCALP subject keys (multi-select)
  const [raStudentAnalyses, setRaStudentAnalyses] = useState([]); // analyses saved for this student session
  const [raAnalyzing, setRaAnalyzing] = useState(false);
  const [raError, setRaError] = useState(null);
  const [raResult, setRaResult] = useState(null);
  const [raInputMode, setRaInputMode] = useState("text");
  const [raFileProcessing, setRaFileProcessing] = useState(false);
  const [raFileName, setRaFileName] = useState("");
  // Tabla general provisoria state
  const [tablaSelectedPlanId, setTablaSelectedPlanId] = useState(null);
  const [tablaBatchResult, setTablaBatchResult] = useState(null);
  const [tablaBatchLoading, setTablaBatchLoading] = useState(false);
  const [tablaBatchError, setTablaBatchError] = useState(null);
  const [tablaCache, setTablaCache] = useState({});
  const [tablaEditMode, setTablaEditMode] = useState(false);
  const [tablaEditColors, setTablaEditColors] = useState({}); // overrides: key -> value
  const [tablaSaving, setTablaSaving] = useState(false);
  const [savedTablas, setSavedTablas] = useState([]);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  // Supabase config
  const [supabaseUrl, setSupabaseUrl] = useState("");
  const [supabaseKey, setSupabaseKey] = useState("");
  const resultRef = useRef(null);
  const tablaRef = useRef(null);
  const [tablaEmailTo, setTablaEmailTo] = useState("");
  const [tablaEmailSending, setTablaEmailSending] = useState(false);

  useEffect(() => {
    const saved = loadData("eq-analyses-v2", []);
    const key = loadData("eq-apikey-v2", "");
    const model = loadData("eq-model-v2", MODELS[0].id);
    setAnalyses(saved); setApiKey(key); setSelectedModel(model); setLoading(false);
    const sbUrl = import.meta.env.VITE_SUPABASE_URL || loadData("eq-supabase-url", "");
    const sbKey = import.meta.env.VITE_SUPABASE_ANON_KEY || loadData("eq-supabase-key", "");
    const cache = loadData("eq-tabla-cache", {});
    if (sbUrl) setSupabaseUrl(sbUrl);
    if (sbKey) setSupabaseKey(sbKey);
    if (cache) setTablaCache(cache);
    // Restore last tabla state
    const lastPlanId = loadData("eq-tabla-last-plan", null);
    const lastEdits  = loadData("eq-tabla-last-edits", {});
    if (lastPlanId) setTablaSelectedPlanId(lastPlanId);
    if (lastEdits && Object.keys(lastEdits).length > 0) setTablaEditColors(lastEdits);

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

    const initAuth = async () => {
      const sb = getSupabaseClient();
      if (!sb) { setAuthLoading(false); return; }
      const { data: { session } } = await sb.auth.getSession();
      setAuthSession(session);
      if (session?.user) {
        const { data: profile } = await sb.from("profiles").select("*").eq("id", session.user.id).single();
        setAuthProfile(profile);
        if (profile?.openrouter_key) { setApiKey(profile.openrouter_key); saveData("eq-apikey-v2", profile.openrouter_key); }
        await loadPlansFromSupabase(sb);
        await loadProgramAttachments(sb);
      }
      setAuthLoading(false);
      sb.auth.onAuthStateChange(async (event, session) => {
        setAuthSession(session);
        if (session?.user) {
          const { data: profile } = await sb.from("profiles").select("*").eq("id", session.user.id).single();
          setAuthProfile(profile);
          if (profile?.openrouter_key) { setApiKey(profile.openrouter_key); saveData("eq-apikey-v2", profile.openrouter_key); }
          const { data: tablas } = await sb.from("equivalencias_tablas").select("*").order("updated_at", { ascending: false });
          if (tablas) setSavedTablas(tablas.map(r => ({ ...r, colors: typeof r.colors === "string" ? JSON.parse(r.colors) : r.colors })));
          await loadPlansFromSupabase(sb);
          await loadProgramAttachments(sb);
        } else {
          setAuthProfile(null);
        }
      });
    };
    initAuth();

    document.title = "Equivalencias · UCALP Gobernanza de Datos";
    let link = document.querySelector("link[rel~='icon']");
    if (!link) { link = document.createElement("link"); link.rel = "icon"; link.type = "image/png"; document.head.appendChild(link); }
    link.href = "/favicon-ucalp-180.png";
    let link2 = document.querySelector("link[rel='apple-touch-icon']");
    if (!link2) { link2 = document.createElement("link"); link2.rel = "apple-touch-icon"; document.head.appendChild(link2); }
    link2.href = "/favicon-ucalp-180.png";
  }, []);

  // Persist tabla edit state on change
  useEffect(() => { saveData("eq-tabla-last-edits", tablaEditColors); }, [tablaEditColors]);

  const saveApiKey = (k) => {    setApiKey(k);
    saveData("eq-apikey-v2", k);
    // Also persist to Supabase profile so it syncs across devices
    const sb = getSupabaseClient();
    if (sb && authSession?.user) {
      sb.from("profiles").update({ openrouter_key: k }).eq("id", authSession.user.id).then(() => {});
    }
  };
  const saveModel = (m) => { setSelectedModel(m); saveData("eq-model-v2", m); };

  // ── Auth helpers ──
  const rol = authProfile?.rol || "lectura";
  // director + decano + secretaria → acceso total; otro_director → solo lectura
  const canWrite   = ["director", "decano", "secretaria"].includes(rol);
  const canAnalyze = ["director", "decano", "secretaria"].includes(rol);
  const isDirector = rol === "director";

  const handleLogin = async () => {
    setLoginError(""); setLoginLoading(true);
    const sb = getSupabaseClient();
    if (!sb) { setLoginError("Configurá Supabase primero (URL y API key abajo)."); setLoginLoading(false); return; }
    const { error } = await sb.auth.signInWithPassword({ email: loginEmail, password: loginPassword });
    if (error) setLoginError(error.message === "Invalid login credentials" ? "Email o contraseña incorrectos." : error.message);
    setLoginLoading(false);
  };

  const handleLogout = async () => {
    const sb = getSupabaseClient();
    if (sb) {
      try { await sb.auth.signOut({ scope: "global" }); } catch (e) { console.error("Logout error:", e); }
    }
    setAuthSession(null); setAuthProfile(null);
    // Force page reload to clear all state
    window.location.reload();
  };

  const handleResetPassword = async () => {
    if (!loginEmail) { setLoginError("Ingresá tu email primero."); return; }
    const sb = getSupabaseClient();
    if (!sb) { setLoginError("Supabase no configurado."); return; }
    const { error } = await sb.auth.resetPasswordForEmail(loginEmail, {
      redirectTo: window.location.origin
    });
    if (error) setLoginError(error.message);
    else setLoginError("✓ Revisá tu email para restablecer la contraseña.");
  };

  const ROL_LABELS = {
    director:      { label: "Director", color: C.red,         bg: C.redSoft },
    secretaria:    { label: "Secretaría", color: "#6D28D9",     bg: "#EDE9FE" },
    decano:        { label: "Decano",   color: "#1565C0",     bg: "#E3F2FD" },
    otro_director: { label: "Director. (lectura)", color: "#065F46",     bg: "#D1FAE5" },
    lectura:       { label: "Lectura",    color: C.textSecondary, bg: C.bg },
  };

  // ── Show login screen if Supabase configured but not logged in ──
  const sbConfigured = !!(
    import.meta.env.VITE_SUPABASE_URL ||
    supabaseUrl ||
    loadData("eq-supabase-url", "")
  );
  const needsLogin = sbConfigured && !authLoading && !authSession;

  const deleteAnalysis = (id) => { const u = analyses.filter(a => a.id !== id); setAnalyses(u); saveData("eq-analyses-v2", u); };
  const clearAll = () => { if (confirm("¿Eliminar TODAS las equivalencias guardadas?")) { setAnalyses([]); saveData("eq-analyses-v2", []); } };

  // ── Unified Reporte Alumno: multi-subject analysis ──
  const raAddOriginSubject = () => setRaOriginSubjects(prev => [...prev, { name: "", program: "" }]);
  const raRemoveOriginSubject = (idx) => setRaOriginSubjects(prev => prev.filter((_, i) => i !== idx));
  const raUpdateOriginSubject = (idx, field, value) => setRaOriginSubjects(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  const raToggleTarget = (key) => setRaTargetSubjects(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);

  const raHandleFileUpload = async (e, idx) => {
    const file = e.target.files[0]; if (!file) return;
    setRaFileProcessing(true); setRaError(null); setRaFileName(file.name);
    try {
      const text = await extractTextFromFile(file);
      raUpdateOriginSubject(idx, "program", text);
      setRaInputMode("text");
    } catch (err) { setRaError(err.message); } finally { setRaFileProcessing(false); }
  };

  const buildMultiPrompt = (originSubjects, targetKeys) => {
    const targets = targetKeys.map(k => UCALP_PROGRAMS[k]).filter(Boolean);
    const origins = originSubjects.filter(s => s.name.trim());
    const uni = rStudentUni.includes("Otra") ? customUniversity : rStudentUni;
    const car = rStudentCareer.includes("Otra") ? customCareer : rStudentCareer;

    const originBlock = origins.map((o, i) => `### Materia de origen ${origins.length > 1 ? (i + 1) : ""}
**Materia:** ${o.name}
**Programa/Contenidos:**
${o.program}`).join("\n\n");

    const targetBlock = targets.map(t => {
      const isP = !t.hasProgram;
      return `### ${t.name} ${isP ? "(PROVISORIO)" : ""}
**Año/Semestre:** ${t.year} — ${t.semester === "1S" ? "1° Semestre" : t.semester === "2S" ? "2° Semestre" : "Anual"}
**Créditos:** ${t.credits} | **Carga horaria total:** ${t.totalHours} hs
${isP ? `**Descripción tentativa:** ${t.descripcion || "No disponible"}` :
`**Unidades:**\n${(t.units || []).map(u => `- Unidad ${u.number}: ${u.title}\n  Contenidos: ${u.topics}`).join("\n")}`}`;
    }).join("\n\n");

    return `Sos un experto académico en análisis de equivalencias universitarias en Argentina. Tu tarea es comparar rigurosamente ${origins.length > 1 ? "las materias" : "la materia"} de ORIGEN con ${targets.length > 1 ? "cada una de las materias" : "la materia"} DESTINO de la Licenciatura en Gobernanza de Datos (UCALP).

CONTEXTO IMPORTANTE: ${origins.length > 1
  ? `El alumno cursó ${origins.length} materias en su carrera de origen que podrían cubrir en conjunto los contenidos de ${targets.length > 1 ? "las materias" : "la materia"} destino. Debés evaluar la cobertura combinada de todas las materias de origen sobre cada materia destino.`
  : targets.length > 1
    ? `La materia de origen es una materia que podría cubrir contenidos de ${targets.length} materias destino (por ejemplo, una materia anual que equivale a dos cuatrimestrales). Debés evaluar por separado la cobertura sobre cada materia destino.`
    : `Comparación directa 1 a 1.`}

## ${origins.length > 1 ? "MATERIAS" : "MATERIA"} DE ORIGEN
**Universidad:** ${uni}
**Carrera:** ${car}
${originBlock}

## ${targets.length > 1 ? "MATERIAS" : "MATERIA"} DESTINO (UCALP - Lic. en Gobernanza de Datos)
${targetBlock}

## INSTRUCCIONES DE ANÁLISIS
${origins.length > 1
  ? "Evaluá la cobertura COMBINADA de todas las materias de origen sobre cada materia destino. Los contenidos de las distintas materias de origen se suman."
  : "Evaluá la cobertura de la materia de origen sobre cada materia destino por separado."}
Analizá unidad por unidad de cada materia destino y determiná qué porcentaje de cobertura tienen las materias de origen. Sé riguroso.

## CRITERIOS DE CLASIFICACIÓN
- **EQUIVALENCIA TOTAL**: La(s) materia(s) de origen cubren al menos el 80% de los contenidos de TODAS las unidades de la materia destino.
- **EQUIVALENCIA PARCIAL**: Cobertura sustancial (≥70%) de ALGUNAS unidades pero no todas. Indicá qué unidades se reconocen y cuáles debe rendir.
- **SIN EQUIVALENCIA**: Menos del 50% de cobertura global o enfoques fundamentalmente distintos.
- **NO EVALUABLE**: Programa provisional insuficiente para juicio.

## FORMATO DE RESPUESTA (SOLO JSON, sin backticks ni texto adicional):
{
  "resultados": [
    ${targets.map(t => `{
      "materia_destino_key": "${targetKeys[targets.indexOf(t)]}",
      "materia_destino_nombre": "${t.name}",
      "es_provisional": ${!t.hasProgram},
      "clasificacion": "TOTAL" | "PARCIAL" | "SIN_EQUIVALENCIA" | "NO_EVALUABLE",
      "porcentaje_cobertura_global": <número 0-100>,
      "analisis_por_unidad": [
        { "unidad": <número>, "titulo": "<título>", "cobertura": <número 0-100>, "coincidencias": "<temas>", "faltantes": "<temas>" }
      ],
      "unidades_reconocidas": [<números>],
      "unidades_a_rendir": [<números>],
      "justificacion": "<explicación>",
      "recomendacion": "<recomendación>",
      "observaciones": "<notas>"
    }`).join(",\n    ")}
  ]
}`;
  };

  const runMultiAnalysis = async () => {
    if (!apiKey) { setShowApiKeyModal(true); return; }
    const origins = raOriginSubjects.filter(s => s.name.trim());
    if (origins.length === 0) { setRaError("Ingresá al menos una materia de origen."); return; }
    if (origins.some(s => !s.program.trim())) { setRaError("Completá el programa de todas las materias de origen."); return; }
    if (raTargetSubjects.length === 0) { setRaError("Seleccioná al menos una materia UCALP destino."); return; }
    setRaAnalyzing(true); setRaError(null); setRaResult(null);
    const prompt = buildMultiPrompt(origins, raTargetSubjects);
    const uni = rStudentUni.includes("Otra") ? customUniversity : rStudentUni;
    const car = rStudentCareer.includes("Otra") ? customCareer : rStudentCareer;
    try {
      const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}`, "HTTP-Referer": "https://ucalp-equivalencias.pages.dev", "X-Title": "UCALP Equivalencias" },
        body: JSON.stringify({ model: selectedModel, messages: [{ role: "system", content: "Sos un experto académico en análisis de equivalencias universitarias argentinas. Respondé SOLAMENTE con JSON válido, sin backticks ni texto adicional." }, { role: "user", content: prompt }], temperature: 0.2, max_tokens: 8000 })
      });
      if (!resp.ok) { const errData = await resp.json().catch(() => ({})); throw new Error(errData?.error?.message || `Error ${resp.status}`); }
      const data = await resp.json();
      const text = data.choices?.[0]?.message?.content || "";
      const clean = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      let parsed;
      try { parsed = JSON.parse(clean); } catch { const match = clean.match(/\{[\s\S]*\}/); if (match) parsed = JSON.parse(match[0]); else throw new Error("No se pudo parsear la respuesta. Intentá con otro modelo."); }

      // Handle both single-result and multi-result formats
      const resultados = parsed.resultados || [parsed];
      const originNames = origins.map(o => o.name).join(" + ");
      setRaResult(resultados);

      // Create individual records for each target
      const newRecords = resultados.map(r => ({
        id: Date.now().toString() + "_" + (r.materia_destino_key || raTargetSubjects[0]),
        date: new Date().toISOString(),
        originUniversity: uni, originCareer: car,
        originSubject: originNames,
        originSubjects: origins.map(o => o.name),
        targetSubject: r.materia_destino_nombre || UCALP_PROGRAMS[r.materia_destino_key]?.name,
        targetSubjectKey: r.materia_destino_key || raTargetSubjects[0],
        model: selectedModel,
        result: r,
        isProvisional: r.es_provisional,
        originProgram: origins.map(o => o.program).join("\n\n---\n\n").substring(0, 3000),
        studentName: rStudentName,
        studentDni: rStudentDni,
      }));

      // Save to student analyses and global analyses
      setRaStudentAnalyses(prev => [...prev, ...newRecords]);
      const updated = [...newRecords, ...analyses]; setAnalyses(updated); saveData("eq-analyses-v2", updated);

      // Save to Supabase
      const sb = getSupabaseClient();
      if (sb && authSession?.user) {
        for (const rec of newRecords) {
          sb.from("analisis_materias").insert({
            origin_university: uni, origin_career: car, origin_subject: rec.originSubject,
            origin_program: origins.map(o => o.program).join("\n---\n").substring(0, 3000),
            ucalp_subject_key: rec.targetSubjectKey, ucalp_subject_name: rec.targetSubject,
            clasificacion: rec.result.clasificacion, es_provisional: rec.isProvisional,
            porcentaje_cobertura: rec.result.porcentaje_cobertura_global,
            analisis_json: rec.result, modelo_ia: selectedModel, created_by: authSession.user.id
          }).then(() => {});
        }
      }
    } catch (e) { setRaError(e.message); } finally { setRaAnalyzing(false); }
  };

  const raSaveAndContinue = () => {
    // Reset analysis form to add more
    setRaOriginSubjects([{ name: "", program: "" }]);
    setRaTargetSubjects([]);
    setRaResult(null);
    setRaError(null);
    setRaInputMode("text");
  };

  const raDeleteStudentAnalysis = (id) => {
    setRaStudentAnalyses(prev => prev.filter(a => a.id !== id));
    const u = analyses.filter(a => a.id !== id); setAnalyses(u); saveData("eq-analyses-v2", u);
  };

  const handleScrape = async () => {
    if (!scrapeUrl.trim()) return;
    setScraping(true); setError(null); setScrapedPlan(null);
    try {
      const plan = await scrapeStudyPlan(scrapeUrl);
      setScrapedPlan(plan);
    } catch (err) { setError("Error scrapeando: " + err.message); } finally { setScraping(false); }
  };

  const savePlan = (university, career, subjects, url) => {
    const planId = Date.now().toString();
    const plan = { id: planId, date: new Date().toISOString(), university, career, url, subjects };
    // Update UI immediately
    setSavedPlans(prev => [plan, ...prev]);
    // Save to Supabase in background (fire and forget)
    const sb = getSupabaseClient();
    if (sb) {
      sb.from("saved_plans").insert({
        id: planId, university, career, plan_url: url || "",
        subjects: JSON.stringify(subjects), created_at: plan.date
      }).then(({ error }) => {
        if (error) console.error("Supabase save error:", error.message);
        else console.log("✓ Plan guardado en Supabase:", planId);
      }).catch(e => console.error("Error saving plan:", e));
    }
    return plan;
  };

  const deletePlan = (id) => {
    setSavedPlans(prev => prev.filter(p => p.id !== id));
    const sb = getSupabaseClient();
    if (sb) {
      sb.from("saved_plans").delete().eq("id", id)
        .then(({ error }) => { if (error) console.error("Delete error:", error.message); })
        .catch(e => console.error("Error deleting plan:", e));
    }
  };

  const handleSheetsImport = async () => {
    if (!sheetsUrl.trim()) return;
    setSheetsLoading(true); setError(null); setSheetsData(null);
    try {
      const rows = await importFromGoogleSheets(sheetsUrl);
      setSheetsData(rows);
    } catch (e) { setError(e.message); } finally { setSheetsLoading(false); }
  };

  // ── Google Drive Picker ──
  const handleGoogleDrivePick = async () => {
    setDriveLoading(true); setError(null);
    try {
      const result = await pickFileFromDrive();
      if (!result) { setDriveLoading(false); return; } // User cancelled

      if (result.type === "sheets") {
        // Google Sheet → subjects extracted from CSV
        const subjects = result.subjects.map(s => ({ name: s, details: "" }));
        setScrapedPlan({
          subjects,
          rawText: result.text,
          pdfLinks: [],
          redirectedUrl: null,
          preloaded: false,
          driveFile: result.fileName
        });
      } else if (result.type === "file") {
        // PDF, DOCX, TXT → extract text
        const text = await extractTextFromFile(result.file);
        const parsed = parseTextPlan(text);
        setScrapedPlan({
          subjects: parsed,
          rawText: text,
          pdfLinks: [],
          redirectedUrl: null,
          preloaded: false,
          driveFile: result.fileName
        });
      }
    } catch (e) {
      setError("Google Drive: " + e.message);
    } finally {
      setDriveLoading(false);
    }
  };

  // ── Upload file to Supabase Storage ──
  const uploadToStorage = async (subjectKey, file) => {
    const sb = getSupabaseClient();
    if (!sb) return null;
    const ext = file.name.split(".").pop().toLowerCase();
    const path = `programas/${subjectKey}.${ext}`;
    // Remove old file if exists
    await sb.storage.from("programas").remove([path]).catch(() => {});
    const { data, error } = await sb.storage.from("programas").upload(path, file, { upsert: true });
    if (error) { console.error("Storage upload error:", error); return null; }
    const { data: urlData } = sb.storage.from("programas").getPublicUrl(path);
    return urlData?.publicUrl || null;
  };

  // ── Program attachment handlers ──
  const handleProgramFileUpload = async (subjectKey, file) => {
    setProgramUploading(subjectKey); setError(null);
    try {
      const text = await extractTextFromFile(file);
      const fileUrl = await uploadToStorage(subjectKey, file);
      const record = {
        subject_key: subjectKey,
        file_name: file.name,
        content_text: text.substring(0, 50000),
        file_url: fileUrl,
        drive_url: null,
        uploaded_by: authSession?.user?.id || null,
        updated_at: new Date().toISOString()
      };
      const sb = getSupabaseClient();
      if (sb) {
        await sb.from("programas_adjuntos").upsert(record, { onConflict: "subject_key" });
      }
      setProgramAttachments(prev => ({ ...prev, [subjectKey]: record }));
    } catch (e) { setError("Error al subir programa: " + e.message); }
    finally { setProgramUploading(null); }
  };

  const handleProgramDrivePick = async (subjectKey) => {
    if (!isGoogleDriveConfigured()) { setError("Google Drive no configurado."); return; }
    setProgramUploading(subjectKey); setError(null);
    try {
      const result = await pickFileFromDrive();
      if (!result) { setProgramUploading(null); return; }
      let text = "";
      let file = null;
      if (result.type === "sheets") {
        text = result.text;
      } else if (result.type === "file") {
        text = await extractTextFromFile(result.file);
        file = result.file;
      }
      const fileUrl = file ? await uploadToStorage(subjectKey, file) : null;
      const record = {
        subject_key: subjectKey,
        file_name: result.fileName,
        content_text: text.substring(0, 50000),
        file_url: fileUrl,
        drive_url: result.driveUrl || null,
        uploaded_by: authSession?.user?.id || null,
        updated_at: new Date().toISOString()
      };
      const sb = getSupabaseClient();
      if (sb) {
        await sb.from("programas_adjuntos").upsert(record, { onConflict: "subject_key" });
      }
      setProgramAttachments(prev => ({ ...prev, [subjectKey]: record }));
    } catch (e) { setError("Google Drive: " + e.message); }
    finally { setProgramUploading(null); }
  };

  const handleProgramDelete = async (subjectKey) => {
    if (!confirm(`¿Eliminar el programa adjunto de ${UCALP_PROGRAMS[subjectKey]?.name}?`)) return;
    const sb = getSupabaseClient();
    if (sb) {
      try {
        // Delete from storage
        const att = programAttachments[subjectKey];
        if (att?.file_name) {
          const ext = att.file_name.split(".").pop().toLowerCase();
          await sb.storage.from("programas").remove([`programas/${subjectKey}.${ext}`]).catch(() => {});
        }
        await sb.from("programas_adjuntos").delete().eq("subject_key", subjectKey);
      } catch (e) { console.error(e); }
    }
    setProgramAttachments(prev => { const n = { ...prev }; delete n[subjectKey]; return n; });
  };

  // ── Gmail search handlers ──
  const handleGmailSearch = async (query) => {
    setGmailLoading(true); setError(null); setGmailResults(null);
    try {
      const { results, token } = await searchGmailAttachments(query);
      setGmailResults(results);
      setGmailToken(token);
    } catch (e) { setError("Gmail: " + e.message); }
    finally { setGmailLoading(false); }
  };

  const handleGmailAttach = async (messageId, attachmentId, filename) => {
    if (!gmailTarget || !gmailToken) return;
    setProgramUploading(gmailTarget); setError(null);
    try {
      const file = await downloadGmailAttachment(messageId, attachmentId, filename, gmailToken);
      const text = await extractTextFromFile(file);
      const fileUrl = await uploadToStorage(gmailTarget, file);
      const record = {
        subject_key: gmailTarget,
        file_name: filename,
        content_text: text.substring(0, 50000),
        file_url: fileUrl,
        drive_url: null,
        uploaded_by: authSession?.user?.id || null,
        updated_at: new Date().toISOString()
      };
      const sb = getSupabaseClient();
      if (sb) {
        await sb.from("programas_adjuntos").upsert(record, { onConflict: "subject_key" });
      }
      setProgramAttachments(prev => ({ ...prev, [gmailTarget]: record }));
      setGmailTarget(null); setGmailResults(null); setGmailSearch("");
    } catch (e) { setError("Error adjuntando desde Gmail: " + e.message); }
    finally { setProgramUploading(null); }
  };

  // ── Tabla export functions ──
  const tablaToCanvas = async () => {
    if (!tablaRef.current) throw new Error("No hay tabla para exportar");
    // Load html2canvas
    if (!window.html2canvas) {
      await new Promise((resolve, reject) => {
        const s = document.createElement("script");
        s.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
        s.onload = resolve; s.onerror = reject;
        document.head.appendChild(s);
      });
    }
    return await window.html2canvas(tablaRef.current, { scale: 2, backgroundColor: "#FFFFFF", useCORS: true });
  };

  const exportTablaPNG = async () => {
    try {
      const canvas = await tablaToCanvas();
      const link = document.createElement("a");
      link.download = `tabla-equivalencias-${new Date().toISOString().slice(0,10)}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (e) { setError("Error exportando PNG: " + e.message); }
  };

  const exportTablaHTML = () => {
    if (!tablaRef.current) return;
    const htmlContent = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Tabla de Equivalencias — UCALP</title>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>body{margin:0;padding:20px;font-family:'DM Sans',system-ui,sans-serif;background:#fff}@media print{body{padding:0}}</style>
</head><body>${tablaRef.current.outerHTML}</body></html>`;
    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const link = document.createElement("a");
    link.download = `tabla-equivalencias-${new Date().toISOString().slice(0,10)}.html`;
    link.href = URL.createObjectURL(blob);
    link.click();
  };

  const printTabla = () => {
    if (!tablaRef.current) return;
    const w = window.open("", "_blank");
    w.document.write(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Tabla de Equivalencias</title>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>body{margin:0;padding:20px;font-family:'DM Sans',system-ui,sans-serif}@media print{body{padding:10px}}</style>
</head><body>${tablaRef.current.outerHTML}
<script>setTimeout(()=>{window.print();window.close()},500)<\/script>
</body></html>`);
    w.document.close();
  };

  const sendTablaByEmail = async (email) => {
    if (!email || !tablaRef.current) return;
    setTablaEmailSending(true); setError(null);
    try {
      const canvas = await tablaToCanvas();
      const pngBase64 = canvas.toDataURL("image/png").split(",")[1];

      // Build MIME email with embedded image
      const boundary = "boundary_" + Date.now();
      const subject = `Tabla de Equivalencias — Lic. en Gobernanza de Datos — UCALP`;
      const htmlBody = `<p>Estimado/a,</p><p>Adjunto la tabla general provisoria de equivalencias de la Licenciatura en Gobernanza de Datos (UCALP).</p><p>Saludos cordiales,<br/>Dir. Francisco Fernández Ruiz</p>`;

      const mimeEmail = [
        `To: ${email}`,
        `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
        `MIME-Version: 1.0`,
        `Content-Type: multipart/mixed; boundary="${boundary}"`,
        ``,
        `--${boundary}`,
        `Content-Type: text/html; charset=UTF-8`,
        ``,
        htmlBody,
        `--${boundary}`,
        `Content-Type: image/png; name="tabla-equivalencias.png"`,
        `Content-Disposition: attachment; filename="tabla-equivalencias.png"`,
        `Content-Transfer-Encoding: base64`,
        ``,
        pngBase64.match(/.{1,76}/g).join("\n"),
        `--${boundary}--`
      ].join("\r\n");

      const raw = btoa(unescape(encodeURIComponent(mimeEmail)))
        .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

      // Need Gmail token with compose scope
      await new Promise((resolve, reject) => {
        if (!document.getElementById("google-gis-script")) {
          const s = document.createElement("script");
          s.src = "https://accounts.google.com/gsi/client"; s.id = "google-gis-script";
          s.onload = resolve; s.onerror = reject;
          document.head.appendChild(s);
        } else resolve();
      });

      const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
      const token = await new Promise((resolve, reject) => {
        const tc = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: "https://www.googleapis.com/auth/gmail.compose",
          callback: (r) => r.error ? reject(new Error(r.error)) : resolve(r.access_token),
          error_callback: (e) => reject(new Error(e?.message || "Auth error")),
        });
        tc.requestAccessToken();
      });

      // Create draft
      const draftResp = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/drafts", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ message: { raw } })
      });
      if (!draftResp.ok) throw new Error("No se pudo crear el borrador");
      const draft = await draftResp.json();

      // Open Gmail compose with the draft
      window.open(`https://mail.google.com/mail/u/0/#drafts/${draft.message.id}`, "_blank");

      setTablaEmailTo("");
    } catch (e) { setError("Error enviando: " + e.message); }
    finally { setTablaEmailSending(false); }
  };

  const exportCSV = () => {
    if (!analyses.length) return;
    const rows = [["Fecha","Universidad","Carrera","Materia Origen","Materia UCALP","Clasificación","% Cobertura","Unidades reconocidas","Unidades a rendir","Modelo IA"]];
    analyses.forEach(a => rows.push([new Date(a.date).toLocaleDateString("es-AR"), a.originUniversity, a.originCareer, a.originSubject, a.targetSubject, a.result.clasificacion, a.result.porcentaje_cobertura_global+"%", (a.result.unidades_reconocidas||[]).join("; "), (a.result.unidades_a_rendir||[]).join("; "), a.model]));
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF"+csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `equivalencias_ucalp_${new Date().toISOString().slice(0,10)}.csv`; a.click();
  };

  const Badge = ({ clasificacion }) => {
    const m = { TOTAL: { bg: C.green, label: "Equivalencia Total" }, PARCIAL: { bg: C.amber, label: "Equivalencia Parcial" }, SIN_EQUIVALENCIA: { bg: C.redAccent, label: "Sin Equivalencia" } };
    const s = m[clasificacion] || { bg: C.textMuted, label: clasificacion };
    return <span style={{ display: "inline-block", padding: "4px 14px", borderRadius: 20, background: s.bg, color: "#fff", fontSize: 11, fontWeight: 700, letterSpacing: "0.6px", textTransform: "uppercase" }}>{s.label}</span>;
  };

  const CoverageCircle = ({ pct, size = 48 }) => {
    const color = pct >= 70 ? C.green : pct >= 40 ? C.amber : C.redAccent;
    return (
      <div style={{ width: size, height: size, borderRadius: "50%", background: `conic-gradient(${color} ${pct*3.6}deg, ${C.borderLight} 0deg)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: size - 8, height: size - 8, borderRadius: "50%", background: C.surface, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size > 48 ? 15 : 12, fontWeight: 700, color }}>{pct}%</div>
      </div>
    );
  };

  const stats = { total: analyses.filter(a => a.result.clasificacion === "TOTAL").length, parcial: analyses.filter(a => a.result.clasificacion === "PARCIAL").length, sin: analyses.filter(a => a.result.clasificacion === "SIN_EQUIVALENCIA").length, universities: [...new Set(analyses.map(a => a.originUniversity))].length };

  if (loading) return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.bg, fontFamily: "'Outfit', sans-serif" }}>
      <div style={{ textAlign: "center", color: C.textSecondary }}><div style={{ fontSize: 36, marginBottom: 12 }}>⚙️</div>Cargando...</div>
    </div>
  );

  const tabData = [
    { id: "dashboard", icon: "📊", label: "Panel" },
    { id: "tabla", icon: "⚡", label: "Tabla" },
    { id: "reporte_alumno", icon: "📄", label: "Reporte Alumno" },
    { id: "plans", icon: "🌐", label: "Planes" },
    { id: "programs", icon: "📋", label: "Programas" },
    { id: "settings", icon: "⚙️", label: "Config." },
  ];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }
        details summary::-webkit-details-marker { display: none; }
        details summary { list-style: none; }
        ::selection { background: ${C.redMuted}; color: ${C.red}; }
        @media print {
          header, nav, footer, button, .no-print { display: none !important; }
          main { padding: 0 !important; }
        }
      `}</style>

      {/* ── LOGIN SCREEN ── */}
      {needsLogin && (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: `linear-gradient(135deg, ${C.red} 0%, #7B1E1E 100%)`, padding: 24 }}>
          <div style={{ width: "100%", maxWidth: 400, background: "#fff", borderRadius: 20, padding: "40px 36px 32px", boxShadow: "0 20px 60px rgba(0,0,0,0.3)", animation: "fadeIn 0.4s ease" }}>
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <img src="/favicon-ucalp-original.png" alt="UCALP" style={{ width: 180, height: 180, borderRadius: "50%", marginBottom: 16, boxShadow: "0 2px 8px rgba(183,28,28,0.2)" }} />
              <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 22, fontWeight: 800, color: C.red }}>Gestión de Equivalencias</div>
              <div style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>Licenciatura en Gobernanza de Datos</div>
            </div>

            {loginError && (
              <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 8, background: C.redSoft, color: C.redAccent, fontSize: 13, textAlign: "center" }}>
                {loginError}
              </div>
            )}

            {/* Botón Google */}
            <button onClick={async () => {
              setLoginError(""); setLoginLoading(true);
              const sb = getSupabaseClient();
              if (!sb) { setLoginError("Error de configuración."); setLoginLoading(false); return; }
              const { error } = await sb.auth.signInWithOAuth({
                provider: "google",
                options: {
                  redirectTo: window.location.origin,
                  queryParams: { hd: "ucalpvirtual.edu.ar" },
                  scopes: "https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.compose"
                }
              });
              if (error) { setLoginError(error.message); setLoginLoading(false); }
            }} disabled={loginLoading} style={{
              width: "100%", padding: "13px 16px", borderRadius: 10,
              border: "1.5px solid #E0E0E0", background: "#fff",
              cursor: loginLoading ? "wait" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
              fontSize: 15, fontWeight: 600, color: "#3C4043",
              boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
              transition: "box-shadow 0.2s",
              opacity: loginLoading ? 0.7 : 1
            }}>
              {/* Google SVG icon */}
              <svg width="20" height="20" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                <path fill="none" d="M0 0h48v48H0z"/>
              </svg>
              {loginLoading ? "Redirigiendo..." : "Continuar con Google"}
            </button>

            <div style={{ marginTop: 16, fontSize: 11, color: C.textMuted, textAlign: "center", lineHeight: 1.5 }}>
              Usá tu cuenta institucional <strong>@ucalpvirtual.edu.ar</strong>
            </div>

            <div style={{ marginTop: 24, paddingTop: 16, borderTop: `1px solid ${C.borderLight}`, fontSize: 11, color: C.textMuted, textAlign: "center" }}>
              Universidad Católica de La Plata · Fac. de Cs. Exactas e Ingeniería
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN APP ── */}
      {!needsLogin && (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column" }}>

      {/* ─── TOP HEADER (solo logo + perfil) ─── */}
      <header style={{ background: C.red, color: "#fff", boxShadow: "0 2px 12px rgba(183,28,28,0.25)", flexShrink: 0, zIndex: 100, position: "sticky", top: 0 }}>
        <div style={{ padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 58 }}>
          {/* Logo + título */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 1px 4px rgba(0,0,0,0.15)" }}>
              <img src="/favicon-ucalp-180.png" alt="UCALP" style={{ height: 30, borderRadius: "50%" }} />
            </div>
            <div>
              <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 17, fontWeight: 700, lineHeight: 1.2, letterSpacing: "-0.2px" }}>Gestión de Equivalencias</div>
              <div style={{ fontSize: 9, opacity: 0.75, letterSpacing: "0.4px", textTransform: "uppercase", marginTop: 1 }}>Lic. en Gobernanza de Datos · Fac. Cs. Exactas e Ingeniería</div>
            </div>
          </div>

          {/* Perfil */}
          {authSession && authProfile && (() => {
            const googleAvatar = authSession.user?.user_metadata?.avatar_url || authSession.user?.user_metadata?.picture || authProfile.avatar_url;
            const displayName = authProfile.nombre || authSession.user?.user_metadata?.full_name?.split(" ")[0] || authProfile.email?.split("@")[0];
            return (
              <div style={{ position: "relative" }}>
                <button onClick={() => setShowProfileMenu(m => !m)} style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "4px 12px 4px 4px",
                  borderRadius: 24, border: "1.5px solid rgba(255,255,255,0.3)",
                  background: showProfileMenu ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.12)",
                  cursor: "pointer", color: "#fff", transition: "background 0.15s"
                }}>
                  {googleAvatar
                    ? <img src={googleAvatar} referrerPolicy="no-referrer" style={{ width: 30, height: 30, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.5)", flexShrink: 0 }} />
                    : <div style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                        {(displayName?.[0] || "?").toUpperCase()}
                      </div>
                  }
                  <span style={{ fontSize: 13, fontWeight: 600, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{displayName}</span>
                  <span style={{ fontSize: 9, opacity: 0.7 }}>{showProfileMenu ? "▴" : "▾"}</span>
                </button>

                {showProfileMenu && (
                  <>
                    {/* Overlay para cerrar al hacer click afuera */}
                    <div onClick={() => setShowProfileMenu(false)} style={{ position: "fixed", inset: 0, zIndex: 998 }} />
                    {/* Dropdown — fixed para que no quede cortado por overflow */}
                    <div style={{
                      position: "fixed",
                      top: 62,
                      right: 16,
                      background: "#fff", borderRadius: 14, boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
                      border: "1px solid #E8E8E8", minWidth: 240, overflow: "hidden", zIndex: 999
                    }}>
                      <div style={{ padding: "18px 18px 14px", borderBottom: "1px solid #F0F0F0", display: "flex", alignItems: "center", gap: 12 }}>
                        {googleAvatar
                          ? <img src={googleAvatar} referrerPolicy="no-referrer" style={{ width: 44, height: 44, borderRadius: "50%", border: "2px solid #E8E8E8", flexShrink: 0 }} />
                          : <div style={{ width: 44, height: 44, borderRadius: "50%", background: C.redSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: C.red, flexShrink: 0 }}>
                              {(displayName?.[0] || "?").toUpperCase()}
                            </div>
                        }
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "#212121", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{authProfile.nombre} {authProfile.apellido}</div>
                          <div style={{ fontSize: 11, color: "#9E9E9E", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{authProfile.email}</div>
                          <span style={{ display: "inline-block", marginTop: 5, fontSize: 10, padding: "2px 8px", borderRadius: 4, background: ROL_LABELS[rol]?.bg, color: ROL_LABELS[rol]?.color, fontWeight: 700 }}>
                            {ROL_LABELS[rol]?.label || rol}
                          </span>
                        </div>
                      </div>
                      <div style={{ padding: "6px 0" }}>
                        <button onClick={() => { setTab("settings"); setShowProfileMenu(false); }} style={{ width: "100%", padding: "11px 18px", textAlign: "left", border: "none", background: "none", cursor: "pointer", fontSize: 13, color: "#424242", display: "flex", alignItems: "center", gap: 12 }}
                          onMouseEnter={e => e.currentTarget.style.background="#F5F5F5"} onMouseLeave={e => e.currentTarget.style.background="none"}>
                          ⚙️ <span>Configuración</span>
                        </button>
                        <div style={{ height: 1, background: "#F5F5F5", margin: "4px 8px" }} />
                        <button onClick={async () => { setShowProfileMenu(false); await handleLogout(); }} style={{ width: "100%", padding: "11px 18px", textAlign: "left", border: "none", background: "none", cursor: "pointer", fontSize: 13, color: "#C62828", display: "flex", alignItems: "center", gap: 12, fontWeight: 600 }}
                          onMouseEnter={e => e.currentTarget.style.background="#FFEBEE"} onMouseLeave={e => e.currentTarget.style.background="none"}>
                          ↩ <span>Cerrar sesión</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })()}
        </div>
      </header>

      {/* ─── BODY: sidebar + contenido ─── */}
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>

        {/* ── SIDEBAR ── */}
        <aside style={{
          width: 200, flexShrink: 0, background: C.surface,
          borderRight: `1px solid ${C.borderLight}`,
          display: "flex", flexDirection: "column",
          position: "sticky", top: 58, height: "calc(100vh - 58px)",
          overflowY: "auto"
        }}>
          <nav style={{ padding: "16px 10px", display: "flex", flexDirection: "column", gap: 3 }}>
            {tabData.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 14px", borderRadius: 8, border: "none", cursor: "pointer", textAlign: "left",
                background: tab === t.id ? C.redSoft : "transparent",
                color: tab === t.id ? C.redAccent : C.textSecondary,
                fontWeight: tab === t.id ? 700 : 400,
                fontSize: 13, fontFamily: "'DM Sans', sans-serif",
                transition: "all 0.12s",
                borderLeft: tab === t.id ? `3px solid ${C.red}` : "3px solid transparent"
              }}
              onMouseEnter={e => { if (tab !== t.id) e.currentTarget.style.background = C.bg; }}
              onMouseLeave={e => { if (tab !== t.id) e.currentTarget.style.background = "transparent"; }}
              >
                <span style={{ fontSize: 16, width: 20, textAlign: "center", flexShrink: 0 }}>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </nav>

          {/* Rol badge al fondo del sidebar */}
          {authProfile && (
            <div style={{ marginTop: "auto", padding: "14px 14px 20px", borderTop: `1px solid ${C.borderLight}` }}>
              <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 4 }}>Sesión activa</div>
              <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 5, background: ROL_LABELS[rol]?.bg, color: ROL_LABELS[rol]?.color, fontWeight: 700 }}>
                {ROL_LABELS[rol]?.label || rol}
              </span>
            </div>
          )}
        </aside>

        {/* ── CONTENIDO PRINCIPAL ── */}
        <main style={{ flex: 1, minWidth: 0, padding: "28px 28px 80px", overflowY: "auto" }}>

        {/* ═══════ DASHBOARD ═══════ */}
        {tab === "dashboard" && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 14, marginBottom: 32 }}>
              {[
                { label: "Análisis realizados", value: analyses.length, color: C.red, bg: C.redSoft, border: C.redBorder },
                { label: "Equiv. Totales", value: stats.total, color: C.green, bg: C.greenSoft, border: C.greenBorder },
                { label: "Equiv. Parciales", value: stats.parcial, color: C.amber, bg: C.amberSoft, border: C.amberBorder },
                { label: "Sin Equivalencia", value: stats.sin, color: C.redAccent, bg: C.dangerSoft, border: C.dangerBorder },
                { label: "Universidades", value: stats.universities, color: C.red, bg: C.redSoft, border: C.redBorder },
              ].map((s, i) => (
                <div key={i} style={{ background: s.bg, borderRadius: 12, padding: "18px 16px", border: `1px solid ${s.border}` }}>
                  <div style={{ fontSize: 30, fontWeight: 700, color: s.color, fontFamily: "'Outfit', sans-serif" }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: C.textSecondary, marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 22, color: C.text, margin: 0, fontWeight: 700 }}>Historial de equivalencias</h2>
              {analyses.length > 0 && (
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={exportCSV} style={btnOutline}>📥 Exportar CSV</button>
                  <button onClick={clearAll} style={{ ...btnOutline, borderColor: C.redBorder, color: C.redAccent }}>🗑 Limpiar</button>
                </div>
              )}
            </div>

            {analyses.length === 0 ? (
              <div style={{ background: C.surface, borderRadius: 16, padding: 56, textAlign: "center", border: `2px dashed ${C.redBorder}` }}>
                <div style={{ fontSize: 48, marginBottom: 14 }}>📝</div>
                <div style={{ fontSize: 18, color: C.text, marginBottom: 6, fontFamily: "'Outfit', sans-serif", fontWeight: 600 }}>No hay análisis guardados</div>
                <div style={{ fontSize: 14, color: C.textSecondary, marginBottom: 24 }}>Iniciá tu primer análisis de equivalencias.</div>
                <button onClick={() => setTab("reporte_alumno")} style={btnPrimary}>🔍 Iniciar análisis</button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {analyses.map(a => (
                  <div key={a.id} style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                    <div onClick={() => setExpandedAnalysis(expandedAnalysis === a.id ? null : a.id)}
                      style={{ padding: "14px 18px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                          <Badge clasificacion={a.result.clasificacion} />
                          {a.isProvisional && <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 4, background: C.amberSoft, color: C.amber, fontWeight: 700, border: `1px solid ${C.amberBorder}` }}>PROVISIONAL</span>}
                          <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{a.originSubject}</span>
                          <span style={{ fontSize: 12, color: C.textMuted }}>→</span>
                          <span style={{ fontSize: 13, color: C.textSecondary }}>{a.targetSubject}</span>
                        </div>
                        <div style={{ fontSize: 12, color: C.textMuted, marginTop: 5 }}>{a.originUniversity} · {a.originCareer} · {new Date(a.date).toLocaleDateString("es-AR")}</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <CoverageCircle pct={a.result.porcentaje_cobertura_global} />
                        <span style={{ fontSize: 16, color: C.textMuted, transform: expandedAnalysis === a.id ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▾</span>
                      </div>
                    </div>

                    {expandedAnalysis === a.id && (
                      <div style={{ padding: "0 18px 18px", borderTop: `1px solid ${C.borderLight}`, animation: "fadeIn 0.2s ease" }}>
                        <div style={{ paddingTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: C.textSecondary, marginBottom: 4 }}>Análisis por unidad</div>
                          {(a.result.analisis_por_unidad || []).map((u, i) => (
                            <UnitDetail key={i} u={u} recognized={(a.result.unidades_reconocidas||[]).includes(u.unidad)} />
                          ))}
                          {a.result.unidades_a_rendir?.length > 0 && <AlertBox color="amber" icon="📝" title="Unidades a rendir" text={(a.result.unidades_a_rendir||[]).map(n => { const u2 = (a.result.analisis_por_unidad||[]).find(x => x.unidad === n); return `Unidad ${n}${u2 ? `: ${u2.titulo}` : ""}`; }).join(" · ")} />}
                          <InfoBox color={C.red} title="Justificación" text={a.result.justificacion} />
                          {a.result.recomendacion && <InfoBox color={C.amber} title="Recomendación" text={a.result.recomendacion} />}
                          <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: 11, color: C.textMuted }}>Modelo: {a.model}</span>
                            <button onClick={(e) => { e.stopPropagation(); deleteAnalysis(a.id); }} style={{ ...btnOutline, borderColor: C.redBorder, color: C.redAccent, padding: "5px 12px", fontSize: 11 }}>Eliminar</button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══════ TABLA GENERAL PROVISORIA ═══════ */}
        {tab === "tabla" && (() => {
          const selectedPlan = tablaSelectedPlanId
            ? savedPlans.find(p => p.id === tablaSelectedPlanId)
            : null;

          // Merge: base colors from cache/batch, overridden by manual edits
          const baseColors = (tablaBatchResult?.planId === tablaSelectedPlanId)
            ? tablaBatchResult.colors
            : (tablaCache[tablaSelectedPlanId] || null);

          const effectiveColors = baseColors
            ? { ...baseColors, ...tablaEditColors }
            : (Object.keys(tablaEditColors).length > 0 ? tablaEditColors : null);

          const COLOR_MAP = {
            TOTAL:            { bg: "#E8F5E9", border: "#A5D6A7", text: "#1B5E20", dot: "#4CAF50", label: "✓ Total" },
            PARCIAL:          { bg: "#FFF8E1", border: "#FFE082", text: "#5D4037", dot: "#FFC107", label: "△ Parcial" },
            SIN_EQUIVALENCIA: { bg: "#FFEBEE", border: "#FFCDD2", text: "#B71C1C", dot: "#EF5350", label: "✗ Sin Equiv." },
            SKIP:             { bg: C.bg,      border: C.borderLight, text: C.textMuted, dot: "#BDBDBD", label: "— N/A" },
          };
          const CYCLE = ["TOTAL", "PARCIAL", "SIN_EQUIVALENCIA", "SKIP"];

          const runBatch = async () => {
            if (!apiKey) { setShowApiKeyModal(true); return; }
            if (!selectedPlan) return;
            setTablaBatchLoading(true); setTablaBatchError(null); setTablaEditColors({});
            saveData("eq-tabla-last-edits", {});
            try {
              const result = await runBatchQuickAnalysis(selectedPlan, apiKey, selectedModel);
              const entry = { planId: selectedPlan.id, colors: result };
              setTablaBatchResult(entry);
              const newCache = { ...tablaCache, [selectedPlan.id]: result };
              setTablaCache(newCache);
              saveData("eq-tabla-cache", newCache);
            } catch(e) {
              setTablaBatchError(e.message);
            } finally {
              setTablaBatchLoading(false);
            }
          };

          const saveToSupabase = async () => {
            if (!effectiveColors || !selectedPlan) return;
            const sb = getSupabaseClient();
            if (!sb) { alert("Supabase no configurado."); return; }
            setTablaSaving(true);
            try {
              // Upsert by plan_id — insert or update if already exists
              const { error } = await sb.from("equivalencias_tablas").upsert({
                origin_university: selectedPlan.university,
                origin_career:     selectedPlan.career,
                plan_id:           selectedPlan.id,
                colors:            effectiveColors,
                notes:             "",
                updated_at:        new Date().toISOString()
              }, { onConflict: "plan_id" });
              if (error) throw new Error(error.message);
              // Reload
              const { data: tablas } = await sb.from("equivalencias_tablas").select("*").order("updated_at", { ascending: false });
              if (tablas) setSavedTablas(tablas.map(r => ({ ...r, colors: typeof r.colors === "string" ? JSON.parse(r.colors) : r.colors })));
              const newCache = { ...tablaCache, [selectedPlan.id]: effectiveColors };
              setTablaCache(newCache);
              saveData("eq-tabla-cache", newCache);
              alert(`✅ Tabla guardada para: ${selectedPlan.career}`);
            } catch(e) {
              alert("⚠ Error guardando: " + e.message);
            } finally {
              setTablaSaving(false);
            }
          };

          const colorStats = effectiveColors
            ? { total: Object.values(effectiveColors).filter(v => v === "TOTAL").length,
                parcial: Object.values(effectiveColors).filter(v => v === "PARCIAL").length,
                sin: Object.values(effectiveColors).filter(v => v === "SIN_EQUIVALENCIA").length }
            : null;

          const hasEdits = Object.keys(tablaEditColors).length > 0;

          return (
            <div style={{ animation: "fadeIn 0.3s ease" }}>
              <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                <div>
                  <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 24, color: C.text, margin: 0, fontWeight: 700 }}>
                    ⚡ Tabla General Provisoria
                  </h2>
                  <p style={{ color: C.textSecondary, fontSize: 13, marginTop: 5, lineHeight: 1.5, maxWidth: 600 }}>
                    Análisis en 1 consulta IA. <strong>Es orientativo</strong> — editá manualmente si querés ajustar y luego guardá en Supabase para tener la tabla disponible siempre.
                  </p>
                </div>
                {effectiveColors && selectedPlan && (
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <button onClick={() => setTablaEditMode(!tablaEditMode)} style={{
                      padding: "8px 16px", borderRadius: 7, border: `1.5px solid ${tablaEditMode ? C.amber : C.border}`,
                      background: tablaEditMode ? C.amberSoft : C.surface, color: tablaEditMode ? C.amber : C.textSecondary,
                      cursor: "pointer", fontSize: 12, fontWeight: 600
                    }}>
                      ✏️ {tablaEditMode ? "Editando..." : "Editar"}{hasEdits ? " ●" : ""}
                    </button>
                    {hasEdits && (
                      <button onClick={() => setTablaEditColors({})} style={{ ...btnOutline, fontSize: 12, padding: "8px 12px" }}>
                        ↩ Deshacer edits
                      </button>
                    )}
                    <button onClick={saveToSupabase} disabled={tablaSaving} style={{
                      ...btnPrimary, padding: "8px 18px", fontSize: 12,
                      background: "#3ECF8E", opacity: tablaSaving ? 0.6 : 1
                    }}>
                      {tablaSaving ? "⚙️ Guardando..." : "🗄️ Guardar en Supabase"}
                    </button>
                    <div style={{ width: 1, height: 24, background: C.borderLight }} />
                    <button onClick={exportTablaPNG} style={{ ...btnOutline, fontSize: 11, padding: "7px 12px" }} title="Descargar como imagen PNG">
                      🖼 PNG
                    </button>
                    <button onClick={exportTablaHTML} style={{ ...btnOutline, fontSize: 11, padding: "7px 12px" }} title="Descargar como HTML">
                      📄 HTML
                    </button>
                    <button onClick={printTabla} style={{ ...btnOutline, fontSize: 11, padding: "7px 12px" }} title="Imprimir / Guardar como PDF">
                      🖨 Imprimir
                    </button>
                    {isGoogleDriveConfigured() && (
                      <button onClick={() => setTablaEmailTo(tablaEmailTo ? "" : " ")} style={{ ...btnOutline, fontSize: 11, padding: "7px 12px", borderColor: tablaEmailTo ? C.redBorder : C.border, color: tablaEmailTo ? C.redAccent : C.textSecondary }} title="Enviar por Gmail">
                        ✉️ Enviar
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Email send bar */}
              {tablaEmailTo !== "" && effectiveColors && (
                <div style={{ ...cardStyle, marginBottom: 16, padding: "12px 18px", display: "flex", gap: 10, alignItems: "center", borderColor: C.redBorder, background: C.redSoft }}>
                  <span style={{ fontSize: 13, color: C.redAccent, fontWeight: 600, flexShrink: 0 }}>✉️ Enviar tabla a:</span>
                  <input
                    placeholder="email@ejemplo.com"
                    value={tablaEmailTo.trim()}
                    onChange={e => setTablaEmailTo(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && tablaEmailTo.trim() && sendTablaByEmail(tablaEmailTo.trim())}
                    style={{ ...inputStyle, flex: 1, fontSize: 13 }}
                    autoFocus
                  />
                  <button onClick={() => sendTablaByEmail(tablaEmailTo.trim())}
                    disabled={tablaEmailSending || !tablaEmailTo.trim()}
                    style={{ ...btnPrimary, padding: "9px 18px", fontSize: 13, whiteSpace: "nowrap", opacity: (tablaEmailSending || !tablaEmailTo.trim()) ? 0.6 : 1 }}>
                    {tablaEmailSending ? "⚙️ Creando borrador..." : "✉️ Crear borrador en Gmail"}
                  </button>
                  <button onClick={() => setTablaEmailTo("")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: C.redAccent, padding: "4px" }}>✕</button>
                </div>
              )}

              {/* Saved tablas from Supabase */}
              {savedTablas.length > 0 && (
                <div style={{ ...cardStyle, marginBottom: 16, padding: "12px 18px" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#3ECF8E", marginBottom: 8 }}>🗄️ Tablas guardadas en Supabase</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {savedTablas.map(t => (
                      <button key={t.id} onClick={() => {
                        // Load this tabla's colors into cache
                        const newCache = { ...tablaCache, [t.plan_id]: t.colors };
                        setTablaCache(newCache);
                        saveData("eq-tabla-cache", newCache);
                        setTablaSelectedPlanId(t.plan_id);
                        setTablaEditColors({});
                      }} style={{
                        padding: "6px 14px", borderRadius: 6, border: "1px solid #3ECF8E22",
                        background: "#3ECF8E10", color: "#2A9D6A", cursor: "pointer", fontSize: 12, fontWeight: 600
                      }}>
                        {t.origin_career} — {t.origin_university?.replace("Universidad ", "U. ")}
                        <span style={{ fontSize: 10, color: "#3ECF8E", marginLeft: 6 }}>
                          {new Date(t.updated_at).toLocaleDateString("es-AR")}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {tablaEditMode && effectiveColors && (
                <div style={{ ...cardStyle, marginBottom: 16, padding: "12px 18px", borderLeft: `4px solid ${C.amber}`, background: C.amberSoft }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.amber, marginBottom: 4 }}>✏️ Modo edición activo</div>
                  <div style={{ fontSize: 12, color: "#5D4037", lineHeight: 1.5 }}>
                    Hacé <strong>click en cualquier materia</strong> para cambiar su equivalencia en ciclo: Total → Parcial → Sin Equivalencia → N/A → Total.
                    Los cambios se aplican sobre los resultados de la IA. Guardá con el botón <strong>Guardar en Supabase</strong> cuando estés conforme.
                    {hasEdits && <span style={{ marginLeft: 8, fontWeight: 700, color: C.amber }}>({Object.keys(tablaEditColors).length} cambio{Object.keys(tablaEditColors).length !== 1 ? "s" : ""} manual{Object.keys(tablaEditColors).length !== 1 ? "es" : ""})</span>}
                  </div>
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 20, alignItems: "start" }}>

                {/* ── Columna izquierda: planes ── */}
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ ...cardStyle, padding: "16px" }}>
                    <SectionTitle icon="🏛" color={C.blue} label="Plan de origen" />
                    {savedPlans.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "24px 0", color: C.textMuted, fontSize: 13 }}>
                        <div style={{ fontSize: 28, marginBottom: 8 }}>📭</div>
                        No hay planes guardados.<br />
                        <button onClick={() => setTab("plans")} style={{ ...btnOutline, display: "block", margin: "12px auto 0", fontSize: 12 }}>🌐 Ir a Planes</button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                        {savedPlans.map(plan => {
                          const cached = tablaCache[plan.id];
                          const isSaved = savedTablas.some(t => t.plan_id === plan.id);
                          const isSelected = tablaSelectedPlanId === plan.id;
                          const cTotal = cached ? Object.values(cached).filter(v => v === "TOTAL").length : 0;
                          const cParcial = cached ? Object.values(cached).filter(v => v === "PARCIAL").length : 0;
                          return (
                            <button key={plan.id} onClick={() => { setTablaSelectedPlanId(plan.id); setTablaBatchError(null); setTablaEditColors({}); setTablaEditMode(false); saveData('eq-tabla-last-plan', plan.id); saveData('eq-tabla-last-edits', {}); }} style={{
                              padding: "9px 12px", borderRadius: 7, cursor: "pointer", textAlign: "left",
                              border: `1.5px solid ${isSelected ? C.red : C.border}`,
                              background: isSelected ? C.redSoft : C.surface, transition: "all 0.12s"
                            }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <span style={{ fontSize: 12, fontWeight: 600, color: isSelected ? C.redAccent : C.text, flex: 1 }}>
                                  {plan.career}
                                </span>
                                {isSaved && <span title="Guardada en Supabase" style={{ fontSize: 10, color: "#3ECF8E" }}>🗄️</span>}
                              </div>
                              <div style={{ fontSize: 11, color: C.textMuted, marginTop: 1 }}>{plan.university?.replace("Universidad ", "U. ")} · {plan.subjects?.length || 0} mat.</div>
                              {cached && (
                                <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                                  <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 3, background: "#E8F5E9", color: "#2E7D32", fontWeight: 700 }}>✓ {cTotal}</span>
                                  <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 3, background: "#FFF8E1", color: "#F57F17", fontWeight: 700 }}>△ {cParcial}</span>
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {selectedPlan && (selectedPlan.subjects?.length > 0) && (
                    <div style={{ ...cardStyle, padding: "12px", maxHeight: 260, display: "flex", flexDirection: "column" }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: C.textSecondary, marginBottom: 7, textTransform: "uppercase", letterSpacing: "0.4px", flexShrink: 0 }}>
                        Materias del plan <span style={{ color: C.textMuted, fontWeight: 400 }}>({selectedPlan.subjects.length})</span>
                      </div>
                      <div style={{ overflowY: "auto", flex: 1 }}>
                        {selectedPlan.subjects.map((s, i) => (
                          <div key={i} style={{ fontSize: 11, padding: "4px 7px", borderRadius: 4, marginBottom: 2, background: C.bg, border: `1px solid ${C.borderLight}`, color: C.text, lineHeight: 1.3 }}>
                            <span style={{ color: C.textMuted, marginRight: 5, fontSize: 9 }}>{i + 1}.</span>
                            {s.name || s}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedPlan && (
                    <div style={{ ...cardStyle, padding: "14px" }}>
                      {!apiKey && <div style={{ fontSize: 12, color: C.amber, marginBottom: 8 }}>⚠ Configurá API Key en Config.</div>}
                      <button onClick={runBatch} disabled={tablaBatchLoading || !apiKey} style={{
                        ...btnPrimary, width: "100%", display: "flex", alignItems: "center",
                        justifyContent: "center", gap: 8, padding: "11px",
                        opacity: (tablaBatchLoading || !apiKey) ? 0.6 : 1
                      }}>
                        {tablaBatchLoading
                          ? <><span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⚙️</span> Analizando...</>
                          : effectiveColors ? "🔄 Re-analizar" : "⚡ Analizar equivalencias"}
                      </button>
                      {tablaBatchError && <div style={{ marginTop: 8, fontSize: 12, color: C.redAccent }}>⚠ {tablaBatchError}</div>}
                      {colorStats && (
                        <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: "#E8F5E9", color: "#2E7D32", fontWeight: 700 }}>✓ {colorStats.total}</span>
                          <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: "#FFF8E1", color: "#F57F17", fontWeight: 700 }}>△ {colorStats.parcial}</span>
                          <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: "#FFEBEE", color: C.redAccent, fontWeight: 700 }}>✗ {colorStats.sin}</span>
                        </div>
                      )}
                      <div style={{ marginTop: 8, fontSize: 10, color: C.textMuted, lineHeight: 1.4, textAlign: "center" }}>
                        1 consulta IA · Análisis preliminar basado en nombres y contexto disciplinar
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Columna derecha: semáforo UCALP ── */}
                <div ref={tablaRef} style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
                  <div style={{ padding: "13px 20px", background: C.red, color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 15, fontWeight: 700 }}>Lic. en Gobernanza de Datos — UCALP</div>
                      {selectedPlan ? (
                        <div style={{ fontSize: 11, opacity: 0.85, marginTop: 2 }}>
                          {effectiveColors ? "⚡ Análisis provisorio" : "Seleccioná un plan y ejecutá el análisis"} ·
                          <strong style={{ marginLeft: 4 }}>{selectedPlan.career}</strong>
                        </div>
                      ) : (
                        <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>Seleccioná un plan de origen</div>
                      )}
                    </div>
                    {tablaEditMode && <span style={{ fontSize: 11, background: "rgba(255,193,7,0.3)", padding: "3px 10px", borderRadius: 10, fontWeight: 700 }}>✏️ Editando</span>}
                  </div>

                  <div style={{ padding: "7px 20px", background: C.bg, borderBottom: `1px solid ${C.borderLight}`, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                    {Object.entries(COLOR_MAP).map(([k, v]) => (
                      <div key={k} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: v.dot }} />
                        <span style={{ fontSize: 10, color: C.textSecondary }}>{v.label}</span>
                      </div>
                    ))}
                    {tablaEditMode && <span style={{ fontSize: 10, color: C.amber, marginLeft: "auto" }}>Click en materia para cambiar</span>}
                  </div>

                  <div style={{ padding: "12px 20px 20px" }}>
                    {Object.entries(UCALP_PLAN).map(([yearKey, yearData]) => (
                      <div key={yearKey} style={{ marginBottom: 18 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: C.redAccent, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>
                          {yearData.label}
                          {yearKey === "año2" && <span style={{ fontSize: 10, fontWeight: 400, color: C.textMuted, textTransform: "none", letterSpacing: 0, marginLeft: 8 }}>— Título intermedio al finalizar</span>}
                        </div>
                        {Object.entries(yearData.semestres).map(([semKey, semData]) => (
                          <div key={semKey} style={{ marginBottom: 10 }}>
                            <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.3px" }}>{semData.label}</div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 5 }}>
                              {semData.subjects.map(key => {
                                const prog = UCALP_PROGRAMS[key];
                                if (!prog) return null;
                                const colorKey = effectiveColors?.[key] || null;
                                const isEdited = tablaEditColors[key] != null;
                                const cStyle = colorKey ? (COLOR_MAP[colorKey] || COLOR_MAP.SKIP) : null;
                                const isClickable = tablaEditMode && effectiveColors;
                                return (
                                  <div key={key}
                                    onClick={() => {
                                      if (!isClickable) { if (effectiveColors) setTablaEditMode(true); else setTab("reporte_alumno"); return; }
                                      // Cycle through values
                                      const current = effectiveColors[key] || "SKIP";
                                      const idx = CYCLE.indexOf(current);
                                      const next = CYCLE[(idx + 1) % CYCLE.length];
                                      setTablaEditColors(prev => ({ ...prev, [key]: next }));
                                    }}
                                    title={isClickable ? `Click para cambiar: ${colorKey || "—"}` : `Ver análisis: ${prog.name}`}
                                    style={{
                                      padding: "7px 10px", borderRadius: 6,
                                      cursor: isClickable ? "pointer" : "pointer",
                                      border: `1.5px solid ${isEdited ? C.amber : (cStyle ? cStyle.border : C.borderLight)}`,
                                      background: cStyle ? cStyle.bg : C.surface,
                                      transition: "all 0.15s", display: "flex", alignItems: "center", gap: 7,
                                      outline: isEdited ? `2px solid ${C.amber}44` : "none",
                                      outlineOffset: 1
                                    }}>
                                    <div style={{
                                      width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                                      background: cStyle ? cStyle.dot : (selectedPlan ? "#BDBDBD" : C.borderLight),
                                      opacity: tablaBatchLoading ? 0.4 : 1
                                    }} />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div style={{ fontSize: 11, fontWeight: 600, color: cStyle ? cStyle.text : C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {prog.name}
                                        {isEdited && <span style={{ marginLeft: 4, fontSize: 9, color: C.amber }}>✏</span>}
                                      </div>
                                      <div style={{ fontSize: 9, color: C.textMuted }}>
                                        {prog.year.replace("° Año","°")} · {prog.credits}cr
                                        {cStyle && colorKey !== "SKIP" && <span style={{ marginLeft: 3, fontWeight: 700, color: cStyle.text }}>{cStyle.label}</span>}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: "8px 20px", borderTop: `1px solid ${C.borderLight}`, fontSize: 10, color: C.textMuted, background: C.bg, display: "flex", gap: 16, alignItems: "center" }}>
                    <span>⚡ Análisis provisorio por IA · Click en materia para análisis profundo (modo ver) o para editar (modo edición)</span>
                    {effectiveColors && !supabaseUrl && (
                      <span style={{ color: C.amber }}>Configurá Supabase para guardar permanentemente →</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ═══════ REPORTE DE ALUMNOS (UNIFICADO) ═══════ */}
        {tab === "reporte_alumno" && (() => {
          // Build lookup of student analyses by UCALP subject key
          const allStudentAnalyses = [...raStudentAnalyses];
          const bySubjectRA = {};
          allStudentAnalyses.forEach(a => { if (!bySubjectRA[a.targetSubjectKey]) bySubjectRA[a.targetSubjectKey] = []; bySubjectRA[a.targetSubjectKey].push(a); });

          const CLASI_LABEL = { TOTAL: "Equivalencia Total", PARCIAL: "Equivalencia Parcial", SIN_EQUIVALENCIA: "Sin Equivalencia", NO_EVALUABLE: "No Evaluable" };
          const CLASI_COLOR = { TOTAL: C.green, PARCIAL: C.amber, SIN_EQUIVALENCIA: C.redAccent, NO_EVALUABLE: C.textMuted };
          const CLASI_BG    = { TOTAL: C.greenSoft, PARCIAL: C.amberSoft, SIN_EQUIVALENCIA: C.dangerSoft, NO_EVALUABLE: C.bg };

          const studentDataComplete = rStudentName.trim() && rStudentDni.trim();

          return (
            <div style={{ animation: "fadeIn 0.3s ease" }}>
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22, flexWrap: "wrap", gap: 12 }}>
                <div>
                  <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 24, color: C.text, margin: 0, fontWeight: 700 }}>📄 Reporte de Equivalencias del Alumno</h2>
                  <p style={{ color: C.textSecondary, fontSize: 13, marginTop: 4 }}>Completá los datos del alumno, analizá las materias y generá el reporte final.</p>
                </div>
                {/* Step indicators */}
                <div style={{ display: "flex", gap: 4 }}>
                  {[
                    { id: "datos", icon: "👤", label: "Datos" },
                    { id: "analisis", icon: "🔍", label: "Análisis" },
                    { id: "reporte", icon: "📋", label: "Reporte" },
                  ].map((s, i) => (
                    <button key={s.id} onClick={() => {
                      if (s.id === "analisis" && !studentDataComplete) return;
                      if (s.id === "reporte" && allStudentAnalyses.length === 0) return;
                      setRaStep(s.id);
                    }} style={{
                      display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8,
                      border: `1.5px solid ${raStep === s.id ? C.red : C.border}`,
                      background: raStep === s.id ? C.redSoft : C.surface,
                      color: raStep === s.id ? C.redAccent : C.textSecondary,
                      cursor: (s.id === "analisis" && !studentDataComplete) || (s.id === "reporte" && allStudentAnalyses.length === 0) ? "not-allowed" : "pointer",
                      opacity: (s.id === "analisis" && !studentDataComplete) || (s.id === "reporte" && allStudentAnalyses.length === 0) ? 0.5 : 1,
                      fontSize: 13, fontWeight: raStep === s.id ? 700 : 500, transition: "all 0.15s"
                    }}>
                      <span>{s.icon}</span> {s.label}
                      {i < 2 && <span style={{ marginLeft: 4, color: C.textMuted }}>→</span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── STEP 1: DATOS DEL ALUMNO ── */}
              {raStep === "datos" && (
                <div style={{ animation: "fadeIn 0.2s ease" }}>
                  <div style={cardStyle}>
                    <SectionTitle icon="👤" color={C.red} label="Datos del alumno" />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                      <div>
                        <Label>Nombre y apellido</Label>
                        <input placeholder="Ej: Juan Pérez García" value={rStudentName} onChange={e => setRStudentName(e.target.value)} style={inputStyle} />
                      </div>
                      <div>
                        <Label>DNI</Label>
                        <input placeholder="Ej: 38.123.456" value={rStudentDni} onChange={e => setRStudentDni(e.target.value)} style={inputStyle} />
                      </div>
                      <div>
                        <Label>Universidad de origen</Label>
                        <select value={rStudentUni} onChange={e => setRStudentUni(e.target.value)} style={selectStyle}>{COMMON_UNIVERSITIES.map(u => <option key={u} value={u}>{u}</option>)}</select>
                        {rStudentUni.includes("Otra") && <input placeholder="Nombre..." value={customUniversity} onChange={e => setCustomUniversity(e.target.value)} style={{ ...inputStyle, marginTop: 6 }} />}
                      </div>
                      <div>
                        <Label>Carrera de origen</Label>
                        <select value={rStudentCareer} onChange={e => setRStudentCareer(e.target.value)} style={selectStyle}>{COMMON_CAREERS.map(c => <option key={c} value={c}>{c}</option>)}</select>
                        {rStudentCareer.includes("Otra") && <input placeholder="Nombre..." value={customCareer} onChange={e => setCustomCareer(e.target.value)} style={{ ...inputStyle, marginTop: 6 }} />}
                      </div>
                    </div>
                    <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end" }}>
                      <button onClick={() => { if (studentDataComplete) setRaStep("analisis"); }} disabled={!studentDataComplete} style={{
                        ...btnPrimary, padding: "12px 28px", fontSize: 14, opacity: studentDataComplete ? 1 : 0.5, cursor: studentDataComplete ? "pointer" : "not-allowed"
                      }}>
                        Continuar al análisis →
                      </button>
                    </div>
                  </div>

                  {/* Show student summary if already have analyses */}
                  {allStudentAnalyses.length > 0 && (
                    <div style={{ ...cardStyle, marginTop: 16, background: C.greenSoft, borderColor: C.greenBorder }}>
                      <div style={{ fontSize: 13, color: C.green, fontWeight: 600 }}>
                        ✓ {rStudentName} ya tiene {allStudentAnalyses.length} {allStudentAnalyses.length === 1 ? "análisis guardado" : "análisis guardados"}.
                        <button onClick={() => setRaStep("reporte")} style={{ ...btnOutline, marginLeft: 12, borderColor: C.greenBorder, color: C.green, padding: "5px 14px", fontSize: 12 }}>Ver reporte →</button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── STEP 2: ANÁLISIS DE EQUIVALENCIAS ── */}
              {raStep === "analisis" && (
                <div style={{ animation: "fadeIn 0.2s ease" }}>
                  {/* Student summary bar */}
                  <div style={{ ...cardStyle, padding: "12px 18px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between", background: C.surfaceAlt }}>
                    <div style={{ fontSize: 13, color: C.text }}>
                      <span style={{ fontWeight: 700 }}>{rStudentName}</span> <span style={{ color: C.textMuted }}>· DNI: {rStudentDni} · {rStudentUni} — {rStudentCareer}</span>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => setRaStep("datos")} style={{ ...btnOutline, padding: "5px 12px", fontSize: 11 }}>✏️ Editar datos</button>
                      {allStudentAnalyses.length > 0 && <button onClick={() => setRaStep("reporte")} style={{ ...btnOutline, padding: "5px 12px", fontSize: 11, borderColor: C.greenBorder, color: C.green }}>📋 Ver reporte ({allStudentAnalyses.length})</button>}
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22 }}>
                    {/* Left: Materias de origen */}
                    <div style={cardStyle}>
                      <SectionTitle icon="🏛" color={C.redAccent} label={`Materia${raOriginSubjects.length > 1 ? "s" : ""} de origen`} />
                      <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 12, lineHeight: 1.5, padding: "6px 10px", borderRadius: 6, background: C.blueSoft, border: `1px solid ${C.blueBorder}` }}>
                        💡 <b>Podés agregar varias materias de origen</b> si el alumno cursó más de una que cubra la(s) materia(s) destino. También podés seleccionar más de una materia UCALP destino.
                      </div>

                      {raOriginSubjects.map((orig, idx) => (
                        <div key={idx} style={{ marginBottom: 16, padding: 14, borderRadius: 10, border: `1px solid ${C.border}`, background: idx % 2 === 0 ? C.surface : C.bg }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: C.redAccent }}>Materia origen {raOriginSubjects.length > 1 ? `#${idx + 1}` : ""}</span>
                            {raOriginSubjects.length > 1 && (
                              <button onClick={() => raRemoveOriginSubject(idx)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: C.redAccent, padding: 0 }}>✕</button>
                            )}
                          </div>
                          <Label>Nombre de la materia</Label>
                          <input placeholder="Ej: Análisis Matemático I" value={orig.name} onChange={e => raUpdateOriginSubject(idx, "name", e.target.value)} style={inputStyle} />

                          <Label>Programa / Contenidos</Label>
                          {idx === 0 && (
                            <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
                              {[{ id: "text", icon: "📝", label: "Pegar texto" }, { id: "file", icon: "📄", label: "Subir archivo" }].map(m => (
                                <button key={m.id} onClick={() => setRaInputMode(m.id)} style={{
                                  flex: 1, padding: "7px 6px", borderRadius: 6, border: `1.5px solid ${raInputMode === m.id ? C.red : C.border}`,
                                  background: raInputMode === m.id ? C.redSoft : C.surface, color: raInputMode === m.id ? C.redAccent : C.textSecondary,
                                  cursor: "pointer", fontSize: 11, fontWeight: raInputMode === m.id ? 600 : 400, transition: "all 0.15s"
                                }}>{m.icon} {m.label}</button>
                              ))}
                            </div>
                          )}

                          {(idx === 0 && raInputMode === "file") ? (
                            <div style={{ padding: 16, borderRadius: 8, border: `2px dashed ${C.redBorder}`, background: C.redSoft, textAlign: "center" }}>
                              <div style={{ fontSize: 28, marginBottom: 6 }}>📄</div>
                              <div style={{ fontSize: 12, color: C.textSecondary, marginBottom: 10 }}>PDF, DOCX o TXT</div>
                              <input type="file" accept=".pdf,.docx,.doc,.txt" onChange={(e) => raHandleFileUpload(e, idx)} style={{ fontSize: 12 }} />
                              {raFileProcessing && <div style={{ marginTop: 8, fontSize: 12, color: C.red, fontWeight: 600 }}>⚙️ Extrayendo...</div>}
                            </div>
                          ) : (
                            <textarea placeholder={"Pegá el programa completo de la materia.\nCuanto más detallado, más preciso el análisis."} value={orig.program} onChange={e => raUpdateOriginSubject(idx, "program", e.target.value)} style={{ ...inputStyle, minHeight: raOriginSubjects.length > 1 ? 100 : 150, resize: "vertical", lineHeight: 1.55 }} />
                          )}
                          {orig.program && <div style={{ marginTop: 4, fontSize: 11, color: C.green }}>✓ {orig.program.length} caracteres</div>}
                        </div>
                      ))}

                      <button onClick={raAddOriginSubject} style={{ ...btnOutline, width: "100%", padding: "10px", fontSize: 12, borderStyle: "dashed", borderColor: C.redBorder, color: C.redAccent }}>
                        + Agregar otra materia de origen
                      </button>
                    </div>

                    {/* Right: Target + action */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                      <div style={cardStyle}>
                        <SectionTitle icon="🎯" color={C.red} label="Materia(s) UCALP destino" />
                        <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 8, lineHeight: 1.5 }}>
                          Seleccioná una o varias materias destino. Usá <span style={{ background: C.greenSoft, color: C.green, padding: "1px 5px", borderRadius: 3, fontWeight: 700, fontSize: 10 }}>✓</span> para marcar.
                          {raTargetSubjects.length > 0 && <span style={{ marginLeft: 6, fontWeight: 700, color: C.red }}>{raTargetSubjects.length} seleccionada{raTargetSubjects.length > 1 ? "s" : ""}</span>}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 12, maxHeight: 400, overflow: "auto", paddingRight: 4 }}>
                          {Object.entries(UCALP_PLAN).map(([yearKey, yearData]) => (
                            <div key={yearKey}>
                              <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 5 }}>{yearData.label}</div>
                              {Object.entries(yearData.semestres).map(([semKey, semData]) => (
                                <div key={semKey} style={{ marginBottom: 6 }}>
                                  <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 3, paddingLeft: 4 }}>{semData.label}</div>
                                  {semData.subjects.map(key => {
                                    const prog = UCALP_PROGRAMS[key];
                                    if (!prog) return null;
                                    const isSelected = raTargetSubjects.includes(key);
                                    const alreadyAnalyzed = !!bySubjectRA[key];
                                    return (
                                      <button key={key} onClick={() => raToggleTarget(key)} style={{
                                        width: "100%", padding: "8px 10px", borderRadius: 7, cursor: "pointer",
                                        textAlign: "left", transition: "all 0.12s", fontSize: 12,
                                        border: `1.5px solid ${isSelected ? C.red : alreadyAnalyzed ? C.greenBorder : C.border}`,
                                        background: isSelected ? C.redSoft : alreadyAnalyzed ? C.greenSoft : C.surface,
                                        color: isSelected ? C.redAccent : C.text,
                                        marginBottom: 2, display: "flex", alignItems: "center", justifyContent: "space-between"
                                      }}>
                                        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                          <span style={{
                                            width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                                            border: `2px solid ${isSelected ? C.red : C.border}`,
                                            background: isSelected ? C.red : "transparent",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            color: "#fff", fontSize: 11, fontWeight: 700
                                          }}>{isSelected ? "✓" : ""}</span>
                                          <span style={{ fontWeight: isSelected ? 700 : 500 }}>{prog.name}</span>
                                        </span>
                                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                          {alreadyAnalyzed && <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 3, background: C.greenSoft, color: C.green, fontWeight: 700, border: `1px solid ${C.greenBorder}` }}>HECHO</span>}
                                          <span style={{
                                            fontSize: 9, padding: "2px 5px", borderRadius: 4, flexShrink: 0,
                                            background: prog.hasProgram ? C.greenSoft : C.amberSoft,
                                            color: prog.hasProgram ? C.green : C.amber,
                                            fontWeight: 700, border: `1px solid ${prog.hasProgram ? C.greenBorder : C.amberBorder}`
                                          }}>
                                            {prog.hasProgram ? "✓ PROG." : "PROV."}
                                          </span>
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div style={cardStyle}>
                        <SectionTitle icon="🤖" color={C.textSecondary} label="Modelo de IA" />
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                          {MODELS.map(m => (
                            <button key={m.id} onClick={() => saveModel(m.id)} style={{
                              padding: "10px 10px", borderRadius: 7, cursor: "pointer", textAlign: "left", fontSize: 12, transition: "all 0.15s", border: `1.5px solid`,
                              borderColor: selectedModel === m.id ? C.red : C.border,
                              background: selectedModel === m.id ? C.redSoft : C.surface,
                              color: selectedModel === m.id ? C.redAccent : C.textSecondary,
                              fontWeight: selectedModel === m.id ? 600 : 400
                            }}>{m.icon} {m.label}</button>
                          ))}
                        </div>
                      </div>

                      <button onClick={runMultiAnalysis} disabled={raAnalyzing} style={{
                        ...btnPrimary, padding: "15px 28px", fontSize: 15, opacity: raAnalyzing ? 0.7 : 1, cursor: raAnalyzing ? "wait" : "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 8
                      }}>
                        {raAnalyzing ? <><span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⚙️</span> Analizando {raTargetSubjects.length > 1 ? `${raTargetSubjects.length} materias` : ""} con IA...</> : `🔍 Ejecutar análisis${raTargetSubjects.length > 1 ? ` (${raTargetSubjects.length} materias)` : ""}`}
                      </button>
                    </div>
                  </div>

                  {raError && <div style={{ marginTop: 18, padding: 14, borderRadius: 10, background: C.dangerSoft, border: `1px solid ${C.dangerBorder}`, color: C.redAccent, fontSize: 13 }}>⚠️ {raError}</div>}

                  {/* Results */}
                  {raResult && (
                    <div style={{ marginTop: 26, animation: "fadeIn 0.3s ease" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                        <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 20, color: C.text, margin: 0, fontWeight: 700 }}>Resultados del análisis</h3>
                        <button onClick={raSaveAndContinue} style={{ ...btnPrimary, padding: "10px 20px", fontSize: 13 }}>
                          ✓ Guardar y agregar otro análisis
                        </button>
                      </div>
                      {raResult.map((r, ri) => (
                        <div key={ri} style={{ ...cardStyle, marginBottom: 14 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                            <div>
                              <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{r.materia_destino_nombre || "Materia UCALP"}</div>
                              <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>
                                {raOriginSubjects.filter(s => s.name.trim()).map(s => s.name).join(" + ")} → {r.materia_destino_nombre}
                              </div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                              <Badge clasificacion={r.clasificacion} />
                              <CoverageCircle pct={r.porcentaje_cobertura_global} size={54} />
                            </div>
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {(r.analisis_por_unidad || []).map((u, i) => (
                              <UnitDetail key={i} u={u} recognized={(r.unidades_reconocidas||[]).includes(u.unidad)} />
                            ))}
                          </div>
                          {r.unidades_a_rendir?.length > 0 && <div style={{ marginTop: 14 }}><AlertBox color="amber" icon="📝" title="Unidades a rendir" text={(r.unidades_a_rendir||[]).map(n => { const u2 = (r.analisis_por_unidad||[]).find(x => x.unidad === n); return `Unidad ${n}${u2 ? `: ${u2.titulo}` : ""}`; }).join(" · ")} /></div>}
                          <div style={{ marginTop: 14 }}><InfoBox color={C.red} title="Justificación" text={r.justificacion} /></div>
                          {r.recomendacion && <div style={{ marginTop: 8 }}><InfoBox color={C.amber} title="Recomendación" text={r.recomendacion} /></div>}
                          {r.observaciones && <div style={{ marginTop: 8 }}><InfoBox color={C.textMuted} title="Observaciones" text={r.observaciones} /></div>}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Student analyses saved so far */}
                  {allStudentAnalyses.length > 0 && !raResult && (
                    <div style={{ marginTop: 22 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                        <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 18, color: C.text, margin: 0, fontWeight: 700 }}>
                          Análisis guardados ({allStudentAnalyses.length})
                        </h3>
                        <button onClick={() => setRaStep("reporte")} style={{ ...btnPrimary, padding: "9px 18px", fontSize: 13 }}>📋 Ver reporte final →</button>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {allStudentAnalyses.map(a => (
                          <div key={a.id} style={{ ...cardStyle, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <Badge clasificacion={a.result.clasificacion} />
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{a.originSubject} → {a.targetSubject}</div>
                                <div style={{ fontSize: 11, color: C.textMuted }}>{a.result.porcentaje_cobertura_global}% cobertura</div>
                              </div>
                            </div>
                            <button onClick={() => raDeleteStudentAnalysis(a.id)} style={{ ...btnOutline, borderColor: C.redBorder, color: C.redAccent, padding: "4px 10px", fontSize: 11 }}>✕</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── STEP 3: REPORTE FINAL ── */}
              {raStep === "reporte" && (
                <div style={{ animation: "fadeIn 0.2s ease" }}>
                  {/* Action bar */}
                  <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                    <button onClick={() => setRaStep("analisis")} style={{ ...btnOutline, padding: "9px 16px", fontSize: 12 }}>← Agregar más análisis</button>
                    <button onClick={() => window.print()} style={{ ...btnPrimary, padding: "9px 20px", fontSize: 13 }}>🖨 Imprimir / PDF</button>
                  </div>

                  {/* Full plan table — same beautiful design */}
                  <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
                    {/* Report header */}
                    <div style={{ padding: "20px 24px", background: C.red, color: "#fff" }}>
                      <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 700 }}>
                        TABLA DE EQUIVALENCIAS — LIC. EN GOBERNANZA DE DATOS
                      </div>
                      <div style={{ fontSize: 12, opacity: 0.85, marginTop: 4 }}>
                        Universidad Católica de La Plata · Facultad de Ciencias Exactas e Ingeniería
                        {rStudentName && ` · Alumno: ${rStudentName}`}
                        {rStudentDni && ` (DNI: ${rStudentDni})`}
                        {rStudentUni && ` · Origen: ${rStudentUni}`}
                        {rStudentCareer && ` — ${rStudentCareer}`}
                      </div>
                      <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>
                        Fecha: {new Date().toLocaleDateString("es-AR", { year: "numeric", month: "long", day: "numeric" })}
                      </div>
                    </div>

                    {/* Legend */}
                    <div style={{ padding: "10px 24px", background: C.bg, borderBottom: `1px solid ${C.borderLight}`, display: "flex", gap: 16, flexWrap: "wrap" }}>
                      {[["TOTAL", "Equivalencia Total — materia eximida"], ["PARCIAL", "Equivalencia Parcial — examen complementario"], ["SIN_EQUIVALENCIA", "Sin Equivalencia — debe cursar"], ["NO_EVALUABLE", "No Evaluable / No analizada"]].map(([k, label]) => (
                        <div key={k} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          <span style={{ width: 10, height: 10, borderRadius: 2, background: CLASI_COLOR[k], display: "inline-block" }} />
                          <span style={{ fontSize: 11, color: C.textSecondary }}>{label}</span>
                        </div>
                      ))}
                    </div>

                    {/* Plan table by year */}
                    {Object.entries(UCALP_PLAN).map(([yearKey, yearData]) => (
                      <div key={yearKey}>
                        <div style={{ padding: "8px 24px", background: C.redSoft, borderBottom: `1px solid ${C.redBorder}`, borderTop: `1px solid ${C.redBorder}` }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: C.redAccent }}>{yearData.label}</span>
                          {yearKey === "año2" && <span style={{ fontSize: 11, color: C.textMuted, marginLeft: 12 }}>· Título intermedio al finalizar: Técnico/a Universitario/a en Gobernanza de Datos</span>}
                        </div>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                          <thead>
                            <tr style={{ background: C.bg }}>
                              {["#", "Materia UCALP", "Año/Sem", "Créd.", "Materia de origen equivalente", "Resultado", "%", "Observaciones"].map((h, i) => (
                                <th key={i} style={{ padding: "7px 12px", fontSize: 10, fontWeight: 700, color: C.textMuted, textAlign: i >= 3 ? "center" : "left", letterSpacing: "0.3px", textTransform: "uppercase", borderBottom: `1px solid ${C.borderLight}` }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(yearData.semestres).flatMap(([semKey, semData]) =>
                              semData.subjects.map((key, rowIdx) => {
                                const prog = UCALP_PROGRAMS[key];
                                if (!prog) return null;
                                const matchingAnalyses = bySubjectRA[key] || [];
                                const best = matchingAnalyses.sort((a, b) => (b.result.porcentaje_cobertura_global || 0) - (a.result.porcentaje_cobertura_global || 0))[0];
                                const clasi = best?.result?.clasificacion;
                                const pct   = best?.result?.porcentaje_cobertura_global;
                                const rowBg = clasi ? (CLASI_BG[clasi] || C.surface) : (rowIdx % 2 === 0 ? C.surface : C.bg);
                                return (
                                  <tr key={key} style={{ background: rowBg }}>
                                    <td style={{ padding: "8px 12px", fontSize: 11, color: C.textMuted, textAlign: "center" }}>{prog.cod}</td>
                                    <td style={{ padding: "8px 12px", fontSize: 12, fontWeight: 500, color: C.text }}>
                                      {prog.name}
                                      {!prog.hasProgram && <span style={{ marginLeft: 6, fontSize: 9, padding: "1px 5px", borderRadius: 3, background: C.amberSoft, color: C.amber, fontWeight: 700, border: `1px solid ${C.amberBorder}` }}>PROV</span>}
                                    </td>
                                    <td style={{ padding: "8px 12px", fontSize: 11, color: C.textMuted, textAlign: "center" }}>{prog.year.replace("° Año","°")} · {semKey === "1S" ? "1°S" : semKey === "2S" ? "2°S" : "Anual"}</td>
                                    <td style={{ padding: "8px 12px", fontSize: 11, color: C.textMuted, textAlign: "center" }}>{prog.credits}</td>
                                    <td style={{ padding: "8px 12px", fontSize: 12, color: best ? C.text : C.textMuted, fontStyle: best ? "normal" : "italic" }}>
                                      {best ? best.originSubject : "—"}
                                    </td>
                                    <td style={{ padding: "8px 12px", textAlign: "center" }}>
                                      {clasi ? (
                                        <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 4, background: CLASI_COLOR[clasi] + "20", color: CLASI_COLOR[clasi], fontWeight: 700, whiteSpace: "nowrap" }}>
                                          {clasi === "TOTAL" ? "✓ Total" : clasi === "PARCIAL" ? "△ Parcial" : clasi === "SIN_EQUIVALENCIA" ? "✗ Sin Equiv." : "— N/E"}
                                        </span>
                                      ) : (
                                        <span style={{ fontSize: 11, color: C.textMuted }}>Pendiente</span>
                                      )}
                                    </td>
                                    <td style={{ padding: "8px 12px", fontSize: 11, textAlign: "center", fontWeight: pct != null ? 600 : 400, color: pct != null ? (pct >= 70 ? C.green : pct >= 40 ? C.amber : C.redAccent) : C.textMuted }}>
                                      {pct != null ? `${pct}%` : "—"}
                                    </td>
                                    <td style={{ padding: "8px 12px", fontSize: 11, color: C.textSecondary, maxWidth: 200 }}>
                                      {clasi === "PARCIAL" && best?.result?.unidades_a_rendir?.length > 0 && (
                                        <span>Rendir U{best.result.unidades_a_rendir.join(", U")}</span>
                                      )}
                                      {best?.isProvisional && <span style={{ color: C.amber }}> (provisional)</span>}
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    ))}

                    {/* Summary footer */}
                    <div style={{ padding: "16px 24px", background: C.bg, borderTop: `1px solid ${C.borderLight}` }}>
                      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                        {["TOTAL", "PARCIAL", "SIN_EQUIVALENCIA"].map(k => {
                          const count = Object.values(bySubjectRA).filter(arr => arr.some(a => a.result.clasificacion === k)).length;
                          return (
                            <div key={k} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Outfit', sans-serif", color: CLASI_COLOR[k] }}>{count}</span>
                              <span style={{ fontSize: 12, color: C.textSecondary }}>{CLASI_LABEL[k]}</span>
                            </div>
                          );
                        })}
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Outfit', sans-serif", color: C.textMuted }}>
                            {Object.keys(UCALP_PROGRAMS).length - Object.keys(bySubjectRA).length}
                          </span>
                          <span style={{ fontSize: 12, color: C.textSecondary }}>Pendientes de análisis</span>
                        </div>
                      </div>
                      <div style={{ marginTop: 12, fontSize: 11, color: C.textMuted, borderTop: `1px dashed ${C.borderLight}`, paddingTop: 10 }}>
                        Análisis realizado con asistencia de inteligencia artificial. Los resultados provisionales están sujetos a revisión por el Director de Carrera.
                        Firmado: Dir. Francisco Fernández Ruiz — Lic. en Gobernanza de Datos — UCALP
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* ═══════ PLANES ═══════ */}
        {tab === "plans" && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 24, color: C.text, marginBottom: 4, fontWeight: 700 }}>Planes de estudio</h2>
            <p style={{ color: C.textSecondary, fontSize: 14, marginBottom: 20 }}>Cargá planes de estudio por URL, texto pegado, PDF o Google Sheets. Los planes se guardan en Supabase y están disponibles para todos los usuarios.</p>


            <div style={cardStyle}>
              <SectionTitle icon="🌐" color={C.blue} label="Cargar plan de estudios" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div>
                  <Label>Universidad</Label>
                  <select value={originUniversity} onChange={e => setOriginUniversity(e.target.value)} style={selectStyle}>{COMMON_UNIVERSITIES.map(u => <option key={u} value={u}>{u}</option>)}</select>
                  {originUniversity.includes("Otra") && <input placeholder="Nombre..." value={customUniversity} onChange={e => setCustomUniversity(e.target.value)} style={{ ...inputStyle, marginTop: 6 }} />}
                </div>
                <div>
                  <Label>Carrera</Label>
                  <select value={originCareer} onChange={e => setOriginCareer(e.target.value)} style={selectStyle}>{COMMON_CAREERS.map(c => <option key={c} value={c}>{c}</option>)}</select>
                  {originCareer.includes("Otra") && <input placeholder="Nombre..." value={customCareer} onChange={e => setCustomCareer(e.target.value)} style={{ ...inputStyle, marginTop: 6 }} />}
                </div>
              </div>

              {/* Input mode tabs */}
              <div style={{ display: "flex", gap: 4, marginBottom: 12, flexWrap: "wrap" }}>
                {[
                  { id: "url", icon: "🌐", label: "URL" },
                  { id: "paste", icon: "📋", label: "Pegar texto/HTML" },
                  { id: "pdf", icon: "📄", label: "Subir PDF/DOCX" },
                  { id: "sheets", icon: "📊", label: "Google Sheets" },
                  ...(isGoogleDriveConfigured() ? [{ id: "drive", icon: "📁", label: "Google Drive" }] : []),
                ].map(m => (
                  <button key={m.id} onClick={() => { if (!window._planInputMode) window._planInputMode = "url"; window._planInputMode = m.id; setScrapedPlan(null); setScrapeUrl(""); document.getElementById("plan-input-mode-indicator")?.setAttribute("data-mode", m.id); document.querySelectorAll("[data-plan-mode]").forEach(el => { el.style.display = el.getAttribute("data-plan-mode") === m.id ? "" : "none"; }); }} style={{
                    padding: "7px 14px", borderRadius: 6, border: `1.5px solid ${C.border}`,
                    background: C.surface, color: C.textSecondary, cursor: "pointer", fontSize: 12, fontWeight: 500,
                  }} id={`plan-btn-${m.id}`}>{m.icon} {m.label}</button>
                ))}
              </div>

              {/* URL mode (shown by default) */}
              <div data-plan-mode="url" style={{ }}>
                <div style={{ display: "flex", gap: 8 }}>
                  <input placeholder="https://www.ucalp.edu.ar/carrera/..." value={scrapeUrl} onChange={e => setScrapeUrl(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleScrape()} style={{ ...inputStyle, flex: 1 }} />
                  <button onClick={handleScrape} disabled={scraping} style={{ ...btnPrimary, padding: "10px 20px", fontSize: 13, opacity: scraping ? 0.7 : 1, whiteSpace: "nowrap" }}>
                    {scraping ? "⚙️ Scrapeando..." : "🌐 Extraer plan"}
                  </button>
                </div>
                <div style={{ fontSize: 11, color: C.textMuted, marginTop: 6, lineHeight: 1.5 }}>
                  Pegá la URL del plan de estudios. Se intentará extraer las materias automáticamente.
                </div>
              </div>

              {/* Paste text/HTML mode */}
              <div data-plan-mode="paste" style={{ display: "none" }}>
                <div style={{ fontSize: 12, color: C.textSecondary, marginBottom: 8, lineHeight: 1.5 }}>
                  Pegá el <strong>HTML del plan</strong> (clic derecho → Inspeccionar → copiar la sección con las materias) o directamente el <strong>texto con una materia por línea</strong>.
                  El parser detecta automáticamente el formato.
                </div>
                <textarea
                  id="plan-paste-text"
                  placeholder={"Pegá aquí el HTML o texto del plan de estudios.\n\nEjemplo HTML:\n<ul><li>Matemática I (1° Cuatrimestre)</li><li>Física I...</li></ul>\n\nEjemplo texto:\nMatemática I\nFísica I\nQuímica General\n..."}
                  style={{ ...inputStyle, minHeight: 200, resize: "vertical", fontFamily: "monospace", fontSize: 11, lineHeight: 1.5 }}
                />
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <button onClick={() => {
                    const text = document.getElementById("plan-paste-text")?.value || "";
                    if (!text.trim()) return;
                    const parsed = parseTextPlan(text);
                    if (parsed.length === 0) { alert("No se detectaron materias. Verificá el formato."); return; }
                    setScrapedPlan({ subjects: parsed, rawText: text, pdfLinks: [], redirectedUrl: null, preloaded: false });
                  }} style={{ ...btnPrimary, padding: "9px 18px", fontSize: 13 }}>
                    🔍 Extraer materias
                  </button>
                  <button onClick={() => {
                    const text = document.getElementById("plan-paste-text")?.value || "";
                    if (!text.trim() || !apiKey) { if (!apiKey) setShowApiKeyModal(true); return; }
                    setAiExtracting(true);
                    aiExtractSubjects(text, apiKey, selectedModel)
                      .then(subjects => {
                        setScrapedPlan({ subjects: subjects.map(s => ({ name: s, details: "" })), rawText: text, pdfLinks: [], redirectedUrl: null, preloaded: false, aiParsed: true });
                      })
                      .catch(e => setError("IA: " + e.message))
                      .finally(() => setAiExtracting(false));
                  }} disabled={aiExtracting} style={{ ...btnOutline, fontSize: 12, padding: "9px 14px", borderColor: "rgba(139,92,246,0.3)", color: "#7C3AED" }}>
                    {aiExtracting ? "⚙️ Procesando..." : "🤖 Extraer con IA"}
                  </button>
                </div>
              </div>

              {/* PDF mode */}
              <div data-plan-mode="pdf" style={{ display: "none" }}>
                <div style={{ padding: 16, borderRadius: 8, border: `2px dashed ${C.redBorder}`, background: C.redSoft, textAlign: "center" }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>📄</div>
                  <div style={{ fontSize: 13, color: C.textSecondary, marginBottom: 10 }}>Subí el plan en PDF, DOCX o TXT</div>
                  <input type="file" accept=".pdf,.docx,.doc,.txt" onChange={async e => {
                    const file = e.target.files[0]; if (!file) return;
                    try {
                      const text = await extractTextFromFile(file);
                      const parsed = parseTextPlan(text);
                      setScrapedPlan({ subjects: parsed, rawText: text, pdfLinks: [], redirectedUrl: null, preloaded: false });
                    } catch(err) { setError(err.message); }
                  }} style={{ fontSize: 13 }} />
                </div>
              </div>

              {/* Sheets mode */}
              <div data-plan-mode="sheets" style={{ display: "none" }}>
                <div style={{ display: "flex", gap: 8 }}>
                  <input placeholder="https://docs.google.com/spreadsheets/d/..." value={sheetsUrl} onChange={e => setSheetsUrl(e.target.value)} style={{ ...inputStyle, flex: 1, fontSize: 12 }} />
                  <button onClick={handleSheetsImport} disabled={sheetsLoading} style={{ ...btnPrimary, padding: "10px 16px", fontSize: 12, whiteSpace: "nowrap", background: C.green, opacity: sheetsLoading ? 0.6 : 1 }}>
                    {sheetsLoading ? "⚙️..." : "📊 Importar"}
                  </button>
                </div>
                <div style={{ fontSize: 11, color: C.textMuted, marginTop: 6 }}>El Sheet debe estar compartido como "Cualquier persona con el enlace".</div>
                {sheetsData && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontSize: 12, color: C.green, fontWeight: 600, marginBottom: 6 }}>{sheetsData.length} filas importadas</div>
                    <button onClick={() => {
                      const subjects = sheetsData.slice(1).map(r => r[0]).filter(s => s && s.length > 2);
                      const uni = originUniversity.includes("Otra") ? customUniversity : originUniversity;
                      const car = originCareer.includes("Otra") ? customCareer : originCareer;
                      savePlan(uni, car, subjects.map(s => ({ name: s, details: "" })), sheetsUrl);
                      setSheetsData(null); setSheetsUrl("");
                    }} style={{ ...btnPrimary, padding: "8px 16px", fontSize: 12, background: C.green }}>
                      💾 Guardar materias (1era columna)
                    </button>
                  </div>
                )}
              </div>

              {/* Google Drive mode */}
              {isGoogleDriveConfigured() && (
              <div data-plan-mode="drive" style={{ display: "none" }}>
                <div style={{ padding: 24, borderRadius: 10, border: `2px dashed #4285F4`, background: "#EBF3FE", textAlign: "center" }}>
                  <div style={{ fontSize: 40, marginBottom: 10 }}>📁</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#1A73E8", marginBottom: 8 }}>
                    Seleccionar archivo desde Google Drive
                  </div>
                  <div style={{ fontSize: 12, color: C.textSecondary, marginBottom: 16, lineHeight: 1.5 }}>
                    Seleccioná un PDF, DOCX, TXT o Google Sheet con el plan de estudios.<br/>
                    Se abre tu Drive institucional (@ucalpvirtual.edu.ar).
                  </div>
                  <button onClick={handleGoogleDrivePick} disabled={driveLoading} style={{
                    padding: "12px 28px", borderRadius: 9, border: "none", cursor: driveLoading ? "wait" : "pointer",
                    background: "#1A73E8", color: "#fff", fontSize: 14, fontWeight: 700,
                    boxShadow: "0 2px 8px rgba(26,115,232,0.3)", transition: "all 0.15s",
                    opacity: driveLoading ? 0.7 : 1, display: "inline-flex", alignItems: "center", gap: 8
                  }}>
                    {driveLoading ? (
                      <><span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⚙️</span> Cargando...</>
                    ) : (
                      <>
                        <svg width="18" height="18" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
                          <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066DA"/>
                          <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0-1.2 4.5h27.5z" fill="#00AC47"/>
                          <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.8l5.95 10.3z" fill="#EA4335"/>
                          <path d="M43.65 25 57.4 1.2C56.05.4 54.5 0 52.9 0H34.4c-1.6 0-3.15.45-4.5 1.2z" fill="#00832D"/>
                          <path d="M59.8 53H27.5L13.75 76.8c1.35.8 2.9 1.2 4.5 1.2h36.85c1.6 0 3.15-.45 4.5-1.2z" fill="#2684FC"/>
                          <path d="M73.4 26.5 60.65 4.5c-.8-1.4-1.95-2.5-3.3-3.3L43.6 25l16.15 28h27.5c0-1.55-.4-3.1-1.2-4.5z" fill="#FFBA00"/>
                        </svg>
                        Abrir Google Drive
                      </>
                    )}
                  </button>
                </div>
              </div>
              )}

              {/* Result display */}
              {scrapedPlan && (
                <div style={{ marginTop: 16, padding: 16, borderRadius: 10, background: scrapedPlan.preloaded ? C.greenSoft : C.blueSoft, border: `1px solid ${scrapedPlan.preloaded ? C.greenBorder : C.blueBorder}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: scrapedPlan.preloaded ? C.green : C.blue }}>
                      {scrapedPlan.driveFile
                        ? `📁 ${scrapedPlan.driveFile} — ${scrapedPlan.subjects.length} materias detectadas`
                        : scrapedPlan.preloaded ? `✅ Plan precargado${scrapedPlan.preloadedName ? ` — ${scrapedPlan.preloadedName}` : ""}` : `🔍 ${scrapedPlan.subjects.length} materias detectadas${scrapedPlan.aiParsed ? " (con IA)" : ""}`}
                    </div>
                    {scrapedPlan.subjects.length > 0 && (
                      <div style={{ fontSize: 11, color: C.textMuted }}>
                        Hacé clic en ✕ para eliminar filas que no sean materias
                      </div>
                    )}
                  </div>
                  {scrapedPlan.subjects.length > 0 ? (
                    <div>
                      <div style={{ maxHeight: 340, overflow: "auto", display: "flex", flexDirection: "column", gap: 3, marginBottom: 12 }}>
                        {scrapedPlan.subjects.map((s, i) => (
                          <div key={i} style={{ padding: "5px 8px 5px 10px", borderRadius: 5, background: C.surface, border: `1px solid ${C.borderLight}`, fontSize: 12, color: C.text, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                            <div style={{ display: "flex", alignItems: "center", flex: 1, minWidth: 0 }}>
                              <span style={{ color: C.textMuted, marginRight: 8, fontSize: 10, flexShrink: 0 }}>{i + 1}.</span>
                              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</span>
                            </div>
                            <button onClick={() => {
                              setScrapedPlan(prev => ({
                                ...prev,
                                subjects: prev.subjects.filter((_, idx) => idx !== i)
                              }));
                            }} style={{
                              background: "none", border: "none", cursor: "pointer", color: C.redAccent,
                              fontSize: 14, padding: "2px 6px", borderRadius: 4, flexShrink: 0,
                              opacity: 0.5, transition: "opacity 0.15s"
                            }}
                            onMouseEnter={e => e.currentTarget.style.opacity = "1"}
                            onMouseLeave={e => e.currentTarget.style.opacity = "0.5"}
                            title="Eliminar esta fila"
                            >✕</button>
                          </div>
                        ))}
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <button onClick={() => {
                          const uni = originUniversity.includes("Otra") ? customUniversity : originUniversity;
                          const car = originCareer.includes("Otra") ? customCareer : originCareer;
                          savePlan(uni, car, scrapedPlan.subjects, scrapeUrl || "");
                          setScrapedPlan(null); setScrapeUrl("");
                        }} style={{ ...btnPrimary, padding: "10px 20px", fontSize: 13 }}>
                          💾 Guardar este plan ({scrapedPlan.subjects.length} materias)
                        </button>
                        <button onClick={() => setScrapedPlan(null)} style={{ ...btnOutline, padding: "10px 16px", fontSize: 12 }}>
                          Descartar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: 13, color: C.textSecondary, marginBottom: 8 }}>No se detectaron materias automáticamente.</div>
                      {scrapedPlan.pdfLinks?.length > 0 && (
                        <div style={{ marginBottom: 10, fontSize: 12, color: C.amber }}>📄 {scrapedPlan.pdfLinks.length} PDF(s) encontrados — probá scrapeando el PDF directo.</div>
                      )}
                      {apiKey && scrapedPlan.rawText && (
                        <button onClick={() => {
                          setAiExtracting(true);
                          aiExtractSubjects(scrapedPlan.rawText, apiKey, selectedModel)
                            .then(subjects => setScrapedPlan({ ...scrapedPlan, subjects: subjects.map(s => ({ name: s, details: "" })), aiParsed: true }))
                            .catch(e => setError("IA: " + e.message))
                            .finally(() => setAiExtracting(false));
                        }} disabled={aiExtracting} style={{ ...btnOutline, fontSize: 12, padding: "8px 14px", borderColor: "rgba(139,92,246,0.3)", color: "#7C3AED" }}>
                          {aiExtracting ? "⚙️..." : "🤖 Extraer con IA"}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Saved Plans */}
            {savedPlans.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 18, color: C.text, marginBottom: 14, fontWeight: 700 }}>Planes guardados ({savedPlans.length})</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {savedPlans.map(plan => (
                    <details key={plan.id} style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, overflow: "hidden" }}>
                      <summary style={{ padding: "14px 18px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 14, fontWeight: 600, color: C.text, listStyle: "none" }}>
                        <div>
                          <div style={{ color: C.blue }}>{plan.university} — {plan.career}</div>
                          <div style={{ fontSize: 12, color: C.textMuted, fontWeight: 400, marginTop: 2 }}>
                            {plan.subjects?.length || 0} materias · {new Date(plan.date).toLocaleDateString("es-AR")}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <button onClick={(e) => { e.preventDefault(); deletePlan(plan.id); }} style={{ ...btnOutline, fontSize: 11, padding: "4px 10px", borderColor: C.redBorder, color: C.redAccent }}>🗑</button>
                          <span style={{ fontSize: 12, color: C.textMuted }}>▾</span>
                        </div>
                      </summary>
                      <div style={{ padding: "0 18px 18px" }}>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {(plan.subjects || []).map((s, i) => (
                            <div key={i} style={{ padding: "6px 12px", borderRadius: 6, background: C.bg, border: `1px solid ${C.borderLight}`, fontSize: 12, color: C.text }}>{s.name || s}</div>
                          ))}
                        </div>
                        {plan.url && <div style={{ marginTop: 10, fontSize: 11, color: C.textMuted }}>Fuente: <a href={plan.url} target="_blank" rel="noopener" style={{ color: C.blue }}>{plan.url}</a></div>}
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════ PROGRAMS ═══════ */}
        {tab === "programs" && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 24, color: C.text, marginBottom: 4, fontWeight: 700 }}>Plan de Estudios — UCALP</h2>
            <p style={{ color: C.textSecondary, fontSize: 14, marginBottom: 8 }}>
              Licenciatura en Gobernanza de Datos · 41 materias · 6.250 hs · 250 créditos
            </p>
            <div style={{ display: "flex", gap: 12, marginBottom: 22, flexWrap: "wrap" }}>
              <span style={{ fontSize: 12, padding: "4px 12px", borderRadius: 20, background: C.greenSoft, color: C.green, fontWeight: 600, border: `1px solid ${C.greenBorder}` }}>
                ✓ {Object.values(UCALP_PROGRAMS).filter(p => p.hasProgram).length} programas completos
              </span>
              <span style={{ fontSize: 12, padding: "4px 12px", borderRadius: 20, background: C.amberSoft, color: C.amber, fontWeight: 600, border: `1px solid ${C.amberBorder}` }}>
                ⚠ {Object.values(UCALP_PROGRAMS).filter(p => !p.hasProgram).length} programas provisionales
              </span>
              <span style={{ fontSize: 12, padding: "4px 12px", borderRadius: 20, background: C.blueSoft, color: C.blue, fontWeight: 600, border: `1px solid ${C.blueBorder}` }}>
                📎 {Object.keys(programAttachments).length} programas adjuntados
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {Object.entries(UCALP_PLAN).map(([yearKey, yearData]) => (
                <div key={yearKey}>
                  <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 16, color: C.redAccent, marginBottom: 10, fontWeight: 700 }}>{yearData.label}</h3>
                  {Object.entries(yearData.semestres).map(([semKey, semData]) => (
                    <div key={semKey} style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: C.textSecondary, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.4px" }}>{semData.label}</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {semData.subjects.map(key => {
                          const prog = UCALP_PROGRAMS[key];
                          if (!prog) return null;
                          const attachment = programAttachments[key];
                          const isUploading = programUploading === key;
                          return (
                            <details key={key} style={{ background: C.surface, borderRadius: 10, border: `1px solid ${prog.hasProgram ? C.border : C.amberBorder}`, overflow: "hidden" }}>
                              <summary style={{ padding: "12px 16px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", listStyle: "none" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                  <span style={{ fontSize: 11, padding: "2px 6px", borderRadius: 4, background: prog.hasProgram ? C.greenSoft : C.amberSoft, color: prog.hasProgram ? C.green : C.amber, fontWeight: 700 }}>
                                    {prog.cod}
                                  </span>
                                  <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{prog.name}</span>
                                  {!prog.hasProgram && <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 4, background: C.amberSoft, color: C.amber, fontWeight: 700, border: `1px solid ${C.amberBorder}` }}>PROVISIONAL</span>}
                                  {attachment && <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 4, background: C.blueSoft, color: C.blue, fontWeight: 700, border: `1px solid ${C.blueBorder}` }}>📎 ADJUNTO</span>}
                                </div>
                                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                                  <span style={{ fontSize: 11, color: C.textMuted }}>{prog.credits} créd · {prog.totalHours} hs</span>
                                  {prog.professor && <span style={{ fontSize: 11, color: C.textMuted }}>Prof. {prog.professor}</span>}
                                  <span style={{ fontSize: 12, color: C.textMuted }}>▾</span>
                                </div>
                              </summary>
                              <div style={{ padding: "0 16px 16px", borderTop: `1px solid ${C.borderLight}` }}>
                                {/* Unidades del programa */}
                                {prog.hasProgram ? (
                                  <div style={{ paddingTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                                    {prog.units.map(u => (
                                      <div key={u.number} style={{ padding: 11, borderRadius: 7, background: C.bg, border: `1px solid ${C.borderLight}` }}>
                                        <div style={{ fontSize: 12, fontWeight: 600, color: C.redAccent, marginBottom: 3 }}>Unidad {u.number}: {u.title}</div>
                                        <div style={{ fontSize: 12, color: C.textSecondary, lineHeight: 1.5 }}>{u.topics}</div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div style={{ paddingTop: 12 }}>
                                    <div style={{ padding: 11, borderRadius: 7, background: C.amberSoft, border: `1px solid ${C.amberBorder}`, fontSize: 12, color: "#6B4F00", lineHeight: 1.6 }}>
                                      <div style={{ fontWeight: 700, marginBottom: 6 }}>⚠ Programa en elaboración — Descripción tentativa:</div>
                                      {prog.descripcion}
                                    </div>
                                  </div>
                                )}

                                {/* Programa adjunto */}
                                <div style={{ marginTop: 14, padding: 14, borderRadius: 8, background: attachment ? C.blueSoft : C.bg, border: `1px solid ${attachment ? C.blueBorder : C.borderLight}` }}>
                                  <div style={{ fontSize: 12, fontWeight: 700, color: attachment ? C.blue : C.textSecondary, marginBottom: 8 }}>
                                    📎 Programa adjunto
                                  </div>

                                  {attachment ? (
                                    <div>
                                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                                        <div>
                                          <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{attachment.file_name}</div>
                                          <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>
                                            {attachment.content_text?.length || 0} caracteres extraídos
                                            {attachment.updated_at && ` · ${new Date(attachment.updated_at).toLocaleDateString("es-AR")}`}
                                          </div>
                                        </div>
                                        <div style={{ display: "flex", gap: 6 }}>
                                          {attachment.file_url && (
                                            <a href={attachment.file_url} target="_blank" rel="noopener noreferrer"
                                              onClick={(e) => e.stopPropagation()}
                                              style={{ ...btnOutline, fontSize: 11, padding: "4px 10px", borderColor: C.blueBorder, color: C.blue, textDecoration: "none" }}>
                                              📥 Descargar
                                            </a>
                                          )}
                                          <button onClick={(e) => { e.stopPropagation(); handleProgramDelete(key); }} style={{ ...btnOutline, fontSize: 11, padding: "4px 10px", borderColor: C.redBorder, color: C.redAccent }}>🗑</button>
                                        </div>
                                      </div>
                                      <details style={{ marginTop: 4 }}>
                                        <summary style={{ fontSize: 11, color: C.blue, cursor: "pointer", fontWeight: 600 }}>Ver contenido extraído</summary>
                                        <div style={{ marginTop: 8, padding: 10, borderRadius: 6, background: C.surface, border: `1px solid ${C.borderLight}`, fontSize: 11, color: C.textSecondary, lineHeight: 1.6, maxHeight: 200, overflow: "auto", whiteSpace: "pre-wrap" }}>
                                          {attachment.content_text?.substring(0, 3000) || "(vacío)"}
                                          {attachment.content_text?.length > 3000 && "\n\n... (contenido truncado)"}
                                        </div>
                                      </details>
                                    </div>
                                  ) : (
                                    <div>
                                      <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 10 }}>
                                        Adjuntá el programa oficial (PDF, DOCX o TXT). El texto se extrae y el archivo se guarda.
                                      </div>
                                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                                        <label style={{
                                          display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px",
                                          borderRadius: 7, border: `1.5px solid ${C.border}`, background: C.surface,
                                          cursor: isUploading ? "wait" : "pointer", fontSize: 12, fontWeight: 500,
                                          color: C.textSecondary, transition: "all 0.15s",
                                          opacity: isUploading ? 0.6 : 1
                                        }}>
                                          📄 {isUploading ? "Subiendo..." : "Subir archivo"}
                                          <input type="file" accept=".pdf,.docx,.doc,.txt" style={{ display: "none" }}
                                            disabled={isUploading}
                                            onChange={(e) => {
                                              const file = e.target.files[0];
                                              if (file) handleProgramFileUpload(key, file);
                                              e.target.value = "";
                                            }}
                                          />
                                        </label>
                                        {isGoogleDriveConfigured() && (
                                          <button onClick={(e) => { e.stopPropagation(); handleProgramDrivePick(key); }}
                                            disabled={isUploading}
                                            style={{
                                              display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px",
                                              borderRadius: 7, border: "1.5px solid #BBDEFB", background: "#EBF3FE",
                                              cursor: isUploading ? "wait" : "pointer", fontSize: 12, fontWeight: 500,
                                              color: "#1A73E8", transition: "all 0.15s",
                                              opacity: isUploading ? 0.6 : 1
                                            }}>
                                            📁 Google Drive
                                          </button>
                                        )}
                                        {isGoogleDriveConfigured() && (
                                          <button onClick={(e) => { e.stopPropagation(); setGmailTarget(key); setGmailResults(null); setGmailSearch(prog.name); }}
                                            disabled={isUploading}
                                            style={{
                                              display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px",
                                              borderRadius: 7, border: "1.5px solid #FFCDD2", background: "#FFEBEE",
                                              cursor: isUploading ? "wait" : "pointer", fontSize: 12, fontWeight: 500,
                                              color: "#C62828", transition: "all 0.15s",
                                              opacity: isUploading ? 0.6 : 1
                                            }}>
                                            ✉️ Buscar en Gmail
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </details>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══════ SETTINGS ═══════ */}
        {tab === "settings" && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
              <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 24, color: C.text, margin: 0, fontWeight: 700 }}>Configuración</h2>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, alignItems: "start" }}>

              {/* Columna izquierda */}
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

                {/* Usuario actual */}
                {authSession && authProfile && (
                  <div style={{ ...cardStyle }}>
                    <SectionTitle icon="👤" color={C.red} label="Tu cuenta" />
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <div style={{ width: 48, height: 48, borderRadius: "50%", background: C.redSoft, border: `2px solid ${C.redBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                        {(authProfile.nombre?.[0] || "?").toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{authProfile.nombre} {authProfile.apellido}</div>
                        <div style={{ fontSize: 12, color: C.textMuted }}>{authProfile.email}</div>
                        <div style={{ marginTop: 4 }}>
                          <span style={{ fontSize: 11, padding: "2px 10px", borderRadius: 5, background: ROL_LABELS[rol]?.bg || C.bg, color: ROL_LABELS[rol]?.color || C.text, fontWeight: 700 }}>
                            {ROL_LABELS[rol]?.label || rol}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button onClick={handleLogout} style={{ ...btnOutline, marginTop: 14, width: "100%", fontSize: 12, borderColor: C.redBorder, color: C.redAccent }}>
                      ↩ Cerrar sesión
                    </button>
                  </div>
                )}

                {/* API Key OpenRouter */}
                <div style={cardStyle}>
                  <SectionTitle icon="🔑" color={C.redAccent} label="API Key de OpenRouter" />
                  <p style={{ fontSize: 13, color: C.textSecondary, marginBottom: 14, lineHeight: 1.5 }}>
                    Necesitás una key de <a href="https://openrouter.ai/keys" target="_blank" rel="noopener" style={{ color: C.red, fontWeight: 600, textDecoration: "none" }}>openrouter.ai/keys</a> para los análisis. El plan gratuito incluye ~50 consultas/día.
                  </p>
                  <input type="password" placeholder="sk-or-v1-..." value={apiKey} onChange={e => saveApiKey(e.target.value)} style={{ ...inputStyle, fontFamily: "monospace" }} />
                  {apiKey && <div style={{ marginTop: 6, fontSize: 12, color: C.green, fontWeight: 500 }}>✓ Configurada ({apiKey.substring(0, 14)}...)</div>}
                </div>

                {/* Datos almacenados */}
                <div style={cardStyle}>
                  <SectionTitle icon="📊" color={C.textSecondary} label="Datos almacenados" />
                  <div style={{ fontSize: 13, color: C.textSecondary, marginBottom: 12 }}>
                    {analyses.length} análisis · {stats.universities} universidades · {savedPlans.length} planes guardados
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {analyses.length > 0 && <>
                      <button onClick={exportCSV} style={{ ...btnOutline, fontSize: 12 }}>📥 Exportar CSV</button>
                      <button onClick={clearAll} style={{ ...btnOutline, borderColor: C.redBorder, color: C.redAccent, fontSize: 12 }}>🗑 Análisis</button>
                    </>}
                    <button onClick={() => { if (confirm("¿Limpiar el caché de la Tabla Provisoria?")) { setTablaCache({}); saveData("eq-tabla-cache", {}); }}} style={{ ...btnOutline, fontSize: 12 }}>🗑 Caché Tabla</button>
                  </div>
                </div>
              </div>

              {/* Columna derecha */}
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

                {/* Modelo */}
                <div style={cardStyle}>
                  <SectionTitle icon="🤖" color={C.textSecondary} label="Modelo por defecto" />
                  <p style={{ fontSize: 12, color: C.textSecondary, marginBottom: 10 }}>Para la Tabla Provisoria se recomienda un modelo gratuito (Trinity o Gemini Flash) — usa 1 consulta por análisis batch.</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {MODELS.map(m => (
                      <button key={m.id} onClick={() => saveModel(m.id)} style={{
                        padding: "10px 14px", borderRadius: 8, cursor: "pointer", textAlign: "left", fontSize: 13,
                        border: `1.5px solid ${selectedModel === m.id ? C.red : C.border}`,
                        background: selectedModel === m.id ? C.redSoft : C.surface,
                        color: selectedModel === m.id ? C.redAccent : C.textSecondary,
                      }}>
                        <span style={{ marginRight: 6 }}>{m.icon}</span>
                        <span style={{ fontWeight: 600 }}>{m.label}</span>
                        <span style={{ marginLeft: 8, fontSize: 10, color: C.textMuted }}>{m.id}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Gestión de usuarios — solo director */}
                {isDirector && (
                  <div style={cardStyle}>
                    <SectionTitle icon="👥" color={C.red} label="Gestión de usuarios" />
                    <p style={{ fontSize: 13, color: C.textSecondary, marginBottom: 12, lineHeight: 1.5 }}>
                      Invitá usuarios desde <strong>Supabase → Authentication → Users → Invite user</strong>. Luego asigná el rol con SQL:
                    </p>
                    <code style={{ display: "block", background: C.bg, padding: "10px 12px", borderRadius: 7, fontSize: 11, fontFamily: "monospace", lineHeight: 1.7, color: C.text, border: `1px solid ${C.borderLight}` }}>
                      update profiles set rol = 'decano'<br/>
                      where email = 'decano@ucalp.edu.ar';
                    </code>
                    <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 6 }}>
                      {[
                        { rol: "director",      desc: "Acceso total + gestión de usuarios" },
                        { rol: "decano",        desc: "Acceso total (lectura y escritura)" },
                        { rol: "secretaria",    desc: "Acceso total (lectura y escritura)" },
                        { rol: "otro_director", desc: "Solo lectura" },
                      ].map(r => {
                        const rs = ROL_LABELS[r.rol] || {};
                        return (
                          <div key={r.rol} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 7, background: C.bg, border: `1px solid ${C.borderLight}` }}>
                            <span style={{ padding: "2px 10px", borderRadius: 5, background: rs.bg, color: rs.color, fontSize: 11, fontWeight: 700, minWidth: 80, textAlign: "center", flexShrink: 0 }}>{r.rol}</span>
                            <span style={{ fontSize: 12, color: C.textSecondary }}>{r.desc}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        )}
      </main>
      </div> {/* end flex body */}

      {/* API Key Modal */}
      {showApiKeyModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={() => setShowApiKeyModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: C.surface, borderRadius: 16, padding: 28, border: `1px solid ${C.border}`, maxWidth: 420, width: "90%", boxShadow: "0 20px 50px rgba(0,0,0,0.15)" }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 10 }}>🔑 Configurá tu API Key</h3>
            <p style={{ fontSize: 13, color: C.textSecondary, marginBottom: 18, lineHeight: 1.5 }}>Para ejecutar análisis necesitás una API Key de <a href="https://openrouter.ai/keys" target="_blank" rel="noopener" style={{ color: C.red, fontWeight: 600, textDecoration: "none" }}>openrouter.ai/keys</a></p>
            <input type="password" placeholder="sk-or-v1-..." value={apiKey} onChange={e => saveApiKey(e.target.value)} style={{ ...inputStyle, fontFamily: "monospace", marginBottom: 16 }} autoFocus />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setShowApiKeyModal(false)} style={btnOutline}>Cancelar</button>
              <button onClick={() => { if (apiKey) setShowApiKeyModal(false); }} style={{ ...btnPrimary, opacity: apiKey ? 1 : 0.5 }}>Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {/* Gmail Search Modal */}
      {gmailTarget && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={() => { setGmailTarget(null); setGmailResults(null); }}>
          <div onClick={e => e.stopPropagation()} style={{ background: C.surface, borderRadius: 16, padding: 28, border: `1px solid ${C.border}`, maxWidth: 640, width: "95%", boxShadow: "0 20px 50px rgba(0,0,0,0.2)", maxHeight: "85vh", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: 0 }}>✉️ Buscar programa en Gmail</h3>
                <div style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>
                  Para: <span style={{ fontWeight: 600, color: C.red }}>{UCALP_PROGRAMS[gmailTarget]?.name}</span>
                </div>
              </div>
              <button onClick={() => { setGmailTarget(null); setGmailResults(null); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: C.textMuted, padding: 4 }}>✕</button>
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <input
                placeholder="Buscar por asunto, remitente, materia..."
                value={gmailSearch}
                onChange={e => setGmailSearch(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleGmailSearch(gmailSearch)}
                style={{ ...inputStyle, flex: 1 }}
                autoFocus
              />
              <button onClick={() => handleGmailSearch(gmailSearch)} disabled={gmailLoading} style={{
                ...btnPrimary, padding: "10px 18px", fontSize: 13, whiteSpace: "nowrap",
                background: "#C62828", opacity: gmailLoading ? 0.7 : 1
              }}>
                {gmailLoading ? "⚙️ Buscando..." : "✉️ Buscar"}
              </button>
            </div>

            <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 12, lineHeight: 1.5 }}>
              Buscá por nombre del alumno, materia, o cualquier texto. Se muestran mails con archivos adjuntos (PDF, DOCX, TXT).
            </div>

            {/* Results */}
            <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
              {gmailResults && gmailResults.length === 0 && (
                <div style={{ textAlign: "center", padding: 24, color: C.textMuted }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
                  No se encontraron mails con adjuntos para esa búsqueda.
                </div>
              )}

              {gmailResults && gmailResults.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {gmailResults.map((msg, mi) => (
                    <div key={mi} style={{ padding: "12px 14px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 4 }}>{msg.subject}</div>
                      <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 8 }}>
                        De: {msg.from} · {msg.date}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {msg.attachments.map((att, ai) => (
                          <div key={ai} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 10px", borderRadius: 6, background: C.surface, border: `1px solid ${C.borderLight}` }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                              <span>📎</span>
                              <span style={{ fontWeight: 500, color: C.text }}>{att.filename}</span>
                              <span style={{ fontSize: 10, color: C.textMuted }}>({Math.round(att.size / 1024)} KB)</span>
                            </div>
                            <button
                              onClick={() => handleGmailAttach(msg.messageId, att.attachmentId, att.filename)}
                              disabled={programUploading === gmailTarget}
                              style={{
                                padding: "5px 12px", borderRadius: 6, border: "none", cursor: "pointer",
                                background: C.red, color: "#fff", fontSize: 11, fontWeight: 700,
                                opacity: programUploading === gmailTarget ? 0.6 : 1
                              }}>
                              {programUploading === gmailTarget ? "⚙️..." : "Adjuntar"}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer style={{ position: "fixed", bottom: 0, left: 200, right: 0, height: 32, background: C.surface, borderTop: `1px solid ${C.borderLight}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: C.textMuted, zIndex: 50 }}>
        Universidad Católica de La Plata · Fac. de Ciencias Exactas e Ingeniería · Lic. en Gobernanza de Datos · Dir. Francisco Fernández Ruiz
      </footer>
    </div>
    )}  {/* end !needsLogin */}
  </div>
  );
}
