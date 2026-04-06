import { useState } from "react";
import { useApp } from "../context/AppContext";
import { getSupabaseClient } from "../supabaseClient";
import { UCALP_PROGRAMS, MODELS } from "../lib/constants";
import { C, cardStyle, inputStyle, selectStyle, btnPrimary, btnOutline } from "../lib/styles";
import { AutocompleteInput, Label, SectionTitle } from "../lib/components";
import { parseTextPlan, extractTextFromFile, importFromGoogleSheets, parseHtmlTable, aiExtractSubjects, scrapeStudyPlan } from "../lib/utils";
import { isGoogleDriveConfigured, pickFileFromDrive } from "../lib/googleDrive";

export default function Planes() {
  const {
    apiKey, selectedModel, savedPlans, savePlan, deletePlan,
    error, setError, setShowApiKeyModal, setTab, ucalpCarreras, setUcalpCarreras
  } = useApp();

  const [originUniversity, setOriginUniversity] = useState("");
  const [customUniversity, setCustomUniversity] = useState("");
  const [originCareer, setOriginCareer] = useState("");
  const [customCareer, setCustomCareer] = useState("");
  const [scrapeUrl, setScrapeUrl] = useState("");
  const [scraping, setScraping] = useState(false);
  const [scrapedPlan, setScrapedPlan] = useState(null);
  const [ucalpSearch, setUcalpSearch] = useState("");
  const [sheetsUrl, setSheetsUrl] = useState("");
  const [sheetsData, setSheetsData] = useState(null);
  const [sheetsLoading, setSheetsLoading] = useState(false);
  const [aiExtracting, setAiExtracting] = useState(false);
  const [driveLoading, setDriveLoading] = useState(false);

const handleScrape = async () => {
  if (!scrapeUrl.trim()) return;
  setScraping(true); setError(null); setScrapedPlan(null);
  try {
    const plan = await scrapeStudyPlan(scrapeUrl);
    setScrapedPlan(plan);
  } catch (err) { setError("Error scrapeando: " + err.message); } finally { setScraping(false); }
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

  return (
      <div style={{ animation: "fadeIn 0.3s ease" }}>
        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 24, color: C.text, marginBottom: 4, fontWeight: 700 }}>Planes de estudio</h2>
        <p style={{ color: C.textSecondary, fontSize: 14, marginBottom: 20 }}>Cargá planes de estudio por URL, texto pegado, PDF o Google Sheets. Los planes se guardan en Supabase y están disponibles para todos los usuarios.</p>


        <div style={cardStyle}>
          <SectionTitle icon="🌐" color={C.blue} label="Cargar plan de estudios" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div>
              <Label>Universidad</Label>
              <AutocompleteInput
                value={originUniversity}
                onChange={setOriginUniversity}
                placeholder="Escribí el nombre de la universidad..."
                getSupabase={getSupabaseClient}
                column="universidad"
              />
            </div>
            <div>
              <Label>Carrera</Label>
              <AutocompleteInput
                value={originCareer}
                onChange={setOriginCareer}
                placeholder="Escribí el nombre de la carrera..."
                getSupabase={getSupabaseClient}
                column="carrera"
                filterColumn={originUniversity ? "universidad" : null}
                filterValue={originUniversity || null}
              />
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
                  const uni = originUniversity;
                  const car = originCareer;
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
                      const uni = originUniversity;
                      const car = originCareer;
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

        {/* ── UCALP Plans Browser ── */}
        {ucalpCarreras.length > 0 && (
          <div style={{ marginTop: 28 }}>
            <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 18, color: C.text, marginBottom: 6, fontWeight: 700 }}>
              🏛 Planes de estudio UCALP ({ucalpCarreras.length} carreras)
            </h3>
            <p style={{ fontSize: 12, color: C.textSecondary, marginBottom: 12 }}>
              Base de datos completa de la UCALP. Hacé click en una carrera para ver las materias, o guardala como plan.
            </p>
            <input
              type="text" placeholder="🔍 Buscar carrera o facultad UCALP..."
              value={ucalpSearch} onChange={e => setUcalpSearch(e.target.value)}
              style={{ ...inputStyle, fontSize: 13, marginBottom: 12 }}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {ucalpCarreras
                .filter(c => !ucalpSearch || c.nombre.toLowerCase().includes(ucalpSearch.toLowerCase()) || (c.facultad||"").toLowerCase().includes(ucalpSearch.toLowerCase()))
                .map(c => (
                <details key={c.id} style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
                  <summary style={{ padding: "12px 16px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: C.blue }}>{c.nombre}</div>
                      <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>
                        {c.facultad || "UCALP"} · {c.duracion || "?"} · {c.modalidad || "?"} · {c.subjects?.length || 0} materias
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                      <button onClick={(e) => {
                        e.preventDefault(); e.stopPropagation();
                        savePlan("Universidad Católica de La Plata", c.nombre, (c.subjects || []).map(s => ({ name: s.name, details: s.duracion || "" })), "");
                      }} style={{ ...btnOutline, fontSize: 11, padding: "5px 10px", borderColor: C.greenBorder, color: C.green }}>
                        💾 Guardar
                      </button>
                      <button onClick={async (e) => {
                        e.preventDefault(); e.stopPropagation();
                        if (!confirm(`¿Eliminar "${c.nombre}" de la base de datos UCALP?`)) return;
                        const sb = getSupabaseClient();
                        if (sb) {
                          await sb.from("ucalp_materias").delete().eq("carrera_id", c.id);
                          await sb.from("ucalp_carreras").delete().eq("id", c.id);
                        }
                        setUcalpCarreras(prev => prev.filter(x => x.id !== c.id));
                      }} style={{ ...btnOutline, fontSize: 11, padding: "5px 8px", borderColor: C.redBorder, color: C.redAccent }}>
                        🗑
                      </button>
                    </div>
                  </summary>
                  <div style={{ padding: "0 16px 14px", display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {(c.subjects || []).map((s, i) => (
                      <div key={i} style={{ padding: "5px 10px", borderRadius: 6, background: C.bg, border: `1px solid ${C.borderLight}`, fontSize: 11, color: C.text }}>
                        {s.name} <span style={{ color: C.textMuted, fontSize: 10 }}>({s.duracion || "?"} · {s.anio || "?"})</span>
                      </div>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          </div>
        )}
      </div>

  );
}