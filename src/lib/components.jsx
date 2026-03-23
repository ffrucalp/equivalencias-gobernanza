import { C } from "./styles";

export function SectionTitle({ icon, color, label }) {
  return (
    <h3 style={{ fontSize: 15, fontWeight: 700, color: "#212121", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 18 }}>{icon}</span>
      <span style={{ borderBottom: `2px solid ${color}`, paddingBottom: 2 }}>{label}</span>
    </h3>
  );
}

export function Label({ children }) {
  return <div style={{ fontSize: 12, fontWeight: 600, color: C.textSecondary, marginBottom: 5, marginTop: 12 }}>{children}</div>;
}

export function Badge({ clasificacion }) {
  const m = { TOTAL: { bg: C.green, label: "Equivalencia Total" }, PARCIAL: { bg: C.amber, label: "Equivalencia Parcial" }, SIN_EQUIVALENCIA: { bg: C.redAccent, label: "Sin Equivalencia" } };
  const s = m[clasificacion] || { bg: C.textMuted, label: clasificacion };
  return <span style={{ display: "inline-block", padding: "4px 14px", borderRadius: 20, background: s.bg, color: "#fff", fontSize: 11, fontWeight: 700, letterSpacing: "0.6px", textTransform: "uppercase" }}>{s.label}</span>;
}

export function CoverageCircle({ pct, size = 48 }) {
  const color = pct >= 70 ? C.green : pct >= 40 ? C.amber : C.redAccent;
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: `conic-gradient(${color} ${pct*3.6}deg, ${C.borderLight} 0deg)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: size - 8, height: size - 8, borderRadius: "50%", background: C.surface, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size > 48 ? 15 : 12, fontWeight: 700, color }}>{pct}%</div>
    </div>
  );
}

export function UnitDetail({ u, recognized }) {
  const pct = u.cobertura ?? 0;
  const color = pct >= 70 ? C.green : pct >= 40 ? C.amber : C.redAccent;
  return (
    <div style={{ padding: "10px 14px", borderRadius: 8, background: recognized ? C.greenSoft : C.bg, border: `1px solid ${recognized ? C.greenBorder : C.borderLight}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
          {recognized && <span style={{ color: C.green, marginRight: 6 }}>✓</span>}
          Unidad {u.unidad}: {u.titulo}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 60, height: 5, borderRadius: 3, background: C.borderLight, overflow: "hidden" }}>
            <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 3 }} />
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color, minWidth: 34, textAlign: "right" }}>{pct}%</span>
        </div>
      </div>
      {u.coincidencias && <div style={{ fontSize: 11, color: C.green, marginTop: 3, lineHeight: 1.5 }}>✓ {u.coincidencias}</div>}
      {u.faltantes && <div style={{ fontSize: 11, color: C.redAccent, marginTop: 2, lineHeight: 1.5 }}>✗ {u.faltantes}</div>}
    </div>
  );
}

export function AlertBox({ color, icon, title, text }) {
  const colors = { amber: { bg: C.amberSoft, border: C.amberBorder, text: "#5D4037" }, red: { bg: C.dangerSoft, border: C.dangerBorder, text: C.redAccent } };
  const s = colors[color] || colors.amber;
  return (
    <div style={{ padding: "10px 14px", borderRadius: 8, background: s.bg, border: `1px solid ${s.border}` }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: s.text, marginBottom: 4 }}>{icon} {title}</div>
      <div style={{ fontSize: 12, color: s.text, lineHeight: 1.5 }}>{text}</div>
    </div>
  );
}

export function InfoBox({ color, title, text }) {
  return (
    <div style={{ padding: "10px 14px", borderRadius: 8, background: C.bg, borderLeft: `3px solid ${color}` }}>
      <div style={{ fontSize: 11, fontWeight: 700, color, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.3px" }}>{title}</div>
      <div style={{ fontSize: 13, color: C.text, lineHeight: 1.6 }}>{text}</div>
    </div>
  );
}
