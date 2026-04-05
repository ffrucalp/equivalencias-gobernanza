import { useState } from "react";
import { useApp } from "../context/AppContext";
import { getSupabaseClient } from "../supabaseClient";
import { UCALP_PLAN, UCALP_ORDER, UCALP_PROGRAMS } from "../lib/constants";
import { C, cardStyle, inputStyle, btnPrimary, btnOutline } from "../lib/styles";
import { extractTextFromFile } from "../lib/utils";
import { isGoogleDriveConfigured, pickFileFromDrive } from "../lib/googleDrive";
import { searchGmailAttachments, downloadGmailAttachment } from "../lib/gmail";

export default function Programas() {
  const {
    programAttachments, setProgramAttachments,
    authSession, error, setError, setTab
  } = useApp();

  const [programUploading, setProgramUploading] = useState(null);
  const [gmailSearch, setGmailSearch] = useState("");
  const [gmailResults, setGmailResults] = useState(null);
  const [gmailToken, setGmailToken] = useState(null);
  const [gmailLoading, setGmailLoading] = useState(false);
  const [gmailTarget, setGmailTarget] = useState(null);

// ── Upload file to Supabase Storage ──
const uploadToStorage = async (subjectKey, file) => {
  const sb = getSupabaseClient();
  if (!sb) return null;
  const ext = file.name.split(".").pop().toLowerCase();
  const path = `programas/${subjectKey}.${ext}`;
  // Remove old file if exists
  await sb.storage.from("programas").remove([path]).catch(() => {});
  const { data, error } = await sb.storage.from("programas").upload(path, file, { upsert: true });
  if (error) { console.error("Storage upload error:", error); return null; }
  const { data: urlData } = sb.storage.from("programas").getPublicUrl(path);
  return urlData?.publicUrl || null;
};

// ── Program attachment handlers ──
const handleProgramFileUpload = async (subjectKey, file) => {
  setProgramUploading(subjectKey); setError(null);
  try {
    const text = await extractTextFromFile(file);
    const fileUrl = await uploadToStorage(subjectKey, file);
    const record = {
      subject_key: subjectKey,
      file_name: file.name,
      content_text: text.substring(0, 50000),
      file_url: fileUrl,
      drive_url: null,
      uploaded_by: authSession?.user?.id || null,
      updated_at: new Date().toISOString()
    };
    const sb = getSupabaseClient();
    if (sb) {
      await sb.from("programas_adjuntos").upsert(record, { onConflict: "subject_key" });
    }
    setProgramAttachments(prev => ({ ...prev, [subjectKey]: record }));
  } catch (e) { setError("Error al subir programa: " + e.message); }
  finally { setProgramUploading(null); }
};

const handleProgramDrivePick = async (subjectKey) => {
  if (!isGoogleDriveConfigured()) { setError("Google Drive no configurado."); return; }
  setProgramUploading(subjectKey); setError(null);
  try {
    const result = await pickFileFromDrive();
    if (!result) { setProgramUploading(null); return; }
    let text = "";
    let file = null;
    if (result.type === "sheets") {
      text = result.text;
    } else if (result.type === "file") {
      text = await extractTextFromFile(result.file);
      file = result.file;
    }
    const fileUrl = file ? await uploadToStorage(subjectKey, file) : null;
    const record = {
      subject_key: subjectKey,
      file_name: result.fileName,
      content_text: text.substring(0, 50000),
      file_url: fileUrl,
      drive_url: result.driveUrl || null,
      uploaded_by: authSession?.user?.id || null,
      updated_at: new Date().toISOString()
    };
    const sb = getSupabaseClient();
    if (sb) {
      await sb.from("programas_adjuntos").upsert(record, { onConflict: "subject_key" });
    }
    setProgramAttachments(prev => ({ ...prev, [subjectKey]: record }));
  } catch (e) { setError("Google Drive: " + e.message); }
  finally { setProgramUploading(null); }
};

const handleProgramDelete = async (subjectKey) => {
  if (!confirm(`¿Eliminar el programa adjunto de ${UCALP_PROGRAMS[subjectKey]?.name}?`)) return;
  const sb = getSupabaseClient();
  if (sb) {
    try {
      // Delete from storage
      const att = programAttachments[subjectKey];
      if (att?.file_name) {
        const ext = att.file_name.split(".").pop().toLowerCase();
        await sb.storage.from("programas").remove([`programas/${subjectKey}.${ext}`]).catch(() => {});
      }
      await sb.from("programas_adjuntos").delete().eq("subject_key", subjectKey);
    } catch (e) { console.error(e); }
  }
  setProgramAttachments(prev => { const n = { ...prev }; delete n[subjectKey]; return n; });
};

// ── Gmail search handlers ──
const handleGmailSearch = async (query) => {
  setGmailLoading(true); setError(null); setGmailResults(null);
  try {
    const { results, token } = await searchGmailAttachments(query);
    setGmailResults(results);
    setGmailToken(token);
  } catch (e) { setError("Gmail: " + e.message); }
  finally { setGmailLoading(false); }
};

const handleGmailAttach = async (messageId, attachmentId, filename) => {
  if (!gmailTarget || !gmailToken) return;
  setProgramUploading(gmailTarget); setError(null);
  try {
    const file = await downloadGmailAttachment(messageId, attachmentId, filename, gmailToken);
    const text = await extractTextFromFile(file);
    const fileUrl = await uploadToStorage(gmailTarget, file);
    const record = {
      subject_key: gmailTarget,
      file_name: filename,
      content_text: text.substring(0, 50000),
      file_url: fileUrl,
      drive_url: null,
      uploaded_by: authSession?.user?.id || null,
      updated_at: new Date().toISOString()
    };
    const sb = getSupabaseClient();
    if (sb) {
      await sb.from("programas_adjuntos").upsert(record, { onConflict: "subject_key" });
    }
    setProgramAttachments(prev => ({ ...prev, [gmailTarget]: record }));
    setGmailTarget(null); setGmailResults(null); setGmailSearch("");
  } catch (e) { setError("Error adjuntando desde Gmail: " + e.message); }
  finally { setProgramUploading(null); }
};

  return (
    <>
      <div style={{ animation: "fadeIn 0.3s ease" }}>
        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 24, color: C.text, marginBottom: 4, fontWeight: 700 }}>Plan de Estudios — UCALP</h2>
        <p style={{ color: C.textSecondary, fontSize: 14, marginBottom: 8 }}>
          Licenciatura en Gobernanza de Datos · 41 materias · 6.250 hs · 250 créditos
        </p>
        <div style={{ display: "flex", gap: 12, marginBottom: 22, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, padding: "4px 12px", borderRadius: 20, background: C.greenSoft, color: C.green, fontWeight: 600, border: `1px solid ${C.greenBorder}` }}>
            ✓ {Object.values(UCALP_PROGRAMS).filter(p => p.hasProgram).length} programas completos
          </span>
          <span style={{ fontSize: 12, padding: "4px 12px", borderRadius: 20, background: C.amberSoft, color: C.amber, fontWeight: 600, border: `1px solid ${C.amberBorder}` }}>
            ⚠ {Object.values(UCALP_PROGRAMS).filter(p => !p.hasProgram).length} programas provisionales
          </span>
          <span style={{ fontSize: 12, padding: "4px 12px", borderRadius: 20, background: C.blueSoft, color: C.blue, fontWeight: 600, border: `1px solid ${C.blueBorder}` }}>
            📎 {Object.keys(programAttachments).length} programas adjuntados
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {Object.entries(UCALP_PLAN).map(([yearKey, yearData]) => (
            <div key={yearKey}>
              <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 16, color: C.redAccent, marginBottom: 10, fontWeight: 700 }}>{yearData.label}</h3>
              {Object.entries(yearData.semestres).map(([semKey, semData]) => (
                <div key={semKey} style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.textSecondary, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.4px" }}>{semData.label}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {semData.subjects.map(key => {
                      const prog = UCALP_PROGRAMS[key];
                      if (!prog) return null;
                      const attachment = programAttachments[key];
                      const isUploading = programUploading === key;
                      return (
                        <details key={key} style={{ background: C.surface, borderRadius: 10, border: `1px solid ${prog.hasProgram ? C.border : C.amberBorder}`, overflow: "hidden" }}>
                          <summary style={{ padding: "12px 16px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", listStyle: "none" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <span style={{ fontSize: 11, padding: "2px 6px", borderRadius: 4, background: prog.hasProgram ? C.greenSoft : C.amberSoft, color: prog.hasProgram ? C.green : C.amber, fontWeight: 700 }}>
                                {prog.cod}
                              </span>
                              <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{prog.name}</span>
                              {!prog.hasProgram && <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 4, background: C.amberSoft, color: C.amber, fontWeight: 700, border: `1px solid ${C.amberBorder}` }}>PROVISIONAL</span>}
                              {attachment && <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 4, background: C.blueSoft, color: C.blue, fontWeight: 700, border: `1px solid ${C.blueBorder}` }}>📎 ADJUNTO</span>}
                            </div>
                            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                              <span style={{ fontSize: 11, color: C.textMuted }}>{prog.credits} créd · {prog.totalHours} hs</span>
                              {prog.professor && <span style={{ fontSize: 11, color: C.textMuted }}>Prof. {prog.professor}</span>}
                              <span style={{ fontSize: 12, color: C.textMuted }}>▾</span>
                            </div>
                          </summary>
                          <div style={{ padding: "0 16px 16px", borderTop: `1px solid ${C.borderLight}` }}>
                            {/* Unidades del programa */}
                            {prog.hasProgram ? (
                              <div style={{ paddingTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                                {prog.units.map(u => (
                                  <div key={u.number} style={{ padding: 11, borderRadius: 7, background: C.bg, border: `1px solid ${C.borderLight}` }}>
                                    <div style={{ fontSize: 12, fontWeight: 600, color: C.redAccent, marginBottom: 3 }}>Unidad {u.number}: {u.title}</div>
                                    <div style={{ fontSize: 12, color: C.textSecondary, lineHeight: 1.5 }}>{u.topics}</div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div style={{ paddingTop: 12 }}>
                                <div style={{ padding: 11, borderRadius: 7, background: C.amberSoft, border: `1px solid ${C.amberBorder}`, fontSize: 12, color: "#6B4F00", lineHeight: 1.6 }}>
                                  <div style={{ fontWeight: 700, marginBottom: 6 }}>⚠ Programa en elaboración — Descripción tentativa:</div>
                                  {prog.descripcion}
                                </div>
                              </div>
                            )}

                            {/* Programa adjunto */}
                            <div style={{ marginTop: 14, padding: 14, borderRadius: 8, background: attachment ? C.blueSoft : C.bg, border: `1px solid ${attachment ? C.blueBorder : C.borderLight}` }}>
                              <div style={{ fontSize: 12, fontWeight: 700, color: attachment ? C.blue : C.textSecondary, marginBottom: 8 }}>
                                📎 Programa adjunto
                              </div>

                              {attachment ? (
                                <div>
                                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                                    <div>
                                      <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{attachment.file_name}</div>
                                      <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>
                                        {attachment.content_text?.length || 0} caracteres extraídos
                                        {attachment.updated_at && ` · ${new Date(attachment.updated_at).toLocaleDateString("es-AR")}`}
                                      </div>
                                    </div>
                                    <div style={{ display: "flex", gap: 6 }}>
                                      {attachment.file_url && (
                                        <a href={attachment.file_url} target="_blank" rel="noopener noreferrer"
                                          onClick={(e) => e.stopPropagation()}
                                          style={{ ...btnOutline, fontSize: 11, padding: "4px 10px", borderColor: C.blueBorder, color: C.blue, textDecoration: "none" }}>
                                          📥 Descargar
                                        </a>
                                      )}
                                      <button onClick={(e) => { e.stopPropagation(); handleProgramDelete(key); }} style={{ ...btnOutline, fontSize: 11, padding: "4px 10px", borderColor: C.redBorder, color: C.redAccent }}>🗑</button>
                                    </div>
                                  </div>
                                  <details style={{ marginTop: 4 }}>
                                    <summary style={{ fontSize: 11, color: C.blue, cursor: "pointer", fontWeight: 600 }}>Ver contenido extraído</summary>
                                    <div style={{ marginTop: 8, padding: 10, borderRadius: 6, background: C.surface, border: `1px solid ${C.borderLight}`, fontSize: 11, color: C.textSecondary, lineHeight: 1.6, maxHeight: 200, overflow: "auto", whiteSpace: "pre-wrap" }}>
                                      {attachment.content_text?.substring(0, 3000) || "(vacío)"}
                                      {attachment.content_text?.length > 3000 && "\n\n... (contenido truncado)"}
                                    </div>
                                  </details>
                                </div>
                              ) : (
                                <div>
                                  <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 10 }}>
                                    Adjuntá el programa oficial (PDF, DOCX o TXT). El texto se extrae y el archivo se guarda.
                                  </div>
                                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                                    <label style={{
                                      display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px",
                                      borderRadius: 7, border: `1.5px solid ${C.border}`, background: C.surface,
                                      cursor: isUploading ? "wait" : "pointer", fontSize: 12, fontWeight: 500,
                                      color: C.textSecondary, transition: "all 0.15s",
                                      opacity: isUploading ? 0.6 : 1
                                    }}>
                                      📄 {isUploading ? "Subiendo..." : "Subir archivo"}
                                      <input type="file" accept=".pdf,.docx,.doc,.txt" style={{ display: "none" }}
                                        disabled={isUploading}
                                        onChange={(e) => {
                                          const file = e.target.files[0];
                                          if (file) handleProgramFileUpload(key, file);
                                          e.target.value = "";
                                        }}
                                      />
                                    </label>
                                    {isGoogleDriveConfigured() && (
                                      <button onClick={(e) => { e.stopPropagation(); handleProgramDrivePick(key); }}
                                        disabled={isUploading}
                                        style={{
                                          display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px",
                                          borderRadius: 7, border: "1.5px solid #BBDEFB", background: "#EBF3FE",
                                          cursor: isUploading ? "wait" : "pointer", fontSize: 12, fontWeight: 500,
                                          color: "#1A73E8", transition: "all 0.15s",
                                          opacity: isUploading ? 0.6 : 1
                                        }}>
                                        📁 Google Drive
                                      </button>
                                    )}
                                    {isGoogleDriveConfigured() && (
                                      <button onClick={(e) => { e.stopPropagation(); setGmailTarget(key); setGmailResults(null); setGmailSearch(prog.name); }}
                                        disabled={isUploading}
                                        style={{
                                          display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px",
                                          borderRadius: 7, border: "1.5px solid #FFCDD2", background: "#FFEBEE",
                                          cursor: isUploading ? "wait" : "pointer", fontSize: 12, fontWeight: 500,
                                          color: "#C62828", transition: "all 0.15s",
                                          opacity: isUploading ? 0.6 : 1
                                        }}>
                                        ✉️ Buscar en Gmail
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </details>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

    {gmailTarget && (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={() => { setGmailTarget(null); setGmailResults(null); }}>
        <div onClick={e => e.stopPropagation()} style={{ background: C.surface, borderRadius: 16, padding: 28, border: `1px solid ${C.border}`, maxWidth: 640, width: "95%", boxShadow: "0 20px 50px rgba(0,0,0,0.2)", maxHeight: "85vh", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: 0 }}>✉️ Buscar programa en Gmail</h3>
              <div style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>
                Para: <span style={{ fontWeight: 600, color: C.red }}>{UCALP_PROGRAMS[gmailTarget]?.name}</span>
              </div>
            </div>
            <button onClick={() => { setGmailTarget(null); setGmailResults(null); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: C.textMuted, padding: 4 }}>✕</button>
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <input
              placeholder="Buscar por asunto, remitente, materia..."
              value={gmailSearch}
              onChange={e => setGmailSearch(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleGmailSearch(gmailSearch)}
              style={{ ...inputStyle, flex: 1 }}
              autoFocus
            />
            <button onClick={() => handleGmailSearch(gmailSearch)} disabled={gmailLoading} style={{
              ...btnPrimary, padding: "10px 18px", fontSize: 13, whiteSpace: "nowrap",
              background: "#C62828", opacity: gmailLoading ? 0.7 : 1
            }}>
              {gmailLoading ? "⚙️ Buscando..." : "✉️ Buscar"}
            </button>
          </div>

          <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 12, lineHeight: 1.5 }}>
            Buscá por nombre del alumno, materia, o cualquier texto. Se muestran mails con archivos adjuntos (PDF, DOCX, TXT).
          </div>

          {/* Results */}
          <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
            {gmailResults && gmailResults.length === 0 && (
              <div style={{ textAlign: "center", padding: 24, color: C.textMuted }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
                No se encontraron mails con adjuntos para esa búsqueda.
              </div>
            )}

            {gmailResults && gmailResults.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {gmailResults.map((msg, mi) => (
                  <div key={mi} style={{ padding: "12px 14px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 4 }}>{msg.subject}</div>
                    <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 8 }}>
                      De: {msg.from} · {msg.date}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {msg.attachments.map((att, ai) => (
                        <div key={ai} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 10px", borderRadius: 6, background: C.surface, border: `1px solid ${C.borderLight}` }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                            <span>📎</span>
                            <span style={{ fontWeight: 500, color: C.text }}>{att.filename}</span>
                            <span style={{ fontSize: 10, color: C.textMuted }}>({Math.round(att.size / 1024)} KB)</span>
                          </div>
                          <button
                            onClick={() => handleGmailAttach(msg.messageId, att.attachmentId, att.filename)}
                            disabled={programUploading === gmailTarget}
                            style={{
                              padding: "5px 12px", borderRadius: 6, border: "none", cursor: "pointer",
                              background: C.red, color: "#fff", fontSize: 11, fontWeight: 700,
                              opacity: programUploading === gmailTarget ? 0.6 : 1
                            }}>
                            {programUploading === gmailTarget ? "⚙️..." : "Adjuntar"}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )}
    </>
  );
}