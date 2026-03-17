import { useState, useEffect, useRef } from "react";

// ============ UCALP PROGRAMS DATA ============
const UCALP_PROGRAMS = {
  "estrategias_comunicacionales": {
    name: "Estrategias Comunicacionales",
    professor: "Francisco Fernández Ruiz",
    hours: 64,
    year: "1°",
    units: [
      { number: 1, title: "Fundamentos de la comunicación y retórica clásica", topics: "Comunicación humana: modelos y elementos. Texto, discurso y contexto. Retórica clásica: Aristóteles y Quintiliano. Tres géneros retóricos (deliberativo, judicial, epidíctico). Cinco operaciones retóricas: inventio, dispositio, elocutio, memoria, actio. Ethos, pathos y logos. Análisis de charlas TED desde la retórica aristotélica." },
      { number: 2, title: "Lectura crítica y comprensión textual", topics: "Lectura académica: estrategias. Secuencias textuales: narrativa, descriptiva, explicativa, argumentativa, dialogal. Inferencias e hipótesis de lectura. Elementos paratextuales. Redes y mapas conceptuales. Géneros discursivos y esferas sociales de uso." },
      { number: 3, title: "Fenómenos de la textualidad y análisis del discurso", topics: "Cohesión y coherencia textual. Procedimientos lingüísticos para mantenimiento del referente. Ambigüedad, polisemia, estilo directo e indirecto. Objetividad y subjetividad en el lenguaje. Lo explícito y lo implícito. Marcadores discursivos y conectores." },
      { number: 4, title: "El texto académico: análisis y producción", topics: "Texto académico: registro, léxico, estructura. Tipos: resumen, informe, ensayo, monografía, abstract. Citas directas e indirectas, notas al pie, normas APA 7.ª ed. Argumentación académica: tesis, premisas, evidencia, conclusión." },
      { number: 5, title: "Oralidad persuasiva: del discurso clásico al formato TED", topics: "Oralidad académica y profesional. Estructura de presentación oral. Storytelling aplicado a comunicación de datos. Recursos retóricos: anáfora, metáfora, antítesis, pregunta retórica. Formato TED. Comunicación oral en entornos virtuales." }
    ]
  },
  "fundamentos_computacion": {
    name: "Fundamentos de Computación",
    professor: "Lic. Sebastián Cerezo",
    hours: 48,
    year: "1°",
    units: [
      { number: 1, title: "Arquitectura de computadoras", topics: "Historia de la computación. Componentes del hardware: CPU, memoria RAM, almacenamiento, periféricos. Modelo de Von Neumann y ciclo de instrucción. Representación de la información: sistemas numéricos binario, octal y hexadecimal. Tipos de buses y comunicación entre componentes." },
      { number: 2, title: "Sistemas operativos – conceptos y administración", topics: "Concepto y funciones del sistema operativo. Tipos: monousuario, multiusuario, tiempo real. Estructura interna: kernel, shell e interfaz de usuario. Gestión de procesos, memoria y archivos. Administración en Windows. Introducción a GNU/Linux: filosofía, distribuciones y línea de comandos." },
      { number: 3, title: "Redes de computadoras y protocolos", topics: "Conceptos fundamentales de redes: topologías y tipos. Modelo OSI y modelo TCP/IP. Protocolo IP: direccionamiento IPv4 e IPv6, máscaras de subred. Protocolos de aplicación: HTTP/HTTPS, DNS, DHCP, FTP, SSH. Dispositivos de red: routers, switches, access points." },
      { number: 4, title: "Almacenamiento y gestión de archivos", topics: "Tipos de almacenamiento: HDD, SSD, NVMe, RAID. Sistemas de archivos: FAT32, NTFS, ext4. Particionado de discos y gestión de volúmenes. Estrategias de backup y recuperación de datos." },
      { number: 5, title: "Virtualización y computación en la nube", topics: "Virtualización: completa, paravirtualización y contenedores. Hipervisores Tipo 1 y Tipo 2. VirtualBox, VMware. Docker y contenedores. Computación en la nube: modelos IaaS, PaaS y SaaS. AWS, Azure, Google Cloud. Seguridad y privacidad en entornos virtualizados." }
    ]
  },
  "intro_economia": {
    name: "Introducción a la Economía",
    professor: "Cra. Silvina Lorenzi",
    hours: 64,
    year: "1°",
    units: [
      { number: 1, title: "Introducción a la Economía", topics: "Definición de Economía y relación con datos. Fuentes de datos económicos. Microeconomía y Macroeconomía. Principio de escasez. Necesidades, Bienes y Servicios. Recursos productivos. Flujo Circular de la Renta. Costo de Oportunidad. Frontera de Posibilidades de Producción. Agentes económicos. Sistemas económicos. Historia del Pensamiento Económico: Fisiocracia, Mercantilismo, Adam Smith, David Ricardo, Marxismo, Escuela Neoclásica, Keynes." },
      { number: 2, title: "Equilibrio de Oferta y Demanda. El Mercado", topics: "Ley de Demanda. Curva de Demanda. Variables significativas. Cambios en la demanda y en la cantidad demandada. Curva de Oferta. Equilibrio de mercado. Desplazamiento de las curvas. Elasticidad precio de la demanda." },
      { number: 3, title: "La Empresa", topics: "Concepto de empresa. Producción. Combinación de recursos productivos. Función de Producción. Corto Plazo. Ley de rendimientos marginales decrecientes. Largo Plazo. Rendimientos a escala. Teoría de los costos de Corto Plazo. Clases de costos." },
      { number: 4, title: "Los Mercados", topics: "Tipos de mercado. Competencia Perfecta: supuestos, beneficio, curva de oferta. Competencia Imperfecta: Monopolio, discriminación de precios, regulaciones. Competencia Monopólica. Monopsonio. Oligopolio. Duopolio. Posición de la Iglesia." },
      { number: 5, title: "Introducción a la Macroeconomía", topics: "PIB y crecimiento económico. Inflación, desempleo y ciclos económicos. Política monetaria y política fiscal. Series de tiempo en análisis macroeconómico. Visualización e interpretación de indicadores." }
    ]
  },
  "intro_gobernanza": {
    name: "Introducción a la Gobernanza de Datos",
    professor: "Ing. Felipe Rojo Amadeo",
    hours: 64,
    year: "1°",
    units: [
      { number: 1, title: "El dato y la gobernanza de datos", topics: "Dato como activo estratégico. Jerarquía DIKW. Tipos de datos: estructurados, semiestructurados, no estructurados. Economía del dato: organizaciones data-driven. Definición y alcance de gobernanza de datos. Data Governance vs Data Management. Principios: responsabilidad, integridad, transparencia, accesibilidad. Frameworks: DAMA-DMBOK, COBIT for Data, enfoque no invasivo (Seiner). Modelos de madurez." },
      { number: 2, title: "Políticas, procesos, roles y estructuras", topics: "Políticas de datos: definición, tipología y ciclo de vida. Diseño e implementación de políticas. Toma de decisiones basada en datos. Roles: Data Owner, Data Steward, Data Custodian, Data User. Comité de Datos, CDO. Modelos: centralizado, federado, híbrido. Gestión del cambio y cultura del dato." },
      { number: 3, title: "Ciclo de vida del dato y calidad de datos", topics: "Etapas: creación/captura, almacenamiento, procesamiento, uso/análisis, archivo, eliminación. Linaje de datos: trazabilidad, impacto, auditoría. Integración de datos. Metadatos y catálogos. Gestión de datos maestros (MDM). Calidad: exactitud, completitud, consistencia, oportunidad, unicidad, validez. Métricas, KPIs y scorecards. Profiling, limpieza y monitoreo continuo." },
      { number: 4, title: "Seguridad, privacidad y marco normativo", topics: "Confidencialidad, integridad, disponibilidad. Amenazas y vulnerabilidades. Controles: clasificación de datos, acceso basado en roles, cifrado. Privacy by Design. Gestión de incidentes. Ley 25.326 de Protección de Datos Personales (Argentina). GDPR europeo. Derechos de titulares: acceso, rectificación, supresión, portabilidad." },
      { number: 5, title: "Gobernanza en entornos emergentes y ética del dato", topics: "Big Data: las 5V e implicancias para gobernanza. Cloud, data lakes y data mesh. Gobernanza de IA: responsabilidad algorítmica. Sesgos algorítmicos: identificación y mitigación. EU AI Act. Ética aplicada a datos. Prudencia y deliberación. Consentimiento, finalidad, proporcionalidad. Responsabilidad social del profesional." }
    ]
  },
  "matematicas": {
    name: "Matemáticas",
    professor: "Caterina Meteo",
    hours: 64,
    year: "1°",
    units: [
      { number: 1, title: "Lógica y teoría de conjuntos", topics: "Proposiciones y conectivos lógicos. Tablas de verdad. Negaciones. Equivalencias lógicas. Conjuntos: operaciones básicas." },
      { number: 2, title: "Funciones elementales", topics: "Funciones: operación y composición. Representación gráfica e interpretación. Dominio, imagen e inversa. Crecimiento y decrecimiento." },
      { number: 3, title: "Límites y continuidad", topics: "Noción intuitiva y formal de límite. Límites en un punto, laterales, finitos e infinitos. Propiedades y cálculos. Continuidad y tipos de discontinuidades." },
      { number: 4, title: "Derivadas", topics: "Derivada como razón de cambio. Reglas de derivación. Derivadas de funciones elementales. Derivadas de orden superior. Relación derivabilidad-continuidad. Extremos relativos y absolutos. Concavidad y puntos de inflexión. Análisis cualitativo y gráfico." },
      { number: 5, title: "Integración y ecuaciones diferenciales", topics: "Integral definida e indefinida. Regla de Barrow. Teorema Fundamental del Cálculo. Métodos básicos de integración. Integrales impropias. EDO de primer orden. Variables separables. Modelos de crecimiento y decaimiento." },
      { number: 6, title: "Sucesiones y series", topics: "Sucesiones numéricas. Límite y convergencia. Series numéricas. Criterios básicos de convergencia. Criterio de Leibnitz. Series de potencias." },
      { number: 7, title: "Álgebra lineal", topics: "Vectores y matrices. Sistemas de ecuaciones lineales. Método de Gauss. Espacios vectoriales: definición y ejemplos. Bases y dimensión." },
      { number: 8, title: "Polinomios y ecuaciones algebraicas", topics: "Polinomios: operaciones y propiedades. Raíces y factorización. Ecuaciones algebraicas. Teorema Fundamental del Álgebra." },
      { number: 9, title: "Estructuras algebraicas", topics: "Concepto de estructura algebraica. Grupos, anillos y cuerpos. Noción de módulo." },
      { number: 10, title: "Funciones de varias variables", topics: "Funciones de dos variables. Derivadas parciales. Regla de la cadena. Integrales triples, integrales de línea y de superficie. Interpretación geométrica." }
    ]
  }
};

const MODELS = [
  { id: "anthropic/claude-sonnet-4.6", label: "Claude Sonnet 4.6", icon: "🟣" },
  { id: "google/gemini-3-flash-preview", label: "Gemini 3 Flash", icon: "🔵" },
  { id: "arcee-ai/trinity-large-preview:free", label: "Trinity Large (gratis)", icon: "🟢" },
  { id: "openrouter/hunter-Alpha", label: "Hunter Alpha", icon: "🟠" },
];

const COMMON_UNIVERSITIES = [
  "Universidad Nacional de La Plata (UNLP)",
  "Universidad de Buenos Aires (UBA)",
  "Universidad Tecnológica Nacional (UTN)",
  "Universidad Nacional de Córdoba (UNC)",
  "Universidad Nacional de Rosario (UNR)",
  "Universidad del Salvador (USAL)",
  "Universidad de Ciencias Empresariales y Sociales (UCES)",
  "Otra (especificar)"
];

const COMMON_CAREERS = [
  "Ingeniería en Sistemas",
  "Ingeniería en Computación",
  "Ingeniería Industrial",
  "Ingeniería Electrónica",
  "Ingeniería Mecánica",
  "Licenciatura en Sistemas",
  "Licenciatura en Informática",
  "Contador Público",
  "Licenciatura en Administración",
  "Licenciatura en Economía",
  "Abogacía / Derecho",
  "Otra (especificar)"
];

function buildPrompt(ucalpSubject, ucalpUnits, originSubject, originProgram, originUniversity, originCareer) {
  return `Sos un experto académico en análisis de equivalencias universitarias en Argentina. Tu tarea es comparar rigurosamente el programa de una materia de ORIGEN con el programa de una materia DESTINO de la Licenciatura en Gobernanza de Datos (UCALP).

## MATERIA DESTINO (UCALP - Lic. en Gobernanza de Datos)
**Materia:** ${ucalpSubject}
**Unidades:**
${ucalpUnits.map(u => `- Unidad ${u.number}: ${u.title}\n  Contenidos: ${u.topics}`).join("\n")}

## MATERIA DE ORIGEN
**Universidad:** ${originUniversity}
**Carrera:** ${originCareer}
**Materia:** ${originSubject}
**Programa/Contenidos:**
${originProgram}

## INSTRUCCIONES DE ANÁLISIS
Analizá unidad por unidad de la materia DESTINO y determiná qué porcentaje de cobertura tiene la materia de ORIGEN sobre cada una. Sé riguroso: no basta con que los temas sean vagamente similares, los contenidos deben ser sustancialmente equivalentes.

## CRITERIOS DE CLASIFICACIÓN
- **EQUIVALENCIA TOTAL**: La materia de origen cubre al menos el 80% de los contenidos de TODAS las unidades de la materia destino.
- **EQUIVALENCIA PARCIAL**: La materia de origen cubre sustancialmente (≥70%) ALGUNAS unidades pero no todas. Indicar exactamente qué unidades se reconocen y cuáles debe rendir el alumno en un examen complementario.
- **SIN EQUIVALENCIA**: La materia de origen cubre menos del 50% de los contenidos globales o los enfoques son fundamentalmente distintos.

## FORMATO DE RESPUESTA (responder SOLO en este formato JSON exacto, sin texto adicional ni backticks):
{
  "clasificacion": "TOTAL" | "PARCIAL" | "SIN_EQUIVALENCIA",
  "porcentaje_cobertura_global": <número 0-100>,
  "analisis_por_unidad": [
    {
      "unidad": <número>,
      "titulo": "<título>",
      "cobertura": <número 0-100>,
      "coincidencias": "<temas que coinciden>",
      "faltantes": "<temas que faltan o difieren>"
    }
  ],
  "unidades_reconocidas": [<números de unidades reconocidas>],
  "unidades_a_rendir": [<números de unidades que debe rendir>],
  "justificacion": "<explicación clara y fundamentada de la decisión>",
  "recomendacion": "<recomendación para el director de carrera>",
  "observaciones": "<notas adicionales relevantes>"
}`;
}

async function loadData(key, fallback) {
  try { const r = await window.storage.get(key); return r ? JSON.parse(r.value) : fallback; } catch { return fallback; }
}
async function saveData(key, value) {
  try { await window.storage.set(key, JSON.stringify(value)); } catch (e) { console.error(e); }
}

// ============ COLORS ============
const C = {
  red: "#B71C1C",
  redLight: "#E53935",
  redSoft: "#FFEBEE",
  redBorder: "#FFCDD2",
  redAccent: "#C62828",
  redMuted: "#EF9A9A",
  bg: "#FAFAFA",
  surface: "#FFFFFF",
  surfaceAlt: "#FFF8F8",
  border: "#E0E0E0",
  borderLight: "#F5F5F5",
  text: "#212121",
  textSecondary: "#757575",
  textMuted: "#9E9E9E",
  green: "#2E7D32",
  greenSoft: "#E8F5E9",
  greenBorder: "#C8E6C9",
  amber: "#F57F17",
  amberSoft: "#FFF8E1",
  amberBorder: "#FFECB3",
  dangerSoft: "#FFEBEE",
  dangerBorder: "#FFCDD2",
};

export default function EquivalenciasApp() {
  const [tab, setTab] = useState("dashboard");
  const [apiKey, setApiKey] = useState("");
  const [selectedModel, setSelectedModel] = useState(MODELS[0].id);
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [expandedAnalysis, setExpandedAnalysis] = useState(null);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [originUniversity, setOriginUniversity] = useState(COMMON_UNIVERSITIES[0]);
  const [customUniversity, setCustomUniversity] = useState("");
  const [originCareer, setOriginCareer] = useState(COMMON_CAREERS[0]);
  const [customCareer, setCustomCareer] = useState("");
  const [originSubject, setOriginSubject] = useState("");
  const [originProgram, setOriginProgram] = useState("");
  const [targetSubject, setTargetSubject] = useState(Object.keys(UCALP_PROGRAMS)[0]);
  const [result, setResult] = useState(null);
  const resultRef = useRef(null);

  useEffect(() => {
    (async () => {
      const saved = await loadData("eq-analyses-v2", []);
      const key = await loadData("eq-apikey-v2", "");
      const model = await loadData("eq-model-v2", MODELS[0].id);
      setAnalyses(saved); setApiKey(key); setSelectedModel(model); setLoading(false);
    })();
  }, []);

  const saveApiKey = async (k) => { setApiKey(k); await saveData("eq-apikey-v2", k); };
  const saveModel = async (m) => { setSelectedModel(m); await saveData("eq-model-v2", m); };

  const runAnalysis = async () => {
    if (!apiKey) { setShowApiKeyModal(true); return; }
    const uni = originUniversity.includes("Otra") ? customUniversity : originUniversity;
    const car = originCareer.includes("Otra") ? customCareer : originCareer;
    if (!originSubject.trim() || !originProgram.trim()) { setError("Completá el nombre y programa de la materia de origen."); return; }
    setAnalyzing(true); setError(null); setResult(null);
    const prog = UCALP_PROGRAMS[targetSubject];
    const prompt = buildPrompt(prog.name, prog.units, originSubject, originProgram, uni, car);
    try {
      const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}`, "HTTP-Referer": "https://ucalp-equivalencias.pages.dev", "X-Title": "UCALP Equivalencias" },
        body: JSON.stringify({ model: selectedModel, messages: [{ role: "system", content: "Sos un experto académico en análisis de equivalencias universitarias argentinas. Respondé SOLAMENTE con JSON válido, sin backticks ni texto adicional." }, { role: "user", content: prompt }], temperature: 0.2, max_tokens: 4000 })
      });
      if (!resp.ok) { const errData = await resp.json().catch(() => ({})); throw new Error(errData?.error?.message || `Error ${resp.status}`); }
      const data = await resp.json();
      const text = data.choices?.[0]?.message?.content || "";
      const clean = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      let parsed;
      try { parsed = JSON.parse(clean); } catch { const match = clean.match(/\{[\s\S]*\}/); if (match) parsed = JSON.parse(match[0]); else throw new Error("No se pudo parsear la respuesta. Intentá con otro modelo."); }
      const record = { id: Date.now().toString(), date: new Date().toISOString(), originUniversity: uni, originCareer: car, originSubject, targetSubject: prog.name, targetSubjectKey: targetSubject, model: selectedModel, result: parsed, originProgram: originProgram.substring(0, 2000) };
      setResult(record);
      const updated = [record, ...analyses]; setAnalyses(updated); await saveData("eq-analyses-v2", updated);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 200);
    } catch (e) { setError(e.message); } finally { setAnalyzing(false); }
  };

  const deleteAnalysis = async (id) => { const u = analyses.filter(a => a.id !== id); setAnalyses(u); await saveData("eq-analyses-v2", u); };
  const clearAll = async () => { if (confirm("¿Eliminar TODAS las equivalencias guardadas?")) { setAnalyses([]); await saveData("eq-analyses-v2", []); } };

  const exportCSV = () => {
    if (!analyses.length) return;
    const rows = [["Fecha","Universidad","Carrera","Materia Origen","Materia UCALP","Clasificación","% Cobertura","Unidades reconocidas","Unidades a rendir","Modelo IA"]];
    analyses.forEach(a => rows.push([new Date(a.date).toLocaleDateString("es-AR"), a.originUniversity, a.originCareer, a.originSubject, a.targetSubject, a.result.clasificacion, a.result.porcentaje_cobertura_global+"%", (a.result.unidades_reconocidas||[]).join("; "), (a.result.unidades_a_rendir||[]).join("; "), a.model]));
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF"+csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `equivalencias_ucalp_${new Date().toISOString().slice(0,10)}.csv`; a.click();
  };

  const Badge = ({ clasificacion }) => {
    const m = { TOTAL: { bg: C.green, label: "Equivalencia Total" }, PARCIAL: { bg: C.amber, label: "Equivalencia Parcial" }, SIN_EQUIVALENCIA: { bg: C.redAccent, label: "Sin Equivalencia" } };
    const s = m[clasificacion] || { bg: C.textMuted, label: clasificacion };
    return <span style={{ display: "inline-block", padding: "4px 14px", borderRadius: 20, background: s.bg, color: "#fff", fontSize: 11, fontWeight: 700, letterSpacing: "0.6px", textTransform: "uppercase" }}>{s.label}</span>;
  };

  const CoverageCircle = ({ pct, size = 48 }) => {
    const color = pct >= 70 ? C.green : pct >= 40 ? C.amber : C.redAccent;
    return (
      <div style={{ width: size, height: size, borderRadius: "50%", background: `conic-gradient(${color} ${pct*3.6}deg, ${C.borderLight} 0deg)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: size - 8, height: size - 8, borderRadius: "50%", background: C.surface, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size > 48 ? 15 : 12, fontWeight: 700, color }}>{pct}%</div>
      </div>
    );
  };

  const stats = { total: analyses.filter(a => a.result.clasificacion === "TOTAL").length, parcial: analyses.filter(a => a.result.clasificacion === "PARCIAL").length, sin: analyses.filter(a => a.result.clasificacion === "SIN_EQUIVALENCIA").length, universities: [...new Set(analyses.map(a => a.originUniversity))].length };

  if (loading) return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.bg, fontFamily: "'Source Serif 4', Georgia, serif" }}>
      <div style={{ textAlign: "center", color: C.textSecondary }}><div style={{ fontSize: 36, marginBottom: 12 }}>⚙️</div>Cargando...</div>
    </div>
  );

  const tabData = [
    { id: "dashboard", icon: "📊", label: "Panel" },
    { id: "analyze", icon: "🔍", label: "Analizar" },
    { id: "programs", icon: "📋", label: "Programas" },
    { id: "settings", icon: "⚙️", label: "Configuración" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700&family=Source+Serif+4:ital,wght@0,400;0,600;0,700&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }
        details summary::-webkit-details-marker { display: none; }
        details summary { list-style: none; }
        ::selection { background: ${C.redMuted}; color: ${C.red}; }
      `}</style>

      {/* ─── HEADER ─── */}
      <header style={{ background: C.red, color: "#fff", boxShadow: "0 2px 12px rgba(183,28,28,0.25)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, backdropFilter: "blur(4px)" }}>⚖</div>
              <div>
                <div style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 17, fontWeight: 700, lineHeight: 1.1 }}>Equivalencias UCALP</div>
                <div style={{ fontSize: 10, opacity: 0.8, letterSpacing: "0.8px", textTransform: "uppercase" }}>Lic. en Gobernanza de Datos · Fac. de Cs. Exactas e Ingeniería</div>
              </div>
            </div>
            <nav style={{ display: "flex", gap: 2 }}>
              {tabData.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)} style={{
                  padding: "8px 14px", borderRadius: 6, border: "none", cursor: "pointer",
                  background: tab === t.id ? "rgba(255,255,255,0.2)" : "transparent",
                  color: "#fff", fontSize: 12, fontWeight: tab === t.id ? 700 : 400,
                  transition: "all 0.15s", opacity: tab === t.id ? 1 : 0.8
                }}>{t.icon} {t.label}</button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Accent line */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${C.red}, ${C.redLight}, ${C.redMuted}, ${C.redLight}, ${C.red})` }} />

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 24px 80px" }}>

        {/* ═══════ DASHBOARD ═══════ */}
        {tab === "dashboard" && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 14, marginBottom: 32 }}>
              {[
                { label: "Análisis realizados", value: analyses.length, color: C.red, bg: C.redSoft, border: C.redBorder },
                { label: "Equiv. Totales", value: stats.total, color: C.green, bg: C.greenSoft, border: C.greenBorder },
                { label: "Equiv. Parciales", value: stats.parcial, color: C.amber, bg: C.amberSoft, border: C.amberBorder },
                { label: "Sin Equivalencia", value: stats.sin, color: C.redAccent, bg: C.dangerSoft, border: C.dangerBorder },
                { label: "Universidades", value: stats.universities, color: C.red, bg: C.redSoft, border: C.redBorder },
              ].map((s, i) => (
                <div key={i} style={{ background: s.bg, borderRadius: 12, padding: "18px 16px", border: `1px solid ${s.border}` }}>
                  <div style={{ fontSize: 30, fontWeight: 700, color: s.color, fontFamily: "'Source Serif 4', Georgia, serif" }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: C.textSecondary, marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 22, color: C.text, margin: 0, fontWeight: 700 }}>Historial de equivalencias</h2>
              {analyses.length > 0 && (
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={exportCSV} style={btnOutline}>📥 Exportar CSV</button>
                  <button onClick={clearAll} style={{ ...btnOutline, borderColor: C.redBorder, color: C.redAccent }}>🗑 Limpiar</button>
                </div>
              )}
            </div>

            {analyses.length === 0 ? (
              <div style={{ background: C.surface, borderRadius: 16, padding: 56, textAlign: "center", border: `2px dashed ${C.redBorder}` }}>
                <div style={{ fontSize: 48, marginBottom: 14 }}>📝</div>
                <div style={{ fontSize: 18, color: C.text, marginBottom: 6, fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 600 }}>No hay análisis guardados</div>
                <div style={{ fontSize: 14, color: C.textSecondary, marginBottom: 24 }}>Iniciá tu primer análisis de equivalencias.</div>
                <button onClick={() => setTab("analyze")} style={btnPrimary}>🔍 Iniciar análisis</button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {analyses.map(a => (
                  <div key={a.id} style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                    <div onClick={() => setExpandedAnalysis(expandedAnalysis === a.id ? null : a.id)}
                      style={{ padding: "14px 18px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                          <Badge clasificacion={a.result.clasificacion} />
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
                      <div style={{ padding: "0 18px 18px", borderTop: `1px solid ${C.borderLight}`, animation: "fadeIn 0.2s ease" }}>
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
            )}
          </div>
        )}

        {/* ═══════ ANALYZE ═══════ */}
        {tab === "analyze" && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <h2 style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 24, color: C.text, marginBottom: 4, fontWeight: 700 }}>Nuevo análisis de equivalencia</h2>
            <p style={{ color: C.textSecondary, fontSize: 14, marginBottom: 24 }}>Ingresá los datos de la materia de origen y seleccioná la materia UCALP contra la cual comparar.</p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22 }}>
              {/* Left: Origin */}
              <div style={cardStyle}>
                <SectionTitle icon="🏛" color={C.redAccent} label="Materia de origen" />
                <Label>Universidad de origen</Label>
                <select value={originUniversity} onChange={e => setOriginUniversity(e.target.value)} style={selectStyle}>{COMMON_UNIVERSITIES.map(u => <option key={u} value={u}>{u}</option>)}</select>
                {originUniversity.includes("Otra") && <input placeholder="Nombre de la universidad..." value={customUniversity} onChange={e => setCustomUniversity(e.target.value)} style={{ ...inputStyle, marginTop: 6 }} />}

                <Label>Carrera de origen</Label>
                <select value={originCareer} onChange={e => setOriginCareer(e.target.value)} style={selectStyle}>{COMMON_CAREERS.map(c => <option key={c} value={c}>{c}</option>)}</select>
                {originCareer.includes("Otra") && <input placeholder="Nombre de la carrera..." value={customCareer} onChange={e => setCustomCareer(e.target.value)} style={{ ...inputStyle, marginTop: 6 }} />}

                <Label>Nombre de la materia</Label>
                <input placeholder="Ej: Análisis Matemático I" value={originSubject} onChange={e => setOriginSubject(e.target.value)} style={inputStyle} />

                <Label>Programa / Contenidos</Label>
                <textarea placeholder={"Pegá acá el programa completo de la materia de origen.\n\nPodés copiar y pegar desde un PDF, Word, o página web.\n\nCuanto más detallado, más preciso el análisis."} value={originProgram} onChange={e => setOriginProgram(e.target.value)} style={{ ...inputStyle, minHeight: 200, resize: "vertical", lineHeight: 1.55 }} />
              </div>

              {/* Right */}
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <div style={cardStyle}>
                  <SectionTitle icon="🎯" color={C.red} label="Materia UCALP destino" />
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {Object.entries(UCALP_PROGRAMS).map(([key, prog]) => (
                      <button key={key} onClick={() => setTargetSubject(key)} style={{
                        padding: "12px 14px", borderRadius: 8, cursor: "pointer", textAlign: "left", transition: "all 0.15s", fontSize: 13, border: `1.5px solid`,
                        borderColor: targetSubject === key ? C.red : C.border,
                        background: targetSubject === key ? C.redSoft : C.surface,
                        color: targetSubject === key ? C.redAccent : C.text,
                      }}>
                        <div style={{ fontWeight: 600 }}>{prog.name}</div>
                        <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{prog.units.length} unidades · {prog.hours} hs · Prof. {prog.professor}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div style={cardStyle}>
                  <SectionTitle icon="🤖" color={C.textSecondary} label="Modelo de IA" />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                    {MODELS.map(m => (
                      <button key={m.id} onClick={() => saveModel(m.id)} style={{
                        padding: "10px 10px", borderRadius: 7, cursor: "pointer", textAlign: "left", fontSize: 12, transition: "all 0.15s", border: `1.5px solid`,
                        borderColor: selectedModel === m.id ? C.red : C.border,
                        background: selectedModel === m.id ? C.redSoft : C.surface,
                        color: selectedModel === m.id ? C.redAccent : C.textSecondary,
                        fontWeight: selectedModel === m.id ? 600 : 400
                      }}>{m.icon} {m.label}</button>
                    ))}
                  </div>
                </div>

                <button onClick={runAnalysis} disabled={analyzing} style={{
                  ...btnPrimary, padding: "15px 28px", fontSize: 15, opacity: analyzing ? 0.7 : 1, cursor: analyzing ? "wait" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8
                }}>
                  {analyzing ? <><span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⚙️</span> Analizando con IA...</> : "🔍 Ejecutar análisis de equivalencia"}
                </button>
              </div>
            </div>

            {error && <div style={{ marginTop: 18, padding: 14, borderRadius: 10, background: C.dangerSoft, border: `1px solid ${C.dangerBorder}`, color: C.redAccent, fontSize: 13 }}>⚠️ {error}</div>}

            {result && (
              <div ref={resultRef} style={{ ...cardStyle, marginTop: 26, animation: "fadeIn 0.3s ease" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                  <div>
                    <h3 style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 20, color: C.text, margin: 0, fontWeight: 700 }}>Resultado del análisis</h3>
                    <div style={{ fontSize: 13, color: C.textMuted, marginTop: 3 }}>{result.originSubject} ({result.originUniversity}) → {result.targetSubject}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <Badge clasificacion={result.result.clasificacion} />
                    <CoverageCircle pct={result.result.porcentaje_cobertura_global} size={54} />
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {(result.result.analisis_por_unidad || []).map((u, i) => (
                    <UnitDetail key={i} u={u} recognized={(result.result.unidades_reconocidas||[]).includes(u.unidad)} />
                  ))}
                </div>

                {result.result.unidades_a_rendir?.length > 0 && <div style={{ marginTop: 14 }}><AlertBox color="amber" icon="📝" title="Unidades a rendir en examen complementario" text={(result.result.unidades_a_rendir||[]).map(n => { const u2 = (result.result.analisis_por_unidad||[]).find(x => x.unidad === n); return `Unidad ${n}${u2 ? `: ${u2.titulo}` : ""}`; }).join(" · ")} /></div>}
                <div style={{ marginTop: 14 }}><InfoBox color={C.red} title="Justificación" text={result.result.justificacion} /></div>
                {result.result.recomendacion && <div style={{ marginTop: 8 }}><InfoBox color={C.amber} title="Recomendación" text={result.result.recomendacion} /></div>}
                {result.result.observaciones && <div style={{ marginTop: 8 }}><InfoBox color={C.textMuted} title="Observaciones" text={result.result.observaciones} /></div>}
              </div>
            )}
          </div>
        )}

        {/* ═══════ PROGRAMS ═══════ */}
        {tab === "programs" && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <h2 style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 24, color: C.text, marginBottom: 4, fontWeight: 700 }}>Programas UCALP precargados</h2>
            <p style={{ color: C.textSecondary, fontSize: 14, marginBottom: 22 }}>Materias del primer cuatrimestre — Lic. en Gobernanza de Datos (Plan 2025).</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {Object.entries(UCALP_PROGRAMS).map(([key, prog]) => (
                <details key={key} style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, overflow: "hidden" }}>
                  <summary style={{ padding: "16px 18px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 15, fontWeight: 600, color: C.text }}>
                    <div>
                      <div style={{ color: C.redAccent }}>{prog.name}</div>
                      <div style={{ fontSize: 12, color: C.textMuted, fontWeight: 400, marginTop: 3 }}>Prof. {prog.professor} · {prog.hours} hs · {prog.units.length} unidades</div>
                    </div>
                    <span style={{ fontSize: 11, color: C.textMuted, fontWeight: 400 }}>▾ ver</span>
                  </summary>
                  <div style={{ padding: "0 18px 18px" }}>
                    {prog.units.map(u => (
                      <div key={u.number} style={{ padding: 12, borderRadius: 8, background: C.bg, border: `1px solid ${C.borderLight}`, marginBottom: 6 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: C.red, marginBottom: 4 }}>Unidad {u.number}: {u.title}</div>
                        <div style={{ fontSize: 12, color: C.textSecondary, lineHeight: 1.5 }}>{u.topics}</div>
                      </div>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          </div>
        )}

        {/* ═══════ SETTINGS ═══════ */}
        {tab === "settings" && (
          <div style={{ maxWidth: 560, animation: "fadeIn 0.3s ease" }}>
            <h2 style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 24, color: C.text, marginBottom: 22, fontWeight: 700 }}>Configuración</h2>

            <div style={{ ...cardStyle, marginBottom: 18 }}>
              <SectionTitle icon="🔑" color={C.redAccent} label="API Key de OpenRouter" />
              <p style={{ fontSize: 13, color: C.textSecondary, marginBottom: 14, lineHeight: 1.5 }}>Necesitás una API key de <a href="https://openrouter.ai/keys" target="_blank" rel="noopener" style={{ color: C.red, fontWeight: 600, textDecoration: "none" }}>openrouter.ai/keys</a> para ejecutar los análisis.</p>
              <input type="password" placeholder="sk-or-v1-..." value={apiKey} onChange={e => saveApiKey(e.target.value)} style={{ ...inputStyle, fontFamily: "monospace" }} />
              {apiKey && <div style={{ marginTop: 6, fontSize: 12, color: C.green, fontWeight: 500 }}>✓ Configurada ({apiKey.substring(0, 14)}...)</div>}
            </div>

            <div style={{ ...cardStyle, marginBottom: 18 }}>
              <SectionTitle icon="🤖" color={C.textSecondary} label="Modelo por defecto" />
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {MODELS.map(m => (
                  <button key={m.id} onClick={() => saveModel(m.id)} style={{
                    padding: "12px 14px", borderRadius: 8, cursor: "pointer", textAlign: "left", fontSize: 13, transition: "all 0.15s", border: `1.5px solid`,
                    borderColor: selectedModel === m.id ? C.red : C.border,
                    background: selectedModel === m.id ? C.redSoft : C.surface,
                    color: selectedModel === m.id ? C.redAccent : C.textSecondary,
                  }}>
                    <span style={{ marginRight: 6 }}>{m.icon}</span>
                    <span style={{ fontWeight: 600 }}>{m.label}</span>
                    <span style={{ marginLeft: 8, fontSize: 11, color: C.textMuted }}>{m.id}</span>
                  </button>
                ))}
              </div>
            </div>

            <div style={cardStyle}>
              <SectionTitle icon="📊" color={C.textSecondary} label="Datos almacenados" />
              <div style={{ fontSize: 13, color: C.textSecondary, marginBottom: 12 }}>{analyses.length} análisis · {stats.universities} universidades</div>
              {analyses.length > 0 && (
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={exportCSV} style={btnOutline}>📥 Exportar CSV</button>
                  <button onClick={clearAll} style={{ ...btnOutline, borderColor: C.redBorder, color: C.redAccent }}>🗑 Eliminar todo</button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

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
      <footer style={{ position: "fixed", bottom: 0, left: 0, right: 0, height: 36, background: C.surface, borderTop: `1px solid ${C.borderLight}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: C.textMuted }}>
        Universidad Católica de La Plata · Fac. de Ciencias Exactas e Ingeniería · Lic. en Gobernanza de Datos · Dir. Francisco Fernández Ruiz
      </footer>
    </div>
  );
}

// ─── SMALL COMPONENTS ───
function SectionTitle({ icon, color, label }) {
  return (
    <h3 style={{ fontSize: 15, fontWeight: 700, color: "#212121", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ background: color + "18", padding: "4px 7px", borderRadius: 6, fontSize: 13 }}>{icon}</span>
      {label}
    </h3>
  );
}

function Label({ children }) {
  return <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#757575", marginBottom: 5, marginTop: 14, letterSpacing: "0.2px" }}>{children}</label>;
}

function UnitDetail({ u, recognized }) {
  const pctColor = u.cobertura >= 70 ? C.green : u.cobertura >= 40 ? C.amber : C.redAccent;
  return (
    <div style={{
      padding: 13, borderRadius: 8, background: recognized ? C.greenSoft : C.bg,
      border: `1px solid ${recognized ? C.greenBorder : C.borderLight}`,
      borderLeft: `4px solid ${recognized ? C.green : pctColor}`
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#212121" }}>U{u.unidad}: {u.titulo}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {recognized ? <span style={{ fontSize: 11, color: C.green, fontWeight: 700 }}>✓ RECONOCIDA</span> : <span style={{ fontSize: 11, color: C.redAccent, fontWeight: 700 }}>✗ DEBE RENDIR</span>}
          <span style={{ fontSize: 12, fontWeight: 700, padding: "2px 10px", borderRadius: 10, background: pctColor + "18", color: pctColor }}>{u.cobertura}%</span>
        </div>
      </div>
      {u.coincidencias && <div style={{ fontSize: 12, color: "#616161", marginBottom: 3 }}><span style={{ color: C.green }}>✓</span> {u.coincidencias}</div>}
      {u.faltantes && <div style={{ fontSize: 12, color: "#616161" }}><span style={{ color: C.redAccent }}>✗</span> {u.faltantes}</div>}
    </div>
  );
}

function AlertBox({ color, icon, title, text }) {
  const colors = { amber: { bg: C.amberSoft, border: C.amberBorder, text: C.amber }, red: { bg: C.dangerSoft, border: C.dangerBorder, text: C.redAccent } };
  const c = colors[color] || colors.amber;
  return (
    <div style={{ padding: 12, borderRadius: 8, background: c.bg, border: `1px solid ${c.border}` }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: c.text, marginBottom: 3 }}>{icon} {title}</div>
      <div style={{ fontSize: 13, color: "#424242", lineHeight: 1.5 }}>{text}</div>
    </div>
  );
}

function InfoBox({ color, title, text }) {
  return (
    <div style={{ padding: 13, borderRadius: 8, background: color + "08", border: `1px solid ${color}22` }}>
      <div style={{ fontSize: 12, fontWeight: 600, color, marginBottom: 4 }}>📋 {title}</div>
      <div style={{ fontSize: 13, color: "#424242", lineHeight: 1.55 }}>{text}</div>
    </div>
  );
}

// ─── STYLES ───
const cardStyle = { background: "#FFFFFF", borderRadius: 14, padding: 22, border: "1px solid #E0E0E0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" };
const inputStyle = { width: "100%", padding: "11px 13px", borderRadius: 7, border: "1px solid #E0E0E0", background: "#FAFAFA", color: "#212121", fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "'DM Sans', system-ui, sans-serif", transition: "border-color 0.15s" };
const selectStyle = { ...inputStyle, cursor: "pointer", appearance: "auto" };
const btnPrimary = { padding: "11px 22px", borderRadius: 9, border: "none", cursor: "pointer", background: "#B71C1C", color: "#fff", fontSize: 14, fontWeight: 700, transition: "all 0.15s", boxShadow: "0 2px 8px rgba(183,28,28,0.25)" };
const btnOutline = { padding: "8px 16px", borderRadius: 7, border: "1px solid #E0E0E0", background: "transparent", color: "#757575", cursor: "pointer", fontSize: 12, fontWeight: 500, transition: "all 0.15s" };