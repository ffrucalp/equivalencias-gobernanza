// ============ UCALP PLAN STRUCTURE (Plan 2025) ============

export const UCALP_PLAN = {
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
export const UCALP_ORDER = Object.values(UCALP_PLAN).flatMap(yr =>
  Object.values(yr.semestres).flatMap(s => s.subjects)
);

// ============ UCALP PROGRAMS DATA ============
export const UCALP_PROGRAMS = {
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

export const MODELS = [
  { id: "anthropic/claude-sonnet-4.6", label: "Claude Sonnet 4.6", icon: "🟣" },
  { id: "google/gemini-3-flash-preview", label: "Gemini 3 Flash", icon: "🔵" },
  { id: "arcee-ai/trinity-large-preview:free", label: "Trinity Large (gratis)", icon: "🟢" },
  { id: "openrouter/hunter-Alpha", label: "Hunter Alpha", icon: "🟠" },
];

export const COMMON_UNIVERSITIES = [
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

export const COMMON_CAREERS = [
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
