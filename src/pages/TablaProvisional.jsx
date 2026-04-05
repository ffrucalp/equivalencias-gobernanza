import { useState, useRef, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { UCALP_PLAN, UCALP_ORDER, UCALP_PROGRAMS, MODELS } from "../lib/constants";
import { C, cardStyle, inputStyle, selectStyle, btnPrimary, btnOutline } from "../lib/styles";
import { SectionTitle } from "../lib/components";
import { saveData, loadData, runBatchQuickAnalysis } from "../lib/utils";
import { isGoogleDriveConfigured } from "../lib/googleDrive";

export default function TablaProvisional() {
  const {
    tablaSelectedPlanId, setTablaSelectedPlanId,
    savedPlans, savedTablas, setSavedTablas,
    tablaCache, setTablaCache,
    apiKey, selectedModel, setError,
    setShowApiKeyModal, getSupabaseClient, setTab, supabaseUrl
  } = useApp();

  const [tablaBatchResult, setTablaBatchResult] = useState(null);
  const [tablaBatchLoading, setTablaBatchLoading] = useState(false);
  const [tablaBatchError, setTablaBatchError] = useState(null);
  const [tablaEditMode, setTablaEditMode] = useState(false);
  const [tablaEditColors, setTablaEditColors] = useState(() => loadData("eq-tabla-last-edits", {}));
  const [tablaSaving, setTablaSaving] = useState(false);
  const [tablaSearchQuery, setTablaSearchQuery] = useState("");
  const [tablaEmailTo, setTablaEmailTo] = useState("");
  const [tablaEmailSending, setTablaEmailSending] = useState(false);
  const tablaRef = useRef(null);

  // ── Progress timer ──
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (tablaBatchLoading) {
      setElapsedSeconds(0);
      timerRef.current = setInterval(() => setElapsedSeconds(s => s + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [tablaBatchLoading]);

  useEffect(() => { saveData("eq-tabla-last-plan", tablaSelectedPlanId); }, [tablaSelectedPlanId]);
  useEffect(() => { saveData("eq-tabla-last-edits", tablaEditColors); }, [tablaEditColors]);

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

  // ── WhatsApp sharing ──
  const shareViaWhatsApp = async () => {
    if (!tablaRef.current) return;
    try {
      const canvas = await tablaToCanvas();
      const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png"));
      const file = new File([blob], `tabla-equivalencias-${new Date().toISOString().slice(0,10)}.png`, { type: "image/png" });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "Tabla de Equivalencias — UCALP", text: "Tabla general provisoria de equivalencias — Lic. en Gobernanza de Datos — UCALP" });
      } else {
        const link = document.createElement("a");
        link.download = file.name;
        link.href = canvas.toDataURL("image/png");
        link.click();
        const text = encodeURIComponent("Tabla general provisoria de equivalencias — Lic. en Gobernanza de Datos — UCALP");
        window.open(`https://wa.me/?text=${text}`, "_blank");
      }
    } catch (e) { if (e.name !== "AbortError") setError("Error compartiendo: " + e.message); }
  };

  // ── Delete saved tabla ──
  const deleteTabla = async (tablaId) => {
    if (!confirm("¿Eliminar esta tabla provisoria guardada?")) return;
    const sb = getSupabaseClient();
    if (sb) {
      const { error } = await sb.from("equivalencias_tablas").delete().eq("id", tablaId);
      if (error) { alert("Error eliminando: " + error.message); return; }
    }
    setSavedTablas(prev => prev.filter(t => t.id !== tablaId));
  };

  // ── Rename saved tabla ──
  const renameTabla = async (tablaId) => {
    const tabla = savedTablas.find(t => t.id === tablaId);
    if (!tabla) return;
    const newCareer = prompt("Nombre de la carrera:", tabla.origin_career || "");
    if (newCareer === null) return;
    const newUni = prompt("Universidad:", tabla.origin_university || "");
    if (newUni === null) return;
    const sb = getSupabaseClient();
    if (sb) {
      const { error } = await sb.from("equivalencias_tablas").update({ origin_career: newCareer, origin_university: newUni }).eq("id", tablaId);
      if (error) { alert("Error renombrando: " + error.message); return; }
    }
    setSavedTablas(prev => prev.map(t => t.id === tablaId ? { ...t, origin_career: newCareer, origin_university: newUni } : t));
  };

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
    if (!effectiveColors) { alert("No hay tabla para guardar. Ejecutá el análisis primero."); return; }
    const sb = getSupabaseClient();
    if (!sb) { alert("Supabase no configurado."); return; }
    const planId = tablaSelectedPlanId;
    if (!planId) { alert("Seleccioná un plan primero."); return; }

    // Resolve university/career from multiple sources
    const plan = savedPlans.find(p => p.id === planId);
    const existingTabla = savedTablas.find(t => t.plan_id === planId);
    const uni = plan?.university || existingTabla?.origin_university || "";
    const car = plan?.career || existingTabla?.origin_career || "";

    setTablaSaving(true);
    try {
      const { data: upserted, error } = await sb.from("equivalencias_tablas").upsert({
        origin_university: uni,
        origin_career:     car,
        plan_id:           planId,
        colors:            effectiveColors,
        notes:             "",
        updated_at:        new Date().toISOString()
      }, { onConflict: "plan_id" }).select().single();

      if (error) throw new Error(error.message);

      // Update local state with the upserted row (no need for separate select query)
      setSavedTablas(prev => {
        const existing = prev.filter(t => t.plan_id !== planId);
        const newTabla = { ...upserted, colors: typeof upserted.colors === "string" ? JSON.parse(upserted.colors) : upserted.colors };
        return [newTabla, ...existing];
      });

      const newCache = { ...tablaCache, [planId]: effectiveColors };
      setTablaCache(newCache);
      saveData("eq-tabla-cache", newCache);
      setTablaEditColors({});
      alert(`✅ Tabla guardada para: ${car || "plan seleccionado"}`);
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
      <div style={{ marginBottom: 20, textAlign: "center" }}>
        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 24, color: C.text, margin: 0, fontWeight: 700 }}>
          ⚡ Tabla General Provisoria
        </h2>
        <p style={{ color: C.textSecondary, fontSize: 13, marginTop: 5, lineHeight: 1.5 }}>
          Análisis en 1 consulta IA. <strong>Es orientativo</strong> — editá manualmente si querés ajustar y luego guardá en Supabase para tener la tabla disponible siempre.
        </p>
        {effectiveColors && (
          <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "center", flexWrap: "wrap", marginTop: 14 }}>
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
            <button onClick={shareViaWhatsApp} style={{ ...btnOutline, fontSize: 11, padding: "7px 12px", borderColor: "#25D366", color: "#25D366" }} title="Compartir por WhatsApp">
              📲 WhatsApp
            </button>
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
        <div style={{ marginBottom: 16, padding: "10px 16px", borderRadius: 8, background: "#3ECF8E08", border: "1px solid #3ECF8E22" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#3ECF8E", flexShrink: 0 }}>🗄️ Tablas guardadas:</span>
            <select
              value={savedTablas.find(t => t.plan_id === tablaSelectedPlanId)?.id || ""}
              onChange={e => {
                const t = savedTablas.find(st => st.id === e.target.value);
                if (t) {
                  const newCache = { ...tablaCache, [t.plan_id]: t.colors };
                  setTablaCache(newCache);
                  saveData("eq-tabla-cache", newCache);
                  setTablaSelectedPlanId(t.plan_id);
                  setTablaEditColors({});
                }
              }}
              style={{ ...selectStyle, flex: 1, fontSize: 12, padding: "7px 10px", borderColor: "#3ECF8E44", color: "#2A9D6A" }}
            >
              <option value="">— Seleccionar tabla guardada ({savedTablas.length}) —</option>
              {savedTablas
                .filter(t => !tablaSearchQuery || `${t.origin_career} ${t.origin_university}`.toLowerCase().includes(tablaSearchQuery.toLowerCase()))
                .map(t => (
                  <option key={t.id} value={t.id}>
                    {t.origin_career || "Sin nombre"} — {t.origin_university?.replace("Universidad ", "U. ") || "?"} ({new Date(t.updated_at).toLocaleDateString("es-AR")})
                  </option>
                ))
              }
            </select>
          </div>
          {/* Edit/delete buttons for selected tabla */}
          {(() => {
            const selectedTabla = savedTablas.find(t => t.plan_id === tablaSelectedPlanId);
            if (!selectedTabla) return null;
            return (
              <div style={{ display: "flex", gap: 6, alignItems: "center", paddingLeft: 2 }}>
                <span style={{ fontSize: 11, color: C.textMuted, flex: 1 }}>
                  {selectedTabla.origin_career || "Sin nombre"} — {selectedTabla.origin_university || "Sin universidad"}
                </span>
                <button onClick={() => renameTabla(selectedTabla.id)} style={{ ...btnOutline, fontSize: 10, padding: "3px 8px", color: "#6366f1", borderColor: "#c7d2fe" }} title="Renombrar">
                  ✏️ Renombrar
                </button>
                <button onClick={() => deleteTabla(selectedTabla.id)} style={{ ...btnOutline, fontSize: 10, padding: "3px 8px", color: C.redAccent, borderColor: C.redBorder }} title="Eliminar">
                  🗑 Eliminar
                </button>
              </div>
            );
          })()}
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
                {savedPlans.length > 4 && (
                  <input
                    placeholder="🔍 Buscar plan..."
                    value={tablaSearchQuery}
                    onChange={e => setTablaSearchQuery(e.target.value)}
                    style={{ ...inputStyle, fontSize: 11, padding: "6px 10px", marginBottom: 4 }}
                  />
                )}
                {savedPlans
                  .filter(plan => !tablaSearchQuery || `${plan.career} ${plan.university}`.toLowerCase().includes(tablaSearchQuery.toLowerCase()))
                  .map(plan => {
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
                  ? <><span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⚙️</span> Analizando... ({elapsedSeconds}s)</>
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
}