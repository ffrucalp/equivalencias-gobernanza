import { UCALP_PROGRAMS } from "./constants";

// ============ LOCAL STORAGE HELPERS ============
export function loadData(key, fallback) {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; } catch { return fallback; }
}
export function saveData(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { console.error(e); }
}

// ============ PARSE TEXT/HTML PLAN ============
export function parseTextPlan(rawText) {
  const subjects = [];
  const seen = new Set();
  if (rawText.includes("<li>") || rawText.includes("<ul>") || rawText.includes("<td>")) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(rawText, "text/html");
    doc.querySelectorAll("p strong, h1, h2, h3, h4").forEach(el => {
      const t = el.textContent.trim();
      if (/año|total|carga horaria/i.test(t)) el.parentElement?.remove();
    });
    doc.querySelectorAll("li").forEach(li => {
      let t = li.textContent.trim().replace(/\s+/g, " ");
      t = t.replace(/\s*\(\d[°º]\s*[Cc]uatrimestre\)/g, "").trim();
      t = t.replace(/\s*\(anual\)/gi, "").trim();
      if (t.length > 3 && t.length < 120 && !seen.has(t.toLowerCase())
        && !/^(home|inicio|nosotros|contacto|facebook|twitter|instagram|youtube|ver más|leer más)/i.test(t)) {
        seen.add(t.toLowerCase());
        subjects.push({ name: t, details: "" });
      }
    });
    if (subjects.length > 0) return subjects;
  }
  const lines = rawText.split(/\n|\r/).map(l => l.trim()).filter(Boolean);
  for (const line of lines) {
    if (/^(primer|segundo|tercer|cuarto|1°|2°|3°|4°|primer|total|carga horaria)/i.test(line)) continue;
    let t = line
      .replace(/^[\-•·*\d\.]+\s*/, "")
      .replace(/\s*[\(\[]\s*\d[°º]\s*[Cc]uatrimestre[\)\]]/g, "")
      .replace(/\s*[\(\[]\s*anual\s*[\)\]]/gi, "")
      .trim();
    if (t.length > 3 && t.length < 120 && /[a-záéíóúüñA-Z]{3,}/.test(t)
      && !seen.has(t.toLowerCase())) {
      seen.add(t.toLowerCase());
      subjects.push({ name: t, details: "" });
    }
  }
  return subjects;
}

// ============ FILE EXTRACTION ============
function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement("script"); s.src = src;
    s.onload = resolve; s.onerror = reject;
    document.head.appendChild(s);
  });
}

async function extractDocx(file) {
  if (!window.mammoth) {
    await loadScript("https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js");
  }
  const buf = await file.arrayBuffer();
  const result = await window.mammoth.extractRawText({ arrayBuffer: buf });
  return result.value;
}

async function extractPdf(file) {
  if (!window.pdfjsLib) {
    await loadScript("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js");
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  }
  const buf = await file.arrayBuffer();
  const pdf = await window.pdfjsLib.getDocument({ data: buf }).promise;
  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map(item => item.str).join(" ") + "\n";
  }
  return text;
}

export async function extractTextFromFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  if (ext === "txt") return await file.text();
  if (ext === "docx") return await extractDocx(file);
  if (ext === "pdf") return await extractPdf(file);
  throw new Error("Formato no soportado. Usá PDF, DOCX o TXT.");
}

async function extractPdfFromUrl(url) {
  if (!window.pdfjsLib) {
    await loadScript("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js");
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  }
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
  const resp = await fetch(proxyUrl);
  if (!resp.ok) throw new Error("No se pudo descargar el PDF.");
  const buf = await resp.arrayBuffer();
  const pdf = await window.pdfjsLib.getDocument({ data: buf }).promise;
  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map(item => item.str).join(" ") + "\n";
  }
  return text;
}

// ============ GOOGLE SHEETS IMPORT ============
export async function importFromGoogleSheets(url) {
  let sheetId = null;
  const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (match) sheetId = match[1];
  if (!sheetId) throw new Error("URL de Google Sheets no válida.");
  const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(csvUrl)}`;
  const resp = await fetch(proxyUrl);
  if (!resp.ok) throw new Error("No se pudo acceder al Sheet. Verificá que esté compartido.");
  const csv = await resp.text();
  const rows = csv.split("\n").map(row => {
    const cells = [];
    let current = "", inQuotes = false;
    for (const ch of row) {
      if (ch === '"') { inQuotes = !inQuotes; }
      else if (ch === ',' && !inQuotes) { cells.push(current.trim()); current = ""; }
      else { current += ch; }
    }
    cells.push(current.trim());
    return cells;
  }).filter(r => r.some(c => c.length > 0));
  return rows;
}

// ============ HTML TABLE PARSER ============
export function parseHtmlTable(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const subjects = [];
  doc.querySelectorAll("tr").forEach(row => {
    const tds = row.querySelectorAll("td");
    if (tds.length >= 2) {
      if (row.querySelector(".separador_semestre")) return;
      const nameCell = tds[1];
      const link = nameCell.querySelector("a");
      const name = (link ? link.textContent : nameCell.textContent).trim();
      if (name && name.length > 2 && !/^(actividades de formación|afc\s)/i.test(name)
        && !/^(cód|asignatura|materia|optativa$)/i.test(name)) {
        const codeCell = tds[0];
        const code = codeCell.textContent.trim();
        if (!subjects.find(s => s.name === name)) {
          subjects.push({ name, details: code || "" });
        }
      }
    }
  });
  if (subjects.length === 0) {
    doc.querySelectorAll("td, li").forEach(el => {
      const t = el.textContent.trim();
      if (t.length > 3 && t.length < 120 && /[a-záéíóúñ]{3,}/i.test(t)
        && !/^\d+$/.test(t) && !subjects.find(s => s.name === t)) {
        subjects.push({ name: t, details: "" });
      }
    });
  }
  return subjects;
}

// ============ AI-ASSISTED EXTRACTION ============
export async function aiExtractSubjects(rawText, apiKey, model) {
  const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}`, "HTTP-Referer": "https://ucalp-equivalencias.pages.dev", "X-Title": "UCALP Equivalencias" },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: "Sos un asistente que extrae listas de materias/asignaturas de planes de estudio universitarios. Respondé SOLO con un JSON array de strings con los nombres de las materias, sin texto adicional, sin backticks." },
        { role: "user", content: `Extraé la lista completa de materias/asignaturas del siguiente texto de un plan de estudios universitario. Devolvé SOLO el JSON array:\n\n${rawText.substring(0, 6000)}` }
      ],
      temperature: 0.1, max_tokens: 3000
    })
  });
  if (!resp.ok) { const e = await resp.json().catch(() => ({})); throw new Error(e?.error?.message || `Error ${resp.status}`); }
  const data = await resp.json();
  const text = data.choices?.[0]?.message?.content || "";
  const clean = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  try { const arr = JSON.parse(clean); if (Array.isArray(arr)) return arr; } catch {}
  const match2 = clean.match(/\[[\s\S]*\]/);
  if (match2) return JSON.parse(match2[0]);
  throw new Error("No se pudo parsear la respuesta de la IA.");
}

// ============ WEB SCRAPER (generic) ============
export async function scrapeStudyPlan(url) {
  let html = null;
  try {
    const resp = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`, { signal: AbortSignal.timeout(15000) });
    if (resp.ok) { const data = await resp.json(); if (data.contents) html = data.contents; }
  } catch {}
  if (!html) {
    try {
      const resp = await fetch(`https://corsproxy.io/?${encodeURIComponent(url)}`, { signal: AbortSignal.timeout(15000) });
      if (resp.ok) html = await resp.text();
    } catch {}
  }
  if (!html) {
    try {
      const resp = await fetch(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`, { signal: AbortSignal.timeout(15000) });
      if (resp.ok) html = await resp.text();
    } catch {}
  }
  if (!html) throw new Error("No se pudo acceder. Probá con otra URL o copiá el contenido manualmente.");

  if (html.substring(0, 10).includes("%PDF")) {
    try {
      const pdfText = await extractPdfFromUrl(url);
      return { subjects: [], rawText: pdfText, pdfLinks: [{ url, text: "PDF del plan de estudios" }], redirectedUrl: null, isPdfParsed: true };
    } catch {
      return { subjects: [], rawText: "(No se pudo parsear el PDF. Descargalo y subilo.)", pdfLinks: [{ url, text: "Descargar PDF" }], redirectedUrl: null };
    }
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  doc.querySelectorAll("script, style, nav, header, footer, .menu, .navbar, .sidebar, #menu, #header, #footer, [class*='menu'], [class*='nav'], [id*='menu'], [id*='nav']").forEach(el => el.remove());

  let subjects = [];
  let pdfLinks = [];

  const planSection = (() => {
    const allEls = Array.from(doc.querySelectorAll("h1,h2,h3,h4,section,div,article"));
    for (const el of allEls) {
      const t = el.textContent.toLowerCase();
      if (t.includes("plan de estudio") || t.includes("materias") || t.includes("asignaturas")) {
        const lists = el.querySelectorAll("ul, ol");
        if (lists.length > 0) return el;
      }
    }
    return null;
  })();

  const searchRoot = planSection || doc.body;

  searchRoot.querySelectorAll("table").forEach(table => {
    table.querySelectorAll("tr").forEach(row => {
      const cells = Array.from(row.querySelectorAll("td, th")).map(c => c.textContent.trim());
      if (cells.length >= 2) {
        for (const cell of cells) {
          const clean = cell.replace(/\s+/g, " ").trim();
          if (clean.length > 4 && clean.length < 120
            && !/^\d+$/.test(clean) && !/^[A-Z]\d{3,}$/.test(clean)
            && !/^(cód|codigo|correlat|semestre|cuatri|año|hs|hora|plan|carga|tipo|hes|het|hfp|asignatura|materia|1er|2do|3er)/i.test(clean)
            && /[a-záéíóúñ]{3,}/i.test(clean)
            && !subjects.find(s => s.name === clean)) {
            subjects.push({ name: clean, details: cells.join(" | ") });
            break;
          }
        }
      }
    });
  });

  if (subjects.length === 0) {
    const NAV_SKIP = /^(home|inicio|nosotros|quiénes|contacto|buscar|ver más|leer más|facebook|twitter|instagram|youtube|linkedin|campus|biblioteca|repositorio|extensión|investigación|idiomas|sede|ingresantes|noticias|graduados|docentes|carreras|facultad|universidad|inicio de sesión|ingresar|registrarse|siguiente|anterior|más información)/i;
    searchRoot.querySelectorAll("li").forEach(li => {
      const parent = li.closest("nav, [class*='menu'], [class*='nav'], [id*='menu'], [id*='nav'], [class*='header'], [class*='footer']");
      if (parent) return;
      let t = li.textContent.trim().replace(/\s+/g, " ");
      t = t.replace(/\s*[\(\[]\s*\d[°ºo]\s*[Cc]uatrimestre[\)\]]/g, "")
           .replace(/\s*[\(\[]\s*[12][°ºo]\s*[Ss]emestre[\)\]]/g, "")
           .replace(/\s*[\(\[]\s*[Aa]nual\s*[\)\]]/g, "").trim();
      if (t.length > 3 && t.length < 120 && !NAV_SKIP.test(t)
        && /[a-záéíóúüñA-ZÁÉÍÓÚÜÑ]{3,}/.test(t)
        && !subjects.find(s => s.name === t)) {
        subjects.push({ name: t, details: "" });
      }
    });
  }

  if (subjects.length === 0) {
    doc.querySelectorAll("a").forEach(a => {
      const text = a.textContent.trim();
      const href = a.getAttribute("href") || "";
      if ((href.includes("catedra") || href.includes("analitico") || href.includes("asignatura"))
        && text.length > 3 && text.length < 100 && /[a-záéíóúñ]{2,}/i.test(text)
        && !subjects.find(s => s.name === text)) {
        subjects.push({ name: text, details: href });
      }
    });
  }

  doc.querySelectorAll("a").forEach(a => {
    const href = a.getAttribute("href") || "";
    const text = a.textContent.trim();
    if (href.match(/\.pdf/i) || href.includes("plan.php")) {
      let fullUrl = href;
      if (href.startsWith("/")) { try { fullUrl = new URL(href, url).href; } catch {} }
      else if (!href.startsWith("http")) { try { fullUrl = new URL(href, url).href; } catch {} }
      if (!pdfLinks.find(p => p.url === fullUrl)) pdfLinks.push({ url: fullUrl, text: text || "PDF" });
    }
  });

  const mainContent = doc.querySelector("main, .content, #content, article, .entry-content, .page-content") || doc.body;
  const rawText = mainContent.textContent.replace(/\s+/g, " ").trim().substring(0, 10000);

  return { subjects, rawText, pdfLinks, redirectedUrl: null };
}

// ============ AI PROMPT BUILDERS ============
export function buildPrompt(ucalpSubject, ucalpData, originSubject, originProgram, originUniversity, originCareer) {
  const isProvisional = !ucalpData.hasProgram;
  if (isProvisional) {
    return `Sos un experto académico en análisis de equivalencias universitarias en Argentina. Debés realizar un análisis PROVISIONAL de equivalencia entre una materia de ORIGEN y una materia DESTINO de la Licenciatura en Gobernanza de Datos (UCALP).

IMPORTANTE: Esta evaluación es PROVISIONAL porque el programa completo de la materia destino aún está en elaboración.

## MATERIA DESTINO (UCALP) — PROGRAMA PROVISORIO
**Materia:** ${ucalpSubject}
**Año/Semestre:** ${ucalpData.year} — ${ucalpData.semester === "1S" ? "1° Semestre" : ucalpData.semester === "2S" ? "2° Semestre" : "Anual"}
**Créditos:** ${ucalpData.credits} | **Carga horaria total:** ${ucalpData.totalHours} hs
**Descripción tentativa:**
${ucalpData.descripcion}

## MATERIA DE ORIGEN
**Universidad:** ${originUniversity}
**Carrera:** ${originCareer}
**Materia:** ${originSubject}
**Programa/Contenidos:**
${originProgram}

## CRITERIOS
- **EQUIVALENCIA TOTAL**: Coincidencia sustancial (≥75%).
- **EQUIVALENCIA PARCIAL**: Coincidencia en algunos bloques.
- **SIN EQUIVALENCIA**: Contenidos sustancialmente distintos.
- **NO EVALUABLE**: Descripción insuficiente.

## FORMATO DE RESPUESTA (SOLO JSON, sin backticks):
{
  "clasificacion": "TOTAL" | "PARCIAL" | "SIN_EQUIVALENCIA" | "NO_EVALUABLE",
  "es_provisional": true,
  "porcentaje_cobertura_global": <número 0-100>,
  "analisis_por_unidad": [{ "unidad": 1, "titulo": "<bloque>", "cobertura": <0-100>, "coincidencias": "<temas>", "faltantes": "<temas>" }],
  "unidades_reconocidas": [],
  "unidades_a_rendir": [],
  "justificacion": "<análisis>",
  "recomendacion": "<recomendación>",
  "observaciones": "ANÁLISIS PROVISIONAL"
}`;
  }

  return `Sos un experto académico en análisis de equivalencias universitarias en Argentina. Compará rigurosamente la materia de ORIGEN con la materia DESTINO de la Lic. en Gobernanza de Datos (UCALP).

## MATERIA DESTINO (UCALP)
**Materia:** ${ucalpSubject}
**Año/Semestre:** ${ucalpData.year} — ${ucalpData.semester === "1S" ? "1° Semestre" : "2° Semestre"}
**Créditos:** ${ucalpData.credits} | **Carga horaria total:** ${ucalpData.totalHours} hs
**Unidades:**
${(ucalpData.units || []).map(u => `- Unidad ${u.number}: ${u.title}\n  Contenidos: ${u.topics}`).join("\n")}

## MATERIA DE ORIGEN
**Universidad:** ${originUniversity}
**Carrera:** ${originCareer}
**Materia:** ${originSubject}
**Programa/Contenidos:**
${originProgram}

## CRITERIOS
- **EQUIVALENCIA TOTAL**: Cubre ≥80% de TODAS las unidades.
- **EQUIVALENCIA PARCIAL**: Cubre ≥70% de ALGUNAS unidades.
- **SIN EQUIVALENCIA**: <50% global o enfoques distintos.

## FORMATO (SOLO JSON, sin backticks):
{
  "clasificacion": "TOTAL" | "PARCIAL" | "SIN_EQUIVALENCIA",
  "es_provisional": false,
  "porcentaje_cobertura_global": <0-100>,
  "analisis_por_unidad": [{ "unidad": <n>, "titulo": "<título>", "cobertura": <0-100>, "coincidencias": "<temas>", "faltantes": "<temas>" }],
  "unidades_reconocidas": [<números>],
  "unidades_a_rendir": [<números>],
  "justificacion": "<explicación>",
  "recomendacion": "<recomendación>",
  "observaciones": "<notas>"
}`;
}

// ============ BATCH QUICK ANALYSIS ============
export async function runBatchQuickAnalysis(originPlan, apiKey, model) {
  const originList = originPlan.subjects.slice(0, 80).map(s => `  • ${typeof s === "string" ? s : s.name}`).join("\n");

  const ucalpDescriptions = {
    estrategias_comunicacionales: "Comunicación, retórica, texto académico, oratoria",
    matematica: "Cálculo, álgebra lineal, funciones, derivadas, integrales, estadística",
    intro_economia: "Microeconomía básica, mercados, oferta y demanda, macroeconomía introductoria",
    intro_gobernanza: "ESPECÍFICA: Gobernanza de datos, DAMA-DMBOK, Data Steward, ciclo de vida del dato",
    fundamentos_computacion: "Hardware, SO, redes, almacenamiento, virtualización, nube",
    principios_programacion: "Programación estructurada y OOP, Python, algoritmos, NumPy/Pandas",
    filosofia_1: "Filosofía general, metafísica, Tomás de Aquino, gnoseología, ética filosófica",
    arquitectura_software: "Arquitecturas de software, patrones de diseño, Big-O, estructuras de datos, Git, APIs",
    macroeconomia: "PBI, inflación, desempleo, política fiscal y monetaria, ciclos económicos",
    administracion: "Proceso administrativo, gestión de proyectos, estrategia, transformación digital",
    estrategias_gobernanza: "MUY ESPECÍFICA: Estrategia de gobernanza de datos, frameworks, Data Office",
    modelado_datos: "MUY ESPECÍFICA: Modelo ER, normalización, Data Warehouse, ETL, data lakehouse",
    probabilidad_estadistica: "Probabilidad, distribuciones, inferencia, regresión",
    gobernanza_organizaciones: "ESPECÍFICA: Gobierno corporativo, COBIT, ISO 38500, compliance",
    microeconomia: "Teoría del consumidor y empresa, elasticidades, estructuras de mercado",
    normativa_internacional: "MUY ESPECÍFICA: GDPR, CCPA, Ley 25.326, Privacy by Design",
    bases_datos: "SQL avanzado, NoSQL, optimización, transacciones ACID, PostgreSQL, MongoDB",
    fund_inteligencia_artificial: "Machine learning, redes neuronales, deep learning, NLP, IA generativa",
    etica_responsabilidad: "ESPECÍFICA: Ética de datos, sesgos algorítmicos, IA ética",
    teologia_1: "Teología, doctrina social de la Iglesia",
    ingles: "Inglés técnico para tecnología",
    big_data: "MUY ESPECÍFICA: Hadoop, Spark, Kafka, data lakes, gobernanza Big Data",
    analisis_visualizacion: "Power BI, Tableau, Python visualización, dashboards",
    politicas_publicas: "ESPECÍFICA: Políticas públicas de datos, gobierno abierto, datos abiertos",
    ciberseguridad: "Criptografía, seguridad en redes, IAM, ISO 27001",
    diseno_politicas: "MUY ESPECÍFICA: Diseño de políticas de datos, DLM, retención y acceso",
    calidad_privacidad: "MUY ESPECÍFICA: Calidad de datos (DAMA), privacidad diferencial, anonimización",
    auditoria_datos: "MUY ESPECÍFICA: Auditoría de datos, ISACA, COBIT, auditoría de algoritmos",
    mineria_datos: "Machine learning aplicado, CRISP-DM, clasificación, clustering",
    toma_decisiones: "ESPECÍFICA: Toma de decisiones basada en datos, BI, analítica prescriptiva",
    filosofia_2: "Filosofía política, filosofía de la técnica, filosofía de la IA",
    gobernanza_proyectos: "MUY ESPECÍFICA: Gobernanza en proyectos de datos, DataOps, MLOps"
  };

  const ucalpList = Object.entries(ucalpDescriptions).map(([key, desc]) => `- ${key}: ${desc}`).join("\n");

  const allKeys = Object.keys(UCALP_PROGRAMS);
  const jsonTemplate = allKeys.map(k => `  "${k}": "TOTAL"|"PARCIAL"|"SIN_EQUIVALENCIA"|"SKIP"`).join(",\n");

  const prompt = `Sos un experto en equivalencias universitarias argentinas. Análisis PRELIMINAR y CONSERVADOR.

CARRERA DE ORIGEN: ${originPlan.career} — ${originPlan.university}
MATERIAS DE ORIGEN:
${originList}

MATERIAS UCALP — Gobernanza de Datos:
${ucalpList}

CRITERIOS ESTRICTOS:
- TOTAL: equivalencia muy probable. Nombre y área prácticamente idénticos.
- PARCIAL: superposición parcial pero real. Ser conservador.
- SIN_EQUIVALENCIA: área diferente o insuficiente.
- SKIP: teología, optativas, proyectos, inglés sin equivalente.

REGLAS: Materias MUY ESPECÍFICA → SIN_EQUIVALENCIA para carreras no-tech. Teología → SKIP siempre. Preferí SIN_EQUIVALENCIA ante dudas.

Respondé SOLO con JSON (sin backticks):
{
${jsonTemplate}
}`;

  const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}`, "HTTP-Referer": "https://ucalp-equivalencias.pages.dev", "X-Title": "UCALP Equivalencias" },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: "Respondé ÚNICAMENTE con JSON válido sin backticks. Sé conservador." },
        { role: "user", content: prompt }
      ],
      temperature: 0.1, max_tokens: 1200
    })
  });
  if (!resp.ok) { const e = await resp.json().catch(() => ({})); throw new Error(e?.error?.message || `Error ${resp.status}`); }
  const data = await resp.json();
  const text = data.choices?.[0]?.message?.content || "";
  const clean = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  try { return JSON.parse(clean); }
  catch {
    const m = clean.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]);
    throw new Error("No se pudo parsear la respuesta del análisis batch.");
  }
}
