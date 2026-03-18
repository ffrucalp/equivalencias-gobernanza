import { useState, useEffect, useRef, useMemo } from "react";
import { FI_UNLP_PLANES, FI_UNLP_URL_KEYWORDS } from "./data/fi_unlp_planes";
import { getSupabaseClient, resetSupabaseClient } from "./supabaseClient";

// ============ UCALP PLAN STRUCTURE (Plan 2025 — todas las materias) ============
// hasProgram: true = programa completo cargado → análisis profundo
// hasProgram: false = solo metadatos → análisis PROVISIONAL sujeto a revisión

const UCALP_PLAN = {
  año1: {
    label: "1° Año",
    semestres: {
      "1S": {
        label: "1° Semestre",
        subjects: ["estrategias_comunicacionales","matematica","intro_economia","intro_gobernanza","fundamentos_computacion"]
      },
      "2S": {
        label: "2° Semestre",
        subjects: ["principios_programacion","filosofia_1","arquitectura_software","macroeconomia","administracion"]
      }
    }
  },
  año2: {
    label: "2° Año",
    semestres: {
      "1S": {
        label: "1° Semestre",
        subjects: ["estrategias_gobernanza","modelado_datos","probabilidad_estadistica","gobernanza_organizaciones","microeconomia"]
      },
      "2S": {
        label: "2° Semestre",
        subjects: ["normativa_internacional","bases_datos","fund_inteligencia_artificial","etica_responsabilidad","teologia_1","ingles"]
      }
    }
  },
  año3: {
    label: "3° Año",
    semestres: {
      "1S": {
        label: "1° Semestre",
        subjects: ["big_data","analisis_visualizacion","politicas_publicas","ciberseguridad","diseno_politicas"]
      },
      "2S": {
        label: "2° Semestre",
        subjects: ["calidad_privacidad","auditoria_datos","mineria_datos","toma_decisiones","filosofia_2"]
      }
    }
  },
  año4: {
    label: "4° Año",
    semestres: {
      "1S": {
        label: "1° Semestre",
        subjects: ["optativa_1","optativa_2","optativa_3","proyecto_1","gobernanza_proyectos"]
      },
      "2S": {
        label: "2° Semestre",
        subjects: ["optativa_4","optativa_5","optativa_6","proyecto_2","teologia_2"]
      }
    }
  }
};

// Helper: ordenar materias por año/semestre
const UCALP_ORDER = Object.values(UCALP_PLAN).flatMap(yr =>
  Object.values(yr.semestres).flatMap(s => s.subjects)
);

// ============ UCALP PROGRAMS DATA ============
const UCALP_PROGRAMS = {
  "estrategias_comunicacionales": {
    name: "Estrategias Comunicacionales",
    cod: 1, year: "1° Año", semester: "1S", credits: 4, totalHours: 100, weeklyHours: 3,
    correlatives: [],
    professor: "Francisco Fernández Ruiz",
    hours: 64, hasProgram: true,
    units: [
      { number: 1, title: "Fundamentos de la comunicación y retórica clásica", topics: "Comunicación humana: modelos y elementos. Texto, discurso y contexto. Retórica clásica: Aristóteles y Quintiliano. Tres géneros retóricos (deliberativo, judicial, epidíctico). Cinco operaciones retóricas: inventio, dispositio, elocutio, memoria, actio. Ethos, pathos y logos. Análisis de charlas TED desde la retórica aristotélica." },
      { number: 2, title: "Lectura crítica y comprensión textual", topics: "Lectura académica: estrategias. Secuencias textuales: narrativa, descriptiva, explicativa, argumentativa, dialogal. Inferencias e hipótesis de lectura. Elementos paratextuales. Redes y mapas conceptuales. Géneros discursivos y esferas sociales de uso." },
      { number: 3, title: "Fenómenos de la textualidad y análisis del discurso", topics: "Cohesión y coherencia textual. Procedimientos lingüísticos para mantenimiento del referente. Ambigüedad, polisemia, estilo directo e indirecto. Objetividad y subjetividad en el lenguaje. Lo explícito y lo implícito. Marcadores discursivos y conectores." },
      { number: 4, title: "El texto académico: análisis y producción", topics: "Texto académico: registro, léxico, estructura. Tipos: resumen, informe, ensayo, monografía, abstract. Citas directas e indirectas, notas al pie, normas APA 7.ª ed. Argumentación académica: tesis, premisas, evidencia, conclusión." },
      { number: 5, title: "Oralidad persuasiva: del discurso clásico al formato TED", topics: "Oralidad académica y profesional. Estructura de presentación oral. Storytelling aplicado a comunicación de datos. Recursos retóricos: anáfora, metáfora, antítesis, pregunta retórica. Formato TED. Comunicación oral en entornos virtuales." }
    ]
  },
  "matematica": {
    name: "Matemática",
    cod: 2, year: "1° Año", semester: "1S", credits: 8, totalHours: 200, weeklyHours: 4,
    correlatives: [], professor: "Caterina Meteo", hours: 64, hasProgram: true,
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
  },
  "intro_economia": {
    name: "Introducción a la Economía",
    cod: 3, year: "1° Año", semester: "1S", credits: 6, totalHours: 150, weeklyHours: 4,
    correlatives: [], professor: "Cra. Silvina Lorenzi", hours: 64, hasProgram: true,
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
    cod: 4, year: "1° Año", semester: "1S", credits: 6, totalHours: 150, weeklyHours: 4,
    correlatives: [], professor: "Ing. Felipe Rojo Amadeo", hours: 64, hasProgram: true,
    units: [
      { number: 1, title: "El dato y la gobernanza de datos", topics: "Dato como activo estratégico. Jerarquía DIKW. Tipos de datos: estructurados, semiestructurados, no estructurados. Economía del dato: organizaciones data-driven. Definición y alcance de gobernanza de datos. Data Governance vs Data Management. Principios: responsabilidad, integridad, transparencia, accesibilidad. Frameworks: DAMA-DMBOK, COBIT for Data, enfoque no invasivo (Seiner). Modelos de madurez." },
      { number: 2, title: "Políticas, procesos, roles y estructuras", topics: "Políticas de datos: definición, tipología y ciclo de vida. Diseño e implementación de políticas. Toma de decisiones basada en datos. Roles: Data Owner, Data Steward, Data Custodian, Data User. Comité de Datos, CDO. Modelos: centralizado, federado, híbrido. Gestión del cambio y cultura del dato." },
      { number: 3, title: "Ciclo de vida del dato y calidad de datos", topics: "Etapas: creación/captura, almacenamiento, procesamiento, uso/análisis, archivo, eliminación. Linaje de datos: trazabilidad, impacto, auditoría. Integración de datos. Metadatos y catálogos. Gestión de datos maestros (MDM). Calidad: exactitud, completitud, consistencia, oportunidad, unicidad, validez. Métricas, KPIs y scorecards. Profiling, limpieza y monitoreo continuo." },
      { number: 4, title: "Seguridad, privacidad y marco normativo", topics: "Confidencialidad, integridad, disponibilidad. Amenazas y vulnerabilidades. Controles: clasificación de datos, acceso basado en roles, cifrado. Privacy by Design. Gestión de incidentes. Ley 25.326 de Protección de Datos Personales (Argentina). GDPR europeo. Derechos de titulares: acceso, rectificación, supresión, portabilidad." },
      { number: 5, title: "Gobernanza en entornos emergentes y ética del dato", topics: "Big Data: las 5V e implicancias para gobernanza. Cloud, data lakes y data mesh. Gobernanza de IA: responsabilidad algorítmica. Sesgos algorítmicos: identificación y mitigación. EU AI Act. Ética aplicada a datos. Prudencia y deliberación. Consentimiento, finalidad, proporcionalidad. Responsabilidad social del profesional." }
    ]
  },
  "fundamentos_computacion": {
    name: "Fundamentos de Computación",
    cod: 5, year: "1° Año", semester: "1S", credits: 5, totalHours: 125, weeklyHours: 3,
    correlatives: [], professor: "Lic. Sebastián Cerezo", hours: 48, hasProgram: true,
    units: [
      { number: 1, title: "Arquitectura de computadoras", topics: "Historia de la computación. Componentes del hardware: CPU, memoria RAM, almacenamiento, periféricos. Modelo de Von Neumann y ciclo de instrucción. Representación de la información: sistemas numéricos binario, octal y hexadecimal. Tipos de buses y comunicación entre componentes." },
      { number: 2, title: "Sistemas operativos – conceptos y administración", topics: "Concepto y funciones del sistema operativo. Tipos: monousuario, multiusuario, tiempo real. Estructura interna: kernel, shell e interfaz de usuario. Gestión de procesos, memoria y archivos. Administración en Windows. Introducción a GNU/Linux: filosofía, distribuciones y línea de comandos." },
      { number: 3, title: "Redes de computadoras y protocolos", topics: "Conceptos fundamentales de redes: topologías y tipos. Modelo OSI y modelo TCP/IP. Protocolo IP: direccionamiento IPv4 e IPv6, máscaras de subred. Protocolos de aplicación: HTTP/HTTPS, DNS, DHCP, FTP, SSH. Dispositivos de red: routers, switches, access points." },
      { number: 4, title: "Almacenamiento y gestión de archivos", topics: "Tipos de almacenamiento: HDD, SSD, NVMe, RAID. Sistemas de archivos: FAT32, NTFS, ext4. Particionado de discos y gestión de volúmenes. Estrategias de backup y recuperación de datos." },
      { number: 5, title: "Virtualización y computación en la nube", topics: "Virtualización: completa, paravirtualización y contenedores. Hipervisores Tipo 1 y Tipo 2. VirtualBox, VMware. Docker y contenedores. Computación en la nube: modelos IaaS, PaaS y SaaS. AWS, Azure, Google Cloud. Seguridad y privacidad en entornos virtualizados." }
    ]
  },

  // ── 2° SEMESTRE AÑO 1 ────────────────────────────────────────────────────
  "principios_programacion": {
    name: "Principios de Programación",
    cod: 6, year: "1° Año", semester: "2S", credits: 8, totalHours: 200, weeklyHours: 4,
    correlatives: [5], hasProgram: false,
    descripcion: "Introducción a la programación estructurada y orientada a objetos. Algoritmos, estructuras de datos básicas, pseudocódigo, diagramas de flujo. Programación en Python: tipos de datos, control de flujo, funciones, listas, diccionarios. Introducción a la programación orientada a objetos: clases, objetos, herencia, polimorfismo. Manejo de archivos y excepciones. Introducción a librerías de análisis de datos (NumPy, Pandas). Resolución de problemas computacionales aplicados a datos."
  },
  "filosofia_1": {
    name: "Filosofía I",
    cod: 7, year: "1° Año", semester: "2S", credits: 5, totalHours: 125, weeklyHours: 3,
    correlatives: [], hasProgram: false,
    descripcion: "Introducción a la filosofía. Metafísica y gnoseología clásica. Platón y Aristóteles: teoría del conocimiento y ontología. Filosofía medieval: Tomás de Aquino, escolástica y razón-fe. Filosofía moderna: Descartes, Kant, empirismo. Filosofía contemporánea: hermenéutica, fenomenología. Ética filosófica: bien común, virtud, ley natural. Relación entre filosofía, ciencia y tecnología. Filosofía del dato y la información."
  },
  "arquitectura_software": {
    name: "Arquitectura de Software y Algoritmos",
    cod: 8, year: "1° Año", semester: "2S", credits: 5, totalHours: 125, weeklyHours: 3,
    correlatives: [2], hasProgram: false,
    descripcion: "Arquitecturas de software: monolítica, cliente-servidor, microservicios, serverless. Patrones de diseño: MVC, repositorio, factory, singleton. Análisis de algoritmos: complejidad temporal y espacial, notación Big-O. Algoritmos de búsqueda y ordenamiento. Estructuras de datos: pilas, colas, listas enlazadas, árboles, grafos. Algoritmos en grafos aplicados a redes de datos. Introducción a bases de datos relacionales. APIs REST. Versionado con Git."
  },
  "macroeconomia": {
    name: "Macroeconomía",
    cod: 9, year: "1° Año", semester: "2S", credits: 7, totalHours: 175, weeklyHours: 4,
    correlatives: [3], hasProgram: false,
    descripcion: "Cuentas nacionales: PBI, PNB, ingreso nacional. Modelo de demanda agregada-oferta agregada. Teoría keynesiana: consumo, inversión y multiplicador. Política fiscal: gasto público, impuestos, déficit. Política monetaria: dinero, sistema financiero, banco central. Inflación: tipos, causas, medición. Desempleo: tipos y políticas de empleo. Crecimiento económico: modelos neoclásico y endógeno. Ciclos económicos y crisis. Economía argentina: estructura, historia y coyuntura. Economía digital y datos macroeconómicos."
  },
  "administracion": {
    name: "Administración",
    cod: 10, year: "1° Año", semester: "2S", credits: 6, totalHours: 150, weeklyHours: 4,
    correlatives: [4], hasProgram: false,
    descripcion: "Teoría de la administración: escuelas y enfoques. Proceso administrativo: planificación, organización, dirección y control. Estructuras organizacionales: tipos y diseño. Gestión de recursos humanos: reclutamiento, motivación, liderazgo. Gestión de proyectos: metodologías ágiles y tradicionales. Estrategia empresarial: análisis FODA, Porter, cadena de valor. Toma de decisiones gerenciales. Administración de operaciones y procesos. Gestión del cambio organizacional. Transformación digital y gobierno de datos en las organizaciones."
  },

  // ── 1° SEMESTRE AÑO 2 ────────────────────────────────────────────────────
  "estrategias_gobernanza": {
    name: "Estrategias para la Gobernanza de Datos",
    cod: 11, year: "2° Año", semester: "1S", credits: 5, totalHours: 125, weeklyHours: 3,
    correlatives: [4, 10], hasProgram: false,
    descripcion: "Marcos de gobernanza de datos: DAMA-DMBOK, COBIT, ISO 8000. Estrategia de datos alineada al negocio. Roadmap de implementación de gobernanza. Data Office: roles, estructura, responsabilidades. Métricas e indicadores de gobernanza (KGIs). Gestión del cambio y cultura data-driven. Casos de estudio: implementaciones exitosas en sector público y privado. Gobernanza en entornos distribuidos y multinube. Madurez organizacional en gestión de datos. Stakeholders y comunicación estratégica."
  },
  "modelado_datos": {
    name: "Modelado de Datos",
    cod: 12, year: "2° Año", semester: "1S", credits: 7, totalHours: 175, weeklyHours: 4,
    correlatives: [6], hasProgram: false,
    descripcion: "Modelo Entidad-Relación (ER): entidades, atributos, relaciones, cardinalidades. Modelo relacional: tablas, claves primarias y foráneas, normalización (1FN, 2FN, 3FN, BCNF). Diseño lógico y físico de bases de datos. Modelado dimensional: esquema estrella y copo de nieve. Data Warehousing: conceptos, arquitectura, ETL/ELT. Modelos NoSQL: documental, clave-valor, columnar, grafos. Metadatos y catálogos de datos. Linaje y trazabilidad. Modelado para Big Data. Herramientas: ERwin, draw.io, dbt."
  },
  "probabilidad_estadistica": {
    name: "Probabilidad y Estadística",
    cod: 13, year: "2° Año", semester: "1S", credits: 7, totalHours: 175, weeklyHours: 4,
    correlatives: [2], hasProgram: false,
    descripcion: "Estadística descriptiva: medidas de tendencia central, dispersión, forma. Tablas de frecuencias y gráficos. Probabilidad: axiomas, espacio muestral, probabilidad condicional, Bayes. Variables aleatorias discretas y continuas. Distribuciones: binomial, Poisson, normal, t-Student, chi-cuadrado, F. Inferencia estadística: estimación puntual e intervalos de confianza. Pruebas de hipótesis. Regresión lineal simple y múltiple. Correlación. Estadística no paramétrica. Análisis exploratorio de datos (EDA). Aplicaciones con Python/R."
  },
  "gobernanza_organizaciones": {
    name: "Gobernanza y Estrategia de las Organizaciones",
    cod: 14, year: "2° Año", semester: "1S", credits: 6, totalHours: 150, weeklyHours: 3,
    correlatives: [4, 5], hasProgram: false,
    descripcion: "Gobierno corporativo: principios y marcos (OCDE, G20). Responsabilidad social empresarial (RSE). Gobernanza de TI: COBIT, ITIL, ISO 38500. Alineación entre estrategia de negocio y estrategia de datos. Gestión de riesgos organizacionales: COSO, ISO 31000. Compliance y cumplimiento normativo. Gobierno de datos en el sector público: marcos regulatorios argentinos. Ética organizacional y buen gobierno. Indicadores de gobernanza organizacional. Casos de estudio: gobernanza en organizaciones complejas."
  },
  "microeconomia": {
    name: "Microeconomía",
    cod: 15, year: "2° Año", semester: "1S", credits: 7, totalHours: 175, weeklyHours: 4,
    correlatives: [9], hasProgram: false,
    descripcion: "Teoría del consumidor: utilidad, preferencias, restricción presupuestaria. Demanda: individual y de mercado, elasticidades. Teoría de la empresa: producción, costos de corto y largo plazo. Estructuras de mercado: competencia perfecta, monopolio, oligopolio, competencia monopolística. Fallas de mercado: externalidades, bienes públicos, información asimétrica. Economía del bienestar: excedentes, eficiencia de Pareto. Teoría de juegos aplicada: dilema del prisionero, estrategias dominantes. Regulación económica y política antimonopolio. Economía de plataformas digitales y datos como bien económico."
  },

  // ── 2° SEMESTRE AÑO 2 ────────────────────────────────────────────────────
  "normativa_internacional": {
    name: "Normativa Internacional de Datos",
    cod: 16, year: "2° Año", semester: "2S", credits: 5, totalHours: 125, weeklyHours: 3,
    correlatives: [11], hasProgram: false,
    descripcion: "Marco jurídico internacional de protección de datos. GDPR: principios, bases legales, derechos del titular, obligaciones del responsable y encargado, transferencias internacionales, sanciones. CCPA (California Consumer Privacy Act) y legislación estadounidense. Legislación latinoamericana comparada. Ley 25.326 argentina: análisis en profundidad, AAIP. Privacidad desde el diseño (Privacy by Design). Estándares ISO/IEC 27701. Regulación de IA: EU AI Act. Soberanía del dato y localización. Contratos de tratamiento de datos. Auditoría de cumplimiento normativo."
  },
  "bases_datos": {
    name: "Bases de Datos",
    cod: 17, year: "2° Año", semester: "2S", credits: 8, totalHours: 200, weeklyHours: 4,
    correlatives: [12], hasProgram: false,
    descripcion: "SQL avanzado: DDL, DML, DQL, DCL. Joins, subconsultas, funciones de ventana, CTEs. Procedimientos almacenados, triggers, vistas. Optimización de consultas y planes de ejecución. Índices: B-tree, hash, full-text, cobertura. Transacciones: ACID, niveles de aislamiento, control de concurrencia. Motores relacionales: PostgreSQL, MySQL. Bases de datos NoSQL: MongoDB (documental), Redis (clave-valor), Cassandra (columnar), Neo4j (grafos). Bases de datos en la nube: BigQuery, Snowflake, Redshift. Seguridad en bases de datos: autenticación, autorización, auditoría. Backup y recuperación."
  },
  "fund_inteligencia_artificial": {
    name: "Fundamentos de Inteligencia Artificial",
    cod: 18, year: "2° Año", semester: "2S", credits: 6, totalHours: 150, weeklyHours: 3,
    correlatives: [], hasProgram: false,
    descripcion: "Historia y panorama de la IA. Agentes inteligentes: tipos y arquitecturas. Búsqueda heurística: A*, minimax. Machine learning supervisado: regresión, clasificación, árboles de decisión, SVM, k-NN. Machine learning no supervisado: clustering (K-means, DBSCAN), reducción dimensional (PCA). Redes neuronales artificiales: perceptrón, backpropagation. Deep learning: CNN, RNN, transformers. Procesamiento de lenguaje natural (PLN). Computer vision. IA generativa y LLMs. Evaluación de modelos: métricas, overfitting, validación cruzada. Herramientas: scikit-learn, TensorFlow, PyTorch."
  },
  "etica_responsabilidad": {
    name: "Ética y Responsabilidad Social de Datos",
    cod: 19, year: "2° Año", semester: "2S", credits: 5, totalHours: 125, weeklyHours: 3,
    correlatives: [14], hasProgram: false,
    descripcion: "Fundamentos de ética filosófica: deontología, consecuencialismo, ética de la virtud. Ética de datos: principios de transparencia, equidad, privacidad, responsabilidad, beneficencia. Sesgos algorítmicos: tipos, causas, consecuencias y mitigación. IA ética y explicable (XAI). Impacto social de la tecnología de datos. Responsabilidad social corporativa en la era digital. Consentimiento informado y uso ético de datos personales. Derechos digitales y ciudadanía de datos. Casos de estudio: Cambridge Analytica, reconocimiento facial, scoring crediticio. Marcos de gobernanza ética: IEEE, OCDE, UNESCO."
  },
  "teologia_1": {
    name: "Teología I",
    cod: 20, year: "2° Año", semester: "2S", credits: 4, totalHours: 100, weeklyHours: 1.5,
    correlatives: [], hasProgram: false,
    descripcion: "Teología fundamental: fe y razón, revelación. Teología natural. Doctrina social de la Iglesia. Persona humana: dignidad, derechos, bien común. Ética cristiana aplicada a la vida profesional. Tecnología y humanismo cristiano. Uso ético de datos desde la perspectiva de la Doctrina Social."
  },
  "ingles": {
    name: "Inglés",
    cod: 21, year: "2° Año", semester: "A", credits: 5, totalHours: 125, weeklyHours: 1.5,
    correlatives: [], hasProgram: false,
    descripcion: "Lecto-comprensión de textos técnicos en inglés. Vocabulario especializado en tecnología, datos e IA. Reading comprehension de documentación técnica, papers y normativas internacionales (GDPR, ISO). Habilidades de escritura técnica básica en inglés. Presentaciones orales de proyectos técnicos. Inglés para el mundo laboral en tecnología."
  },

  // ── 1° SEMESTRE AÑO 3 ────────────────────────────────────────────────────
  "big_data": {
    name: "Big Data",
    cod: 22, year: "3° Año", semester: "1S", credits: 7, totalHours: 175, weeklyHours: 4,
    correlatives: [17], hasProgram: false,
    descripcion: "Las 5V del Big Data: volumen, velocidad, variedad, veracidad, valor. Arquitecturas de Big Data: Lambda, Kappa. Ecosistema Hadoop: HDFS, MapReduce, YARN. Apache Spark: RDDs, DataFrames, Spark SQL, Spark Streaming. Procesamiento en tiempo real: Apache Kafka, Flink. Data Lakes: arquitectura, zonas, gobernanza. Data Lakehouse: Delta Lake, Apache Iceberg. Servicios en nube: AWS EMR, Azure HDInsight, GCP Dataproc. Gobernanza de Big Data: catálogos, linaje, calidad a escala. Casos de aplicación en industria."
  },
  "analisis_visualizacion": {
    name: "Análisis y Visualización de Datos",
    cod: 23, year: "3° Año", semester: "1S", credits: 7, totalHours: 175, weeklyHours: 4,
    correlatives: [17], hasProgram: false,
    descripcion: "Análisis exploratorio de datos (EDA): distribuciones, outliers, correlaciones. Análisis descriptivo, diagnóstico, predictivo y prescriptivo. Principios de visualización: gramática de gráficos, Tufte, percepción visual. Tipos de gráficos y cuándo usarlos. Herramientas: Power BI, Tableau, Python (Matplotlib, Seaborn, Plotly), R (ggplot2). Dashboards ejecutivos: diseño, KPIs, storytelling con datos. Narrativa de datos. Análisis geoespacial básico. Visualización de redes y grafos. Accesibilidad en visualizaciones."
  },
  "politicas_publicas": {
    name: "Políticas Públicas de Datos",
    cod: 24, year: "3° Año", semester: "1S", credits: 5, totalHours: 125, weeklyHours: 3,
    correlatives: [16], hasProgram: false,
    descripcion: "Políticas públicas: ciclo, actores, implementación y evaluación. Estado digital: gobierno electrónico y gobierno abierto. Datos abiertos: principios, portales, estándares. Gobierno de datos en el sector público: marcos regulatorios. Interoperabilidad y estándares de datos gubernamentales. Infraestructura de datos nacionales. Política de datos en salud, educación, seguridad y justicia. Modelos internacionales: Estonia, Dinamarca, Argentina. Participación ciudadana y datos. Transparencia y rendición de cuentas mediante datos."
  },
  "ciberseguridad": {
    name: "Ciberseguridad y Protección de Datos",
    cod: 25, year: "3° Año", semester: "1S", credits: 7, totalHours: 175, weeklyHours: 4,
    correlatives: [19], hasProgram: false,
    descripcion: "Fundamentos de ciberseguridad: triada CIA, superficies de ataque. Criptografía: simétrica (AES), asimétrica (RSA, ECC), hashing, PKI. Seguridad en redes: firewalls, IDS/IPS, VPN, segmentación. Amenazas y vulnerabilidades: OWASP Top 10, inyección SQL, XSS, CSRF. Seguridad en bases de datos y APIs. Control de acceso: IAM, RBAC, MFA. Seguridad en la nube: modelos de responsabilidad compartida. Respuesta a incidentes: detección, contención, erradicación, recuperación. Análisis forense digital básico. Normativas de seguridad: ISO 27001, NIST, SOC2. Ciberseguridad y gobernanza de datos."
  },
  "diseno_politicas": {
    name: "Diseño y Gestión de Políticas de Datos",
    cod: 26, year: "3° Año", semester: "1S", credits: 6, totalHours: 150, weeklyHours: 3,
    correlatives: [14], hasProgram: false,
    descripcion: "Diseño de políticas de datos: metodología, componentes, ciclo de vida. Políticas de clasificación y etiquetado de datos. Políticas de retención y eliminación. Políticas de acceso y uso compartido. Gestión del ciclo de vida de datos (DLM). Documentación y comunicación de políticas. Gestión de excepciones y cumplimiento. Políticas de calidad de datos. Auditoría interna de políticas. Integración de políticas en procesos operativos. Cambio organizacional: formación y cultura. Evaluación de efectividad de políticas."
  },

  // ── 2° SEMESTRE AÑO 3 ────────────────────────────────────────────────────
  "calidad_privacidad": {
    name: "Calidad y Privacidad de Datos",
    cod: 27, year: "3° Año", semester: "2S", credits: 7, totalHours: 175, weeklyHours: 4,
    correlatives: [25], hasProgram: false,
    descripcion: "Dimensiones de calidad de datos: completitud, precisión, consistencia, oportunidad, unicidad, validez, accesibilidad. Marcos de calidad: DAMA, ISO 8000, Six Sigma aplicado a datos. Perfilado y profiling de datos. Herramientas de calidad: Great Expectations, dbt tests, Talend DQ. Métricas y KPIs de calidad. Data stewardship para calidad. Privacidad de datos: técnicas de anonimización, pseudonimización, tokenización. Privacy-Enhancing Technologies (PETs): k-anonimato, privacidad diferencial, computación segura multipartita. Privacy by Design avanzado. Evaluaciones de Impacto de Privacidad (DPIA). Gestión continua de privacidad."
  },
  "auditoria_datos": {
    name: "Auditoría de Datos",
    cod: 28, year: "3° Año", semester: "2S", credits: 7, totalHours: 175, weeklyHours: 4,
    correlatives: [23], hasProgram: false,
    descripcion: "Auditoría de sistemas de información: estándares ISACA, COBIT, ISO 19011. Planificación y ejecución de auditorías de datos. Auditoría de calidad de datos. Auditoría de seguridad y control de accesos. Auditoría de cumplimiento normativo (GDPR, Ley 25.326). Auditoría de procesos de gobernanza. Herramientas de auditoría: ACL, IDEA, scripts SQL. Evidencia digital y documentación. Informe de auditoría: estructura, hallazgos, recomendaciones. Auditoría continua y monitoreo automatizado. Auditoría de algoritmos e IA. Gestión de hallazgos y remediación."
  },
  "mineria_datos": {
    name: "Minería de Datos",
    cod: 29, year: "3° Año", semester: "2S", credits: 7, totalHours: 175, weeklyHours: 4,
    correlatives: [22], hasProgram: false,
    descripcion: "Proceso KDD y CRISP-DM. Preprocesamiento de datos: limpieza, transformación, selección de atributos, manejo de missing values. Clasificación supervisada: Naïve Bayes, árboles de decisión, random forest, gradient boosting, SVM. Regresión: lineal, logística, regularización. Clustering: K-means, DBSCAN, clustering jerárquico. Reglas de asociación: Apriori, FP-Growth. Detección de anomalías. Series temporales: ARIMA, suavizamiento exponencial, Prophet. Minería de texto (Text Mining) y análisis de sentimiento. Selección y evaluación de modelos. Herramientas: scikit-learn, Weka, KNIME."
  },
  "toma_decisiones": {
    name: "Toma de Decisiones Basadas en Datos",
    cod: 30, year: "3° Año", semester: "2S", credits: 5, totalHours: 125, weeklyHours: 3,
    correlatives: [26], hasProgram: false,
    descripcion: "Modelos de toma de decisiones: racional, bounded rationality, heurísticas y sesgos cognitivos. Datos como insumo para decisiones estratégicas, tácticas y operativas. Business Intelligence: arquitectura, herramientas, cuadros de mando. Analítica de negocios: prescriptiva, predictiva. Optimización: programación lineal, simulación Monte Carlo. Gestión de incertidumbre: análisis de escenarios, árboles de decisión, teoría de juegos. Data-driven culture: liderazgo y cambio organizacional. Ética en la automatización de decisiones. Algoritmos de decisión y responsabilidad. Casos prácticos en organizaciones."
  },
  "filosofia_2": {
    name: "Filosofía II",
    cod: 31, year: "3° Año", semester: "2S", credits: 5, totalHours: 125, weeklyHours: 3,
    correlatives: [7], hasProgram: false,
    descripcion: "Filosofía política: Estado, poder, justicia, democracia. Filosofía del derecho: iusnaturalismo, positivismo, hermenéutica jurídica. Filosofía de la técnica: Heidegger, Ellul, Stiegler. Filosofía de la mente e inteligencia artificial: mente, conciencia, identidad personal. Filosofía del lenguaje: Wittgenstein, actos de habla, significado. Ética aplicada: bioética, neuroética, tecnoética. Persona, tecnología y bien común. Filosofía tomista contemporánea. Epistemología de la ciencia de datos."
  },

  // ── AÑO 4 ─────────────────────────────────────────────────────────────────
  "optativa_1": {
    name: "Optativa I",
    cod: 32, year: "4° Año", semester: "1S", credits: 6, totalHours: 150, weeklyHours: 4,
    correlatives: [27], hasProgram: false,
    descripcion: "Asignatura optativa del bloque de especialización (4° año). El alumno elige entre las opciones disponibles de la oferta de optativas de la Licenciatura en Gobernanza de Datos, orientadas a profundizar en áreas específicas del campo profesional."
  },
  "optativa_2": {
    name: "Optativa II",
    cod: 33, year: "4° Año", semester: "1S", credits: 6, totalHours: 150, weeklyHours: 4,
    correlatives: [29], hasProgram: false,
    descripcion: "Asignatura optativa del bloque de especialización (4° año). El alumno elige entre las opciones disponibles de la oferta de optativas de la Licenciatura en Gobernanza de Datos."
  },
  "optativa_3": {
    name: "Optativa III",
    cod: 34, year: "4° Año", semester: "1S", credits: 6, totalHours: 150, weeklyHours: 4,
    correlatives: [30], hasProgram: false,
    descripcion: "Asignatura optativa del bloque de especialización (4° año). El alumno elige entre las opciones disponibles de la oferta de optativas de la Licenciatura en Gobernanza de Datos."
  },
  "proyecto_1": {
    name: "Proyecto I",
    cod: 35, year: "4° Año", semester: "1S", credits: 8, totalHours: 200, weeklyHours: 3,
    correlatives: [], hasProgram: false,
    descripcion: "Primera etapa del trabajo final integrador. Formulación del problema, revisión bibliográfica, hipótesis y objetivos. Diseño metodológico. Planificación del proyecto de gobernanza de datos. Selección de caso de estudio o problema real. Tutorías individuales. Presentación de avance ante comité evaluador."
  },
  "gobernanza_proyectos": {
    name: "Gobernanza en Proyectos de Datos",
    cod: 36, year: "4° Año", semester: "1S", credits: 6, totalHours: 150, weeklyHours: 4,
    correlatives: [28], hasProgram: false,
    descripcion: "Gestión de proyectos de datos: PMI, Scrum, Kanban. Gobernanza a lo largo del ciclo de vida del proyecto. Control de calidad en proyectos de datos. Gestión de stakeholders y comunicación. Gestión de riesgos en proyectos de datos. Compliance y regulación durante el proyecto. DataOps: integración continua y entrega continua de datos. MLOps: gobernanza de modelos de ML en producción. Gestión de equipos de datos multidisciplinarios. Evaluación de impacto y valor de proyectos de datos."
  },
  "optativa_4": {
    name: "Optativa IV",
    cod: 37, year: "4° Año", semester: "2S", credits: 6, totalHours: 150, weeklyHours: 4,
    correlatives: [32], hasProgram: false,
    descripcion: "Asignatura optativa del bloque de especialización (4° año, 2° semestre). El alumno elige entre las opciones disponibles de la oferta de optativas de la Licenciatura en Gobernanza de Datos."
  },
  "optativa_5": {
    name: "Optativa V",
    cod: 38, year: "4° Año", semester: "2S", credits: 6, totalHours: 150, weeklyHours: 4,
    correlatives: [33], hasProgram: false,
    descripcion: "Asignatura optativa del bloque de especialización (4° año, 2° semestre). El alumno elige entre las opciones disponibles de la oferta de optativas de la Licenciatura en Gobernanza de Datos."
  },
  "optativa_6": {
    name: "Optativa VI",
    cod: 39, year: "4° Año", semester: "2S", credits: 6, totalHours: 150, weeklyHours: 4,
    correlatives: [34], hasProgram: false,
    descripcion: "Asignatura optativa del bloque de especialización (4° año, 2° semestre). El alumno elige entre las opciones disponibles de la oferta de optativas de la Licenciatura en Gobernanza de Datos."
  },
  "proyecto_2": {
    name: "Proyecto II",
    cod: 40, year: "4° Año", semester: "2S", credits: 8, totalHours: 200, weeklyHours: 3,
    correlatives: [35], hasProgram: false,
    descripcion: "Segunda etapa y defensa del trabajo final integrador. Desarrollo, implementación y validación del proyecto. Análisis de resultados. Elaboración del informe final con formato académico. Preparación y defensa oral ante tribunal evaluador. Publicación o difusión de resultados."
  },
  "teologia_2": {
    name: "Teología II",
    cod: 41, year: "4° Año", semester: "2S", credits: 4, totalHours: 100, weeklyHours: 1.5,
    correlatives: [20], hasProgram: false,
    descripcion: "Teología moral y ética social. Doctrina Social de la Iglesia aplicada a la tecnología y la economía digital. El trabajo humano en la era digital. Inteligencia Artificial y persona humana. Bien común digital. Ecología integral y sustentabilidad tecnológica. Principios de subsidiaridad y solidaridad en organizaciones de datos."
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
  "Universidad Católica de La Plata (UCALP)",
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
  "Otras Ingenierías (UNLP)",
  // UCALP careers
  "Lic. en Gobernanza de Datos (UCALP)",
  "Lic. en Relaciones Públicas (UCALP)",
  "Lic. en Administración (UCALP)",
  "Lic. en Recursos Humanos (UCALP)",
  "Abogacía (UCALP)",
  "Lic. en Ciencias Políticas (UCALP)",
  "Lic. en Educación (UCALP)",
  "Lic. en Psicología (UCALP)",
  "Lic. en Kinesiología (UCALP)",
  "Medicina (UCALP)",
  "Otra (especificar)"
];

// ============ UCALP CAREERS PRELOADED ============
const UCALP_CAREERS_PRELOADED = {
  "relacionespublicas": {
    name: "Lic. en Relaciones Públicas",
    url: "https://www.ucalp.edu.ar/carrera/relacionespublicas/",
    subjects: [
      "Competencias Comunicacionales","Diseño de Contenidos","Estrategias Narrativas",
      "Psicología Social","Redacción y Oratoria","Teología I",
      "Gestión de la Calidad","Narrativa Audiovisual","Principios de Mercadotecnia",
      "Producción de Contenidos Multimedia","Sociología General y de las Organizaciones","Derecho de la Comunicación",
      "Comunicación Digital","Comunicación Organizacional","Técnicas de Comunicación y Promoción",
      "Teorías de la Comunicación y de la Información I","Habilidades Empresariales","Teología II",
      "Publicidad","Gestión de Crisis","Comunicación Política y Gubernamental",
      "Taller de Medios Digitales","Teorías de la Comunicación y de la Información II",
      "Negociación y Gestión de Conflictos","Planificación Estratégica de la Comunicación",
      "Sociología de los Medios I","Teología III","Optativa I","Optativa II",
      "Campañas de Comunicación","Ceremonial y Protocolo","Relaciones Públicas I",
      "Sociología de los Medios II","Optativa III",
      "Asuntos Públicos y Relaciones Institucionales","Seminario de Integración y Aplicación",
      "Relaciones Públicas II","Teología IV","Optativa IV","Optativa V",
      "Auditoría de Comunicación","Tendencias en Comunicación","Producción de Eventos",
      "Relaciones Públicas Aplicadas","Optativa VI"
    ]
  },
  "administracion-ucalp": {
    name: "Lic. en Administración",
    url: "https://www.ucalp.edu.ar/carrera/administracion/",
    subjects: [
      "Matemática I","Principios de Administración","Introducción a la Economía","Contabilidad General I",
      "Competencias Comunicacionales","Teología I","Matemática II","Teoría de las Organizaciones",
      "Microeconomía","Contabilidad General II","Estadística I","Teología II",
      "Macroeconomía","Administración Financiera I","Costos","Estadística II","Derecho Comercial",
      "Administración de la Producción","Administración de Recursos Humanos","Administración Financiera II",
      "Marketing","Investigación de Mercados","Derecho Laboral y Previsional","Teología III",
      "Gestión Estratégica","Formulación y Evaluación de Proyectos","Dirección General",
      "Comercio Internacional","Responsabilidad Social Empresarial","Seminario de Integración",
      "Teología IV","Práctica Profesional"
    ]
  },
  "recursoshumanos": {
    name: "Lic. en Recursos Humanos",
    url: "https://www.ucalp.edu.ar/carrera/licenciatura-en-recursos-humanos/",
    subjects: [
      "Psicología General","Administración General","Introducción a la Economía","Sociología",
      "Comunicación Organizacional","Teología I","Psicología Organizacional","Gestión del Talento",
      "Estadística","Derecho Laboral","Capacitación y Desarrollo","Teología II",
      "Selección de Personal","Evaluación de Desempeño","Remuneraciones y Beneficios",
      "Relaciones Laborales","Seguridad e Higiene Laboral","Teología III",
      "Gestión Estratégica de RRHH","Coaching Organizacional","Liderazgo y Equipos",
      "Clima y Cultura Organizacional","Seminario de Integración","Teología IV",
      "Práctica Profesional"
    ]
  },
  "abogacia-ucalp": {
    name: "Abogacía",
    url: "https://www.ucalp.edu.ar/carrera/abogacia/",
    subjects: [
      "Introducción al Derecho","Derecho Constitucional","Derecho Civil I","Historia del Derecho",
      "Filosofía del Derecho","Teología I","Derecho Civil II","Derecho Penal I",
      "Derecho Procesal Civil I","Derecho Administrativo I","Teología II",
      "Derecho Civil III","Derecho Penal II","Derecho Comercial I","Derecho Laboral I",
      "Derecho Internacional Público","Teología III","Derecho Civil IV","Derecho Comercial II",
      "Derecho Laboral II","Derecho Procesal Penal","Derecho Tributario","Derecho de Familia",
      "Derecho Internacional Privado","Derecho Notarial y Registral","Práctica Forense",
      "Teología IV","Práctica Profesional"
    ]
  },
  "cienciaspoliticas": {
    name: "Lic. en Ciencias Políticas",
    url: "https://www.ucalp.edu.ar/carrera/ciencias-politicas/",
    subjects: [
      "Introducción a la Política","Historia Argentina","Ciencia Política I","Sociología",
      "Economía Política","Teología I","Ciencia Política II","Historia Contemporánea",
      "Derecho Constitucional","Relaciones Internacionales I","Teología II",
      "Teoría Política I","Administración Pública","Política Comparada",
      "Relaciones Internacionales II","Metodología de la Investigación","Teología III",
      "Teoría Política II","Políticas Públicas","Comunicación Política",
      "Análisis de Coyuntura","Seminario de Integración","Teología IV","Práctica Profesional"
    ]
  }
};

// ============ PARSE TEXT/HTML PLAN ============
// Extrae materias desde texto pegado (HTML o texto plano con listas)
function parseTextPlan(rawText) {
  const subjects = [];
  const seen = new Set();

  // Strategy A: parse as HTML if it looks like HTML
  if (rawText.includes("<li>") || rawText.includes("<ul>") || rawText.includes("<td>")) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(rawText, "text/html");

    // Remove headers/totals from context
    doc.querySelectorAll("p strong, h1, h2, h3, h4").forEach(el => {
      const t = el.textContent.trim();
      if (/año|total|carga horaria/i.test(t)) el.parentElement?.remove();
    });

    // Get li items - these are most likely subjects
    doc.querySelectorAll("li").forEach(li => {
      let t = li.textContent.trim().replace(/\s+/g, " ");
      // Strip "(1° Cuatrimestre)" / "(2° Cuatrimestre)" suffixes
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

  // Strategy B: plain text, one subject per line
  const lines = rawText.split(/\n|\r/).map(l => l.trim()).filter(Boolean);
  for (const line of lines) {
    // Skip year/semester headers and totals
    if (/^(primer|segundo|tercer|cuarto|1°|2°|3°|4°|primer|total|carga horaria)/i.test(line)) continue;
    // Strip bullets, numbers, cuatrimestre info
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
async function extractTextFromFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  if (ext === "txt") return await file.text();
  if (ext === "docx") return await extractDocx(file);
  if (ext === "pdf") return await extractPdf(file);
  throw new Error("Formato no soportado. Usá PDF, DOCX o TXT.");
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

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement("script"); s.src = src;
    s.onload = resolve; s.onerror = reject;
    document.head.appendChild(s);
  });
}

// ============ PDF FROM URL ============
async function extractPdfFromUrl(url) {
  if (!window.pdfjsLib) {
    await loadScript("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js");
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  }
  // Fetch PDF via proxy as arraybuffer
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
async function importFromGoogleSheets(url) {
  // Extract sheet ID from various Google Sheets URL formats
  let sheetId = null;
  const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (match) sheetId = match[1];
  if (!sheetId) throw new Error("URL de Google Sheets no válida. Debe ser algo como https://docs.google.com/spreadsheets/d/...");
  
  // Fetch as CSV (works for public or "anyone with link" sheets)
  const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(csvUrl)}`;
  const resp = await fetch(proxyUrl);
  if (!resp.ok) throw new Error("No se pudo acceder al Sheet. Verificá que esté compartido como 'Cualquier persona con el enlace'.");
  const csv = await resp.text();
  
  // Parse CSV into rows
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

// ============ HTML TABLE PARSER (for pasting UNLP-style HTML) ============
function parseHtmlTable(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const subjects = [];
  // Pattern 1: UNLP style - links to catedras in <td> elements
  doc.querySelectorAll("tr").forEach(row => {
    const tds = row.querySelectorAll("td");
    if (tds.length >= 2) {
      // Skip separator rows
      if (row.querySelector(".separador_semestre")) return;
      // Get subject name from second td (might be in an <a> tag)
      const nameCell = tds[1];
      const link = nameCell.querySelector("a");
      const name = (link ? link.textContent : nameCell.textContent).trim();
      // Skip empty, AFC, and header-like entries
      if (name && name.length > 2 && !/^(actividades de formación|afc\s)/i.test(name)
        && !/^(cód|asignatura|materia|optativa$)/i.test(name)) {
        // Get code from first td
        const codeCell = tds[0];
        const code = codeCell.textContent.trim();
        if (!subjects.find(s => s.name === name)) {
          subjects.push({ name, details: code || "" });
        }
      }
    }
  });
  // Pattern 2: generic table
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
async function aiExtractSubjects(rawText, apiKey, model) {
  const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}`, "HTTP-Referer": "https://ucalp-equivalencias.pages.dev", "X-Title": "UCALP Equivalencias" },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: "system", content: "Sos un asistente que extrae listas de materias/asignaturas de planes de estudio universitarios. Respondé SOLO con un JSON array de strings con los nombres de las materias, sin texto adicional, sin backticks. Ejemplo: [\"Matemática I\", \"Física I\", \"Introducción a la Economía\"]" },
        { role: "user", content: `Extraé la lista completa de materias/asignaturas del siguiente texto de un plan de estudios universitario. Devolvé SOLO el JSON array:\n\n${rawText.substring(0, 6000)}` }
      ],
      temperature: 0.1,
      max_tokens: 3000
    })
  });
  if (!resp.ok) { const e = await resp.json().catch(() => ({})); throw new Error(e?.error?.message || `Error ${resp.status}`); }
  const data = await resp.json();
  const text = data.choices?.[0]?.message?.content || "";
  const clean = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  try {
    const arr = JSON.parse(clean);
    if (Array.isArray(arr)) return arr;
  } catch {}
  const match2 = clean.match(/\[[\s\S]*\]/);
  if (match2) return JSON.parse(match2[0]);
  throw new Error("No se pudo parsear la respuesta de la IA.");
}

// ============ WEB SCRAPER (improved) ============
// FI-UNLP plans are now loaded from fi_unlp_planes.js (13 carreras, 520 materias, Plan 2018)
// Legacy compatibility wrapper — keeps old slug keys working
const UNLP_PRELOADED = Object.fromEntries(
  Object.entries(FI_UNLP_PLANES).map(([slug, data]) => [
    slug,
    {
      pdf: `https://www1.ing.unlp.edu.ar/sitio/academica/asignaturas/plan.php?carrera=${slug}`,
      subjects: data.flat,
      structured: data,
    }
  ])
);
const UNLP_ECON_SUBJECTS = {
  "contador": ["Contabilidad Superior I","Introducción a la Economía y Estructura Económica Argentina","Administración I","Matemática I (Análisis Matemático)","Derecho I (Constitucional y Administrativo)","Introducción a las Ciencias Sociales","Microeconomía I","Contabilidad Superior II","Macroeconomía I","Matemática II (Álgebra)","Derecho II (Privado)","Estadística para los Negocios","Contabilidad III","Administración II","Finanzas Públicas I","Historia Económica y Social Argentina","Contabilidad IV","Régimen Tributario I","Contabilidad V (Costos)","Matemática para Decisiones Empresarias","Auditoría","Régimen Tributario II","Contabilidad VI","Contabilidad VII","Dirección General","Seminario"],
  "administracion": ["Contabilidad Superior I","Introducción a la Economía y Estructura Económica Argentina","Administración I","Matemática I (Análisis Matemático)","Derecho I (Constitucional y Administrativo)","Introducción a las Ciencias Sociales","Microeconomía I","Contabilidad Superior II","Macroeconomía I","Matemática II (Álgebra)","Derecho II (Privado)","Estadística para los Negocios","Administración II","Administración de la Producción","Administración de Personal","Administración Financiera","Comercialización","Sistemas de Información","Dirección General","Formulación y Evaluación de Proyectos"],
};

async function scrapeStudyPlan(url) {
  let finalUrl = url;

  // Smart redirect: check for preloaded FI-UNLP plans (all 13 careers)
  if (url.includes("ing.unlp.edu.ar") || url.includes("www1.ing.unlp.edu.ar")) {
    const slug = url.toLowerCase();
    for (const [keyword, targetSlug] of Object.entries(FI_UNLP_URL_KEYWORDS)) {
      if (slug.includes(keyword)) {
        const data = UNLP_PRELOADED[targetSlug];
        if (data) {
          return {
            subjects: data.subjects.map(s => ({ name: s, details: "" })),
            rawText: `Plan oficial FI-UNLP — ${FI_UNLP_PLANES[targetSlug].nombre} (Plan ${FI_UNLP_PLANES[targetSlug].plan}) — ${data.subjects.length} materias`,
            pdfLinks: [{ url: data.pdf, text: `📄 Plan de estudios oficial — ${FI_UNLP_PLANES[targetSlug].nombre}` }],
            redirectedUrl: null, preloaded: true, fiSlug: targetSlug,
          };
        }
      }
    }
  }

  // UCALP preloaded plans
  if (url.includes("ucalp.edu.ar")) {
    const slug = url.toLowerCase();
    for (const [key, data] of Object.entries(UCALP_CAREERS_PRELOADED)) {
      if (slug.includes(key.replace("-ucalp", ""))) {
        return {
          subjects: data.subjects.map(s => ({ name: s, details: "" })),
          rawText: `Plan precargado: UCALP — ${data.name} — ${data.subjects.length} materias`,
          pdfLinks: [],
          redirectedUrl: null,
          preloaded: true,
          preloadedName: data.name,
        };
      }
    }
  }

  // UNLP Económicas
  if (url.includes("econo.unlp.edu.ar")) {
    for (const [key, subjects] of Object.entries(UNLP_ECON_SUBJECTS)) {
      if (url.toLowerCase().includes(key)) {
        return {
          subjects: subjects.map(s => ({ name: s, details: "" })),
          rawText: `Plan precargado: UNLP Económicas - ${subjects.length} materias`,
          pdfLinks: [], redirectedUrl: null, preloaded: true
        };
      }
    }
  }

  // Fetch via CORS proxy
  let html = null;
  try {
    const resp = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(finalUrl)}`, { signal: AbortSignal.timeout(15000) });
    if (resp.ok) { const data = await resp.json(); if (data.contents) html = data.contents; }
  } catch {}
  if (!html) {
    try {
      const resp = await fetch(`https://corsproxy.io/?${encodeURIComponent(finalUrl)}`, { signal: AbortSignal.timeout(15000) });
      if (resp.ok) html = await resp.text();
    } catch {}
  }
  if (!html) {
    try {
      const resp = await fetch(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(finalUrl)}`, { signal: AbortSignal.timeout(15000) });
      if (resp.ok) html = await resp.text();
    } catch {}
  }
  if (!html) throw new Error("No se pudo acceder. Probá con otra URL o copiá el contenido manualmente.");

  // Detect PDF
  if (html.substring(0, 10).includes("%PDF")) {
    try {
      const pdfText = await extractPdfFromUrl(finalUrl);
      return { subjects: [], rawText: pdfText, pdfLinks: [{ url: finalUrl, text: "PDF del plan de estudios" }], redirectedUrl: null, isPdfParsed: true };
    } catch {
      return { subjects: [], rawText: "(No se pudo parsear el PDF. Descargalo y subilo en Analizar > Subir archivo.)", pdfLinks: [{ url: finalUrl, text: "Descargar PDF" }], redirectedUrl: null };
    }
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  doc.querySelectorAll("script, style, nav, header, footer, .menu, .navbar, .sidebar, #menu, #header, #footer, [class*='menu'], [class*='nav'], [id*='menu'], [id*='nav']").forEach(el => el.remove());

  let subjects = [];
  let pdfLinks = [];

  // Strategy 1: look for a "plan de estudios" section specifically
  const planSection = (() => {
    const allEls = Array.from(doc.querySelectorAll("h1,h2,h3,h4,section,div,article"));
    for (const el of allEls) {
      const t = el.textContent.toLowerCase();
      if (t.includes("plan de estudio") || t.includes("materias") || t.includes("asignaturas")) {
        // Return the UL/OL lists inside this element
        const lists = el.querySelectorAll("ul, ol");
        if (lists.length > 0) return el;
      }
    }
    return null;
  })();

  const searchRoot = planSection || doc.body;

  // Strategy 2: Tables
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

  // Strategy 3: LI items inside the plan section (much stricter than before)
  if (subjects.length === 0) {
    const NAV_SKIP = /^(home|inicio|nosotros|quiénes|contacto|buscar|ver más|leer más|facebook|twitter|instagram|youtube|linkedin|campus|biblioteca|repositorio|extensión|investigación|idiomas|sede|ingresantes|noticias|graduados|docentes|carreras|facultad|universidad|inicio de sesión|ingresar|registrarse|siguiente|anterior|más información)/i;
    const liEls = searchRoot.querySelectorAll("li");
    liEls.forEach(li => {
      // Skip LIs that are inside nav-like parents
      const parent = li.closest("nav, [class*='menu'], [class*='nav'], [id*='menu'], [id*='nav'], [class*='header'], [class*='footer']");
      if (parent) return;
      let t = li.textContent.trim().replace(/\s+/g, " ");
      // Strip cuatrimestre/semestre/anual suffixes
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

  // Strategy 4: cátedra links (UNLP old site)
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

  // Detect PDF links
  doc.querySelectorAll("a").forEach(a => {
    const href = a.getAttribute("href") || "";
    const text = a.textContent.trim();
    if (href.match(/\.pdf/i) || href.includes("plan.php")) {
      let fullUrl = href;
      if (href.startsWith("/")) { try { fullUrl = new URL(href, finalUrl).href; } catch {} }
      else if (!href.startsWith("http")) { try { fullUrl = new URL(href, finalUrl).href; } catch {} }
      if (!pdfLinks.find(p => p.url === fullUrl)) pdfLinks.push({ url: fullUrl, text: text || "PDF" });
    }
  });

  const mainContent = doc.querySelector("main, .content, #content, article, .entry-content, .page-content") || doc.body;
  const rawText = mainContent.textContent.replace(/\s+/g, " ").trim().substring(0, 10000);

  return { subjects, rawText, pdfLinks, redirectedUrl: null };
}

// ============ SUPABASE HELPERS ============
async function supabaseSavePlan(url, anonKey, plan) {
  if (!url || !anonKey) return null;
  try {
    const resp = await fetch(`${url}/rest/v1/saved_plans`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": anonKey,
        "Authorization": `Bearer ${anonKey}`,
        "Prefer": "return=representation"
      },
      body: JSON.stringify({
        university: plan.university,
        career: plan.career,
        plan_url: plan.url || "",
        subjects: JSON.stringify(plan.subjects),
        created_at: new Date().toISOString()
      })
    });
    if (!resp.ok) return null;
    return await resp.json();
  } catch { return null; }
}

async function supabaseLoadPlans(url, anonKey) {
  if (!url || !anonKey) return null;
  try {
    const resp = await fetch(`${url}/rest/v1/saved_plans?order=created_at.desc`, {
      headers: { "apikey": anonKey, "Authorization": `Bearer ${anonKey}` }
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    return data.map(r => ({
      ...r,
      subjects: typeof r.subjects === "string" ? JSON.parse(r.subjects) : r.subjects,
      url: r.plan_url
    }));
  } catch { return null; }
}

async function supabaseSaveTabla(sbUrl, sbKey, tabla) {
  if (!sbUrl || !sbKey) return null;
  try {
    const resp = await fetch(`${sbUrl}/rest/v1/equivalencias_tablas`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": sbKey,
        "Authorization": `Bearer ${sbKey}`,
        "Prefer": "return=representation"
      },
      body: JSON.stringify({
        origin_university: tabla.originUniversity,
        origin_career:     tabla.originCareer,
        plan_id:           tabla.planId,
        colors:            JSON.stringify(tabla.colors),
        created_at:        new Date().toISOString(),
        updated_at:        new Date().toISOString(),
        notes:             tabla.notes || ""
      })
    });
    if (!resp.ok) { const e = await resp.json().catch(() => ({})); throw new Error(e?.message || `Error ${resp.status}`); }
    return await resp.json();
  } catch(e) { throw e; }
}

async function supabaseUpdateTabla(sbUrl, sbKey, id, colors, notes) {
  if (!sbUrl || !sbKey) return null;
  try {
    const resp = await fetch(`${sbUrl}/rest/v1/equivalencias_tablas?id=eq.${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "apikey": sbKey,
        "Authorization": `Bearer ${sbKey}`,
        "Prefer": "return=representation"
      },
      body: JSON.stringify({ colors: JSON.stringify(colors), notes: notes || "", updated_at: new Date().toISOString() })
    });
    if (!resp.ok) return null;
    return await resp.json();
  } catch { return null; }
}

async function supabaseLoadTablas(sbUrl, sbKey) {
  if (!sbUrl || !sbKey) return [];
  try {
    const resp = await fetch(`${sbUrl}/rest/v1/equivalencias_tablas?order=updated_at.desc`, {
      headers: { "apikey": sbKey, "Authorization": `Bearer ${sbKey}` }
    });
    if (!resp.ok) return [];
    const data = await resp.json();
    return data.map(r => ({ ...r, colors: typeof r.colors === "string" ? JSON.parse(r.colors) : r.colors }));
  } catch { return []; }
}

// ============ BATCH QUICK ANALYSIS ============
async function runBatchQuickAnalysis(originPlan, apiKey, model) {
  const originList = originPlan.subjects.slice(0, 80).map(s => `  • ${s.name}`).join("\n");

  // Build UCALP descriptions focusing on what distinguishes each subject
  const ucalpDescriptions = {
    estrategias_comunicacionales: "Comunicación, retórica, texto académico, oratoria",
    matematica: "Cálculo, álgebra lineal, funciones, derivadas, integrales, estadística",
    intro_economia: "Microeconomía básica, mercados, oferta y demanda, macroeconomía introductoria",
    intro_gobernanza: "ESPECÍFICA: Gobernanza de datos, DAMA-DMBOK, Data Steward, ciclo de vida del dato, marcos regulatorios de datos",
    fundamentos_computacion: "Hardware, SO, redes, almacenamiento, virtualización, nube",
    principios_programacion: "Programación estructurada y OOP, Python, algoritmos, NumPy/Pandas",
    filosofia_1: "Filosofía general, metafísica, Tomás de Aquino, gnoseología, ética filosófica",
    arquitectura_software: "Arquitecturas de software, patrones de diseño, Big-O, estructuras de datos, Git, APIs",
    macroeconomia: "PBI, inflación, desempleo, política fiscal y monetaria, ciclos económicos",
    administracion: "Proceso administrativo, gestión de proyectos, estrategia, transformación digital",
    estrategias_gobernanza: "MUY ESPECÍFICA: Estrategia de gobernanza de datos, frameworks, Data Office, roadmap de implementación",
    modelado_datos: "MUY ESPECÍFICA: Modelo ER, normalización, Data Warehouse, ETL, data lakehouse, linaje de datos",
    probabilidad_estadistica: "Probabilidad, distribuciones, inferencia, regresión, análisis exploratorio",
    gobernanza_organizaciones: "ESPECÍFICA: Gobierno corporativo, COBIT, ISO 38500, compliance, gobernanza de TI",
    microeconomia: "Teoría del consumidor y empresa, elasticidades, estructuras de mercado, externalidades",
    normativa_internacional: "MUY ESPECÍFICA: GDPR, CCPA, Ley 25.326, Privacy by Design, normativa internacional de datos personales",
    bases_datos: "SQL avanzado, NoSQL, optimización, transacciones ACID, PostgreSQL, MongoDB",
    fund_inteligencia_artificial: "Machine learning, redes neuronales, deep learning, NLP, IA generativa, LLMs",
    etica_responsabilidad: "ESPECÍFICA: Ética de datos, sesgos algorítmicos, IA ética, derechos digitales, responsabilidad social en datos",
    teologia_1: "Teología, doctrina social de la Iglesia",
    ingles: "Inglés técnico para tecnología, lecto-comprensión de documentación",
    big_data: "MUY ESPECÍFICA: Hadoop, Spark, Kafka, arquitecturas Lambda/Kappa, data lakes, gobernanza Big Data",
    analisis_visualizacion: "Power BI, Tableau, Python visualización, dashboards, storytelling con datos",
    politicas_publicas: "ESPECÍFICA: Políticas públicas de datos, gobierno abierto, datos abiertos, interoperabilidad",
    ciberseguridad: "Criptografía, seguridad en redes, IAM, ISO 27001, respuesta a incidentes, protección de datos",
    diseno_politicas: "MUY ESPECÍFICA: Diseño y gestión de políticas de datos, DLM, políticas de retención y acceso",
    calidad_privacidad: "MUY ESPECÍFICA: Calidad de datos (DAMA), privacidad diferencial, anonimización, k-anonimato, DPIA",
    auditoria_datos: "MUY ESPECÍFICA: Auditoría de datos, ISACA, COBIT, auditoría de algoritmos, informe de hallazgos",
    mineria_datos: "Machine learning aplicado, CRISP-DM, clasificación, clustering, series temporales, scikit-learn",
    toma_decisiones: "ESPECÍFICA: Toma de decisiones basada en datos, BI, analítica prescriptiva, data-driven culture",
    filosofia_2: "Filosofía política, filosofía de la técnica, filosofía de la IA, epistemología de la ciencia de datos",
    gobernanza_proyectos: "MUY ESPECÍFICA: Gobernanza en proyectos de datos, DataOps, MLOps, gestión de riesgos en datos"
  };

  const ucalpList = Object.entries(ucalpDescriptions)
    .map(([key, desc]) => `- ${key}: ${desc}`)
    .join("\n");

  const prompt = `Sos un experto en equivalencias universitarias argentinas. Realizá un análisis PRELIMINAR y CONSERVADOR de equivalencias entre el plan de origen y las materias de la Licenciatura en Gobernanza de Datos (UCALP).

CARRERA DE ORIGEN: ${originPlan.career} — ${originPlan.university}
MATERIAS DE ORIGEN:
${originList}

MATERIAS UCALP — Gobernanza de Datos (con descripción de contenidos clave):
${ucalpList}

CRITERIOS ESTRICTOS:
- TOTAL: equivalencia muy probable (nombre y área disciplinar prácticamente idénticos, contenidos sustancialmente coincidentes). Ejemplo: "Filosofía I" de origen ↔ "filosofia_1" UCALP.
- PARCIAL: superposición temática parcial pero real. Solo si hay materias de origen que cubran una PARTE significativa. Ser conservador.
- SIN_EQUIVALENCIA: área temática diferente o insuficiente superposición. Para materias marcadas como "MUY ESPECÍFICA" o "ESPECÍFICA" del campo de gobernanza de datos, en general aplica SIN_EQUIVALENCIA salvo que la carrera de origen sea de sistemas/informática/datos.
- SKIP: teología, optativas, proyectos finales, trabajos finales, inglés si no hay materia equivalente.

REGLAS ADICIONALES:
1. Las materias marcadas MUY ESPECÍFICA de gobernanza de datos (normativa_internacional, bases_datos avanzadas, modelado_datos, big_data, calidad_privacidad, auditoria_datos, diseno_politicas, gobernanza_proyectos, estrategias_gobernanza) → SIN_EQUIVALENCIA para carreras de comunicación/RRPP/derecho/administración general.
2. Filosofía I y II → TOTAL si la carrera de origen tiene filosofía.
3. Teología I y II → SKIP siempre.
4. Matemática → TOTAL solo si hay matemática universitaria formal en la carrera de origen.
5. No sobreestimar: es mejor ser conservador (SIN_EQUIVALENCIA) que optimista (PARCIAL) en la tabla preliminar.

Respondé SOLO con este JSON exacto (sin backticks, sin explicaciones):
{
  "estrategias_comunicacionales": "TOTAL"|"PARCIAL"|"SIN_EQUIVALENCIA"|"SKIP",
  "matematica": "TOTAL"|"PARCIAL"|"SIN_EQUIVALENCIA"|"SKIP",
  "intro_economia": "TOTAL"|"PARCIAL"|"SIN_EQUIVALENCIA"|"SKIP",
  "intro_gobernanza": "TOTAL"|"PARCIAL"|"SIN_EQUIVALENCIA"|"SKIP",
  "fundamentos_computacion": "TOTAL"|"PARCIAL"|"SIN_EQUIVALENCIA"|"SKIP",
  "principios_programacion": "TOTAL"|"PARCIAL"|"SIN_EQUIVALENCIA"|"SKIP",
  "filosofia_1": "TOTAL"|"PARCIAL"|"SIN_EQUIVALENCIA"|"SKIP",
  "arquitectura_software": "TOTAL"|"PARCIAL"|"SIN_EQUIVALENCIA"|"SKIP",
  "macroeconomia": "TOTAL"|"PARCIAL"|"SIN_EQUIVALENCIA"|"SKIP",
  "administracion": "TOTAL"|"PARCIAL"|"SIN_EQUIVALENCIA"|"SKIP",
  "estrategias_gobernanza": "TOTAL"|"PARCIAL"|"SIN_EQUIVALENCIA"|"SKIP",
  "modelado_datos": "TOTAL"|"PARCIAL"|"SIN_EQUIVALENCIA"|"SKIP",
  "probabilidad_estadistica": "TOTAL"|"PARCIAL"|"SIN_EQUIVALENCIA"|"SKIP",
  "gobernanza_organizaciones": "TOTAL"|"PARCIAL"|"SIN_EQUIVALENCIA"|"SKIP",
  "microeconomia": "TOTAL"|"PARCIAL"|"SIN_EQUIVALENCIA"|"SKIP",
  "normativa_internacional": "TOTAL"|"PARCIAL"|"SIN_EQUIVALENCIA"|"SKIP",
  "bases_datos": "TOTAL"|"PARCIAL"|"SIN_EQUIVALENCIA"|"SKIP",
  "fund_inteligencia_artificial": "TOTAL"|"PARCIAL"|"SIN_EQUIVALENCIA"|"SKIP",
  "etica_responsabilidad": "TOTAL"|"PARCIAL"|"SIN_EQUIVALENCIA"|"SKIP",
  "teologia_1": "SKIP",
  "ingles": "TOTAL"|"PARCIAL"|"SIN_EQUIVALENCIA"|"SKIP",
  "big_data": "TOTAL"|"PARCIAL"|"SIN_EQUIVALENCIA"|"SKIP",
  "analisis_visualizacion": "TOTAL"|"PARCIAL"|"SIN_EQUIVALENCIA"|"SKIP",
  "politicas_publicas": "TOTAL"|"PARCIAL"|"SIN_EQUIVALENCIA"|"SKIP",
  "ciberseguridad": "TOTAL"|"PARCIAL"|"SIN_EQUIVALENCIA"|"SKIP",
  "diseno_politicas": "TOTAL"|"PARCIAL"|"SIN_EQUIVALENCIA"|"SKIP",
  "calidad_privacidad": "TOTAL"|"PARCIAL"|"SIN_EQUIVALENCIA"|"SKIP",
  "auditoria_datos": "TOTAL"|"PARCIAL"|"SIN_EQUIVALENCIA"|"SKIP",
  "mineria_datos": "TOTAL"|"PARCIAL"|"SIN_EQUIVALENCIA"|"SKIP",
  "toma_decisiones": "TOTAL"|"PARCIAL"|"SIN_EQUIVALENCIA"|"SKIP",
  "filosofia_2": "TOTAL"|"PARCIAL"|"SIN_EQUIVALENCIA"|"SKIP",
  "optativa_1": "SKIP",
  "optativa_2": "SKIP",
  "optativa_3": "SKIP",
  "proyecto_1": "SKIP",
  "gobernanza_proyectos": "TOTAL"|"PARCIAL"|"SIN_EQUIVALENCIA"|"SKIP",
  "optativa_4": "SKIP",
  "optativa_5": "SKIP",
  "optativa_6": "SKIP",
  "proyecto_2": "SKIP",
  "teologia_2": "SKIP"
}`;

  const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
      "HTTP-Referer": "https://ucalp-equivalencias.pages.dev",
      "X-Title": "UCALP Equivalencias"
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: "Respondé ÚNICAMENTE con JSON válido sin backticks. Sé conservador: preferí SIN_EQUIVALENCIA antes que PARCIAL si hay dudas." },
        { role: "user", content: prompt }
      ],
      temperature: 0.1,
      max_tokens: 1200
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

function buildPrompt(ucalpSubject, ucalpData, originSubject, originProgram, originUniversity, originCareer) {
  const isProvisional = !ucalpData.hasProgram;

  if (isProvisional) {
    return `Sos un experto académico en análisis de equivalencias universitarias en Argentina. Debés realizar un análisis PROVISIONAL de equivalencia entre una materia de ORIGEN y una materia DESTINO de la Licenciatura en Gobernanza de Datos (UCALP).

IMPORTANTE: Esta evaluación es PROVISIONAL porque el programa completo de la materia destino aún está en elaboración. El análisis se basa en la descripción tentativa de contenidos. La decisión final quedará sujeta a revisión cuando el programa definitivo esté disponible.

## MATERIA DESTINO (UCALP - Lic. en Gobernanza de Datos) — PROGRAMA PROVISORIO
**Materia:** ${ucalpSubject}
**Año/Semestre:** ${ucalpData.year} — ${ucalpData.semester === "1S" ? "1° Semestre" : ucalpData.semester === "2S" ? "2° Semestre" : "Anual"}
**Créditos:** ${ucalpData.credits} | **Carga horaria total:** ${ucalpData.totalHours} hs
**Descripción tentativa de contenidos:**
${ucalpData.descripcion}

## MATERIA DE ORIGEN
**Universidad:** ${originUniversity}
**Carrera:** ${originCareer}
**Materia:** ${originSubject}
**Programa/Contenidos:**
${originProgram}

## INSTRUCCIONES
Comparar la materia de origen con la descripción tentativa de la materia destino. Como el programa no está completamente definido, usar criterio amplio pero riguroso. Identificar áreas temáticas de convergencia y divergencia. Ser claro sobre el carácter provisional del análisis.

## CRITERIOS
- **EQUIVALENCIA TOTAL**: Hay coincidencia sustancial (≥75%) con los temas descriptos en la materia destino.
- **EQUIVALENCIA PARCIAL**: Hay coincidencia en algunos bloques temáticos pero no en todos.
- **SIN EQUIVALENCIA**: Los contenidos son sustancialmente distintos.
- **NO EVALUABLE**: La descripción es insuficiente para emitir juicio o la materia es muy específica de la carrera (optativas, proyectos, teología).

## FORMATO DE RESPUESTA (SOLO JSON, sin backticks):
{
  "clasificacion": "TOTAL" | "PARCIAL" | "SIN_EQUIVALENCIA" | "NO_EVALUABLE",
  "es_provisional": true,
  "porcentaje_cobertura_global": <número 0-100>,
  "analisis_por_unidad": [
    {
      "unidad": 1,
      "titulo": "<bloque temático identificado>",
      "cobertura": <número 0-100>,
      "coincidencias": "<temas que coinciden>",
      "faltantes": "<temas ausentes>"
    }
  ],
  "unidades_reconocidas": [],
  "unidades_a_rendir": [],
  "justificacion": "<análisis fundamentado con énfasis en el carácter provisional>",
  "recomendacion": "<recomendación al director indicando que debe confirmarse con el programa definitivo>",
  "observaciones": "ANÁLISIS PROVISIONAL — Sujeto a revisión cuando el programa definitivo esté disponible."
}`;
  }

  return `Sos un experto académico en análisis de equivalencias universitarias en Argentina. Tu tarea es comparar rigurosamente el programa de una materia de ORIGEN con el programa completo de una materia DESTINO de la Licenciatura en Gobernanza de Datos (UCALP).

## MATERIA DESTINO (UCALP - Lic. en Gobernanza de Datos)
**Materia:** ${ucalpSubject}
**Año/Semestre:** ${ucalpData.year} — ${ucalpData.semester === "1S" ? "1° Semestre" : ucalpData.semester === "2S" ? "2° Semestre" : "Anual"}
**Créditos:** ${ucalpData.credits} | **Carga horaria total:** ${ucalpData.totalHours} hs
**Unidades:**
${(ucalpData.units || []).map(u => `- Unidad ${u.number}: ${u.title}\n  Contenidos: ${u.topics}`).join("\n")}

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
- **EQUIVALENCIA PARCIAL**: La materia de origen cubre sustancialmente (≥70%) ALGUNAS unidades pero no todas. Indicar exactamente qué unidades se reconocen y cuáles debe rendir el alumno en examen complementario.
- **SIN EQUIVALENCIA**: La materia de origen cubre menos del 50% de los contenidos globales o los enfoques son fundamentalmente distintos.

## FORMATO DE RESPUESTA (SOLO JSON exacto, sin texto adicional ni backticks):
{
  "clasificacion": "TOTAL" | "PARCIAL" | "SIN_EQUIVALENCIA",
  "es_provisional": false,
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

function loadData(key, fallback) {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; } catch { return fallback; }
}
function saveData(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { console.error(e); }
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
  blue: "#1565C0",
  blueSoft: "#E3F2FD",
  blueBorder: "#BBDEFB",
};

export default function EquivalenciasApp() {
  const [tab, setTab] = useState("dashboard");
  const [apiKey, setApiKey] = useState("");
  const [selectedModel, setSelectedModel] = useState(MODELS[0].id);
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  // ── Auth state ──
  const [authSession, setAuthSession] = useState(null);   // Supabase session
  const [authProfile, setAuthProfile] = useState(null);   // {rol, nombre, apellido, ...}
  const [authLoading, setAuthLoading] = useState(true);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(true); // true=login, false=reset pw
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
  const [targetSubject, setTargetSubject] = useState("estrategias_comunicacionales");
  const [result, setResult] = useState(null);
  const [inputMode, setInputMode] = useState("text");
  const [fileProcessing, setFileProcessing] = useState(false);
  const [fileName, setFileName] = useState("");
  const [scrapeUrl, setScrapeUrl] = useState("");
  const [scraping, setScraping] = useState(false);
  const [scrapedPlan, setScrapedPlan] = useState(null);
  const [savedPlans, setSavedPlans] = useState([]);
  const [sheetsUrl, setSheetsUrl] = useState("");
  const [sheetsData, setSheetsData] = useState(null);
  const [sheetsLoading, setSheetsLoading] = useState(false);
  const [aiExtracting, setAiExtracting] = useState(false);
  const [htmlPaste, setHtmlPaste] = useState("");
  const [htmlParsed, setHtmlParsed] = useState(null);
  // FI-UNLP Explorer state
  const [fiCarrera, setFiCarrera] = useState("industrial");
  const [fiSemestre, setFiSemestre] = useState("all");
  const [fiSearch, setFiSearch] = useState("");
  const [fiCompareA, setFiCompareA] = useState("industrial");
  const [fiCompareB, setFiCompareB] = useState("computacion");
  const [fiShowCompare, setFiShowCompare] = useState(false);
  // Reporte tab state
  const [rStudentName, setRStudentName] = useState("");
  const [rStudentDni, setRStudentDni] = useState("");
  const [rStudentUni, setRStudentUni] = useState("Universidad Nacional de La Plata (UNLP)");
  const [rStudentCareer, setRStudentCareer] = useState("Ingeniería en Computación");
  const [rReportView, setRReportView] = useState("form");
  // Tabla general provisoria state
  const [tablaSelectedPlanId, setTablaSelectedPlanId] = useState(null);
  const [tablaBatchResult, setTablaBatchResult] = useState(null);
  const [tablaBatchLoading, setTablaBatchLoading] = useState(false);
  const [tablaBatchError, setTablaBatchError] = useState(null);
  const [tablaCache, setTablaCache] = useState({});
  const [tablaEditMode, setTablaEditMode] = useState(false);
  const [tablaEditColors, setTablaEditColors] = useState({}); // overrides: key -> value
  const [tablaSaving, setTablaSaving] = useState(false);
  const [savedTablas, setSavedTablas] = useState([]);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  // Supabase config
  const [supabaseUrl, setSupabaseUrl] = useState("");
  const [supabaseKey, setSupabaseKey] = useState("");
  const resultRef = useRef(null);

  useEffect(() => {
    const saved = loadData("eq-analyses-v2", []);
    const key = loadData("eq-apikey-v2", "");
    const model = loadData("eq-model-v2", MODELS[0].id);
    const plans = loadData("eq-plans-v2", []);
    setAnalyses(saved); setApiKey(key); setSelectedModel(model); setSavedPlans(plans); setLoading(false);
    const sbUrl = import.meta.env.VITE_SUPABASE_URL || loadData("eq-supabase-url", "");
    const sbKey = import.meta.env.VITE_SUPABASE_ANON_KEY || loadData("eq-supabase-key", "");
    const cache = loadData("eq-tabla-cache", {});
    if (sbUrl) setSupabaseUrl(sbUrl);
    if (sbKey) setSupabaseKey(sbKey);
    if (cache) setTablaCache(cache);
    // Restore last tabla state
    const lastPlanId = loadData("eq-tabla-last-plan", null);
    const lastEdits  = loadData("eq-tabla-last-edits", {});
    if (lastPlanId) setTablaSelectedPlanId(lastPlanId);
    if (lastEdits && Object.keys(lastEdits).length > 0) setTablaEditColors(lastEdits);

    // ── Auth init ──
    const initAuth = async () => {
      const sb = getSupabaseClient();
      if (!sb) { setAuthLoading(false); return; }
      const { data: { session } } = await sb.auth.getSession();
      setAuthSession(session);
      if (session?.user) {
        const { data: profile } = await sb.from("profiles").select("*").eq("id", session.user.id).single();
        setAuthProfile(profile);
        // Load API key from profile if available
        if (profile?.openrouter_key) { setApiKey(profile.openrouter_key); saveData("eq-apikey-v2", profile.openrouter_key); }
      }
      setAuthLoading(false);
      sb.auth.onAuthStateChange(async (event, session) => {
        setAuthSession(session);
        if (session?.user) {
          const { data: profile } = await sb.from("profiles").select("*").eq("id", session.user.id).single();
          setAuthProfile(profile);
          if (profile?.openrouter_key) { setApiKey(profile.openrouter_key); saveData("eq-apikey-v2", profile.openrouter_key); }
          // Load saved tablas
          const { data: tablas } = await sb.from("equivalencias_tablas").select("*").order("updated_at", { ascending: false });
          if (tablas) setSavedTablas(tablas.map(r => ({ ...r, colors: typeof r.colors === "string" ? JSON.parse(r.colors) : r.colors })));
        } else {
          setAuthProfile(null);
        }
      });
    };
    initAuth();

    document.title = "Equivalencias · UCALP Gobernanza de Datos";
    let link = document.querySelector("link[rel~='icon']");
    if (!link) { link = document.createElement("link"); link.rel = "icon"; link.type = "image/png"; document.head.appendChild(link); }
    link.href = "https://www.ucalp.edu.ar/wp-content/uploads/2016/08/apple-touch-icon.png";
    let link2 = document.querySelector("link[rel='apple-touch-icon']");
    if (!link2) { link2 = document.createElement("link"); link2.rel = "apple-touch-icon"; document.head.appendChild(link2); }
    link2.href = "https://www.ucalp.edu.ar/wp-content/uploads/2016/08/apple-touch-icon.png";
  }, []);

  // Persist tabla edit state on change
  useEffect(() => { saveData("eq-tabla-last-edits", tablaEditColors); }, [tablaEditColors]);

  const saveApiKey = (k) => {    setApiKey(k);
    saveData("eq-apikey-v2", k);
    // Also persist to Supabase profile so it syncs across devices
    const sb = getSupabaseClient();
    if (sb && authSession?.user) {
      sb.from("profiles").update({ openrouter_key: k }).eq("id", authSession.user.id).then(() => {});
    }
  };
  const saveModel = (m) => { setSelectedModel(m); saveData("eq-model-v2", m); };

  // ── Auth helpers ──
  const rol = authProfile?.rol || "lectura";
  // director + decano + secretaria → acceso total; otro_director → solo lectura
  const canWrite   = ["director", "decano", "secretaria"].includes(rol);
  const canAnalyze = ["director", "decano", "secretaria"].includes(rol);
  const isDirector = rol === "director";

  const handleLogin = async () => {
    setLoginError(""); setLoginLoading(true);
    const sb = getSupabaseClient();
    if (!sb) { setLoginError("Configurá Supabase primero (URL y API key abajo)."); setLoginLoading(false); return; }
    const { error } = await sb.auth.signInWithPassword({ email: loginEmail, password: loginPassword });
    if (error) setLoginError(error.message === "Invalid login credentials" ? "Email o contraseña incorrectos." : error.message);
    setLoginLoading(false);
  };

  const handleLogout = async () => {
    const sb = getSupabaseClient();
    if (sb) await sb.auth.signOut();
    setAuthSession(null); setAuthProfile(null);
  };

  const handleResetPassword = async () => {
    if (!loginEmail) { setLoginError("Ingresá tu email primero."); return; }
    const sb = getSupabaseClient();
    if (!sb) { setLoginError("Supabase no configurado."); return; }
    const { error } = await sb.auth.resetPasswordForEmail(loginEmail, {
      redirectTo: window.location.origin
    });
    if (error) setLoginError(error.message);
    else setLoginError("✓ Revisá tu email para restablecer la contraseña.");
  };

  const ROL_LABELS = {
    director:      { label: "Director/a", color: C.red,         bg: C.redSoft },
    secretaria:    { label: "Secretaría", color: "#6D28D9",     bg: "#EDE9FE" },
    decano:        { label: "Decano/a",   color: "#1565C0",     bg: "#E3F2FD" },
    otro_director: { label: "Dir. (lectura)", color: "#065F46",     bg: "#D1FAE5" },
    lectura:       { label: "Lectura",    color: C.textSecondary, bg: C.bg },
  };

  // ── Show login screen if Supabase configured but not logged in ──
  const sbConfigured = !!(
    import.meta.env.VITE_SUPABASE_URL ||
    supabaseUrl ||
    loadData("eq-supabase-url", "")
  );
  const needsLogin = sbConfigured && !authLoading && !authSession;

  const runAnalysis = async () => {
    if (!apiKey) { setShowApiKeyModal(true); return; }
    const uni = originUniversity.includes("Otra") ? customUniversity : originUniversity;
    const car = originCareer.includes("Otra") ? customCareer : originCareer;
    if (!originSubject.trim() || !originProgram.trim()) { setError("Completá el nombre y programa de la materia de origen."); return; }
    setAnalyzing(true); setError(null); setResult(null);
    const prog = UCALP_PROGRAMS[targetSubject];
    const prompt = buildPrompt(prog.name, prog, originSubject, originProgram, uni, car);
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
      const record = {
        id: Date.now().toString(), date: new Date().toISOString(),
        originUniversity: uni, originCareer: car, originSubject,
        targetSubject: prog.name, targetSubjectKey: targetSubject,
        model: selectedModel, result: parsed,
        isProvisional: !prog.hasProgram,
        originProgram: originProgram.substring(0, 2000)
      };
      setResult(record);
      const updated = [record, ...analyses]; setAnalyses(updated); saveData("eq-analyses-v2", updated);
      // Save to Supabase analisis_materias
      const sb = getSupabaseClient();
      if (sb && authSession?.user) {
        sb.from("analisis_materias").insert({
          origin_university:   uni,
          origin_career:       car,
          origin_subject:      originSubject,
          origin_program:      originProgram.substring(0, 3000),
          ucalp_subject_key:   targetSubject,
          ucalp_subject_name:  prog.name,
          clasificacion:       parsed.clasificacion,
          es_provisional:      !prog.hasProgram,
          porcentaje_cobertura: parsed.porcentaje_cobertura_global,
          analisis_json:       parsed,
          modelo_ia:           selectedModel,
          created_by:          authSession.user.id
        }).then(() => {});
      }
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 200);
    } catch (e) { setError(e.message); } finally { setAnalyzing(false); }
  };

  const deleteAnalysis = (id) => { const u = analyses.filter(a => a.id !== id); setAnalyses(u); saveData("eq-analyses-v2", u); };
  const clearAll = () => { if (confirm("¿Eliminar TODAS las equivalencias guardadas?")) { setAnalyses([]); saveData("eq-analyses-v2", []); } };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setFileProcessing(true); setError(null); setFileName(file.name);
    try {
      const text = await extractTextFromFile(file);
      setOriginProgram(text);
      setInputMode("text"); // Switch to text view to show extracted content
    } catch (err) { setError(err.message); } finally { setFileProcessing(false); }
  };

  const handleScrape = async () => {
    if (!scrapeUrl.trim()) return;
    setScraping(true); setError(null); setScrapedPlan(null);
    try {
      const plan = await scrapeStudyPlan(scrapeUrl);
      setScrapedPlan(plan);
    } catch (err) { setError("Error scrapeando: " + err.message); } finally { setScraping(false); }
  };

  const savePlan = (university, career, subjects, url) => {
    const plan = { id: Date.now().toString(), date: new Date().toISOString(), university, career, url, subjects };
    const updated = [plan, ...savedPlans];
    setSavedPlans(updated); saveData("eq-plans-v2", updated);
    const sb = getSupabaseClient();
    if (sb) {
      sb.from("saved_plans").insert({
        id: plan.id, university, career, plan_url: url || "",
        subjects: subjects, created_at: plan.date
      }).then(() => {});
    }
    return plan;
  };

  const deletePlan = (id) => { const u = savedPlans.filter(p => p.id !== id); setSavedPlans(u); saveData("eq-plans-v2", u); };

  const handleSheetsImport = async () => {
    if (!sheetsUrl.trim()) return;
    setSheetsLoading(true); setError(null); setSheetsData(null);
    try {
      const rows = await importFromGoogleSheets(sheetsUrl);
      setSheetsData(rows);
    } catch (e) { setError(e.message); } finally { setSheetsLoading(false); }
  };

  const handleAiExtract = async (rawText) => {
    if (!apiKey) { setShowApiKeyModal(true); return; }
    setAiExtracting(true); setError(null);
    try {
      const subjects = await aiExtractSubjects(rawText, apiKey, selectedModel);
      const parsed = subjects.map(s => ({ name: s, details: "" }));
      // Update whichever context triggered this
      if (scrapedPlan) {
        setScrapedPlan({ ...scrapedPlan, subjects: parsed, aiParsed: true });
      }
      if (htmlPaste.trim()) {
        setHtmlParsed(parsed);
      }
    } catch (e) { setError("IA: " + e.message); } finally { setAiExtracting(false); }
  };

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
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.bg, fontFamily: "'Outfit', sans-serif" }}>
      <div style={{ textAlign: "center", color: C.textSecondary }}><div style={{ fontSize: 36, marginBottom: 12 }}>⚙️</div>Cargando...</div>
    </div>
  );

  const tabData = [
    { id: "dashboard", icon: "📊", label: "Panel" },
    { id: "tabla", icon: "⚡", label: "Tabla" },
    { id: "analyze", icon: "🔍", label: "Analizar" },
    { id: "reporte", icon: "📄", label: "Reporte" },
    { id: "fi_unlp", icon: "🎓", label: "FI-UNLP" },
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
        @media print {
          header, nav, footer, button, .no-print { display: none !important; }
          main { padding: 0 !important; }
        }
      `}</style>

      {/* ── LOGIN SCREEN ── */}
      {needsLogin && (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: `linear-gradient(135deg, ${C.red} 0%, #7B1E1E 100%)`, padding: 24 }}>
          <div style={{ width: "100%", maxWidth: 400, background: "#fff", borderRadius: 20, padding: "40px 36px 32px", boxShadow: "0 20px 60px rgba(0,0,0,0.3)", animation: "fadeIn 0.4s ease" }}>
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <img src="https://www.ucalp.edu.ar/wp-content/uploads/2016/08/apple-touch-icon.png" alt="UCALP" style={{ width: 60, height: 60, borderRadius: "50%", marginBottom: 16, boxShadow: "0 2px 8px rgba(183,28,28,0.2)" }} />
              <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 22, fontWeight: 800, color: C.red }}>Equivalencias UCALP</div>
              <div style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>Lic. en Gobernanza de Datos · Fac. Cs. Exactas e Ingeniería</div>
            </div>

            {loginError && (
              <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 8, background: C.redSoft, color: C.redAccent, fontSize: 13, textAlign: "center" }}>
                {loginError}
              </div>
            )}

            {/* Botón Google */}
            <button onClick={async () => {
              setLoginError(""); setLoginLoading(true);
              const sb = getSupabaseClient();
              if (!sb) { setLoginError("Error de configuración."); setLoginLoading(false); return; }
              const { error } = await sb.auth.signInWithOAuth({
                provider: "google",
                options: {
                  redirectTo: window.location.origin,
                  queryParams: { hd: "ucalpvirtual.edu.ar" } // restringe a dominio UCALP (opcional)
                }
              });
              if (error) { setLoginError(error.message); setLoginLoading(false); }
            }} disabled={loginLoading} style={{
              width: "100%", padding: "13px 16px", borderRadius: 10,
              border: "1.5px solid #E0E0E0", background: "#fff",
              cursor: loginLoading ? "wait" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
              fontSize: 15, fontWeight: 600, color: "#3C4043",
              boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
              transition: "box-shadow 0.2s",
              opacity: loginLoading ? 0.7 : 1
            }}>
              {/* Google SVG icon */}
              <svg width="20" height="20" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                <path fill="none" d="M0 0h48v48H0z"/>
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

      {/* ─── TOP HEADER (solo logo + perfil) ─── */}
      <header style={{ background: C.red, color: "#fff", boxShadow: "0 2px 12px rgba(183,28,28,0.25)", flexShrink: 0, zIndex: 100, position: "sticky", top: 0 }}>
        <div style={{ padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 58 }}>
          {/* Logo + título */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 1px 4px rgba(0,0,0,0.15)" }}>
              <img src="https://www.ucalp.edu.ar/wp-content/uploads/2016/08/apple-touch-icon.png" alt="UCALP" style={{ height: 30, borderRadius: "50%" }} />
            </div>
            <div>
              <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 17, fontWeight: 700, lineHeight: 1.2, letterSpacing: "-0.2px" }}>Equivalencias UCALP</div>
              <div style={{ fontSize: 9, opacity: 0.75, letterSpacing: "0.4px", textTransform: "uppercase", marginTop: 1 }}>Lic. en Gobernanza de Datos · Fac. Cs. Exactas e Ingeniería</div>
            </div>
          </div>

          {/* Perfil */}
          {authSession && authProfile && (() => {
            const googleAvatar = authSession.user?.user_metadata?.avatar_url || authSession.user?.user_metadata?.picture || authProfile.avatar_url;
            const displayName = authProfile.nombre || authSession.user?.user_metadata?.full_name?.split(" ")[0] || authProfile.email?.split("@")[0];
            return (
              <div style={{ position: "relative" }}>
                <button onClick={() => setShowProfileMenu(m => !m)} style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "4px 12px 4px 4px",
                  borderRadius: 24, border: "1.5px solid rgba(255,255,255,0.3)",
                  background: showProfileMenu ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.12)",
                  cursor: "pointer", color: "#fff", transition: "background 0.15s"
                }}>
                  {googleAvatar
                    ? <img src={googleAvatar} referrerPolicy="no-referrer" style={{ width: 30, height: 30, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.5)", flexShrink: 0 }} />
                    : <div style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                        {(displayName?.[0] || "?").toUpperCase()}
                      </div>
                  }
                  <span style={{ fontSize: 13, fontWeight: 600, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{displayName}</span>
                  <span style={{ fontSize: 9, opacity: 0.7 }}>{showProfileMenu ? "▴" : "▾"}</span>
                </button>

                {showProfileMenu && (
                  <>
                    {/* Overlay para cerrar al hacer click afuera */}
                    <div onClick={() => setShowProfileMenu(false)} style={{ position: "fixed", inset: 0, zIndex: 998 }} />
                    {/* Dropdown — fixed para que no quede cortado por overflow */}
                    <div style={{
                      position: "fixed",
                      top: 62,
                      right: 16,
                      background: "#fff", borderRadius: 14, boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
                      border: "1px solid #E8E8E8", minWidth: 240, overflow: "hidden", zIndex: 999
                    }}>
                      <div style={{ padding: "18px 18px 14px", borderBottom: "1px solid #F0F0F0", display: "flex", alignItems: "center", gap: 12 }}>
                        {googleAvatar
                          ? <img src={googleAvatar} referrerPolicy="no-referrer" style={{ width: 44, height: 44, borderRadius: "50%", border: "2px solid #E8E8E8", flexShrink: 0 }} />
                          : <div style={{ width: 44, height: 44, borderRadius: "50%", background: C.redSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: C.red, flexShrink: 0 }}>
                              {(displayName?.[0] || "?").toUpperCase()}
                            </div>
                        }
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "#212121", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{authProfile.nombre} {authProfile.apellido}</div>
                          <div style={{ fontSize: 11, color: "#9E9E9E", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{authProfile.email}</div>
                          <span style={{ display: "inline-block", marginTop: 5, fontSize: 10, padding: "2px 8px", borderRadius: 4, background: ROL_LABELS[rol]?.bg, color: ROL_LABELS[rol]?.color, fontWeight: 700 }}>
                            {ROL_LABELS[rol]?.label || rol}
                          </span>
                        </div>
                      </div>
                      <div style={{ padding: "6px 0" }}>
                        <button onClick={() => { setTab("settings"); setShowProfileMenu(false); }} style={{ width: "100%", padding: "11px 18px", textAlign: "left", border: "none", background: "none", cursor: "pointer", fontSize: 13, color: "#424242", display: "flex", alignItems: "center", gap: 12 }}
                          onMouseEnter={e => e.currentTarget.style.background="#F5F5F5"} onMouseLeave={e => e.currentTarget.style.background="none"}>
                          ⚙️ <span>Configuración</span>
                        </button>
                        <div style={{ height: 1, background: "#F5F5F5", margin: "4px 8px" }} />
                        <button onClick={() => { handleLogout(); setShowProfileMenu(false); }} style={{ width: "100%", padding: "11px 18px", textAlign: "left", border: "none", background: "none", cursor: "pointer", fontSize: 13, color: "#C62828", display: "flex", alignItems: "center", gap: 12, fontWeight: 600 }}
                          onMouseEnter={e => e.currentTarget.style.background="#FFEBEE"} onMouseLeave={e => e.currentTarget.style.background="none"}>
                          ↩ <span>Cerrar sesión</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })()}
        </div>
      </header>

      {/* ─── BODY: sidebar + contenido ─── */}
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>

        {/* ── SIDEBAR ── */}
        <aside style={{
          width: 200, flexShrink: 0, background: C.surface,
          borderRight: `1px solid ${C.borderLight}`,
          display: "flex", flexDirection: "column",
          position: "sticky", top: 58, height: "calc(100vh - 58px)",
          overflowY: "auto"
        }}>
          <nav style={{ padding: "16px 10px", display: "flex", flexDirection: "column", gap: 3 }}>
            {tabData.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 14px", borderRadius: 8, border: "none", cursor: "pointer", textAlign: "left",
                background: tab === t.id ? C.redSoft : "transparent",
                color: tab === t.id ? C.redAccent : C.textSecondary,
                fontWeight: tab === t.id ? 700 : 400,
                fontSize: 13, fontFamily: "'DM Sans', sans-serif",
                transition: "all 0.12s",
                borderLeft: tab === t.id ? `3px solid ${C.red}` : "3px solid transparent"
              }}
              onMouseEnter={e => { if (tab !== t.id) e.currentTarget.style.background = C.bg; }}
              onMouseLeave={e => { if (tab !== t.id) e.currentTarget.style.background = "transparent"; }}
              >
                <span style={{ fontSize: 16, width: 20, textAlign: "center", flexShrink: 0 }}>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </nav>

          {/* Rol badge al fondo del sidebar */}
          {authProfile && (
            <div style={{ marginTop: "auto", padding: "14px 14px 20px", borderTop: `1px solid ${C.borderLight}` }}>
              <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 4 }}>Sesión activa</div>
              <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 5, background: ROL_LABELS[rol]?.bg, color: ROL_LABELS[rol]?.color, fontWeight: 700 }}>
                {ROL_LABELS[rol]?.label || rol}
              </span>
            </div>
          )}
        </aside>

        {/* ── CONTENIDO PRINCIPAL ── */}
        <main style={{ flex: 1, minWidth: 0, padding: "28px 28px 80px", overflowY: "auto" }}>

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
                  <div style={{ fontSize: 30, fontWeight: 700, color: s.color, fontFamily: "'Outfit', sans-serif" }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: C.textSecondary, marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 22, color: C.text, margin: 0, fontWeight: 700 }}>Historial de equivalencias</h2>
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
                <div style={{ fontSize: 18, color: C.text, marginBottom: 6, fontFamily: "'Outfit', sans-serif", fontWeight: 600 }}>No hay análisis guardados</div>
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

        {/* ═══════ TABLA GENERAL PROVISORIA ═══════ */}
        {tab === "tabla" && (() => {
          const selectedPlan = tablaSelectedPlanId
            ? savedPlans.find(p => p.id === tablaSelectedPlanId)
            : null;

          // Merge: base colors from cache/batch, overridden by manual edits
          const baseColors = (tablaBatchResult?.planId === tablaSelectedPlanId)
            ? tablaBatchResult.colors
            : (tablaCache[tablaSelectedPlanId] || null);

          const effectiveColors = baseColors
            ? { ...baseColors, ...tablaEditColors }
            : (Object.keys(tablaEditColors).length > 0 ? tablaEditColors : null);

          const COLOR_MAP = {
            TOTAL:            { bg: "#E8F5E9", border: "#A5D6A7", text: "#1B5E20", dot: "#4CAF50", label: "✓ Total" },
            PARCIAL:          { bg: "#FFF8E1", border: "#FFE082", text: "#5D4037", dot: "#FFC107", label: "△ Parcial" },
            SIN_EQUIVALENCIA: { bg: "#FFEBEE", border: "#FFCDD2", text: "#B71C1C", dot: "#EF5350", label: "✗ Sin Equiv." },
            SKIP:             { bg: C.bg,      border: C.borderLight, text: C.textMuted, dot: "#BDBDBD", label: "— N/A" },
          };
          const CYCLE = ["TOTAL", "PARCIAL", "SIN_EQUIVALENCIA", "SKIP"];

          const runBatch = async () => {
            if (!apiKey) { setShowApiKeyModal(true); return; }
            if (!selectedPlan) return;
            setTablaBatchLoading(true); setTablaBatchError(null); setTablaEditColors({});
            saveData("eq-tabla-last-edits", {});
            try {
              const result = await runBatchQuickAnalysis(selectedPlan, apiKey, selectedModel);
              const entry = { planId: selectedPlan.id, colors: result };
              setTablaBatchResult(entry);
              const newCache = { ...tablaCache, [selectedPlan.id]: result };
              setTablaCache(newCache);
              saveData("eq-tabla-cache", newCache);
            } catch(e) {
              setTablaBatchError(e.message);
            } finally {
              setTablaBatchLoading(false);
            }
          };

          const saveToSupabase = async () => {
            if (!effectiveColors || !selectedPlan) return;
            const sb = getSupabaseClient();
            if (!sb) { alert("Supabase no configurado."); return; }
            setTablaSaving(true);
            try {
              // Upsert by plan_id — insert or update if already exists
              const { error } = await sb.from("equivalencias_tablas").upsert({
                origin_university: selectedPlan.university,
                origin_career:     selectedPlan.career,
                plan_id:           selectedPlan.id,
                colors:            effectiveColors,
                notes:             "",
                updated_at:        new Date().toISOString()
              }, { onConflict: "plan_id" });
              if (error) throw new Error(error.message);
              // Reload
              const { data: tablas } = await sb.from("equivalencias_tablas").select("*").order("updated_at", { ascending: false });
              if (tablas) setSavedTablas(tablas.map(r => ({ ...r, colors: typeof r.colors === "string" ? JSON.parse(r.colors) : r.colors })));
              const newCache = { ...tablaCache, [selectedPlan.id]: effectiveColors };
              setTablaCache(newCache);
              saveData("eq-tabla-cache", newCache);
              alert(`✅ Tabla guardada para: ${selectedPlan.career}`);
            } catch(e) {
              alert("⚠ Error guardando: " + e.message);
            } finally {
              setTablaSaving(false);
            }
          };

          const colorStats = effectiveColors
            ? { total: Object.values(effectiveColors).filter(v => v === "TOTAL").length,
                parcial: Object.values(effectiveColors).filter(v => v === "PARCIAL").length,
                sin: Object.values(effectiveColors).filter(v => v === "SIN_EQUIVALENCIA").length }
            : null;

          const hasEdits = Object.keys(tablaEditColors).length > 0;

          return (
            <div style={{ animation: "fadeIn 0.3s ease" }}>
              <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                <div>
                  <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 24, color: C.text, margin: 0, fontWeight: 700 }}>
                    ⚡ Tabla General Provisoria
                  </h2>
                  <p style={{ color: C.textSecondary, fontSize: 13, marginTop: 5, lineHeight: 1.5, maxWidth: 600 }}>
                    Análisis en 1 consulta IA. <strong>Es orientativo</strong> — editá manualmente si querés ajustar y luego guardá en Supabase para tener la tabla disponible siempre.
                  </p>
                </div>
                {effectiveColors && selectedPlan && (
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <button onClick={() => setTablaEditMode(!tablaEditMode)} style={{
                      padding: "8px 16px", borderRadius: 7, border: `1.5px solid ${tablaEditMode ? C.amber : C.border}`,
                      background: tablaEditMode ? C.amberSoft : C.surface, color: tablaEditMode ? C.amber : C.textSecondary,
                      cursor: "pointer", fontSize: 12, fontWeight: 600
                    }}>
                      ✏️ {tablaEditMode ? "Editando..." : "Editar"}{hasEdits ? " ●" : ""}
                    </button>
                    {hasEdits && (
                      <button onClick={() => setTablaEditColors({})} style={{ ...btnOutline, fontSize: 12, padding: "8px 12px" }}>
                        ↩ Deshacer edits
                      </button>
                    )}
                    <button onClick={saveToSupabase} disabled={tablaSaving} style={{
                      ...btnPrimary, padding: "8px 18px", fontSize: 12,
                      background: "#3ECF8E", opacity: tablaSaving ? 0.6 : 1
                    }}>
                      {tablaSaving ? "⚙️ Guardando..." : "🗄️ Guardar en Supabase"}
                    </button>
                  </div>
                )}
              </div>

              {/* Saved tablas from Supabase */}
              {savedTablas.length > 0 && (
                <div style={{ ...cardStyle, marginBottom: 16, padding: "12px 18px" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#3ECF8E", marginBottom: 8 }}>🗄️ Tablas guardadas en Supabase</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {savedTablas.map(t => (
                      <button key={t.id} onClick={() => {
                        // Load this tabla's colors into cache
                        const newCache = { ...tablaCache, [t.plan_id]: t.colors };
                        setTablaCache(newCache);
                        saveData("eq-tabla-cache", newCache);
                        setTablaSelectedPlanId(t.plan_id);
                        setTablaEditColors({});
                      }} style={{
                        padding: "6px 14px", borderRadius: 6, border: "1px solid #3ECF8E22",
                        background: "#3ECF8E10", color: "#2A9D6A", cursor: "pointer", fontSize: 12, fontWeight: 600
                      }}>
                        {t.origin_career} — {t.origin_university?.replace("Universidad ", "U. ")}
                        <span style={{ fontSize: 10, color: "#3ECF8E", marginLeft: 6 }}>
                          {new Date(t.updated_at).toLocaleDateString("es-AR")}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {tablaEditMode && effectiveColors && (
                <div style={{ ...cardStyle, marginBottom: 16, padding: "12px 18px", borderLeft: `4px solid ${C.amber}`, background: C.amberSoft }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.amber, marginBottom: 4 }}>✏️ Modo edición activo</div>
                  <div style={{ fontSize: 12, color: "#5D4037", lineHeight: 1.5 }}>
                    Hacé <strong>click en cualquier materia</strong> para cambiar su equivalencia en ciclo: Total → Parcial → Sin Equivalencia → N/A → Total.
                    Los cambios se aplican sobre los resultados de la IA. Guardá con el botón <strong>Guardar en Supabase</strong> cuando estés conforme.
                    {hasEdits && <span style={{ marginLeft: 8, fontWeight: 700, color: C.amber }}>({Object.keys(tablaEditColors).length} cambio{Object.keys(tablaEditColors).length !== 1 ? "s" : ""} manual{Object.keys(tablaEditColors).length !== 1 ? "es" : ""})</span>}
                  </div>
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 20, alignItems: "start" }}>

                {/* ── Columna izquierda: planes ── */}
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ ...cardStyle, padding: "16px" }}>
                    <SectionTitle icon="🏛" color={C.blue} label="Plan de origen" />
                    {savedPlans.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "24px 0", color: C.textMuted, fontSize: 13 }}>
                        <div style={{ fontSize: 28, marginBottom: 8 }}>📭</div>
                        No hay planes guardados.<br />
                        <button onClick={() => setTab("plans")} style={{ ...btnOutline, display: "block", margin: "12px auto 0", fontSize: 12 }}>🌐 Ir a Planes</button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                        {savedPlans.map(plan => {
                          const cached = tablaCache[plan.id];
                          const isSaved = savedTablas.some(t => t.plan_id === plan.id);
                          const isSelected = tablaSelectedPlanId === plan.id;
                          const cTotal = cached ? Object.values(cached).filter(v => v === "TOTAL").length : 0;
                          const cParcial = cached ? Object.values(cached).filter(v => v === "PARCIAL").length : 0;
                          return (
                            <button key={plan.id} onClick={() => { setTablaSelectedPlanId(plan.id); setTablaBatchError(null); setTablaEditColors({}); setTablaEditMode(false); saveData('eq-tabla-last-plan', plan.id); saveData('eq-tabla-last-edits', {}); }} style={{
                              padding: "9px 12px", borderRadius: 7, cursor: "pointer", textAlign: "left",
                              border: `1.5px solid ${isSelected ? C.red : C.border}`,
                              background: isSelected ? C.redSoft : C.surface, transition: "all 0.12s"
                            }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <span style={{ fontSize: 12, fontWeight: 600, color: isSelected ? C.redAccent : C.text, flex: 1 }}>
                                  {plan.career}
                                </span>
                                {isSaved && <span title="Guardada en Supabase" style={{ fontSize: 10, color: "#3ECF8E" }}>🗄️</span>}
                              </div>
                              <div style={{ fontSize: 11, color: C.textMuted, marginTop: 1 }}>{plan.university?.replace("Universidad ", "U. ")} · {plan.subjects?.length || 0} mat.</div>
                              {cached && (
                                <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                                  <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 3, background: "#E8F5E9", color: "#2E7D32", fontWeight: 700 }}>✓ {cTotal}</span>
                                  <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 3, background: "#FFF8E1", color: "#F57F17", fontWeight: 700 }}>△ {cParcial}</span>
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {selectedPlan && (
                    <div style={{ ...cardStyle, padding: "14px" }}>
                      {!apiKey && <div style={{ fontSize: 12, color: C.amber, marginBottom: 8 }}>⚠ Configurá API Key en Config.</div>}
                      <button onClick={runBatch} disabled={tablaBatchLoading || !apiKey} style={{
                        ...btnPrimary, width: "100%", display: "flex", alignItems: "center",
                        justifyContent: "center", gap: 8, padding: "11px",
                        opacity: (tablaBatchLoading || !apiKey) ? 0.6 : 1
                      }}>
                        {tablaBatchLoading
                          ? <><span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⚙️</span> Analizando...</>
                          : effectiveColors ? "🔄 Re-analizar" : "⚡ Analizar equivalencias"}
                      </button>
                      {tablaBatchError && <div style={{ marginTop: 8, fontSize: 12, color: C.redAccent }}>⚠ {tablaBatchError}</div>}
                      {colorStats && (
                        <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: "#E8F5E9", color: "#2E7D32", fontWeight: 700 }}>✓ {colorStats.total}</span>
                          <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: "#FFF8E1", color: "#F57F17", fontWeight: 700 }}>△ {colorStats.parcial}</span>
                          <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: "#FFEBEE", color: C.redAccent, fontWeight: 700 }}>✗ {colorStats.sin}</span>
                        </div>
                      )}
                      <div style={{ marginTop: 8, fontSize: 10, color: C.textMuted, lineHeight: 1.4, textAlign: "center" }}>
                        1 consulta IA · Análisis preliminar basado en nombres y contexto disciplinar
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Columna derecha: semáforo UCALP ── */}
                <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
                  <div style={{ padding: "13px 20px", background: C.red, color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 15, fontWeight: 700 }}>Lic. en Gobernanza de Datos — UCALP</div>
                      {selectedPlan ? (
                        <div style={{ fontSize: 11, opacity: 0.85, marginTop: 2 }}>
                          {effectiveColors ? "⚡ Análisis provisorio" : "Seleccioná un plan y ejecutá el análisis"} ·
                          <strong style={{ marginLeft: 4 }}>{selectedPlan.career}</strong>
                        </div>
                      ) : (
                        <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>Seleccioná un plan de origen</div>
                      )}
                    </div>
                    {tablaEditMode && <span style={{ fontSize: 11, background: "rgba(255,193,7,0.3)", padding: "3px 10px", borderRadius: 10, fontWeight: 700 }}>✏️ Editando</span>}
                  </div>

                  <div style={{ padding: "7px 20px", background: C.bg, borderBottom: `1px solid ${C.borderLight}`, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                    {Object.entries(COLOR_MAP).map(([k, v]) => (
                      <div key={k} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: v.dot }} />
                        <span style={{ fontSize: 10, color: C.textSecondary }}>{v.label}</span>
                      </div>
                    ))}
                    {tablaEditMode && <span style={{ fontSize: 10, color: C.amber, marginLeft: "auto" }}>Click en materia para cambiar</span>}
                  </div>

                  <div style={{ padding: "12px 20px 20px" }}>
                    {Object.entries(UCALP_PLAN).map(([yearKey, yearData]) => (
                      <div key={yearKey} style={{ marginBottom: 18 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: C.redAccent, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>
                          {yearData.label}
                          {yearKey === "año2" && <span style={{ fontSize: 10, fontWeight: 400, color: C.textMuted, textTransform: "none", letterSpacing: 0, marginLeft: 8 }}>— Título intermedio al finalizar</span>}
                        </div>
                        {Object.entries(yearData.semestres).map(([semKey, semData]) => (
                          <div key={semKey} style={{ marginBottom: 10 }}>
                            <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.3px" }}>{semData.label}</div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 5 }}>
                              {semData.subjects.map(key => {
                                const prog = UCALP_PROGRAMS[key];
                                if (!prog) return null;
                                const colorKey = effectiveColors?.[key] || null;
                                const isEdited = tablaEditColors[key] != null;
                                const cStyle = colorKey ? (COLOR_MAP[colorKey] || COLOR_MAP.SKIP) : null;
                                const isClickable = tablaEditMode && effectiveColors;
                                return (
                                  <div key={key}
                                    onClick={() => {
                                      if (!isClickable) { if (effectiveColors) setTablaEditMode(true); else setTargetSubject(key); setTab(effectiveColors ? "tabla" : "analyze"); return; }
                                      // Cycle through values
                                      const current = effectiveColors[key] || "SKIP";
                                      const idx = CYCLE.indexOf(current);
                                      const next = CYCLE[(idx + 1) % CYCLE.length];
                                      setTablaEditColors(prev => ({ ...prev, [key]: next }));
                                    }}
                                    title={isClickable ? `Click para cambiar: ${colorKey || "—"}` : `Ver análisis: ${prog.name}`}
                                    style={{
                                      padding: "7px 10px", borderRadius: 6,
                                      cursor: isClickable ? "pointer" : "pointer",
                                      border: `1.5px solid ${isEdited ? C.amber : (cStyle ? cStyle.border : C.borderLight)}`,
                                      background: cStyle ? cStyle.bg : C.surface,
                                      transition: "all 0.15s", display: "flex", alignItems: "center", gap: 7,
                                      outline: isEdited ? `2px solid ${C.amber}44` : "none",
                                      outlineOffset: 1
                                    }}>
                                    <div style={{
                                      width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                                      background: cStyle ? cStyle.dot : (selectedPlan ? "#BDBDBD" : C.borderLight),
                                      opacity: tablaBatchLoading ? 0.4 : 1
                                    }} />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div style={{ fontSize: 11, fontWeight: 600, color: cStyle ? cStyle.text : C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {prog.name}
                                        {isEdited && <span style={{ marginLeft: 4, fontSize: 9, color: C.amber }}>✏</span>}
                                      </div>
                                      <div style={{ fontSize: 9, color: C.textMuted }}>
                                        {prog.year.replace("° Año","°")} · {prog.credits}cr
                                        {cStyle && colorKey !== "SKIP" && <span style={{ marginLeft: 3, fontWeight: 700, color: cStyle.text }}>{cStyle.label}</span>}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: "8px 20px", borderTop: `1px solid ${C.borderLight}`, fontSize: 10, color: C.textMuted, background: C.bg, display: "flex", gap: 16, alignItems: "center" }}>
                    <span>⚡ Análisis provisorio por IA · Click en materia para análisis profundo (modo ver) o para editar (modo edición)</span>
                    {effectiveColors && !supabaseUrl && (
                      <span style={{ color: C.amber }}>Configurá Supabase para guardar permanentemente →</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ═══════ ANALYZE ═══════ */}
        {tab === "analyze" && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 24, color: C.text, marginBottom: 4, fontWeight: 700 }}>Nuevo análisis de equivalencia</h2>
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
                <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
                  {[{ id: "text", icon: "📝", label: "Pegar texto" }, { id: "file", icon: "📄", label: "Subir archivo" }, { id: "scrape", icon: "🌐", label: "Desde URL" }].map(m => (
                    <button key={m.id} onClick={() => setInputMode(m.id)} style={{
                      flex: 1, padding: "8px 6px", borderRadius: 6, border: `1.5px solid ${inputMode === m.id ? C.red : C.border}`,
                      background: inputMode === m.id ? C.redSoft : C.surface, color: inputMode === m.id ? C.redAccent : C.textSecondary,
                      cursor: "pointer", fontSize: 11, fontWeight: inputMode === m.id ? 600 : 400, transition: "all 0.15s"
                    }}>{m.icon} {m.label}</button>
                  ))}
                </div>

                {inputMode === "text" && (
                  <textarea placeholder={"Pegá acá el programa completo de la materia de origen.\n\nPodés copiar y pegar desde un PDF, Word, o página web.\n\nCuanto más detallado, más preciso el análisis."} value={originProgram} onChange={e => setOriginProgram(e.target.value)} style={{ ...inputStyle, minHeight: 180, resize: "vertical", lineHeight: 1.55 }} />
                )}

                {inputMode === "file" && (
                  <div style={{ padding: 20, borderRadius: 8, border: `2px dashed ${C.redBorder}`, background: C.redSoft, textAlign: "center" }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
                    <div style={{ fontSize: 13, color: C.textSecondary, marginBottom: 12 }}>Subí el programa en PDF, DOCX o TXT</div>
                    <input type="file" accept=".pdf,.docx,.doc,.txt" onChange={handleFileUpload} style={{ fontSize: 13 }} />
                    {fileProcessing && <div style={{ marginTop: 10, fontSize: 13, color: C.red, fontWeight: 600 }}>⚙️ Extrayendo texto de {fileName}...</div>}
                    {fileName && !fileProcessing && originProgram && (
                      <div style={{ marginTop: 10, fontSize: 12, color: C.green, fontWeight: 500 }}>✓ Texto extraído de {fileName} ({originProgram.length} caracteres). Podés revisarlo en la pestaña "Pegar texto".</div>
                    )}
                  </div>
                )}

                {inputMode === "scrape" && (
                  <div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input placeholder="https://www.econo.unlp.edu.ar/..." value={scrapeUrl} onChange={e => setScrapeUrl(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
                      <button onClick={handleScrape} disabled={scraping} style={{ ...btnPrimary, padding: "10px 16px", fontSize: 12, opacity: scraping ? 0.7 : 1, whiteSpace: "nowrap" }}>
                        {scraping ? "⚙️..." : "🌐 Buscar"}
                      </button>
                    </div>
                    <div style={{ fontSize: 11, color: C.textMuted, marginTop: 6 }}>URLs de UNLP Ingeniería y Económicas están precargadas. Para otras, pegá la URL del plan.</div>
                    {scrapedPlan && (
                      <div style={{ marginTop: 12, padding: 12, borderRadius: 8, background: scrapedPlan.preloaded ? C.greenSoft : C.blueSoft, border: `1px solid ${scrapedPlan.preloaded ? C.greenBorder : C.blueBorder}`, maxHeight: 250, overflow: "auto" }}>
                        {scrapedPlan.preloaded && <div style={{ fontSize: 11, color: C.green, fontWeight: 600, marginBottom: 6 }}>✅ Plan precargado</div>}
                        {scrapedPlan.redirectedUrl && (
                          <div style={{ fontSize: 11, color: C.green, marginBottom: 6 }}>🔄 Redirigido a: {scrapedPlan.redirectedUrl}</div>
                        )}
                        <div style={{ fontSize: 12, fontWeight: 600, color: C.blue, marginBottom: 6 }}>
                          {scrapedPlan.subjects.length > 0 ? `${scrapedPlan.subjects.length} materias encontradas` : "Contenido extraído"} ({scrapedPlan.rawText.length} caracteres)
                        </div>
                        {scrapedPlan.subjects.length > 0 && (
                          <div style={{ marginBottom: 8 }}>
                            {scrapedPlan.subjects.slice(0, 8).map((s, i) => (
                              <div key={i} style={{ fontSize: 11, color: C.text, padding: "2px 0" }}>• {s.name}</div>
                            ))}
                            {scrapedPlan.subjects.length > 8 && <div style={{ fontSize: 11, color: C.textMuted }}>... y {scrapedPlan.subjects.length - 8} más</div>}
                          </div>
                        )}
                        {scrapedPlan.pdfLinks?.length > 0 && (
                          <div style={{ marginBottom: 8, fontSize: 11, color: C.amber }}>📄 {scrapedPlan.pdfLinks.length} PDF(s) encontrados en la página</div>
                        )}
                        <button onClick={() => { setOriginProgram(scrapedPlan.rawText); setInputMode("text"); }} style={{ ...btnOutline, fontSize: 11, padding: "6px 12px", borderColor: C.blueBorder, color: C.blue }}>
                          📋 Usar como contenido
                        </button>
                        <button onClick={() => { const uni = originUniversity.includes("Otra") ? customUniversity : originUniversity; const car = originCareer.includes("Otra") ? customCareer : originCareer; savePlan(uni, car, scrapedPlan.subjects, scrapeUrl); }} style={{ ...btnOutline, fontSize: 11, padding: "6px 12px", marginLeft: 6, borderColor: C.greenBorder, color: C.green }}>
                          💾 Guardar plan
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {originProgram && <div style={{ marginTop: 6, fontSize: 11, color: C.green }}>✓ {originProgram.length} caracteres cargados</div>}
              </div>

              {/* Right */}
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <div style={cardStyle}>
                  <SectionTitle icon="🎯" color={C.red} label="Materia UCALP destino" />
                  <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 10, lineHeight: 1.5 }}>
                    <span style={{ background: C.greenSoft, color: C.green, padding: "1px 6px", borderRadius: 4, fontWeight: 700, marginRight: 4 }}>✓ PROGRAMA</span> análisis profundo ·
                    <span style={{ background: C.amberSoft, color: C.amber, padding: "1px 6px", borderRadius: 4, fontWeight: 700, margin: "0 4px" }}>PROVISIONAL</span> sujeto a revisión
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14, maxHeight: 480, overflow: "auto" }}>
                    {Object.entries(UCALP_PLAN).map(([yearKey, yearData]) => (
                      <div key={yearKey}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>{yearData.label}</div>
                        {Object.entries(yearData.semestres).map(([semKey, semData]) => (
                          <div key={semKey} style={{ marginBottom: 8 }}>
                            <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 4, paddingLeft: 4 }}>{semData.label}</div>
                            {semData.subjects.map(key => {
                              const prog = UCALP_PROGRAMS[key];
                              if (!prog) return null;
                              const isSelected = targetSubject === key;
                              return (
                                <button key={key} onClick={() => setTargetSubject(key)} style={{
                                  width: "100%", padding: "9px 12px", borderRadius: 7, cursor: "pointer",
                                  textAlign: "left", transition: "all 0.12s", fontSize: 12,
                                  border: `1.5px solid ${isSelected ? C.red : C.border}`,
                                  background: isSelected ? C.redSoft : C.surface,
                                  color: isSelected ? C.redAccent : C.text,
                                  marginBottom: 3, display: "flex", alignItems: "center", justifyContent: "space-between"
                                }}>
                                  <span style={{ fontWeight: isSelected ? 700 : 500 }}>{prog.name}</span>
                                  <span style={{
                                    fontSize: 9, padding: "2px 6px", borderRadius: 4, flexShrink: 0, marginLeft: 6,
                                    background: prog.hasProgram ? C.greenSoft : C.amberSoft,
                                    color: prog.hasProgram ? C.green : C.amber,
                                    fontWeight: 700, border: `1px solid ${prog.hasProgram ? C.greenBorder : C.amberBorder}`
                                  }}>
                                    {prog.hasProgram ? "✓ PROG." : "PROV."}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                  {targetSubject && UCALP_PROGRAMS[targetSubject] && (
                    <div style={{ marginTop: 10, padding: "8px 10px", borderRadius: 6, background: UCALP_PROGRAMS[targetSubject].hasProgram ? C.greenSoft : C.amberSoft, border: `1px solid ${UCALP_PROGRAMS[targetSubject].hasProgram ? C.greenBorder : C.amberBorder}`, fontSize: 11 }}>
                      <span style={{ fontWeight: 700, color: UCALP_PROGRAMS[targetSubject].hasProgram ? C.green : C.amber }}>
                        {UCALP_PROGRAMS[targetSubject].hasProgram ? "✓ Programa completo" : "⚠ Programa provisional"}
                      </span>
                      <span style={{ color: C.textSecondary, marginLeft: 6 }}>
                        {UCALP_PROGRAMS[targetSubject].year} · {UCALP_PROGRAMS[targetSubject].credits} créditos · {UCALP_PROGRAMS[targetSubject].totalHours} hs
                        {UCALP_PROGRAMS[targetSubject].hasProgram && ` · ${UCALP_PROGRAMS[targetSubject].units.length} unidades`}
                      </span>
                    </div>
                  )}
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
                    <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 20, color: C.text, margin: 0, fontWeight: 700 }}>Resultado del análisis</h3>
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

        {/* ═══════ PLANES ═══════ */}
        {tab === "plans" && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 24, color: C.text, marginBottom: 4, fontWeight: 700 }}>Planes de estudio</h2>
            <p style={{ color: C.textSecondary, fontSize: 14, marginBottom: 20 }}>Cargá planes por URL, texto pegado, PDF, HTML o Google Sheets. FI-UNLP (13 carreras) y varias UCALP están precargadas.</p>

            {/* UCALP quick load */}
            <div style={{ ...cardStyle, marginBottom: 16, padding: "14px 18px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.red, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.4px" }}>⚡ Carreras UCALP precargadas</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {Object.entries(UCALP_CAREERS_PRELOADED).map(([key, data]) => (
                  <button key={key} onClick={() => {
                    const existing = savedPlans.find(p => p.career === data.name && p.university.includes("UCALP"));
                    if (existing) { alert(`Ya guardado: ${data.name}`); return; }
                    savePlan("Universidad Católica de La Plata (UCALP)", data.name, data.subjects.map(s => ({ name: s, details: "" })), data.url);
                    alert(`✓ ${data.name} guardado (${data.subjects.length} materias)`);
                  }} style={{
                    padding: "7px 14px", borderRadius: 7, border: `1px solid ${C.redBorder}`,
                    background: C.redSoft, color: C.redAccent, cursor: "pointer", fontSize: 12, fontWeight: 600
                  }}>
                    + {data.name}
                  </button>
                ))}
              </div>
              <div style={{ fontSize: 11, color: C.textMuted, marginTop: 8 }}>
                Para otras carreras UCALP: scrapear desde <a href="https://www.ucalp.edu.ar/carrera/" target="_blank" rel="noopener" style={{ color: C.blue }}>ucalp.edu.ar/carrera/</a> o pegar el texto del plan abajo.
              </div>
            </div>

            <div style={cardStyle}>
              <SectionTitle icon="🌐" color={C.blue} label="Cargar plan de estudios" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div>
                  <Label>Universidad</Label>
                  <select value={originUniversity} onChange={e => setOriginUniversity(e.target.value)} style={selectStyle}>{COMMON_UNIVERSITIES.map(u => <option key={u} value={u}>{u}</option>)}</select>
                  {originUniversity.includes("Otra") && <input placeholder="Nombre..." value={customUniversity} onChange={e => setCustomUniversity(e.target.value)} style={{ ...inputStyle, marginTop: 6 }} />}
                </div>
                <div>
                  <Label>Carrera</Label>
                  <select value={originCareer} onChange={e => setOriginCareer(e.target.value)} style={selectStyle}>{COMMON_CAREERS.map(c => <option key={c} value={c}>{c}</option>)}</select>
                  {originCareer.includes("Otra") && <input placeholder="Nombre..." value={customCareer} onChange={e => setCustomCareer(e.target.value)} style={{ ...inputStyle, marginTop: 6 }} />}
                </div>
              </div>

              {/* Input mode tabs */}
              <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
                {[
                  { id: "url", icon: "🌐", label: "URL" },
                  { id: "paste", icon: "📋", label: "Pegar texto/HTML" },
                  { id: "pdf", icon: "📄", label: "Subir PDF/DOCX" },
                  { id: "sheets", icon: "📊", label: "Google Sheets" },
                ].map(m => (
                  <button key={m.id} onClick={() => { if (!window._planInputMode) window._planInputMode = "url"; window._planInputMode = m.id; setScrapedPlan(null); setScrapeUrl(""); document.getElementById("plan-input-mode-indicator")?.setAttribute("data-mode", m.id); document.querySelectorAll("[data-plan-mode]").forEach(el => { el.style.display = el.getAttribute("data-plan-mode") === m.id ? "" : "none"; }); }} style={{
                    padding: "7px 14px", borderRadius: 6, border: `1.5px solid ${C.border}`,
                    background: C.surface, color: C.textSecondary, cursor: "pointer", fontSize: 12, fontWeight: 500,
                  }} id={`plan-btn-${m.id}`}>{m.icon} {m.label}</button>
                ))}
              </div>

              {/* URL mode (shown by default) */}
              <div data-plan-mode="url" style={{ }}>
                <div style={{ display: "flex", gap: 8 }}>
                  <input placeholder="https://www.ucalp.edu.ar/carrera/..." value={scrapeUrl} onChange={e => setScrapeUrl(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleScrape()} style={{ ...inputStyle, flex: 1 }} />
                  <button onClick={handleScrape} disabled={scraping} style={{ ...btnPrimary, padding: "10px 20px", fontSize: 13, opacity: scraping ? 0.7 : 1, whiteSpace: "nowrap" }}>
                    {scraping ? "⚙️ Scrapeando..." : "🌐 Extraer plan"}
                  </button>
                </div>
                <div style={{ fontSize: 11, color: C.textMuted, marginTop: 6, lineHeight: 1.5 }}>
                  FI-UNLP (13 carreras), UCALP (5 carreras) y UNLP Económicas están precargadas. Para otras: pegá la URL o usá otro método.
                </div>
              </div>

              {/* Paste text/HTML mode */}
              <div data-plan-mode="paste" style={{ display: "none" }}>
                <div style={{ fontSize: 12, color: C.textSecondary, marginBottom: 8, lineHeight: 1.5 }}>
                  Pegá el <strong>HTML del plan</strong> (clic derecho → Inspeccionar → copiar la sección con las materias) o directamente el <strong>texto con una materia por línea</strong>.
                  El parser detecta automáticamente el formato.
                </div>
                <textarea
                  id="plan-paste-text"
                  placeholder={"Pegá aquí el HTML o texto del plan de estudios.\n\nEjemplo HTML:\n<ul><li>Matemática I (1° Cuatrimestre)</li><li>Física I...</li></ul>\n\nEjemplo texto:\nMatemática I\nFísica I\nQuímica General\n..."}
                  style={{ ...inputStyle, minHeight: 200, resize: "vertical", fontFamily: "monospace", fontSize: 11, lineHeight: 1.5 }}
                />
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <button onClick={() => {
                    const text = document.getElementById("plan-paste-text")?.value || "";
                    if (!text.trim()) return;
                    const parsed = parseTextPlan(text);
                    if (parsed.length === 0) { alert("No se detectaron materias. Verificá el formato."); return; }
                    setScrapedPlan({ subjects: parsed, rawText: text, pdfLinks: [], redirectedUrl: null, preloaded: false });
                  }} style={{ ...btnPrimary, padding: "9px 18px", fontSize: 13 }}>
                    🔍 Extraer materias
                  </button>
                  <button onClick={() => {
                    const text = document.getElementById("plan-paste-text")?.value || "";
                    if (!text.trim() || !apiKey) { if (!apiKey) setShowApiKeyModal(true); return; }
                    setAiExtracting(true);
                    aiExtractSubjects(text, apiKey, selectedModel)
                      .then(subjects => {
                        setScrapedPlan({ subjects: subjects.map(s => ({ name: s, details: "" })), rawText: text, pdfLinks: [], redirectedUrl: null, preloaded: false, aiParsed: true });
                      })
                      .catch(e => setError("IA: " + e.message))
                      .finally(() => setAiExtracting(false));
                  }} disabled={aiExtracting} style={{ ...btnOutline, fontSize: 12, padding: "9px 14px", borderColor: "rgba(139,92,246,0.3)", color: "#7C3AED" }}>
                    {aiExtracting ? "⚙️ Procesando..." : "🤖 Extraer con IA"}
                  </button>
                </div>
              </div>

              {/* PDF mode */}
              <div data-plan-mode="pdf" style={{ display: "none" }}>
                <div style={{ padding: 16, borderRadius: 8, border: `2px dashed ${C.redBorder}`, background: C.redSoft, textAlign: "center" }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>📄</div>
                  <div style={{ fontSize: 13, color: C.textSecondary, marginBottom: 10 }}>Subí el plan en PDF, DOCX o TXT</div>
                  <input type="file" accept=".pdf,.docx,.doc,.txt" onChange={async e => {
                    const file = e.target.files[0]; if (!file) return;
                    try {
                      const text = await extractTextFromFile(file);
                      const parsed = parseTextPlan(text);
                      setScrapedPlan({ subjects: parsed, rawText: text, pdfLinks: [], redirectedUrl: null, preloaded: false });
                    } catch(err) { setError(err.message); }
                  }} style={{ fontSize: 13 }} />
                </div>
              </div>

              {/* Sheets mode */}
              <div data-plan-mode="sheets" style={{ display: "none" }}>
                <div style={{ display: "flex", gap: 8 }}>
                  <input placeholder="https://docs.google.com/spreadsheets/d/..." value={sheetsUrl} onChange={e => setSheetsUrl(e.target.value)} style={{ ...inputStyle, flex: 1, fontSize: 12 }} />
                  <button onClick={handleSheetsImport} disabled={sheetsLoading} style={{ ...btnPrimary, padding: "10px 16px", fontSize: 12, whiteSpace: "nowrap", background: C.green, opacity: sheetsLoading ? 0.6 : 1 }}>
                    {sheetsLoading ? "⚙️..." : "📊 Importar"}
                  </button>
                </div>
                <div style={{ fontSize: 11, color: C.textMuted, marginTop: 6 }}>El Sheet debe estar compartido como "Cualquier persona con el enlace".</div>
                {sheetsData && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontSize: 12, color: C.green, fontWeight: 600, marginBottom: 6 }}>{sheetsData.length} filas importadas</div>
                    <button onClick={() => {
                      const subjects = sheetsData.slice(1).map(r => r[0]).filter(s => s && s.length > 2);
                      const uni = originUniversity.includes("Otra") ? customUniversity : originUniversity;
                      const car = originCareer.includes("Otra") ? customCareer : originCareer;
                      savePlan(uni, car, subjects.map(s => ({ name: s, details: "" })), sheetsUrl);
                      setSheetsData(null); setSheetsUrl("");
                    }} style={{ ...btnPrimary, padding: "8px 16px", fontSize: 12, background: C.green }}>
                      💾 Guardar materias (1era columna)
                    </button>
                  </div>
                )}
              </div>

              {/* Result display */}
              {scrapedPlan && (
                <div style={{ marginTop: 16, padding: 16, borderRadius: 10, background: scrapedPlan.preloaded ? C.greenSoft : C.blueSoft, border: `1px solid ${scrapedPlan.preloaded ? C.greenBorder : C.blueBorder}` }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: scrapedPlan.preloaded ? C.green : C.blue, marginBottom: 10 }}>
                    {scrapedPlan.preloaded ? `✅ Plan precargado${scrapedPlan.preloadedName ? ` — ${scrapedPlan.preloadedName}` : ""}` : `🔍 ${scrapedPlan.subjects.length} materias detectadas${scrapedPlan.aiParsed ? " (con IA)" : ""}`}
                  </div>
                  {scrapedPlan.subjects.length > 0 ? (
                    <div>
                      <div style={{ maxHeight: 260, overflow: "auto", display: "flex", flexDirection: "column", gap: 3, marginBottom: 12 }}>
                        {scrapedPlan.subjects.map((s, i) => (
                          <div key={i} style={{ padding: "5px 10px", borderRadius: 5, background: C.surface, border: `1px solid ${C.borderLight}`, fontSize: 12, color: C.text }}>
                            <span style={{ color: C.textMuted, marginRight: 8, fontSize: 10 }}>{i + 1}.</span>{s.name}
                          </div>
                        ))}
                      </div>
                      <button onClick={() => {
                        const uni = originUniversity.includes("Otra") ? customUniversity : originUniversity;
                        const car = originCareer.includes("Otra") ? customCareer : originCareer;
                        savePlan(uni, car, scrapedPlan.subjects, scrapeUrl || "");
                        setScrapedPlan(null); setScrapeUrl("");
                      }} style={{ ...btnPrimary, padding: "10px 20px", fontSize: 13 }}>
                        💾 Guardar este plan ({scrapedPlan.subjects.length} materias)
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: 13, color: C.textSecondary, marginBottom: 8 }}>No se detectaron materias automáticamente.</div>
                      {scrapedPlan.pdfLinks?.length > 0 && (
                        <div style={{ marginBottom: 10, fontSize: 12, color: C.amber }}>📄 {scrapedPlan.pdfLinks.length} PDF(s) encontrados — probá scrapeando el PDF directo.</div>
                      )}
                      {apiKey && scrapedPlan.rawText && (
                        <button onClick={() => {
                          setAiExtracting(true);
                          aiExtractSubjects(scrapedPlan.rawText, apiKey, selectedModel)
                            .then(subjects => setScrapedPlan({ ...scrapedPlan, subjects: subjects.map(s => ({ name: s, details: "" })), aiParsed: true }))
                            .catch(e => setError("IA: " + e.message))
                            .finally(() => setAiExtracting(false));
                        }} disabled={aiExtracting} style={{ ...btnOutline, fontSize: 12, padding: "8px 14px", borderColor: "rgba(139,92,246,0.3)", color: "#7C3AED" }}>
                          {aiExtracting ? "⚙️..." : "🤖 Extraer con IA"}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Saved Plans */}
            {savedPlans.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 18, color: C.text, marginBottom: 14, fontWeight: 700 }}>Planes guardados ({savedPlans.length})</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {savedPlans.map(plan => (
                    <details key={plan.id} style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, overflow: "hidden" }}>
                      <summary style={{ padding: "14px 18px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 14, fontWeight: 600, color: C.text, listStyle: "none" }}>
                        <div>
                          <div style={{ color: C.blue }}>{plan.university} — {plan.career}</div>
                          <div style={{ fontSize: 12, color: C.textMuted, fontWeight: 400, marginTop: 2 }}>
                            {plan.subjects?.length || 0} materias · {new Date(plan.date).toLocaleDateString("es-AR")}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <button onClick={(e) => { e.preventDefault(); deletePlan(plan.id); }} style={{ ...btnOutline, fontSize: 11, padding: "4px 10px", borderColor: C.redBorder, color: C.redAccent }}>🗑</button>
                          <span style={{ fontSize: 12, color: C.textMuted }}>▾</span>
                        </div>
                      </summary>
                      <div style={{ padding: "0 18px 18px" }}>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {(plan.subjects || []).map((s, i) => (
                            <div key={i} style={{ padding: "6px 12px", borderRadius: 6, background: C.bg, border: `1px solid ${C.borderLight}`, fontSize: 12, color: C.text }}>{s.name || s}</div>
                          ))}
                        </div>
                        {plan.url && <div style={{ marginTop: 10, fontSize: 11, color: C.textMuted }}>Fuente: <a href={plan.url} target="_blank" rel="noopener" style={{ color: C.blue }}>{plan.url}</a></div>}
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════ REPORTE DE ALUMNO ═══════ */}
        {tab === "reporte" && (() => {
          const studentAnalyses = analyses.filter(a =>
            rStudentName && rStudentUni && rStudentCareer &&
            a.originUniversity === rStudentUni &&
            a.originCareer === rStudentCareer
          );

          const printReport = () => window.print();

          // Group analyses by UCALP subject key for quick lookup
          const bySubject = {};
          analyses.forEach(a => { if (!bySubject[a.targetSubjectKey]) bySubject[a.targetSubjectKey] = []; bySubject[a.targetSubjectKey].push(a); });

          const CLASI_LABEL = { TOTAL: "Equivalencia Total", PARCIAL: "Equivalencia Parcial", SIN_EQUIVALENCIA: "Sin Equivalencia", NO_EVALUABLE: "No Evaluable" };
          const CLASI_COLOR = { TOTAL: C.green, PARCIAL: C.amber, SIN_EQUIVALENCIA: C.redAccent, NO_EVALUABLE: C.textMuted };
          const CLASI_BG    = { TOTAL: C.greenSoft, PARCIAL: C.amberSoft, SIN_EQUIVALENCIA: C.dangerSoft, NO_EVALUABLE: C.bg };

          return (
            <div style={{ animation: "fadeIn 0.3s ease" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22, flexWrap: "wrap", gap: 12 }}>
                <div>
                  <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 24, color: C.text, margin: 0, fontWeight: 700 }}>📄 Reporte de Equivalencias</h2>
                  <p style={{ color: C.textSecondary, fontSize: 13, marginTop: 4 }}>Generá el reporte oficial de equivalencias para un alumno ingresante.</p>
                </div>
                <button onClick={printReport} style={{ ...btnPrimary, padding: "9px 20px", fontSize: 13 }}>🖨 Imprimir / PDF</button>
              </div>

              {/* Student Form */}
              <div style={{ ...cardStyle, marginBottom: 20 }}>
                <SectionTitle icon="👤" color={C.red} label="Datos del alumno" />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 0.5fr", gap: 14 }}>
                  <div>
                    <Label>Nombre y apellido</Label>
                    <input placeholder="Ej: Juan Pérez García" value={rStudentName} onChange={e => setRStudentName(e.target.value)} style={inputStyle} />
                  </div>
                  <div>
                    <Label>DNI</Label>
                    <input placeholder="Ej: 38.123.456" value={rStudentDni} onChange={e => setRStudentDni(e.target.value)} style={inputStyle} />
                  </div>
                  <div>
                    <Label>Universidad de origen</Label>
                    <select value={rStudentUni} onChange={e => setRStudentUni(e.target.value)} style={selectStyle}>{COMMON_UNIVERSITIES.map(u => <option key={u} value={u}>{u}</option>)}</select>
                  </div>
                  <div>
                    <Label>Carrera de origen</Label>
                    <select value={rStudentCareer} onChange={e => setRStudentCareer(e.target.value)} style={selectStyle}>{COMMON_CAREERS.map(c => <option key={c} value={c}>{c}</option>)}</select>
                  </div>
                </div>
              </div>

              {/* Full plan table */}
              <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
                {/* Report header */}
                <div style={{ padding: "20px 24px", background: C.red, color: "#fff" }}>
                  <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 700 }}>
                    TABLA DE EQUIVALENCIAS — LIC. EN GOBERNANZA DE DATOS
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.85, marginTop: 4 }}>
                    Universidad Católica de La Plata · Facultad de Ciencias Exactas e Ingeniería
                    {rStudentName && ` · Alumno: ${rStudentName}`}
                    {rStudentDni && ` (DNI: ${rStudentDni})`}
                    {rStudentUni && ` · Origen: ${rStudentUni}`}
                    {rStudentCareer && ` — ${rStudentCareer}`}
                  </div>
                  <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>
                    Fecha: {new Date().toLocaleDateString("es-AR", { year: "numeric", month: "long", day: "numeric" })}
                  </div>
                </div>

                {/* Legend */}
                <div style={{ padding: "10px 24px", background: C.bg, borderBottom: `1px solid ${C.borderLight}`, display: "flex", gap: 16, flexWrap: "wrap" }}>
                  {[["TOTAL", "Equivalencia Total — materia eximida"], ["PARCIAL", "Equivalencia Parcial — examen complementario"], ["SIN_EQUIVALENCIA", "Sin Equivalencia — debe cursar"], ["NO_EVALUABLE", "No Evaluable / No analizada"]].map(([k, label]) => (
                    <div key={k} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 2, background: CLASI_COLOR[k], display: "inline-block" }} />
                      <span style={{ fontSize: 11, color: C.textSecondary }}>{label}</span>
                    </div>
                  ))}
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ fontSize: 10, padding: "1px 5px", borderRadius: 3, background: C.amberSoft, color: C.amber, fontWeight: 700, border: `1px solid ${C.amberBorder}` }}>PROV</span>
                    <span style={{ fontSize: 11, color: C.textSecondary }}>Análisis provisional</span>
                  </div>
                </div>

                {/* Plan table by year */}
                {Object.entries(UCALP_PLAN).map(([yearKey, yearData]) => (
                  <div key={yearKey}>
                    <div style={{ padding: "8px 24px", background: C.redSoft, borderBottom: `1px solid ${C.redBorder}`, borderTop: `1px solid ${C.redBorder}` }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: C.redAccent }}>{yearData.label}</span>
                      {yearKey === "año2" && <span style={{ fontSize: 11, color: C.textMuted, marginLeft: 12 }}>· Título intermedio al finalizar: Técnico/a Universitario/a en Gobernanza de Datos</span>}
                    </div>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ background: C.bg }}>
                          {["#", "Materia UCALP", "Año/Sem", "Créd.", "Materia de origen equivalente", "Resultado", "%", "Observaciones"].map((h, i) => (
                            <th key={i} style={{ padding: "7px 12px", fontSize: 10, fontWeight: 700, color: C.textMuted, textAlign: i >= 3 ? "center" : "left", letterSpacing: "0.3px", textTransform: "uppercase", borderBottom: `1px solid ${C.borderLight}` }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(yearData.semestres).flatMap(([semKey, semData]) =>
                          semData.subjects.map((key, rowIdx) => {
                            const prog = UCALP_PROGRAMS[key];
                            if (!prog) return null;
                            const matchingAnalyses = bySubject[key] || [];
                            const best = matchingAnalyses.sort((a, b) => (b.result.porcentaje_cobertura_global || 0) - (a.result.porcentaje_cobertura_global || 0))[0];
                            const clasi = best?.result?.clasificacion;
                            const pct   = best?.result?.porcentaje_cobertura_global;
                            const rowBg = clasi ? (CLASI_BG[clasi] || C.surface) : (rowIdx % 2 === 0 ? C.surface : C.bg);
                            return (
                              <tr key={key} style={{ background: rowBg }}>
                                <td style={{ padding: "8px 12px", fontSize: 11, color: C.textMuted, textAlign: "center" }}>{prog.cod}</td>
                                <td style={{ padding: "8px 12px", fontSize: 12, fontWeight: 500, color: C.text }}>
                                  {prog.name}
                                  {!prog.hasProgram && <span style={{ marginLeft: 6, fontSize: 9, padding: "1px 5px", borderRadius: 3, background: C.amberSoft, color: C.amber, fontWeight: 700, border: `1px solid ${C.amberBorder}` }}>PROV</span>}
                                </td>
                                <td style={{ padding: "8px 12px", fontSize: 11, color: C.textMuted, textAlign: "center" }}>{prog.year.replace("° Año","°")} · {semKey === "1S" ? "1°S" : semKey === "2S" ? "2°S" : "Anual"}</td>
                                <td style={{ padding: "8px 12px", fontSize: 11, color: C.textMuted, textAlign: "center" }}>{prog.credits}</td>
                                <td style={{ padding: "8px 12px", fontSize: 12, color: best ? C.text : C.textMuted, fontStyle: best ? "normal" : "italic" }}>
                                  {best ? best.originSubject : "—"}
                                </td>
                                <td style={{ padding: "8px 12px", textAlign: "center" }}>
                                  {clasi ? (
                                    <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 4, background: CLASI_COLOR[clasi] + "20", color: CLASI_COLOR[clasi], fontWeight: 700, whiteSpace: "nowrap" }}>
                                      {clasi === "TOTAL" ? "✓ Total" : clasi === "PARCIAL" ? "△ Parcial" : clasi === "SIN_EQUIVALENCIA" ? "✗ Sin Equiv." : "— N/E"}
                                    </span>
                                  ) : (
                                    <span style={{ fontSize: 11, color: C.textMuted }}>Pendiente</span>
                                  )}
                                </td>
                                <td style={{ padding: "8px 12px", fontSize: 11, textAlign: "center", fontWeight: pct != null ? 600 : 400, color: pct != null ? (pct >= 70 ? C.green : pct >= 40 ? C.amber : C.redAccent) : C.textMuted }}>
                                  {pct != null ? `${pct}%` : "—"}
                                </td>
                                <td style={{ padding: "8px 12px", fontSize: 11, color: C.textSecondary, maxWidth: 200 }}>
                                  {clasi === "PARCIAL" && best?.result?.unidades_a_rendir?.length > 0 && (
                                    <span>Rendir U{best.result.unidades_a_rendir.join(", U")}</span>
                                  )}
                                  {best?.isProvisional && <span style={{ color: C.amber }}> (provisional)</span>}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                ))}

                {/* Summary footer */}
                <div style={{ padding: "16px 24px", background: C.bg, borderTop: `1px solid ${C.borderLight}` }}>
                  <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                    {["TOTAL", "PARCIAL", "SIN_EQUIVALENCIA"].map(k => {
                      const count = Object.values(bySubject).filter(arr => arr.some(a => a.result.clasificacion === k)).length;
                      return (
                        <div key={k} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Outfit', sans-serif", color: CLASI_COLOR[k] }}>{count}</span>
                          <span style={{ fontSize: 12, color: C.textSecondary }}>{CLASI_LABEL[k]}</span>
                        </div>
                      );
                    })}
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Outfit', sans-serif", color: C.textMuted }}>
                        {Object.keys(UCALP_PROGRAMS).length - Object.keys(bySubject).length}
                      </span>
                      <span style={{ fontSize: 12, color: C.textSecondary }}>Pendientes de análisis</span>
                    </div>
                  </div>
                  <div style={{ marginTop: 12, fontSize: 11, color: C.textMuted, borderTop: `1px dashed ${C.borderLight}`, paddingTop: 10 }}>
                    Análisis realizado con asistencia de inteligencia artificial. Los resultados provisionales están sujetos a revisión por el Director de Carrera.
                    Firmado: Dir. Francisco Fernández Ruiz — Lic. en Gobernanza de Datos — UCALP
                  </div>
                </div>
              </div>

              {/* Quick actions */}
              <div style={{ marginTop: 16, padding: 14, borderRadius: 10, background: C.blueSoft, border: `1px solid ${C.blueBorder}`, fontSize: 13, color: C.blue }}>
                💡 Para completar el reporte: andá a <b>🔍 Analizar</b>, cargá el programa de cada materia del alumno y ejecutá el análisis. Los resultados se agregan automáticamente a esta tabla.
              </div>
            </div>
          );
        })()}

        {/* ═══════ FI-UNLP EXPLORER ═══════ */}
        {tab === "fi_unlp" && (() => {
          const planData = FI_UNLP_PLANES[fiCarrera];
          const allSems = Object.entries(planData.semestres).sort((a, b) => Number(a[0]) - Number(b[0]));
          const TIPO_COLOR = { CB: C.blue, TB: C.amber, TA: C.red, CO: C.green };
          const TIPO_BG   = { CB: C.blueSoft, TB: C.amberSoft, TA: C.redSoft, CO: C.greenSoft };
          const TIPO_LABEL = { CB: "Cs. Básicas", TB: "Tec. Básicas", TA: "Tec. Aplicadas", CO: "Complementaria" };

          const filteredSems = allSems.map(([n, sem]) => ({
            n, label: sem.label,
            materias: sem.materias.filter(m => {
              const matchSem = fiSemestre === "all" || fiSemestre === n;
              const matchSearch = !fiSearch || m.nombre.toLowerCase().includes(fiSearch.toLowerCase()) || m.codigo.toLowerCase().includes(fiSearch.toLowerCase());
              return matchSem && matchSearch;
            })
          })).filter(s => s.materias.length > 0);

          const totalMaterias = Object.values(planData.semestres).reduce((a, s) => a + s.materias.length, 0);

          // Compare logic
          const compareData = fiShowCompare ? (() => {
            const pA = FI_UNLP_PLANES[fiCompareA];
            const pB = FI_UNLP_PLANES[fiCompareB];
            const normA = new Set(pA.flat.map(s => s.toLowerCase().trim()));
            const normB = new Set(pB.flat.map(s => s.toLowerCase().trim()));
            const shared = pA.flat.filter(s => normB.has(s.toLowerCase().trim()));
            const onlyA = pA.flat.filter(s => !normB.has(s.toLowerCase().trim()));
            const onlyB = pB.flat.filter(s => !normA.has(s.toLowerCase().trim()));
            return { shared, onlyA, onlyB, pA, pB };
          })() : null;

          return (
            <div style={{ animation: "fadeIn 0.3s ease" }}>
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
                <div>
                  <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 24, color: C.text, margin: 0, fontWeight: 700 }}>
                    🎓 Planes de Estudio — FI UNLP
                  </h2>
                  <p style={{ color: C.textSecondary, fontSize: 13, marginTop: 4 }}>
                    13 carreras · Plan 2018 · Fuente oficial: <a href="https://ing.unlp.edu.ar/grado/carreras/" target="_blank" rel="noopener" style={{ color: C.blue }}>ing.unlp.edu.ar</a>
                  </p>
                </div>
                <button onClick={() => setFiShowCompare(!fiShowCompare)} style={{
                  padding: "9px 18px", borderRadius: 8, border: `1.5px solid ${fiShowCompare ? C.red : C.border}`,
                  background: fiShowCompare ? C.redSoft : C.surface, color: fiShowCompare ? C.redAccent : C.textSecondary,
                  cursor: "pointer", fontSize: 13, fontWeight: 600, transition: "all 0.15s"
                }}>
                  ⇄ {fiShowCompare ? "Ocultar comparador" : "Comparar carreras"}
                </button>
              </div>

              {/* Compare Panel */}
              {fiShowCompare && compareData && (
                <div style={{ ...cardStyle, marginBottom: 20, borderLeft: `4px solid ${C.red}` }}>
                  <SectionTitle icon="⇄" color={C.red} label="Comparador de planes" />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 12, alignItems: "center", marginBottom: 16 }}>
                    <select value={fiCompareA} onChange={e => setFiCompareA(e.target.value)} style={selectStyle}>
                      {Object.entries(FI_UNLP_PLANES).map(([slug, d]) => <option key={slug} value={slug}>{d.nombre}</option>)}
                    </select>
                    <span style={{ fontSize: 20, color: C.textMuted, textAlign: "center" }}>⇄</span>
                    <select value={fiCompareB} onChange={e => setFiCompareB(e.target.value)} style={selectStyle}>
                      {Object.entries(FI_UNLP_PLANES).map(([slug, d]) => <option key={slug} value={slug}>{d.nombre}</option>)}
                    </select>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                    {/* Shared */}
                    <div style={{ padding: 12, borderRadius: 8, background: C.greenSoft, border: `1px solid ${C.greenBorder}` }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: C.green, marginBottom: 8 }}>
                        ✓ MATERIAS EN COMÚN ({compareData.shared.length})
                      </div>
                      <div style={{ maxHeight: 260, overflow: "auto", display: "flex", flexDirection: "column", gap: 3 }}>
                        {compareData.shared.map((m, i) => (
                          <div key={i} style={{ fontSize: 11, padding: "4px 8px", background: C.surface, borderRadius: 4, color: C.text }}>{m}</div>
                        ))}
                      </div>
                    </div>
                    {/* Only A */}
                    <div style={{ padding: 12, borderRadius: 8, background: C.blueSoft, border: `1px solid ${C.blueBorder}` }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: C.blue, marginBottom: 8 }}>
                        Solo {compareData.pA.nombre.replace("Ingeniería ", "Ing. ")} ({compareData.onlyA.length})
                      </div>
                      <div style={{ maxHeight: 260, overflow: "auto", display: "flex", flexDirection: "column", gap: 3 }}>
                        {compareData.onlyA.map((m, i) => (
                          <div key={i} style={{ fontSize: 11, padding: "4px 8px", background: C.surface, borderRadius: 4, color: C.text }}>{m}</div>
                        ))}
                      </div>
                    </div>
                    {/* Only B */}
                    <div style={{ padding: 12, borderRadius: 8, background: C.amberSoft, border: `1px solid ${C.amberBorder}` }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: C.amber, marginBottom: 8 }}>
                        Solo {compareData.pB.nombre.replace("Ingeniería ", "Ing. ")} ({compareData.onlyB.length})
                      </div>
                      <div style={{ maxHeight: 260, overflow: "auto", display: "flex", flexDirection: "column", gap: 3 }}>
                        {compareData.onlyB.map((m, i) => (
                          <div key={i} style={{ fontSize: 11, padding: "4px 8px", background: C.surface, borderRadius: 4, color: C.text }}>{m}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: 12, fontSize: 12, color: C.textMuted, display: "flex", gap: 20 }}>
                    <span>📊 {compareData.pA.flat.length} materias en {compareData.pA.nombre.replace("Ingeniería ", "Ing. ")}</span>
                    <span>📊 {compareData.pB.flat.length} materias en {compareData.pB.nombre.replace("Ingeniería ", "Ing. ")}</span>
                    <span style={{ color: C.green, fontWeight: 600 }}>✓ {compareData.shared.length} en común ({Math.round(compareData.shared.length / Math.min(compareData.pA.flat.length, compareData.pB.flat.length) * 100)}%)</span>
                  </div>
                </div>
              )}

              {/* Career Selector + Stats */}
              <div style={{ ...cardStyle, marginBottom: 16 }}>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, alignItems: "end" }}>
                  <div>
                    <Label>Carrera</Label>
                    <select value={fiCarrera} onChange={e => { setFiCarrera(e.target.value); setFiSemestre("all"); setFiSearch(""); }} style={{ ...selectStyle, fontSize: 14, fontWeight: 600 }}>
                      {Object.entries(FI_UNLP_PLANES).map(([slug, d]) => (
                        <option key={slug} value={slug}>{d.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Buscar materia</Label>
                    <input placeholder="Filtrar por nombre o código..." value={fiSearch} onChange={e => setFiSearch(e.target.value)} style={{ ...inputStyle, fontSize: 13 }} />
                  </div>
                </div>
                {/* Career metadata chips */}
                <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
                  {[
                    { label: `Título: ${planData.titulo}`, color: C.red },
                    { label: `Plan ${planData.plan}`, color: C.blue },
                    { label: `Código ${planData.codigo}`, color: C.textMuted },
                    { label: `${planData.total_hs} hs totales`, color: C.green },
                    { label: `${totalMaterias} materias`, color: C.amber },
                    planData.acreditacion && { label: `Acred. ${planData.acreditacion}`, color: C.green },
                  ].filter(Boolean).map((chip, i) => (
                    <span key={i} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 20, background: chip.color + "14", color: chip.color, fontWeight: 600, border: `1px solid ${chip.color}25` }}>
                      {chip.label}
                    </span>
                  ))}
                  <a href={`https://www1.ing.unlp.edu.ar/sitio/academica/asignaturas/plan.php?carrera=${fiCarrera}`} target="_blank" rel="noopener"
                    style={{ fontSize: 11, padding: "4px 10px", borderRadius: 20, background: C.blueSoft, color: C.blue, fontWeight: 600, border: `1px solid ${C.blueBorder}`, textDecoration: "none" }}>
                    🔗 Ver plan oficial
                  </a>
                </div>
              </div>

              {/* Semestre pills */}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
                <button onClick={() => setFiSemestre("all")} style={{
                  padding: "6px 14px", borderRadius: 20, border: `1.5px solid ${fiSemestre === "all" ? C.red : C.border}`,
                  background: fiSemestre === "all" ? C.redSoft : C.surface, color: fiSemestre === "all" ? C.redAccent : C.textSecondary,
                  cursor: "pointer", fontSize: 12, fontWeight: 600, transition: "all 0.12s"
                }}>Todos</button>
                {allSems.map(([n, sem]) => (
                  <button key={n} onClick={() => setFiSemestre(n)} style={{
                    padding: "6px 14px", borderRadius: 20, border: `1.5px solid ${fiSemestre === n ? C.red : C.border}`,
                    background: fiSemestre === n ? C.redSoft : C.surface, color: fiSemestre === n ? C.redAccent : C.textSecondary,
                    cursor: "pointer", fontSize: 12, fontWeight: 600, transition: "all 0.12s"
                  }}>{n === "0" ? "Niv." : `${n}º S`}</button>
                ))}
              </div>

              {/* Materias table */}
              {filteredSems.length === 0 ? (
                <div style={{ padding: 40, textAlign: "center", color: C.textMuted }}>No se encontraron materias.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {filteredSems.map(({ n, label, materias }) => (
                    <div key={n} style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
                      <div style={{ padding: "10px 16px", background: n === "0" ? "#5C3D9910" : C.redSoft, borderBottom: `1px solid ${n === "0" ? "#5C3D9920" : C.redBorder}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: n === "0" ? "#5C3D99" : C.redAccent }}>{label}</span>
                        <span style={{ fontSize: 11, color: C.textMuted }}>{materias.length} materias</span>
                      </div>
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                          <tr style={{ background: C.bg }}>
                            {["Código", "Asignatura", "Tipo", "Hes", "Het", "Hfp", ""].map((h, i) => (
                              <th key={i} style={{ padding: "7px 12px", fontSize: 10, fontWeight: 700, color: C.textMuted, textAlign: i >= 3 ? "center" : "left", letterSpacing: "0.3px", textTransform: "uppercase", borderBottom: `1px solid ${C.borderLight}` }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {materias.map((m, i) => (
                            <tr key={i} style={{ background: i % 2 === 0 ? C.surface : C.bg, transition: "background 0.1s" }}>
                              <td style={{ padding: "8px 12px", fontSize: 11, color: C.textMuted, fontFamily: "monospace", whiteSpace: "nowrap" }}>{m.codigo}</td>
                              <td style={{ padding: "8px 12px", fontSize: 13, color: C.text, fontWeight: 500 }}>{m.nombre}</td>
                              <td style={{ padding: "8px 12px" }}>
                                {m.tipo && (
                                  <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 4, background: (TIPO_BG[m.tipo] || C.bg), color: (TIPO_COLOR[m.tipo] || C.textMuted), fontWeight: 700 }}>
                                    {m.tipo}
                                  </span>
                                )}
                              </td>
                              {[m.hes, m.het, m.hfp].map((v, j) => (
                                <td key={j} style={{ padding: "8px 12px", fontSize: 12, color: C.textSecondary, textAlign: "center" }}>{v ?? ""}</td>
                              ))}
                              <td style={{ padding: "8px 12px", textAlign: "right" }}>
                                <button onClick={() => {
                                  setOriginSubject(m.nombre);
                                  setOriginProgram(`Materia: ${m.nombre}\nCódigo: ${m.codigo}\nCarrera: ${planData.nombre} (UNLP Ingeniería)\nPlan: ${planData.plan}\nTipo: ${m.tipo} — ${TIPO_LABEL[m.tipo] || ""}\nHoras semanales: ${m.hes ?? "—"} | Horas totales: ${m.het ?? "—"} | Horas formación práctica: ${m.hfp ?? "—"}`);
                                  setOriginUniversity("Universidad Nacional de La Plata (UNLP)");
                                  setOriginCareer(planData.nombre);
                                  setInputMode("text");
                                  setTab("analyze");
                                }} style={{ fontSize: 10, padding: "4px 10px", borderRadius: 5, border: `1px solid ${C.redBorder}`, background: C.redSoft, color: C.redAccent, cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap" }}>
                                  🔍 Analizar
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              )}

              {/* Legend */}
              <div style={{ marginTop: 16, display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
                {Object.entries(TIPO_LABEL).map(([tipo, label]) => (
                  <div key={tipo} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 4, background: TIPO_BG[tipo], color: TIPO_COLOR[tipo], fontWeight: 700 }}>{tipo}</span>
                    <span style={{ fontSize: 11, color: C.textMuted }}>{label}</span>
                  </div>
                ))}
                <span style={{ fontSize: 11, color: C.textMuted, marginLeft: 8 }}>· Hes = hs/semana · Het = hs totales · Hfp = hs formación práctica</span>
              </div>
            </div>
          );
        })()}

        {/* ═══════ PROGRAMS ═══════ */}
        {tab === "programs" && (
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
                          return (
                            <details key={key} style={{ background: C.surface, borderRadius: 10, border: `1px solid ${prog.hasProgram ? C.border : C.amberBorder}`, overflow: "hidden" }}>
                              <summary style={{ padding: "12px 16px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", listStyle: "none" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                  <span style={{ fontSize: 11, padding: "2px 6px", borderRadius: 4, background: prog.hasProgram ? C.greenSoft : C.amberSoft, color: prog.hasProgram ? C.green : C.amber, fontWeight: 700 }}>
                                    {prog.cod}
                                  </span>
                                  <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{prog.name}</span>
                                  {!prog.hasProgram && <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 4, background: C.amberSoft, color: C.amber, fontWeight: 700, border: `1px solid ${C.amberBorder}` }}>PROVISIONAL</span>}
                                </div>
                                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                                  <span style={{ fontSize: 11, color: C.textMuted }}>{prog.credits} créd · {prog.totalHours} hs</span>
                                  {prog.professor && <span style={{ fontSize: 11, color: C.textMuted }}>Prof. {prog.professor}</span>}
                                  <span style={{ fontSize: 12, color: C.textMuted }}>▾</span>
                                </div>
                              </summary>
                              <div style={{ padding: "0 16px 16px", borderTop: `1px solid ${C.borderLight}` }}>
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
                                    <button onClick={() => { setTargetSubject(key); setTab("analyze"); }}
                                      style={{ ...btnPrimary, marginTop: 10, padding: "8px 16px", fontSize: 12 }}>
                                      🔍 Analizar equivalencias para esta materia
                                    </button>
                                  </div>
                                )}
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
        )}

        {/* ═══════ SETTINGS ═══════ */}
        {tab === "settings" && (
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
        )}
      </main>
      </div> {/* end flex body */}

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
    )}  {/* end !needsLogin */}
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