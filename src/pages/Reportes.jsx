import { useState } from "react";
import { useApp } from "../context/AppContext";
import { UCALP_PLAN, UCALP_ORDER, UCALP_PROGRAMS } from "../lib/constants";
import { C, cardStyle, inputStyle, btnPrimary, btnOutline } from "../lib/styles";
import { Badge, CoverageCircle, UnitDetail, AlertBox, InfoBox } from "../lib/components";
import { saveData } from "../lib/utils";

export default function Reportes() {
  const { savedReports, deleteReport, updateReport, setTab } = useApp();
  const [viewingReport, setViewingReport] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [exportingPdf, setExportingPdf] = useState(false);
  const [editingReport, setEditingReport] = useState(null); // { id, student_name, student_dni, origin_university, origin_career }

  const loadReport = (report) => setViewingReport(report);

  // ── Duplicate report: load into ReporteAlumno as draft ──
  const duplicateReport = (report) => {
    saveData("eq-reporte-draft", {
      name: report.student_name || "",
      dni: report.student_dni || "",
      uni: report.origin_university || "",
      career: report.origin_career || "",
      step: "reporte",
      origins: [],
      targets: [],
      analyses: report.analyses || []
    });
    setTab("reporte_alumno");
  };

  // ── Export to PDF ──
  const exportPdf = async () => {
    const el = document.getElementById("report-viewer-content");
    if (!el) return;
    setExportingPdf(true);
    try {
      // Load html2canvas
      if (!window.html2canvas) {
        await new Promise((resolve, reject) => {
          const s = document.createElement("script");
          s.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
          s.onload = resolve; s.onerror = reject;
          document.head.appendChild(s);
        });
      }
      // Load jsPDF
      if (!window.jspdf) {
        await new Promise((resolve, reject) => {
          const s = document.createElement("script");
          s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
          s.onload = resolve; s.onerror = reject;
          document.head.appendChild(s);
        });
      }
      const canvas = await window.html2canvas(el, { scale: 2, backgroundColor: "#fff", useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 8;
      const imgW = pageW - margin * 2;
      const imgH = (canvas.height * imgW) / canvas.width;

      // If content is taller than one page, split into pages
      let y = margin;
      let remaining = imgH;
      const pageContentH = pageH - margin * 2;

      while (remaining > 0) {
        if (y > margin) pdf.addPage();
        const sourceY = (imgH - remaining) * (canvas.height / imgH);
        const sliceH = Math.min(remaining, pageContentH);
        const sourceSliceH = sliceH * (canvas.height / imgH);

        // Create a canvas slice
        const sliceCanvas = document.createElement("canvas");
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = sourceSliceH;
        const ctx = sliceCanvas.getContext("2d");
        ctx.drawImage(canvas, 0, sourceY, canvas.width, sourceSliceH, 0, 0, canvas.width, sourceSliceH);

        pdf.addImage(sliceCanvas.toDataURL("image/png"), "PNG", margin, margin, imgW, sliceH);
        remaining -= pageContentH;
        y = margin;
      }

      const rpt = viewingReport;
      pdf.save(`Reporte-${rpt.student_name?.replace(/\s+/g, "-") || "alumno"}-${new Date().toISOString().slice(0,10)}.pdf`);
    } catch (e) {
      console.error("Error exportando PDF:", e);
      alert("Error exportando PDF: " + e.message);
    } finally {
      setExportingPdf(false);
    }
  };

  // ── Filter reports ──
  const filteredReports = savedReports.filter(r => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (r.student_name || "").toLowerCase().includes(q) ||
           (r.student_dni || "").toLowerCase().includes(q) ||
           (r.origin_university || "").toLowerCase().includes(q) ||
           (r.origin_career || "").toLowerCase().includes(q);
  });

  return (
    <>
      <div style={{ animation: "fadeIn 0.3s ease" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22 }}>
          <div>
            <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 24, color: C.text, margin: 0, fontWeight: 700 }}>📋 Reportes Guardados</h2>
            <p style={{ color: C.textSecondary, fontSize: 13, marginTop: 4 }}>Reportes de equivalencias generados para alumnos ingresantes.</p>
          </div>
          <button onClick={() => setTab("reporte_alumno")} style={{ ...btnPrimary, padding: "9px 18px", fontSize: 13 }}>
            + Nuevo reporte
          </button>
        </div>

        {/* Search bar */}
        {savedReports.length > 0 && (
          <input
            type="text" placeholder="🔍 Buscar por nombre, DNI, universidad o carrera..."
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            style={{ ...inputStyle, marginBottom: 16, fontSize: 13 }}
          />
        )}

        {filteredReports.length === 0 && savedReports.length > 0 ? (
          <div style={{ ...cardStyle, textAlign: "center", padding: 36 }}>
            <div style={{ fontSize: 14, color: C.textSecondary }}>No hay reportes que coincidan con "{searchQuery}"</div>
          </div>
        ) : savedReports.length === 0 ? (
          <div style={{ ...cardStyle, textAlign: "center", padding: 48 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: C.text, marginBottom: 6 }}>No hay reportes guardados</div>
            <div style={{ fontSize: 13, color: C.textSecondary, marginBottom: 20 }}>Generá un reporte desde la pestaña "Reporte Alumno" y guardalo.</div>
            <button onClick={() => setTab("reporte_alumno")} style={btnPrimary}>📄 Ir a Reporte Alumno</button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filteredReports.map(report => {
              const summary = report.summary || {};
              const analyses = report.analyses || [];
              return (
                <div key={report.id} style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
                  <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{report.student_name}</span>
                        {report.student_dni && <span style={{ fontSize: 12, color: C.textMuted }}>DNI: {report.student_dni}</span>}
                      </div>
                      <div style={{ fontSize: 12, color: C.textSecondary, marginTop: 4 }}>
                        {report.origin_university} — {report.origin_career}
                      </div>
                      <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap", alignItems: "center" }}>
                        <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: C.greenSoft, color: C.green, fontWeight: 700 }}>✓ {summary.total || 0}</span>
                        <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: C.amberSoft, color: C.amber, fontWeight: 700 }}>△ {summary.parcial || 0}</span>
                        <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: C.dangerSoft, color: C.redAccent, fontWeight: 700 }}>✗ {summary.sin || 0}</span>
                        <span style={{ fontSize: 10, color: C.textMuted, marginLeft: 4 }}>
                          {analyses.length} análisis · {new Date(report.created_at).toLocaleDateString("es-AR", { year: "numeric", month: "short", day: "numeric" })}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexShrink: 0, flexWrap: "wrap" }}>
                      <button onClick={() => loadReport(report)} style={{ ...btnPrimary, padding: "8px 16px", fontSize: 12 }}>
                        👁 Ver
                      </button>
                      <button onClick={() => setEditingReport({
                        id: report.id, student_name: report.student_name || "", student_dni: report.student_dni || "",
                        origin_university: report.origin_university || "", origin_career: report.origin_career || ""
                      })} style={{ ...btnOutline, padding: "8px 12px", fontSize: 12 }} title="Editar datos del alumno">
                        ✏️ Editar
                      </button>
                      <button onClick={() => duplicateReport(report)} style={{ ...btnOutline, padding: "8px 12px", fontSize: 12, borderColor: "#c7d2fe", color: "#6366f1" }} title="Duplicar para editar">
                        📋 Duplicar
                      </button>
                      <button onClick={() => deleteReport(report.id)} style={{ ...btnOutline, padding: "8px 12px", fontSize: 12, borderColor: C.redBorder, color: C.redAccent }}>
                        🗑
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ═══════ REPORT VIEWER MODAL ═══════ */}
    {viewingReport && (() => {
      const rpt = viewingReport;
      const bySubjectView = {};
      (rpt.analyses || []).forEach(a => { if (!bySubjectView[a.targetSubjectKey]) bySubjectView[a.targetSubjectKey] = []; bySubjectView[a.targetSubjectKey].push(a); });
      const CLASI_LABEL_V = { TOTAL: "Equivalencia Total", PARCIAL: "Equivalencia Parcial", SIN_EQUIVALENCIA: "Sin Equivalencia", NO_EVALUABLE: "No Evaluable" };
      const CLASI_COLOR_V = { TOTAL: C.green, PARCIAL: C.amber, SIN_EQUIVALENCIA: C.redAccent, NO_EVALUABLE: C.textMuted };
      const CLASI_BG_V    = { TOTAL: C.greenSoft, PARCIAL: C.amberSoft, SIN_EQUIVALENCIA: C.dangerSoft, NO_EVALUABLE: C.bg };
      return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}
          onClick={() => setViewingReport(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, maxWidth: 900, width: "100%", maxHeight: "90vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            {/* Action bar */}
            <div style={{ padding: "12px 20px", borderBottom: `1px solid ${C.borderLight}`, display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: C.surface, zIndex: 10 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Reporte: {rpt.student_name}</span>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={exportPdf} disabled={exportingPdf} style={{ ...btnPrimary, padding: "7px 14px", fontSize: 12, background: "#E53935", opacity: exportingPdf ? 0.6 : 1 }}>
                  {exportingPdf ? "⚙️ Generando..." : "📄 PDF"}
                </button>
                <button onClick={() => {
                  const w = window.open("", "_blank");
                  const el = document.getElementById("report-viewer-content");
                  if (el && w) {
                    w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Reporte ${rpt.student_name}</title>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>body{margin:0;padding:20px;font-family:'DM Sans',system-ui,sans-serif}@media print{body{padding:10px}}</style>
</head><body>${el.outerHTML}<script>setTimeout(()=>{window.print();window.close()},500)<\/script></body></html>`);
                    w.document.close();
                  }
                }} style={{ ...btnOutline, padding: "7px 14px", fontSize: 12 }}>🖨 Imprimir</button>
                <button onClick={() => { duplicateReport(rpt); setViewingReport(null); }} style={{ ...btnOutline, padding: "7px 14px", fontSize: 12, borderColor: "#c7d2fe", color: "#6366f1" }}>
                  📋 Duplicar
                </button>
                <button onClick={() => { setEditingReport({
                  id: rpt.id, student_name: rpt.student_name || "", student_dni: rpt.student_dni || "",
                  origin_university: rpt.origin_university || "", origin_career: rpt.origin_career || ""
                }); }} style={{ ...btnOutline, padding: "7px 14px", fontSize: 12 }}>
                  ✏️ Editar datos
                </button>
                <button onClick={() => setViewingReport(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: C.textMuted, padding: "4px 8px" }}>✕</button>
              </div>
            </div>

            {/* Report content */}
            <div id="report-viewer-content" style={{ padding: 0 }}>
              <div style={{ padding: "20px 24px", background: C.red, color: "#fff" }}>
                <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 700 }}>
                  TABLA DE EQUIVALENCIAS — LIC. EN GOBERNANZA DE DATOS
                </div>
                <div style={{ fontSize: 12, opacity: 0.85, marginTop: 4 }}>
                  Universidad Católica de La Plata · Facultad de Ciencias Exactas e Ingeniería
                  {` · Alumno: ${rpt.student_name}`}
                  {rpt.student_dni && ` (DNI: ${rpt.student_dni})`}
                  {` · Origen: ${rpt.origin_university} — ${rpt.origin_career}`}
                </div>
                <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>
                  Fecha: {new Date(rpt.created_at).toLocaleDateString("es-AR", { year: "numeric", month: "long", day: "numeric" })}
                </div>
              </div>

              <div style={{ padding: "10px 24px", background: C.bg, borderBottom: `1px solid ${C.borderLight}`, display: "flex", gap: 16, flexWrap: "wrap" }}>
                {[["TOTAL", "Equivalencia Total"], ["PARCIAL", "Equivalencia Parcial"], ["SIN_EQUIVALENCIA", "Sin Equivalencia"], ["NO_EVALUABLE", "No analizada"]].map(([k, label]) => (
                  <div key={k} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: CLASI_COLOR_V[k], display: "inline-block" }} />
                    <span style={{ fontSize: 11, color: C.textSecondary }}>{label}</span>
                  </div>
                ))}
              </div>

              {Object.entries(UCALP_PLAN).map(([yearKey, yearData]) => (
                <div key={yearKey}>
                  <div style={{ padding: "8px 24px", background: C.redSoft, borderBottom: `1px solid ${C.redBorder}`, borderTop: `1px solid ${C.redBorder}` }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: C.redAccent }}>{yearData.label}</span>
                  </div>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: C.bg }}>
                        {["#", "Materia UCALP", "Materia origen", "Resultado", "%"].map((h, i) => (
                          <th key={i} style={{ padding: "7px 12px", fontSize: 10, fontWeight: 700, color: C.textMuted, textAlign: i >= 3 ? "center" : "left", letterSpacing: "0.3px", textTransform: "uppercase", borderBottom: `1px solid ${C.borderLight}` }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(yearData.semestres).flatMap(([semKey, semData]) =>
                        semData.subjects.map((key, rowIdx) => {
                          const prog = UCALP_PROGRAMS[key];
                          if (!prog) return null;
                          const matchingA = bySubjectView[key] || [];
                          const best = matchingA.sort((a, b) => (b.result?.porcentaje_cobertura_global || 0) - (a.result?.porcentaje_cobertura_global || 0))[0];
                          const clasi = best?.result?.clasificacion;
                          const pct = best?.result?.porcentaje_cobertura_global;
                          const rowBg = clasi ? (CLASI_BG_V[clasi] || C.surface) : (rowIdx % 2 === 0 ? C.surface : C.bg);
                          return (
                            <tr key={key} style={{ background: rowBg }}>
                              <td style={{ padding: "8px 12px", fontSize: 11, color: C.textMuted, textAlign: "center" }}>{prog.cod}</td>
                              <td style={{ padding: "8px 12px", fontSize: 12, fontWeight: 500, color: C.text }}>{prog.name}</td>
                              <td style={{ padding: "8px 12px", fontSize: 12, color: best ? C.text : C.textMuted, fontStyle: best ? "normal" : "italic" }}>
                                {best ? best.originSubject : "—"}
                              </td>
                              <td style={{ padding: "8px 12px", textAlign: "center" }}>
                                {clasi ? (
                                  <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 4, background: CLASI_COLOR_V[clasi] + "20", color: CLASI_COLOR_V[clasi], fontWeight: 700, whiteSpace: "nowrap" }}>
                                    {clasi === "TOTAL" ? "✓ Total" : clasi === "PARCIAL" ? "△ Parcial" : clasi === "SIN_EQUIVALENCIA" ? "✗ Sin Equiv." : "— N/E"}
                                  </span>
                                ) : (
                                  <span style={{ fontSize: 11, color: C.textMuted }}>—</span>
                                )}
                              </td>
                              <td style={{ padding: "8px 12px", fontSize: 11, textAlign: "center", fontWeight: pct != null ? 600 : 400, color: pct != null ? (pct >= 70 ? C.green : pct >= 40 ? C.amber : C.redAccent) : C.textMuted }}>
                                {pct != null ? `${pct}%` : "—"}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              ))}

              <div style={{ padding: "16px 24px", background: C.bg, borderTop: `1px solid ${C.borderLight}` }}>
                <div style={{ marginTop: 8, fontSize: 11, color: C.textMuted, borderTop: `1px dashed ${C.borderLight}`, paddingTop: 10 }}>
                  Análisis realizado con asistencia de inteligencia artificial. Los resultados provisionales están sujetos a revisión por el Director de Carrera.
                  Firmado: Dir. Francisco Fernández Ruiz — Lic. en Gobernanza de Datos — UCALP
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    })()}

    {/* ═══════ EDIT MODAL ═══════ */}
    {editingReport && (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1001, padding: 20 }}
        onClick={() => setEditingReport(null)}>
        <div onClick={e => e.stopPropagation()} style={{ background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, maxWidth: 480, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", padding: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: 0 }}>✏️ Editar datos del reporte</h3>
            <button onClick={() => setEditingReport(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: C.textMuted }}>✕</button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.textSecondary, marginBottom: 4 }}>Nombre del alumno</div>
              <input value={editingReport.student_name} onChange={e => setEditingReport(prev => ({ ...prev, student_name: e.target.value }))}
                style={{ ...inputStyle, fontSize: 14 }} placeholder="Nombre completo" autoFocus />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.textSecondary, marginBottom: 4 }}>DNI</div>
              <input value={editingReport.student_dni} onChange={e => setEditingReport(prev => ({ ...prev, student_dni: e.target.value }))}
                style={inputStyle} placeholder="DNI" />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.textSecondary, marginBottom: 4 }}>Universidad de origen</div>
              <input value={editingReport.origin_university} onChange={e => setEditingReport(prev => ({ ...prev, origin_university: e.target.value }))}
                style={inputStyle} placeholder="Universidad" />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.textSecondary, marginBottom: 4 }}>Carrera de origen</div>
              <input value={editingReport.origin_career} onChange={e => setEditingReport(prev => ({ ...prev, origin_career: e.target.value }))}
                style={inputStyle} placeholder="Carrera" />
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 20 }}>
            <button onClick={() => setEditingReport(null)} style={btnOutline}>Cancelar</button>
            <button onClick={() => {
              updateReport(editingReport.id, {
                student_name: editingReport.student_name,
                student_dni: editingReport.student_dni,
                origin_university: editingReport.origin_university,
                origin_career: editingReport.origin_career
              });
              // Also update viewingReport if it's the same one
              if (viewingReport?.id === editingReport.id) {
                setViewingReport(prev => ({ ...prev, ...editingReport }));
              }
              setEditingReport(null);
            }} style={{ ...btnPrimary, padding: "10px 24px" }}>💾 Guardar cambios</button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}