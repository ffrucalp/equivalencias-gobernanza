import { useState } from "react";
import { useApp } from "../context/AppContext";
import { UCALP_PLAN, UCALP_ORDER, UCALP_PROGRAMS } from "../lib/constants";
import { C, cardStyle, inputStyle, btnPrimary, btnOutline } from "../lib/styles";
import { Badge, CoverageCircle, UnitDetail, AlertBox, InfoBox } from "../lib/components";

export default function Reportes() {
  const { savedReports, deleteReport, setTab } = useApp();
  const [viewingReport, setViewingReport] = useState(null);

  const loadReport = (report) => setViewingReport(report);

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

        {savedReports.length === 0 ? (
          <div style={{ ...cardStyle, textAlign: "center", padding: 48 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: C.text, marginBottom: 6 }}>No hay reportes guardados</div>
            <div style={{ fontSize: 13, color: C.textSecondary, marginBottom: 20 }}>Generá un reporte desde la pestaña "Reporte Alumno" y guardalo.</div>
            <button onClick={() => setTab("reporte_alumno")} style={btnPrimary}>📄 Ir a Reporte Alumno</button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {savedReports.map(report => {
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
                          {analyses.length} {analyses.length === 1 ? "análisis" : "análisis"} · {new Date(report.created_at).toLocaleDateString("es-AR", { year: "numeric", month: "short", day: "numeric" })}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      <button onClick={() => loadReport(report)} style={{ ...btnPrimary, padding: "8px 16px", fontSize: 12 }}>
                        👁 Ver reporte
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
                }} style={{ ...btnPrimary, padding: "7px 14px", fontSize: 12 }}>🖨 Imprimir</button>
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
    </>
  );
}