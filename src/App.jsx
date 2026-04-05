import { useState } from "react";
import { AppProvider, useApp } from "./context/AppContext";
import { getSupabaseClient } from "./supabaseClient";
import { C, cardStyle, inputStyle, selectStyle, btnPrimary, btnOutline } from "./lib/styles";

// ── Direct imports (sin lazy loading para debugging) ──
import Dashboard from "./pages/Dashboard";
import TablaProvisional from "./pages/TablaProvisional";
import ReporteAlumno from "./pages/ReporteAlumno";
import Reportes from "./pages/Reportes";
import Planes from "./pages/Planes";
import Programas from "./pages/Programas";
import Settings from "./pages/Settings";

function AppContent() {
  const {
    tab, setTab, loading,
    authSession, authProfile, authLoading, rol, needsLogin, ROL_LABELS,
    apiKey, saveApiKey, showApiKeyModal, setShowApiKeyModal,
    showProfileMenu, setShowProfileMenu, handleLogout,
    dashboardStats, savedPlans,
  } = useApp();

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const handleLogin = async () => {
    setLoginError(""); setLoginLoading(true);
    const sb = getSupabaseClient();
    if (!sb) { setLoginError("Configurá Supabase primero."); setLoginLoading(false); return; }
    const { error } = await sb.auth.signInWithPassword({ email: loginEmail, password: loginPassword });
    if (error) setLoginError(error.message === "Invalid login credentials" ? "Email o contraseña incorrectos." : error.message);
    setLoginLoading(false);
  };

  const handleResetPassword = async () => {
    if (!loginEmail) { setLoginError("Ingresá tu email primero."); return; }
    const sb = getSupabaseClient();
    if (!sb) { setLoginError("Supabase no configurado."); return; }
    const { error } = await sb.auth.resetPasswordForEmail(loginEmail, { redirectTo: window.location.origin });
    if (error) setLoginError(error.message);
    else setLoginError("✓ Revisá tu email para restablecer la contraseña.");
  };

  if (loading) return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.bg, fontFamily: "'Outfit', sans-serif" }}>
      <div style={{ textAlign: "center", color: C.textSecondary }}><div style={{ fontSize: 36, marginBottom: 12 }}>⚙️</div>Cargando...</div>
    </div>
  );

  const tabData = [
    { id: "dashboard", icon: "📊", label: "Panel" },
    { id: "tabla", icon: "⚡", label: "Tabla" },
    { id: "reporte_alumno", icon: "📄", label: "Reporte Alumno" },
    { id: "reportes", icon: "📋", label: "Reportes" },
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
        @media print { header, nav, footer, button, .no-print { display: none !important; } main { padding: 0 !important; } }
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
            <button onClick={async () => {
              setLoginError(""); setLoginLoading(true);
              const sb = getSupabaseClient();
              if (!sb) { setLoginError("Error de configuración."); setLoginLoading(false); return; }
              const { error } = await sb.auth.signInWithOAuth({
                provider: "google",
                options: { redirectTo: window.location.origin, queryParams: { hd: "ucalpvirtual.edu.ar" },
                  scopes: "https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.compose" }
              });
              if (error) { setLoginError(error.message); setLoginLoading(false); }
            }} disabled={loginLoading} style={{
              width: "100%", padding: "13px 16px", borderRadius: 10, border: "1.5px solid #E0E0E0", background: "#fff",
              cursor: loginLoading ? "wait" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
              fontSize: 15, fontWeight: 600, color: "#3C4043", boxShadow: "0 1px 4px rgba(0,0,0,0.1)", opacity: loginLoading ? 0.7 : 1
            }}>
              <svg width="20" height="20" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
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
          {/* Header */}
          <header style={{ background: C.red, color: "#fff", boxShadow: "0 2px 12px rgba(183,28,28,0.25)", flexShrink: 0, zIndex: 100, position: "sticky", top: 0 }}>
            <div style={{ padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 58 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 1px 4px rgba(0,0,0,0.15)" }}>
                  <img src="/favicon-ucalp-180.png" alt="UCALP" style={{ height: 30, borderRadius: "50%" }} />
                </div>
                <div>
                  <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 17, fontWeight: 700, lineHeight: 1.2 }}>Gestión de Equivalencias</div>
                  <div style={{ fontSize: 9, opacity: 0.75, letterSpacing: "0.4px", textTransform: "uppercase", marginTop: 1 }}>Lic. en Gobernanza de Datos · Fac. Cs. Exactas e Ingeniería</div>
                </div>
              </div>
              {authSession && authProfile && (() => {
                const googleAvatar = authSession.user?.user_metadata?.avatar_url || authSession.user?.user_metadata?.picture || authProfile.avatar_url;
                const displayName = authProfile.nombre || authSession.user?.user_metadata?.full_name?.split(" ")[0] || authProfile.email?.split("@")[0];
                return (
                  <div style={{ position: "relative" }}>
                    <button onClick={() => setShowProfileMenu(m => !m)} style={{
                      display: "flex", alignItems: "center", gap: 8, padding: "4px 12px 4px 4px", borderRadius: 24,
                      border: "1.5px solid rgba(255,255,255,0.3)", background: showProfileMenu ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.12)",
                      cursor: "pointer", color: "#fff"
                    }}>
                      {googleAvatar
                        ? <img src={googleAvatar} referrerPolicy="no-referrer" style={{ width: 30, height: 30, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.5)", flexShrink: 0 }} />
                        : <div style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{(displayName?.[0] || "?").toUpperCase()}</div>
                      }
                      <span style={{ fontSize: 13, fontWeight: 600, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{displayName}</span>
                      <span style={{ fontSize: 9, opacity: 0.7 }}>{showProfileMenu ? "▴" : "▾"}</span>
                    </button>
                    {showProfileMenu && (
                      <>
                        <div onClick={() => setShowProfileMenu(false)} style={{ position: "fixed", inset: 0, zIndex: 998 }} />
                        <div style={{ position: "fixed", top: 62, right: 16, background: "#fff", borderRadius: 14, boxShadow: "0 10px 40px rgba(0,0,0,0.2)", border: "1px solid #E8E8E8", minWidth: 240, overflow: "hidden", zIndex: 999 }}>
                          <div style={{ padding: "18px 18px 14px", borderBottom: "1px solid #F0F0F0", display: "flex", alignItems: "center", gap: 12 }}>
                            {googleAvatar
                              ? <img src={googleAvatar} referrerPolicy="no-referrer" style={{ width: 44, height: 44, borderRadius: "50%", border: "2px solid #E8E8E8", flexShrink: 0 }} />
                              : <div style={{ width: 44, height: 44, borderRadius: "50%", background: C.redSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: C.red, flexShrink: 0 }}>{(displayName?.[0] || "?").toUpperCase()}</div>
                            }
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: 14, fontWeight: 700, color: "#212121" }}>{authProfile.nombre} {authProfile.apellido}</div>
                              <div style={{ fontSize: 11, color: "#9E9E9E", marginTop: 2 }}>{authProfile.email}</div>
                              <span style={{ display: "inline-block", marginTop: 5, fontSize: 10, padding: "2px 8px", borderRadius: 4, background: ROL_LABELS[rol]?.bg, color: ROL_LABELS[rol]?.color, fontWeight: 700 }}>
                                {ROL_LABELS[rol]?.label || rol}
                              </span>
                            </div>
                          </div>
                          <div style={{ padding: "6px 0" }}>
                            <button onClick={() => { setTab("settings"); setShowProfileMenu(false); }} style={{ width: "100%", padding: "11px 18px", textAlign: "left", border: "none", background: "none", cursor: "pointer", fontSize: 13, color: "#424242", display: "flex", alignItems: "center", gap: 12 }}>⚙️ <span>Configuración</span></button>
                            <div style={{ height: 1, background: "#F5F5F5", margin: "4px 8px" }} />
                            <button onClick={async () => { setShowProfileMenu(false); await handleLogout(); }} style={{ width: "100%", padding: "11px 18px", textAlign: "left", border: "none", background: "none", cursor: "pointer", fontSize: 13, color: "#C62828", display: "flex", alignItems: "center", gap: 12, fontWeight: 600 }}>↩ <span>Cerrar sesión</span></button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                );
              })()}
            </div>
          </header>

          {/* Body: sidebar + contenido */}
          <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
            <aside style={{ width: 200, flexShrink: 0, background: C.surface, borderRight: `1px solid ${C.borderLight}`, display: "flex", flexDirection: "column", position: "sticky", top: 58, height: "calc(100vh - 58px)", overflowY: "auto" }}>
              <nav style={{ padding: "16px 10px", display: "flex", flexDirection: "column", gap: 3 }}>
                {tabData.map(t => (
                  <button key={t.id} onClick={() => setTab(t.id)} style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 8, border: "none", cursor: "pointer", textAlign: "left",
                    background: tab === t.id ? C.redSoft : "transparent", color: tab === t.id ? C.redAccent : C.textSecondary,
                    fontWeight: tab === t.id ? 700 : 400, fontSize: 13, fontFamily: "'DM Sans', sans-serif",
                    borderLeft: tab === t.id ? `3px solid ${C.red}` : "3px solid transparent"
                  }}>
                    <span style={{ fontSize: 16, width: 20, textAlign: "center", flexShrink: 0 }}>{t.icon}</span>
                    <span>{t.label}</span>
                  </button>
                ))}
              </nav>
              {authProfile && (
                <div style={{ marginTop: "auto", padding: "14px 14px 20px", borderTop: `1px solid ${C.borderLight}` }}>
                  <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 4 }}>Sesión activa</div>
                  <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 5, background: ROL_LABELS[rol]?.bg, color: ROL_LABELS[rol]?.color, fontWeight: 700 }}>
                    {ROL_LABELS[rol]?.label || rol}
                  </span>
                </div>
              )}
            </aside>

            <main style={{ flex: 1, minWidth: 0, padding: "28px 28px 80px", overflowY: "auto" }}>
              {tab === "dashboard" && <Dashboard />}
              {tab === "tabla" && <TablaProvisional />}
              {tab === "reporte_alumno" && <ReporteAlumno />}
              {tab === "reportes" && <Reportes />}
              {tab === "plans" && <Planes />}
              {tab === "programs" && <Programas />}
              {tab === "settings" && <Settings />}
            </main>
          </div>

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

          {/* Footer */}
          <footer style={{ position: "fixed", bottom: 0, left: 200, right: 0, height: 32, background: C.surface, borderTop: `1px solid ${C.borderLight}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: C.textMuted, zIndex: 50 }}>
            Universidad Católica de La Plata · Fac. de Ciencias Exactas e Ingeniería · Lic. en Gobernanza de Datos · Dir. Francisco Fernández Ruiz
          </footer>
        </div>
      )}
    </div>
  );
}

export default function EquivalenciasApp() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}