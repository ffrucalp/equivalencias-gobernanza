// ============ GMAIL ATTACHMENT SEARCH ============
// Requires VITE_GOOGLE_CLIENT_ID env var + gmail.readonly scope on login

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
const GMAIL_SCOPE = "https://www.googleapis.com/auth/gmail.readonly";

// ── Load Google Identity Services ──
function loadScript(src, id) {
  return new Promise((resolve, reject) => {
    if (document.getElementById(id)) { resolve(); return; }
    const s = document.createElement("script");
    s.src = src; s.id = id; s.async = true; s.defer = true;
    s.onload = resolve;
    s.onerror = () => reject(new Error(`No se pudo cargar ${src}`));
    document.head.appendChild(s);
  });
}

async function ensureGisLoaded() {
  await loadScript("https://accounts.google.com/gsi/client", "google-gis-script");
}

function requestGmailToken() {
  return new Promise((resolve, reject) => {
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: GMAIL_SCOPE,
      callback: (response) => {
        if (response.error) reject(new Error(response.error_description || response.error));
        else resolve(response.access_token);
      },
      error_callback: (err) => reject(new Error(err?.message || "Error de autenticación Gmail")),
    });
    tokenClient.requestAccessToken();
  });
}

// ── Search emails with attachments ──
export async function searchGmailAttachments(query = "") {
  await ensureGisLoaded();
  const token = await requestGmailToken();

  // Build search query: look for emails with attachments
  const q = `has:attachment ${query}`.trim();

  const resp = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(q)}&maxResults=20`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!resp.ok) throw new Error("Error buscando en Gmail");
  const data = await resp.json();

  if (!data.messages || data.messages.length === 0) return { results: [], token };

  // Fetch message details (in parallel, max 20)
  const details = await Promise.all(
    data.messages.map(async (msg) => {
      const r = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!r.ok) return null;
      const d = await r.json();
      const headers = {};
      (d.payload?.headers || []).forEach(h => { headers[h.name.toLowerCase()] = h.value; });

      // Get attachment info from parts
      const attachments = [];
      const collectParts = (parts) => {
        if (!parts) return;
        for (const part of parts) {
          if (part.filename && part.body?.attachmentId) {
            const ext = part.filename.split(".").pop().toLowerCase();
            if (["pdf", "docx", "doc", "txt", "xlsx", "xls", "csv"].includes(ext)) {
              attachments.push({
                attachmentId: part.body.attachmentId,
                filename: part.filename,
                mimeType: part.mimeType,
                size: part.body.size || 0,
              });
            }
          }
          if (part.parts) collectParts(part.parts);
        }
      };
      // Need full message to get parts
      const fullResp = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (fullResp.ok) {
        const fullMsg = await fullResp.json();
        collectParts(fullMsg.payload?.parts ? fullMsg.payload.parts : [fullMsg.payload]);
      }

      if (attachments.length === 0) return null;

      return {
        messageId: msg.id,
        from: headers.from || "",
        subject: headers.subject || "(sin asunto)",
        date: headers.date || "",
        attachments,
      };
    })
  );

  return {
    results: details.filter(Boolean),
    token,
  };
}

// ── Download a specific attachment ──
export async function downloadGmailAttachment(messageId, attachmentId, filename, token) {
  const resp = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/attachments/${attachmentId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!resp.ok) throw new Error("No se pudo descargar el adjunto");
  const data = await resp.json();

  // Gmail returns base64url-encoded data
  const base64 = data.data.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

  const ext = filename.split(".").pop().toLowerCase();
  const mimeMap = {
    pdf: "application/pdf",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    doc: "application/msword",
    txt: "text/plain",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    csv: "text/csv",
  };

  return new File([bytes], filename, { type: mimeMap[ext] || "application/octet-stream" });
}
