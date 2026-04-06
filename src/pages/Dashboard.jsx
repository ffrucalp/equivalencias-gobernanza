import { useState, useMemo } from "react";
import { useApp } from "../context/AppContext";
import { Badge, CoverageCircle, UnitDetail, AlertBox, InfoBox } from "../lib/components";
import { C, cardStyle, inputStyle, selectStyle, btnPrimary, btnOutline } from "../lib/styles";

export default function Dashboard() {
  const {
    dashboardStats, savedReports, savedTablas, savedPlans, analyses,
    setTab, setTablaSelectedPlanId, deleteAnalysis, exportCSV, clearAll
  } = useApp();

  const [expandedAnalysis, setExpandedAnalysis] = useState(null);
  const [filterUni, setFilterUni] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  // ── Get unique universities ──
  const universities = useMemo(() => {
    const unis = new Set();
    savedReports.forEach(r => { if (r.origin_university) unis.add(r.origin_university); });
    savedTablas.forEach(t => { if (t.origin_university) unis.add(t.origin_university); });
    return [...unis].sort();
  }, [savedReports, savedTablas]);

  // ── Filtered data ──
  const hasFilters = filterUni || filterDateFrom || filterDateTo;

  const matchesFilters = (uni, date) => {
    if (filterUni && uni !== filterUni) return false;
    if (filterDateFrom && date && new Date(date) < new Date(filterDateFrom)) return false;
    if (filterDateTo && date && new Date(date) > new Date(filterDateTo + "T23:59:59")) return false;
    return true;
  };

  const filteredReports = savedReports.filter(r => matchesFilters(r.origin_university, r.created_at));
  const filteredTablas = savedTablas.filter(t => matchesFilters(t.origin_university, t.updated_at));

  // ── Filtered stats ──
  const filteredStats = useMemo(() => {
    if (!hasFilters) return dashboardStats;
    let total = 0, parcial = 0, sin = 0;
    const unis = new Set();
    filteredReports.forEach(r => {
      total += (r.summary?.total || 0); parcial += (r.summary?.parcial || 0); sin += (r.summary?.sin || 0);
      if (r.origin_university) unis.add(r.origin_university);
    });
    filteredTablas.forEach(t => {
      if (t.colors && typeof t.colors === "object") {
        Object.values(t.colors).forEach(v => { if (v === "TOTAL") total++; else if (v === "PARCIAL") parcial++; else if (v === "SIN_EQUIVALENCIA") sin++; });
      }
      if (t.origin_university) unis.add(t.origin_university);
    });
    return { reportes: filteredReports.length, tablas: filteredTablas.length, total, parcial, sin, universities: unis.size, planes: dashboardStats.planes };
  }, [hasFilters, filteredReports, filteredTablas, dashboardStats]);

  const stats = hasFilters ? filteredStats : dashboardStats;

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      {/* ── Filtros ── */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center", padding: "12px 16px", borderRadius: 10, background: C.bg, border: `1px solid ${C.borderLight}` }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: C.textSecondary, flexShrink: 0 }}>🔍 Filtros:</span>
        <select value={filterUni} onChange={e => setFilterUni(e.target.value)} style={{ ...selectStyle, flex: "1 1 200px", fontSize: 12, padding: "7px 10px" }}>
          <option value="">Todas las universidades</option>
          {universities.map(u => <option key={u} value={u}>{u}</option>)}
        </select>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 11, color: C.textMuted }}>Desde:</span>
          <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} style={{ ...inputStyle, width: 140, fontSize: 11, padding: "6px 8px" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 11, color: C.textMuted }}>Hasta:</span>
          <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} style={{ ...inputStyle, width: 140, fontSize: 11, padding: "6px 8px" }} />
        </div>
        {hasFilters && (
          <button onClick={() => { setFilterUni(""); setFilterDateFrom(""); setFilterDateTo(""); }} style={{ ...btnOutline, fontSize: 11, padding: "5px 10px" }}>
            ✕ Limpiar
          </button>
        )}
      </div>

      {hasFilters && (
        <div style={{ marginBottom: 16, fontSize: 12, color: C.textSecondary, fontStyle: "italic" }}>
          Mostrando resultados filtrados{filterUni ? ` de ${filterUni}` : ""}{filterDateFrom ? ` desde ${new Date(filterDateFrom).toLocaleDateString("es-AR")}` : ""}{filterDateTo ? ` hasta ${new Date(filterDateTo).toLocaleDateString("es-AR")}` : ""}
        </div>
      )}

      {/* ── Tarjetas de estadísticas ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14, marginBottom: 32 }}>
        {[
          { label: "Reportes", value: stats.reportes, color: C.red, bg: C.redSoft, border: C.redBorder },
          { label: "Tablas Prov.", value: stats.tablas, color: "#6366f1", bg: "#eef2ff", border: "#c7d2fe" },
          { label: "Equiv. Totales", value: stats.total, color: C.green, bg: C.greenSoft, border: C.greenBorder },
          { label: "Equiv. Parciales", value: stats.parcial, color: C.amber, bg: C.amberSoft, border: C.amberBorder },
          { label: "Sin Equivalencia", value: stats.sin, color: C.redAccent, bg: C.dangerSoft, border: C.dangerBorder },
          { label: "Universidades", value: stats.universities, color: C.red, bg: C.redSoft, border: C.redBorder },
          { label: "Planes", value: stats.planes, color: "#0891b2", bg: "#ecfeff", border: "#a5f3fc" },
        ].map((s, i) => (
          <div key={i} style={{ background: s.bg, borderRadius: 12, padding: "18px 16px", border: `1px solid ${s.border}` }}>
            <div style={{ fontSize: 30, fontWeight: 700, color: s.color, fontFamily: "'Outfit', sans-serif" }}>{s.value}</div>
            <div style={{ fontSize: 12, color: C.textSecondary, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Reportes de alumnos ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 20, color: C.text, margin: 0, fontWeight: 700 }}>📋 Reportes de Alumnos</h2>
        <button onClick={() => setTab("reporte_alumno")} style={{ ...btnPrimary, padding: "7px 14px", fontSize: 12 }}>+ Nuevo reporte</button>
      </div>

      {filteredReports.length === 0 && !hasFilters ? (
        <div style={{ background: C.surface, borderRadius: 12, padding: 36, textAlign: "center", border: `1px dashed ${C.border}`, marginBottom: 28 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>📭</div>
          <div style={{ fontSize: 14, color: C.textSecondary, marginBottom: 14 }}>No hay reportes de alumnos guardados.</div>
          <button onClick={() => setTab("reporte_alumno")} style={{ ...btnOutline, fontSize: 12 }}>📄 Ir a Reporte Alumno</button>
        </div>
      ) : filteredReports.length === 0 && hasFilters ? (
        <div style={{ background: C.bg, borderRadius: 10, padding: "16px", textAlign: "center", fontSize: 13, color: C.textMuted, marginBottom: 28 }}>
          No hay reportes que coincidan con los filtros aplicados.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 28 }}>
          {filteredReports.slice(0, 10).map(report => {
            const s = report.summary || {};
            return (
              <div key={report.id} onClick={() => setTab("reportes")} style={{
                background: C.surface, borderRadius: 10, border: `1px solid ${C.border}`, padding: "12px 16px",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                transition: "box-shadow 0.15s", boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)"}
                onMouseLeave={e => e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)"}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{report.student_name} {report.student_dni ? `· DNI ${report.student_dni}` : ""}</div>
                  <div style={{ fontSize: 12, color: C.textMuted, marginTop: 3 }}>{report.origin_university} — {report.origin_career}</div>
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
                  {(s.total > 0) && <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: C.greenSoft, color: C.green, fontWeight: 700 }}>✓ {s.total}</span>}
                  {(s.parcial > 0) && <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: C.amberSoft, color: C.amber, fontWeight: 700 }}>△ {s.parcial}</span>}
                  {(s.sin > 0) && <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: C.dangerSoft, color: C.redAccent, fontWeight: 700 }}>✗ {s.sin}</span>}
                  <span style={{ fontSize: 11, color: C.textMuted, marginLeft: 4 }}>{new Date(report.created_at).toLocaleDateString("es-AR")}</span>
                </div>
              </div>
            );
          })}
          {filteredReports.length > 10 && (
            <button onClick={() => setTab("reportes")} style={{ ...btnOutline, alignSelf: "center", fontSize: 12, marginTop: 4 }}>
              Ver todos ({filteredReports.length}) →
            </button>
          )}
        </div>
      )}

      {/* ── Tablas provisionales ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 20, color: C.text, margin: 0, fontWeight: 700 }}>📊 Tablas Provisionales</h2>
        <button onClick={() => setTab("tabla")} style={{ ...btnOutline, padding: "7px 14px", fontSize: 12 }}>Ir a Tablas →</button>
      </div>

      {filteredTablas.length === 0 && savedPlans.length === 0 && !hasFilters ? (
        <div style={{ background: C.surface, borderRadius: 12, padding: 36, textAlign: "center", border: `1px dashed ${C.border}`, marginBottom: 28 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>📊</div>
          <div style={{ fontSize: 14, color: C.textSecondary, marginBottom: 14 }}>No hay tablas provisionales ni planes cargados.</div>
          <button onClick={() => setTab("planes")} style={{ ...btnOutline, fontSize: 12 }}>📥 Cargar un plan de estudios</button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 28 }}>
          {filteredTablas.map(tabla => {
            const colors = tabla.colors || {};
            const vals = Object.values(colors);
            const tT = vals.filter(v => v === "TOTAL").length;
            const tP = vals.filter(v => v === "PARCIAL").length;
            const tS = vals.filter(v => v === "SIN_EQUIVALENCIA").length;
            const tTotal = vals.length;
            return (
              <div key={tabla.id} onClick={() => { setTablaSelectedPlanId(tabla.plan_id); setTab("tabla"); }} style={{
                background: C.surface, borderRadius: 10, border: `1px solid ${C.border}`, padding: "12px 16px",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                transition: "box-shadow 0.15s", boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)"}
                onMouseLeave={e => e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)"}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{tabla.origin_career || "Carrera no especificada"}</div>
                  <div style={{ fontSize: 12, color: C.textMuted, marginTop: 3 }}>{tabla.origin_university || "Universidad no especificada"} · {tTotal} materias evaluadas</div>
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
                  {tT > 0 && <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: C.greenSoft, color: C.green, fontWeight: 700 }}>✓ {tT}</span>}
                  {tP > 0 && <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: C.amberSoft, color: C.amber, fontWeight: 700 }}>△ {tP}</span>}
                  {tS > 0 && <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: C.dangerSoft, color: C.redAccent, fontWeight: 700 }}>✗ {tS}</span>}
                  <span style={{ fontSize: 11, color: C.textMuted, marginLeft: 4 }}>{new Date(tabla.updated_at).toLocaleDateString("es-AR")}</span>
                </div>
              </div>
            );
          })}
          {filteredTablas.length === 0 && savedPlans.length > 0 && !hasFilters && (
            <div style={{ background: C.bg, borderRadius: 10, padding: "12px 16px", fontSize: 13, color: C.textSecondary }}>
              Hay {savedPlans.length} plan{savedPlans.length > 1 ? "es" : ""} cargado{savedPlans.length > 1 ? "s" : ""} pero sin tabla provisoria generada aún. <span onClick={() => setTab("tabla")} style={{ color: C.red, cursor: "pointer", fontWeight: 600 }}>Ir a Tablas →</span>
            </div>
          )}
        </div>
      )}

      {/* ── Análisis individuales legacy ── */}
      {analyses.length > 0 && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 20, color: C.text, margin: 0, fontWeight: 700 }}>🔍 Análisis Individuales</h2>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={exportCSV} style={btnOutline}>📥 CSV</button>
              <button onClick={clearAll} style={{ ...btnOutline, borderColor: C.redBorder, color: C.redAccent, fontSize: 12 }}>🗑 Limpiar</button>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {analyses.map(a => (
              <div key={a.id} style={{ background: C.surface, borderRadius: 10, border: `1px solid ${C.border}`, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                <div onClick={() => setExpandedAnalysis(expandedAnalysis === a.id ? null : a.id)}
                  style={{ padding: "12px 16px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
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
                  <div style={{ padding: "0 16px 16px", borderTop: `1px solid ${C.borderLight}`, animation: "fadeIn 0.2s ease" }}>
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
        </>
      )}

      {/* ── Estado vacío general ── */}
      {filteredReports.length === 0 && filteredTablas.length === 0 && analyses.length === 0 && savedPlans.length === 0 && !hasFilters && (
        <div style={{ background: C.surface, borderRadius: 16, padding: 56, textAlign: "center", border: `2px dashed ${C.redBorder}`, marginTop: 8 }}>
          <div style={{ fontSize: 48, marginBottom: 14 }}>📝</div>
          <div style={{ fontSize: 18, color: C.text, marginBottom: 6, fontFamily: "'Outfit', sans-serif", fontWeight: 600 }}>Bienvenido al sistema de equivalencias</div>
          <div style={{ fontSize: 14, color: C.textSecondary, marginBottom: 24 }}>Cargá un plan de estudios o generá un reporte de alumno para comenzar.</div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => setTab("reporte_alumno")} style={btnPrimary}>📄 Reporte Alumno</button>
            <button onClick={() => setTab("planes")} style={btnOutline}>📥 Cargar Plan</button>
          </div>
        </div>
      )}
    </div>
  );
}