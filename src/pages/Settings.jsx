import { useApp } from "../context/AppContext";
import { MODELS } from "../lib/constants";
import { C, cardStyle, inputStyle, selectStyle, btnPrimary, btnOutline } from "../lib/styles";
import { saveData } from "../lib/utils";
import { resetSupabaseClient } from "../supabaseClient";

export default function Settings() {
  const {
    apiKey, saveApiKey, selectedModel, saveModel,
    supabaseUrl, supabaseKey, setSupabaseUrl, setSupabaseKey,
    authProfile, authSession, analyses, savedPlans, dashboardStats
  } = useApp();

  return (
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
  );
}