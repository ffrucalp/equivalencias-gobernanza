import { useState, useEffect, useRef } from "react";
import { useApp } from "../context/AppContext";
import { getSupabaseClient } from "../supabaseClient";
import { UCALP_PLAN, UCALP_ORDER, UCALP_PROGRAMS, MODELS } from "../lib/constants";
import { C, cardStyle, inputStyle, selectStyle, btnPrimary, btnOutline } from "../lib/styles";
import { Badge, CoverageCircle, UnitDetail, AlertBox, InfoBox, SectionTitle, Label, AutocompleteInput } from "../lib/components";
import { extractTextFromFile, saveData, loadData } from "../lib/utils";

const DRAFT_KEY = "eq-reporte-draft";

export default function ReporteAlumno() {
  const {
    apiKey, selectedModel, saveModel, analyses, setAnalyses,
    savedReports, setSavedReports, authSession, authProfile,
    setShowApiKeyModal, setTab, error, setError
  } = useApp();

  // ── Restore draft from localStorage ──
  const draft = useRef(loadData(DRAFT_KEY, null)).current;
  const [draftRestored, setDraftRestored] = useState(!!draft);

  // ── Local state (initialized from draft if available) ──
  const [rStudentName, setRStudentName] = useState(draft?.name || "");
  const [rStudentDni, setRStudentDni] = useState(draft?.dni || "");
  const [rStudentUni, setRStudentUni] = useState(draft?.uni || "");
  const [rStudentCareer, setRStudentCareer] = useState(draft?.career || "");
  const [raStep, setRaStep] = useState(draft?.step || "datos");
  const [raOriginSubjects, setRaOriginSubjects] = useState(draft?.origins || [{ name: "", program: "", hours: "" }]);
  const [raTargetSubjects, setRaTargetSubjects] = useState(draft?.targets || []);
  const [raStudentAnalyses, setRaStudentAnalyses] = useState(draft?.analyses || []);
  const [existingReportId, setExistingReportId] = useState(draft?.existingReportId || null);
  const [raAnalyzing, setRaAnalyzing] = useState(false);
  const [raError, setRaError] = useState(null);
  const [raResult, setRaResult] = useState(null);
  const [raInputMode, setRaInputMode] = useState("text");
  const [raFileProcessing, setRaFileProcessing] = useState(false);
  const [raFileName, setRaFileName] = useState("");
  const [reportSaving, setReportSaving] = useState(false);

  // ── Progress timer ──
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (raAnalyzing) {
      setElapsedSeconds(0);
      timerRef.current = setInterval(() => setElapsedSeconds(s => s + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [raAnalyzing]);

  // ── Search filter for analyses ──
  const [searchFilter, setSearchFilter] = useState("");

  // ── Auto-save draft (debounced) ──
  const saveTimerRef = useRef(null);
  useEffect(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      const hasDraftData = rStudentName.trim() || rStudentDni.trim() || raStudentAnalyses.length > 0 ||
        raOriginSubjects.some(s => s.name.trim() || s.program.trim());
      if (hasDraftData) {
        saveData(DRAFT_KEY, {
          name: rStudentName, dni: rStudentDni, uni: rStudentUni, career: rStudentCareer,
          step: raStep, origins: raOriginSubjects, targets: raTargetSubjects,
          analyses: raStudentAnalyses, existingReportId: existingReportId
        });
      }
    }, 2000); // save 2 seconds after last change
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [rStudentName, rStudentDni, rStudentUni, rStudentCareer, raStep, raOriginSubjects, raTargetSubjects, raStudentAnalyses]);

  // ── Clear draft ──
  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    setRStudentName(""); setRStudentDni(""); setRStudentUni(""); setRStudentCareer("");
    setRaStep("datos"); setRaOriginSubjects([{ name: "", program: "", hours: "" }]);
    setRaTargetSubjects([]); setRaStudentAnalyses([]); setRaResult(null); setRaError(null);
    setDraftRestored(false); setSearchFilter(""); setExistingReportId(null);
  };

const raAddOriginSubject = () => setRaOriginSubjects(prev => [...prev, { name: "", program: "", hours: "" }]);
const raRemoveOriginSubject = (idx) => setRaOriginSubjects(prev => prev.filter((_, i) => i !== idx));
const raUpdateOriginSubject = (idx, field, value) => setRaOriginSubjects(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
const raToggleTarget = (key) => setRaTargetSubjects(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);

const raHandleFileUpload = async (e, idx) => {
  const file = e.target.files[0]; if (!file) return;
  setRaFileProcessing(true); setRaError(null); setRaFileName(file.name);
  try {
    const text = await extractTextFromFile(file);
    raUpdateOriginSubject(idx, "program", text);
    // Auto-fill name from filename if empty
    const currentName = raOriginSubjects[idx]?.name || "";
    if (!currentName.trim()) {
      const nameFromFile = file.name.replace(/\.(pdf|docx?|txt)$/i, "").replace(/[_-]/g, " ").trim();
      raUpdateOriginSubject(idx, "name", nameFromFile);
    }
  } catch (err) { setRaError(err.message); } finally { setRaFileProcessing(false); }
};

const raHandleMultiFileUpload = async (e) => {
  const files = Array.from(e.target.files); if (!files.length) return;
  setRaFileProcessing(true); setRaError(null);
  try {
    const newSubjects = [];
    for (const file of files) {
      const text = await extractTextFromFile(file);
      const nameFromFile = file.name.replace(/\.(pdf|docx?|txt)$/i, "").replace(/[_-]/g, " ").trim();
      newSubjects.push({ name: nameFromFile, program: text, hours: "" });
    }
    setRaOriginSubjects(prev => {
      // Replace empty first entry or append
      const existing = prev.filter(s => s.name.trim() || s.program.trim());
      return [...existing, ...newSubjects];
    });
  } catch (err) { setRaError(err.message); } finally { setRaFileProcessing(false); }
};

const buildMultiPrompt = (originSubjects, targetKeys) => {
  const targets = targetKeys.map(k => UCALP_PROGRAMS[k]).filter(Boolean);
  const origins = originSubjects.filter(s => s.name.trim());
  const uni = rStudentUni;
  const car = rStudentCareer;

  const originBlock = origins.map((o, i) => `### Materia de origen ${origins.length > 1 ? (i + 1) : ""}
**Materia:** ${o.name}
**Carga horaria:** ${o.hours ? o.hours + " horas totales" : "No especificada (PENALIZAR — solicitar al alumno)"}
**Programa/Contenidos:**
${o.program || "(No provisto — limita severamente el análisis)"}`).join("\n\n");

  const targetBlock = targets.map(t => {
    const isP = !t.hasProgram;
    const correlNames = (t.correlatives || []).map(cod => {
      const found = Object.values(UCALP_PROGRAMS).find(p => p.cod === cod);
      return found ? `${found.name} (${found.cod})` : `Cod. ${cod}`;
    });
    const correlInfo = correlNames.length > 0
      ? `**Correlativas requeridas:** ${correlNames.join(", ")}\n**Implicancia:** El alumno debe demostrar conocimientos previos equivalentes a estas correlativas para que la equivalencia sea académicamente válida.`
      : "**Correlativas:** Ninguna (materia sin prerrequisitos)";

    const hoursInfo = `**Carga horaria total:** ${t.totalHours || t.hours || "?"} hs | **Horas semanales:** ${t.weeklyHours || "?"} hs | **Duración:** ${t.semester === "1S" || t.semester === "2S" ? "Semestral" : "Anual"}`;

    return `### ${t.name} ${isP ? "(PROGRAMA PROVISORIO — análisis limitado)" : ""}
**Código:** ${t.cod} | **Año:** ${t.year} | **Semestre:** ${t.semester === "1S" ? "1° Semestre" : t.semester === "2S" ? "2° Semestre" : "Anual"}
**Créditos:** ${t.credits} | ${hoursInfo}
${correlInfo}
${isP ? `**Descripción tentativa:** ${t.descripcion || "No disponible"}` :
`**Unidades temáticas:**\n${(t.units || []).map(u => `- Unidad ${u.number}: ${u.title}\n  Contenidos mínimos: ${u.topics}`).join("\n")}`}`;
  }).join("\n\n");

  // Build hours comparison table
  const originHoursTable = origins.map(o => `| ${o.name} | ${o.hours ? o.hours + " hs" : "NO ESPECIFICADA"} |`).join("\n");
  const targetHoursTable = targets.map(t => `| ${t.name} | ${t.totalHours || t.hours || "?"} hs | ${t.credits} cr |`).join("\n");

  return `Sos un experto académico en análisis de equivalencias universitarias en Argentina, con amplio conocimiento de la Ley de Educación Superior N° 24.521, normativas CONEAU, y reglamentos internos de equivalencias. Tu análisis debe ser RIGUROSO y CONSERVADOR — una equivalencia mal otorgada perjudica la formación del alumno.

## CONTEXTO INSTITUCIONAL
El análisis es para la **Licenciatura en Gobernanza de Datos** de la **Universidad Católica de La Plata (UCALP)**, Facultad de Ciencias Exactas e Ingeniería. Es una carrera nueva con perfil interdisciplinario (tecnología + gestión + normativa de datos).

## ALUMNO
**Universidad de origen:** ${uni}
**Carrera de origen:** ${car}
${origins.length > 1 ? `El alumno presenta ${origins.length} materias de origen que podrían cubrir en conjunto los contenidos de las materias destino. Evaluá la cobertura COMBINADA.` : `Análisis individual de equivalencia.`}

## ${origins.length > 1 ? "MATERIAS" : "MATERIA"} DE ORIGEN (cursadas por el alumno)
${originBlock}

## ${targets.length > 1 ? "MATERIAS" : "MATERIA"} DESTINO UCALP
${targetBlock}

## TABLA COMPARATIVA DE CARGA HORARIA
**Origen:**
| Materia | Carga horaria |
|---|---|
${originHoursTable}

**Destino UCALP:**
| Materia | Carga horaria | Créditos |
|---|---|---|
${targetHoursTable}

## METODOLOGÍA DE ANÁLISIS (los 3 ejes son OBLIGATORIOS)

### EJE 1: COBERTURA DE CONTENIDOS (peso: 50%)
- Analizá UNIDAD POR UNIDAD de la materia destino.
- Para cada unidad, determiná qué porcentaje de los contenidos mínimos están cubiertos por la(s) materia(s) de origen.
- NO basta con coincidencia de nombres: los contenidos específicos deben ser equivalentes en profundidad y alcance.
- Si el programa de origen no fue provisto, el análisis queda severamente limitado — clasificar como NO_EVALUABLE salvo que el nombre de la materia sea idéntico y la carga horaria comparable.
${origins.length > 1 ? "- Cuando hay varias materias de origen, sumá las coberturas pero NO dupliques: si dos materias cubren el mismo tema, contalo una sola vez." : ""}

### EJE 2: CARGA HORARIA (peso: 30%) — CRÍTICO
Este eje es DETERMINANTE. La carga horaria refleja la profundidad de tratamiento.

**REGLAS ESTRICTAS:**
- Origen ≥ 100% de destino → Factor horario: FAVORABLE (no penaliza)
- Origen entre 75%-99% de destino → Factor horario: ACEPTABLE (penalización leve)
- Origen entre 50%-74% de destino → Factor horario: INSUFICIENTE → MÁXIMO: Equivalencia Parcial, sin importar la cobertura de contenidos
- Origen < 50% de destino → Factor horario: MUY INSUFICIENTE → MÁXIMO: Sin Equivalencia
- Origen NO ESPECIFICADA → Factor horario: INDETERMINADO → Mencionarlo como riesgo, solicitar documentación al alumno. Actuar como si fuera insuficiente para no otorgar equivalencia total sin certeza.
${origins.length > 1 ? "- Con varias materias de origen, SUMÁ las cargas horarias de las que cubren contenidos relevantes." : ""}

**Cálculo explícito obligatorio:** Incluí en el JSON el campo "comparacion_carga_horaria" con formato:
"Origen: X hs (materia1 + materia2) vs Destino: Y hs → Ratio: X/Y = Z% → [FAVORABLE/ACEPTABLE/INSUFICIENTE/MUY INSUFICIENTE/INDETERMINADO]"

### EJE 3: CORRELATIVIDADES Y COHERENCIA CURRICULAR (peso: 20%)
- Revisá las correlativas indicadas para cada materia destino.
- Si la materia destino requiere prerrequisitos (ej: "Matemática" es correlativa de "Probabilidad y Estadística"), evaluá si el alumno cursó algo equivalente a esas correlativas en su carrera de origen.
- Si hay correlativas no cubiertas, esto NO impide la equivalencia pero DEBE mencionarse como observación porque afecta la secuencia curricular.
- Para materias de 3° y 4° año, las correlatividades son especialmente relevantes.

## CRITERIOS DE CLASIFICACIÓN FINAL (aplicar los 3 ejes conjuntamente)

| Clasificación | Contenidos | Carga horaria | Resultado |
|---|---|---|---|
| **TOTAL** | ≥80% cobertura global | ≥75% de la destino | Equivalencia completa |
| **PARCIAL** | ≥50% cobertura | ≥50% de la destino | Reconocimiento parcial — indicar unidades a rendir |
| **SIN_EQUIVALENCIA** | <50% cobertura | O <50% carga horaria | Debe cursar la materia completa |
| **NO_EVALUABLE** | Programa no provisto o provisorio insuficiente | — | Requiere documentación adicional |

**REGLA DE ORO:** En caso de duda entre TOTAL y PARCIAL, elegir PARCIAL. En caso de duda entre PARCIAL y SIN_EQUIVALENCIA, elegir SIN_EQUIVALENCIA. Es preferible que el alumno rinda temas de más a que le falten conocimientos.

## FORMATO DE RESPUESTA (SOLO JSON válido, sin backticks, sin texto adicional):
{
"resultados": [
  ${targets.map(t => `{
    "materia_destino_key": "${targetKeys[targets.indexOf(t)]}",
    "materia_destino_nombre": "${t.name}",
    "es_provisional": ${!t.hasProgram},
    "clasificacion": "TOTAL | PARCIAL | SIN_EQUIVALENCIA | NO_EVALUABLE",
    "porcentaje_cobertura_global": 0,
    "porcentaje_cobertura_contenidos": 0,
    "comparacion_carga_horaria": "Origen: X hs vs Destino: ${t.totalHours || "?"} hs → Ratio: Z% → FAVORABLE/INSUFICIENTE",
    "factor_horario": "FAVORABLE | ACEPTABLE | INSUFICIENTE | MUY_INSUFICIENTE | INDETERMINADO",
    "analisis_por_unidad": [
      { "unidad": 1, "titulo": "", "cobertura": 0, "coincidencias": "", "faltantes": "" }
    ],
    "unidades_reconocidas": [],
    "unidades_a_rendir": [],
    "justificacion": "Análisis detallado integrando contenidos + carga horaria + correlatividades",
    "observaciones_correlatividades": "Estado de las correlativas del alumno",
    "recomendacion": "Acción sugerida para el Director de Carrera",
    "observaciones": "Notas adicionales, riesgos, documentación faltante"
  }`).join(",\n    ")}
]
}`;
};

const runMultiAnalysis = async () => {
  if (!apiKey) { setShowApiKeyModal(true); return; }
  const origins = raOriginSubjects.filter(s => s.name.trim());
  if (origins.length === 0) { setRaError("Ingresá al menos una materia de origen."); return; }
  if (origins.every(s => !s.program.trim())) { setRaError("Ingresá el programa de al menos una materia de origen."); return; }
  if (raTargetSubjects.length === 0) { setRaError("Seleccioná al menos una materia UCALP destino."); return; }
  setRaAnalyzing(true); setRaError(null); setRaResult(null);
  const prompt = buildMultiPrompt(origins, raTargetSubjects);
  const uni = rStudentUni;
  const car = rStudentCareer;
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

const saveReport = async () => {
  if (!rStudentName.trim() || raStudentAnalyses.length === 0 || reportSaving) return;
  setReportSaving(true);
  try {
    const summary = {
      total: raStudentAnalyses.filter(a => a.result?.clasificacion === "TOTAL").length,
      parcial: raStudentAnalyses.filter(a => a.result?.clasificacion === "PARCIAL").length,
      sin: raStudentAnalyses.filter(a => a.result?.clasificacion === "SIN_EQUIVALENCIA").length,
    };

    const sbUrl = import.meta.env.VITE_SUPABASE_URL || localStorage.getItem("eq-supabase-url");
    const sbKey = import.meta.env.VITE_SUPABASE_ANON_KEY || localStorage.getItem("eq-supabase-key");
    const token = authSession?.access_token;

    if (sbUrl && sbKey) {
      const reportData = {
        alumno_nombre: rStudentName,
        alumno_dni: rStudentDni,
        origin_university: rStudentUni,
        origin_career: rStudentCareer,
        resultados: { analyses: raStudentAnalyses, summary },
        estado: "generado",
        firmado_por: "Dir. Francisco Fernández Ruiz",
        fecha_emision: new Date().toISOString().slice(0, 10),
      };

      if (existingReportId) {
        // ── UPDATE existing report ──
        console.log("📤 Actualizando reporte...", existingReportId);
        const resp = await fetch(`${sbUrl}/rest/v1/reportes_equivalencias?id=eq.${existingReportId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", "apikey": sbKey, "Authorization": `Bearer ${token || sbKey}`, "Prefer": "return=representation" },
          body: JSON.stringify(reportData)
        });
        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          throw new Error(err.message || `HTTP ${resp.status}`);
        }
        const [updated] = await resp.json();
        console.log("✓ Reporte actualizado en Supabase:", existingReportId);
        const report = {
          id: existingReportId, student_name: rStudentName, student_dni: rStudentDni,
          origin_university: rStudentUni, origin_career: rStudentCareer,
          analyses: raStudentAnalyses, summary,
          estado: updated?.estado || "generado", firmado_por: updated?.firmado_por,
          notas_director: updated?.notas_director, created_at: updated?.created_at,
        };
        setSavedReports(prev => prev.map(r => r.id === existingReportId ? report : r));
        alert("✅ Reporte actualizado correctamente.");
      } else {
        // ── INSERT new report ──
        console.log("📤 Guardando reporte nuevo...");
        reportData.created_at = new Date().toISOString();
        reportData.created_by = authSession?.user?.id || null;
        const resp = await fetch(`${sbUrl}/rest/v1/reportes_equivalencias`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "apikey": sbKey, "Authorization": `Bearer ${token || sbKey}`, "Prefer": "return=representation" },
          body: JSON.stringify(reportData)
        });
        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          throw new Error(err.message || `HTTP ${resp.status}`);
        }
        const [inserted] = await resp.json();
        console.log("✓ Reporte guardado en Supabase:", inserted?.id);
        const report = {
          id: inserted.id, student_name: rStudentName, student_dni: rStudentDni,
          origin_university: rStudentUni, origin_career: rStudentCareer,
          analyses: raStudentAnalyses, summary,
          estado: inserted.estado, firmado_por: inserted.firmado_por,
          notas_director: inserted.notas_director, created_at: inserted.created_at,
        };
        setSavedReports(prev => [report, ...prev]);
        alert("✅ Reporte guardado correctamente.");
      }
    } else {
      // Sin Supabase: guardar solo localmente
      const report = {
        id: existingReportId || Date.now().toString(),
        student_name: rStudentName, student_dni: rStudentDni,
        origin_university: rStudentUni, origin_career: rStudentCareer,
        analyses: raStudentAnalyses, summary, created_at: new Date().toISOString(),
      };
      if (existingReportId) {
        setSavedReports(prev => prev.map(r => r.id === existingReportId ? report : r));
      } else {
        setSavedReports(prev => [report, ...prev]);
      }
    }
    // Clear draft after successful save
    localStorage.removeItem(DRAFT_KEY);
    setExistingReportId(null);
  } catch (e) {
    console.error("Error saving report:", e);
    alert("⚠ Error al guardar: " + e.message);
  } finally {
    setReportSaving(false);
  }
};

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

        {/* Draft restored notification */}
        {draftRestored && !existingReportId && (
          <div style={{ marginBottom: 16, padding: "10px 16px", borderRadius: 8, background: "#EDE9FE", border: "1px solid #C4B5FD", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, color: "#5B21B6" }}>📝 Se restauró un borrador guardado automáticamente.</span>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setDraftRestored(false)} style={{ ...btnOutline, padding: "4px 12px", fontSize: 11 }}>OK</button>
              <button onClick={clearDraft} style={{ ...btnOutline, padding: "4px 12px", fontSize: 11, borderColor: "#C4B5FD", color: "#7C3AED" }}>🗑 Descartar borrador</button>
            </div>
          </div>
        )}

        {/* Continuing existing report banner */}
        {existingReportId && (
          <div style={{ marginBottom: 16, padding: "10px 16px", borderRadius: 8, background: "#ECFDF5", border: "1px solid #6EE7B7", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, color: "#065F46" }}>
              ▶ Continuando reporte de <strong>{rStudentName || "alumno"}</strong> — {raStudentAnalyses.length} análisis previos cargados. Agregá más materias y guardá para actualizar.
            </span>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={clearDraft} style={{ ...btnOutline, padding: "4px 12px", fontSize: 11, borderColor: "#6EE7B7", color: "#065F46" }}>🆕 Nuevo reporte</button>
            </div>
          </div>
        )}

        {/* New report button (when there's data) */}
        {(rStudentName.trim() || raStudentAnalyses.length > 0) && !draftRestored && (
          <div style={{ marginBottom: 16, display: "flex", justifyContent: "flex-end" }}>
            <button onClick={() => { if (confirm("¿Iniciar un nuevo reporte? Se perderán los datos no guardados.")) clearDraft(); }} style={{ ...btnOutline, padding: "6px 14px", fontSize: 11 }}>
              🆕 Nuevo reporte
            </button>
          </div>
        )}

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
                  <AutocompleteInput
                    value={rStudentUni}
                    onChange={setRStudentUni}
                    placeholder="Escribí el nombre de la universidad..."
                    getSupabase={getSupabaseClient}
                    column="universidad"
                  />
                </div>
                <div>
                  <Label>Carrera de origen</Label>
                  <AutocompleteInput
                    value={rStudentCareer}
                    onChange={setRStudentCareer}
                    placeholder="Escribí el nombre de la carrera..."
                    getSupabase={getSupabaseClient}
                    column="carrera"
                    filterColumn={rStudentUni ? "universidad" : null}
                    filterValue={rStudentUni || null}
                  />
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
                  💡 <b>Subí los programas de las materias</b> cursadas por el alumno (PDF, DOCX o TXT). Podés subir varios archivos a la vez con el botón "📄 Subir varios archivos". La carga horaria es <b>fundamental</b> para el análisis — completala si la conocés.
                </div>

                {raOriginSubjects.map((orig, idx) => (
                  <div key={idx} style={{ marginBottom: 16, padding: 14, borderRadius: 10, border: `1px solid ${C.border}`, background: idx % 2 === 0 ? C.surface : C.bg }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: C.redAccent }}>Materia origen {raOriginSubjects.length > 1 ? `#${idx + 1}` : ""}</span>
                      {raOriginSubjects.length > 1 && (
                        <button onClick={() => raRemoveOriginSubject(idx)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: C.redAccent, padding: 0 }}>✕</button>
                      )}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 100px", gap: 8, marginBottom: 8 }}>
                      <div>
                        <Label>Nombre de la materia</Label>
                        <input placeholder="Ej: Análisis Matemático I" value={orig.name} onChange={e => raUpdateOriginSubject(idx, "name", e.target.value)} style={inputStyle} />
                      </div>
                      <div>
                        <Label>Horas</Label>
                        <input placeholder="Ej: 96" type="number" value={orig.hours} onChange={e => raUpdateOriginSubject(idx, "hours", e.target.value)} style={inputStyle} />
                      </div>
                    </div>

                    <Label>Programa / Contenidos</Label>
                    <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
                      <label style={{
                        flex: 1, padding: "7px 6px", borderRadius: 6, border: `1.5px solid ${C.border}`,
                        background: C.surface, color: C.textSecondary, cursor: "pointer", fontSize: 11,
                        textAlign: "center", transition: "all 0.15s"
                      }}>
                        📄 Subir archivo
                        <input type="file" accept=".pdf,.docx,.doc,.txt" onChange={(e) => raHandleFileUpload(e, idx)} style={{ display: "none" }} />
                      </label>
                    </div>
                    {raFileProcessing && idx === raOriginSubjects.length - 1 && <div style={{ marginBottom: 6, fontSize: 12, color: C.red, fontWeight: 600 }}>⚙️ Extrayendo texto...</div>}
                    <textarea placeholder={"Pegá el programa completo de la materia.\nCuanto más detallado, más preciso el análisis."} value={orig.program} onChange={e => raUpdateOriginSubject(idx, "program", e.target.value)} style={{ ...inputStyle, minHeight: raOriginSubjects.length > 1 ? 80 : 130, resize: "vertical", lineHeight: 1.55 }} />
                    {orig.program && <div style={{ marginTop: 4, fontSize: 11, color: C.green }}>✓ {orig.program.length} caracteres</div>}
                  </div>
                ))}

                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={raAddOriginSubject} style={{ ...btnOutline, flex: 1, padding: "10px", fontSize: 12, borderStyle: "dashed", borderColor: C.redBorder, color: C.redAccent }}>
                    + Agregar materia
                  </button>
                  <label style={{
                    ...btnOutline, flex: 1, padding: "10px", fontSize: 12, borderStyle: "dashed",
                    borderColor: C.blue, color: C.blue, cursor: "pointer", textAlign: "center",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 4
                  }}>
                    📄 Subir varios archivos
                    <input type="file" accept=".pdf,.docx,.doc,.txt" multiple onChange={raHandleMultiFileUpload} style={{ display: "none" }} />
                  </label>
                </div>
              </div>

              {/* Right: Target + action */}
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <div style={cardStyle}>
                  <SectionTitle icon="🎯" color={C.red} label="Materia(s) UCALP destino" />
                  <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 8, lineHeight: 1.5 }}>
                    Seleccioná una o varias materias destino.
                    {raTargetSubjects.length > 0 && <span style={{ marginLeft: 6, fontWeight: 700, color: C.red }}>{raTargetSubjects.length} seleccionada{raTargetSubjects.length > 1 ? "s" : ""}</span>}
                  </div>
                  <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
                    <button onClick={() => {
                      const allKeys = Object.entries(UCALP_PLAN).flatMap(([, y]) => Object.entries(y.semestres).flatMap(([, s]) => s.subjects));
                      setRaTargetSubjects(allKeys);
                    }} style={{ ...btnOutline, fontSize: 10, padding: "4px 10px" }}>Seleccionar todas</button>
                    <button onClick={() => setRaTargetSubjects([])} style={{ ...btnOutline, fontSize: 10, padding: "4px 10px" }}>Ninguna</button>
                    {Object.entries(UCALP_PLAN).map(([yearKey, yearData]) => (
                      <button key={yearKey} onClick={() => {
                        const yearKeys = Object.entries(yearData.semestres).flatMap(([, s]) => s.subjects);
                        const allSelected = yearKeys.every(k => raTargetSubjects.includes(k));
                        if (allSelected) setRaTargetSubjects(prev => prev.filter(k => !yearKeys.includes(k)));
                        else setRaTargetSubjects(prev => [...new Set([...prev, ...yearKeys])]);
                      }} style={{ ...btnOutline, fontSize: 10, padding: "4px 8px", borderColor: C.redBorder, color: C.redAccent }}>
                        {yearData.label}
                      </button>
                    ))}
                  </div>
                  {/* Search filter for subjects */}
                  <input
                    type="text" placeholder="🔍 Buscar materia UCALP..."
                    value={searchFilter} onChange={e => setSearchFilter(e.target.value)}
                    style={{ ...inputStyle, marginBottom: 10, fontSize: 12, padding: "8px 12px" }}
                  />
                  <div style={{ display: "flex", flexDirection: "column", gap: 12, maxHeight: 400, overflow: "auto", paddingRight: 4 }}>
                    {Object.entries(UCALP_PLAN).map(([yearKey, yearData]) => {
                      // Filter subjects by search
                      const filteredSemesters = Object.entries(yearData.semestres).map(([semKey, semData]) => ({
                        semKey, semData,
                        subjects: semData.subjects.filter(key => {
                          if (!searchFilter.trim()) return true;
                          const prog = UCALP_PROGRAMS[key];
                          return prog?.name?.toLowerCase().includes(searchFilter.toLowerCase());
                        })
                      })).filter(s => s.subjects.length > 0);
                      if (filteredSemesters.length === 0) return null;
                      return (
                      <div key={yearKey}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 5 }}>{yearData.label}</div>
                        {filteredSemesters.map(({ semKey, semData, subjects }) => (
                          <div key={semKey} style={{ marginBottom: 6 }}>
                            <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 3, paddingLeft: 4 }}>{semData.label}</div>
                            {subjects.map(key => {
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
                      );
                    })}
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
                  {raAnalyzing ? <><span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⚙️</span> Analizando {raTargetSubjects.length > 1 ? `${raTargetSubjects.length} materias` : ""} con IA... ({elapsedSeconds}s)</> : `🔍 Ejecutar análisis${raTargetSubjects.length > 1 ? ` (${raTargetSubjects.length} materias)` : ""}`}
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
                    {r.comparacion_carga_horaria && <div style={{ marginTop: 10 }}><InfoBox color={C.blue} title="⏱ Carga horaria" text={`${r.comparacion_carga_horaria}${r.factor_horario ? ` — Factor: ${r.factor_horario}` : ""}`} /></div>}
                    <div style={{ marginTop: 10 }}><InfoBox color={C.red} title="Justificación" text={r.justificacion} /></div>
                    {r.observaciones_correlatividades && <div style={{ marginTop: 8 }}><InfoBox color="#7B1FA2" title="📚 Correlatividades" text={r.observaciones_correlatividades} /></div>}
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
            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              <button onClick={() => setRaStep("analisis")} style={{ ...btnOutline, padding: "9px 16px", fontSize: 12 }}>← Agregar más análisis</button>
              <button onClick={() => window.print()} style={{ ...btnPrimary, padding: "9px 20px", fontSize: 13 }}>🖨 Imprimir / PDF</button>
              <button onClick={() => { saveReport(); }} disabled={reportSaving} style={{
                ...btnPrimary, padding: "9px 20px", fontSize: 13, background: "#3ECF8E",
                opacity: reportSaving ? 0.6 : 1
              }}>
                {reportSaving ? "⚙️ Guardando..." : existingReportId ? "💾 Actualizar reporte" : "💾 Guardar reporte"}
              </button>
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
}