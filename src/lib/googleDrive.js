// ============ GOOGLE DRIVE PICKER ============
// Requires VITE_GOOGLE_API_KEY and VITE_GOOGLE_CLIENT_ID env vars

const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || "";
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.readonly";

export function isGoogleDriveConfigured() {
  return !!(GOOGLE_API_KEY && GOOGLE_CLIENT_ID);
}

// ── Load external scripts ──
function loadScript(src, id) {
  return new Promise((resolve, reject) => {
    if (document.getElementById(id)) { resolve(); return; }
    const s = document.createElement("script");
    s.src = src;
    s.id = id;
    s.async = true;
    s.defer = true;
    s.onload = resolve;
    s.onerror = () => reject(new Error(`No se pudo cargar ${src}`));
    document.head.appendChild(s);
  });
}

let _pickerApiLoaded = false;

async function ensureGoogleApisLoaded() {
  // Load Google API (for Picker)
  await loadScript("https://apis.google.com/js/api.js", "google-api-script");
  // Load Google Identity Services (for OAuth token)
  await loadScript("https://accounts.google.com/gsi/client", "google-gis-script");

  // Load the Picker API module
  if (!_pickerApiLoaded) {
    await new Promise((resolve, reject) => {
      window.gapi.load("picker", { callback: resolve, onerror: reject });
    });
    _pickerApiLoaded = true;
  }
}

// ── Get OAuth access token via Google Identity Services ──
function requestAccessToken() {
  return new Promise((resolve, reject) => {
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: DRIVE_SCOPE,
      callback: (response) => {
        if (response.error) {
          reject(new Error(response.error_description || response.error));
        } else {
          resolve(response.access_token);
        }
      },
      error_callback: (err) => {
        reject(new Error(err?.message || "Error de autenticación con Google"));
      }
    });
    tokenClient.requestAccessToken();
  });
}

// ── Open Google Picker and return selected file info ──
function openPicker(accessToken) {
  return new Promise((resolve, reject) => {
    const docsView = new window.google.picker.DocsView()
      .setIncludeFolders(true)
      .setSelectFolderEnabled(false)
      .setMimeTypes([
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
        "text/plain",
        "application/vnd.google-apps.spreadsheet",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ].join(","));

    const sheetsView = new window.google.picker.DocsView(window.google.picker.ViewId.SPREADSHEETS)
      .setIncludeFolders(true);

    const picker = new window.google.picker.PickerBuilder()
      .addView(docsView)
      .addView(sheetsView)
      .setOAuthToken(accessToken)
      .setDeveloperKey(GOOGLE_API_KEY)
      .setTitle("Seleccionar plan de estudios desde Google Drive")
      .setLocale("es")
      .setCallback((data) => {
        if (data.action === window.google.picker.Action.PICKED) {
          const doc = data.docs[0];
          resolve({
            id: doc.id,
            name: doc.name,
            mimeType: doc.mimeType,
            url: doc.url,
          });
        } else if (data.action === window.google.picker.Action.CANCEL) {
          resolve(null); // User cancelled
        }
      })
      .build();

    picker.setVisible(true);
  });
}

// ── Download file content from Google Drive ──
async function downloadFileContent(fileId, mimeType, accessToken) {
  const headers = { Authorization: `Bearer ${accessToken}` };

  // Google Sheets → export as CSV
  if (mimeType === "application/vnd.google-apps.spreadsheet") {
    const resp = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/csv`,
      { headers }
    );
    if (!resp.ok) throw new Error("No se pudo exportar el Google Sheet");
    const csv = await resp.text();
    // Parse CSV → extract first column as subjects
    const rows = csv.split("\n").map(r => {
      const cells = [];
      let current = "", inQuotes = false;
      for (const ch of r) {
        if (ch === '"') { inQuotes = !inQuotes; }
        else if (ch === ',' && !inQuotes) { cells.push(current.trim()); current = ""; }
        else { current += ch; }
      }
      cells.push(current.trim());
      return cells;
    }).filter(r => r.some(c => c.length > 0));

    return {
      type: "sheets",
      text: csv,
      subjects: rows.slice(1).map(r => r[0]).filter(s => s && s.length > 2),
    };
  }

  // Regular files (PDF, DOCX, TXT) → download as blob
  const resp = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    { headers }
  );
  if (!resp.ok) throw new Error("No se pudo descargar el archivo");
  const blob = await resp.blob();

  // Create a File object to reuse existing extractors
  const file = new File([blob], `drive-file.${getExtension(mimeType)}`, { type: mimeType });
  return { type: "file", file, mimeType };
}

function getExtension(mimeType) {
  const map = {
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "application/msword": "doc",
    "text/plain": "txt",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  };
  return map[mimeType] || "bin";
}

// ── Main function: full flow ──
export async function pickFileFromDrive() {
  if (!isGoogleDriveConfigured()) {
    throw new Error("Google Drive no está configurado. Configurá VITE_GOOGLE_API_KEY y VITE_GOOGLE_CLIENT_ID.");
  }

  // 1. Load Google APIs
  await ensureGoogleApisLoaded();

  // 2. Get access token (may show Google consent popup)
  const accessToken = await requestAccessToken();

  // 3. Open Picker
  const selected = await openPicker(accessToken);
  if (!selected) return null; // Cancelled

  // 4. Download content
  const content = await downloadFileContent(selected.id, selected.mimeType, accessToken);

  return {
    fileName: selected.name,
    driveUrl: selected.url,
    ...content,
  };
}
