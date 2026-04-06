import { useState, useEffect, useRef } from "react";
import { C, inputStyle } from "./styles";
import { searchUniversidades, searchCarreras } from "./siuCache";

export function AutocompleteInput({ value, onChange, placeholder, getSupabase, table = "universidades_buscador", column, filterColumn, filterValue, style = {} }) {
  const [query, setQuery] = useState(value || "");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const ref = useRef(null);
  const listRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => { setQuery(value || ""); }, [value]);

  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightIdx >= 0 && listRef.current) {
      const items = listRef.current.children;
      if (items[highlightIdx]) items[highlightIdx].scrollIntoView({ block: "nearest" });
    }
  }, [highlightIdx]);

  // ── Select an option ──
  const selectOption = (val) => {
    setQuery(val); onChange(val); setOpen(false); setHighlightIdx(-1);
  };

  // ── Keyboard handler ──
  const handleKeyDown = (e) => {
    if (!open || results.length === 0) {
      // If dropdown is closed and user presses down, open it
      if (e.key === "ArrowDown" && results.length > 0) {
        setOpen(true); setHighlightIdx(0); e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightIdx(prev => (prev + 1) % results.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightIdx(prev => (prev <= 0 ? results.length - 1 : prev - 1));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightIdx >= 0 && highlightIdx < results.length) {
          selectOption(results[highlightIdx]);
        }
        break;
      case "Tab":
        // Select highlighted option and let Tab advance to next field
        if (highlightIdx >= 0 && highlightIdx < results.length) {
          selectOption(results[highlightIdx]);
        } else if (results.length > 0) {
          selectOption(results[0]);
        }
        // Don't preventDefault — let the browser move focus to next input
        break;
      case "Escape":
        setOpen(false); setHighlightIdx(-1);
        break;
    }
  };

  // ── Búsqueda local (instantánea) usando el caché SIU ──
  const searchLocal = (text) => {
    if (column === "universidad") {
      return searchUniversidades(text, 30);
    } else if (column === "carrera") {
      return searchCarreras(text, filterValue || null, 30);
    }
    return null;
  };

  // ── Fallback a Supabase si el caché no está listo ──
  const searchRemote = async (text) => {
    const supabase = getSupabase ? getSupabase() : null;
    if (!supabase) return [];
    try {
      let q = supabase.from(table).select(column).ilike(column, `%${text}%`).limit(200);
      if (filterColumn && filterValue) q = q.ilike(filterColumn, `%${filterValue}%`);
      const { data } = await q;
      if (data) {
        return [...new Set(data.map(r => r[column]).filter(v => v && v.length < 150))].sort().slice(0, 30);
      }
    } catch (e) { console.error(e); }
    return [];
  };

  const search = (text) => {
    setQuery(text);
    onChange(text);
    setHighlightIdx(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!text || text.length < 2) { setResults([]); setOpen(false); return; }

    const localResults = searchLocal(text);
    if (localResults !== null) {
      setResults(localResults);
      setOpen(localResults.length > 0);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const remoteResults = await searchRemote(text);
      setResults(remoteResults);
      setOpen(remoteResults.length > 0);
      setLoading(false);
    }, 250);
  };

  return (
    <div ref={ref} style={{ position: "relative", ...style }}>
      <input
        value={query}
        onChange={(e) => search(e.target.value)}
        onFocus={() => { if (results.length > 0) setOpen(true); }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        style={{ ...inputStyle, width: "100%", paddingRight: 30 }}
      />
      {loading && <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: C.textMuted }}>⏳</span>}
      {open && results.length > 0 && (
        <div ref={listRef} style={{
          position: "absolute", top: "100%", left: 0, right: 0, zIndex: 100,
          background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8,
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)", maxHeight: 220, overflowY: "auto", marginTop: 2,
        }}>
          {results.map((r, i) => (
            <div key={i} onClick={() => selectOption(r)}
              style={{
                padding: "8px 12px", fontSize: 13, cursor: "pointer", color: C.text,
                borderBottom: i < results.length - 1 ? `1px solid ${C.borderLight}` : "none",
                background: i === highlightIdx ? C.redSoft : "transparent",
                fontWeight: i === highlightIdx ? 600 : 400,
              }}
              onMouseEnter={() => setHighlightIdx(i)}
            >
              {r}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

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