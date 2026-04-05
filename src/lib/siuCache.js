/**
 * SIU Cache – Pre-carga universidades y carreras de Supabase al iniciar la app.
 * Guarda en localStorage con TTL de 24hs para que el autocomplete sea instantáneo.
 */

const CACHE_KEY = "siu-buscador-cache";
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 horas
const TABLE = "universidades_buscador";
const PAGE_SIZE = 1000;

// ── Helpers ──

function loadCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.ts > CACHE_TTL) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return parsed;
  } catch {
    localStorage.removeItem(CACHE_KEY);
    return null;
  }
}

function saveCache(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ...data, ts: Date.now() }));
  } catch (e) {
    console.warn("SIU cache: no se pudo guardar en localStorage", e);
  }
}

/**
 * Fetches all rows from the table using pagination (Supabase free tier limits to 1000 per request).
 * Returns array of { universidad, carrera } objects.
 */
async function fetchAllRows(supabase) {
  const allRows = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from(TABLE)
      .select("universidad, carrera")
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      console.error("SIU cache fetch error:", error);
      break;
    }

    if (data && data.length > 0) {
      allRows.push(...data);
      offset += PAGE_SIZE;
      hasMore = data.length === PAGE_SIZE;
    } else {
      hasMore = false;
    }
  }

  return allRows;
}

/**
 * Procesa los rows en estructuras optimizadas para búsqueda local.
 */
function processRows(rows) {
  const universidades = new Set();
  const carrerasByUni = {}; // { universidad: Set<carrera> }
  const allCarreras = new Set();

  for (const row of rows) {
    const uni = row.universidad?.trim();
    const car = row.carrera?.trim();
    if (uni && uni.length < 150) {
      universidades.add(uni);
      if (car && car.length < 150) {
        allCarreras.add(car);
        if (!carrerasByUni[uni]) carrerasByUni[uni] = new Set();
        carrerasByUni[uni].add(car);
      }
    }
  }

  // Convert Sets to sorted arrays for storage/use
  const uniList = [...universidades].sort();
  const carreraList = [...allCarreras].sort();
  const carrerasMap = {};
  for (const [uni, set] of Object.entries(carrerasByUni)) {
    carrerasMap[uni] = [...set].sort();
  }

  return { universidades: uniList, carreras: carreraList, carrerasMap, totalRows: rows.length };
}

// ── Singleton state ──

let _cache = null;
let _loading = false;
let _listeners = [];

function notify() {
  _listeners.forEach(fn => fn(_cache));
}

/**
 * Inicia la carga del caché SIU. Idempotente – se puede llamar muchas veces.
 * @param {Function} getSupabase – función que retorna el cliente Supabase
 */
export async function initSIUCache(getSupabase) {
  // Si ya está cargado en memoria, no hacer nada
  if (_cache) return _cache;

  // Intentar desde localStorage
  const stored = loadCache();
  if (stored && stored.universidades && stored.carreras) {
    _cache = stored;
    notify();
    return _cache;
  }

  // Si ya hay un fetch en progreso, esperar
  if (_loading) {
    return new Promise(resolve => {
      _listeners.push(resolve);
    });
  }

  _loading = true;

  try {
    const supabase = getSupabase();
    if (!supabase) {
      _loading = false;
      return null;
    }

    console.time("SIU cache: fetch completo");
    const rows = await fetchAllRows(supabase);
    console.timeEnd("SIU cache: fetch completo");
    console.log(`SIU cache: ${rows.length} registros cargados`);

    const processed = processRows(rows);
    _cache = processed;
    saveCache(processed);
    notify();
    return _cache;
  } catch (e) {
    console.error("SIU cache: error al cargar", e);
    return null;
  } finally {
    _loading = false;
    _listeners = [];
  }
}

/**
 * Devuelve el caché actual (puede ser null si aún no cargó).
 */
export function getSIUCache() {
  if (!_cache) {
    const stored = loadCache();
    if (stored && stored.universidades) {
      _cache = stored;
    }
  }
  return _cache;
}

/**
 * Filtra universidades localmente.
 */
export function searchUniversidades(query, limit = 30) {
  const cache = getSIUCache();
  if (!cache) return null; // null = cache not ready, fallback to Supabase
  const q = query.toLowerCase();
  return cache.universidades
    .filter(u => u.toLowerCase().includes(q))
    .slice(0, limit);
}

/**
 * Filtra carreras localmente, opcionalmente filtradas por universidad.
 */
export function searchCarreras(query, filterUni = null, limit = 30) {
  const cache = getSIUCache();
  if (!cache) return null;
  const q = query.toLowerCase();

  let pool;
  if (filterUni) {
    // Buscar carreras de universidades que matcheen el filtro
    const uniKey = Object.keys(cache.carrerasMap).find(
      u => u.toLowerCase() === filterUni.toLowerCase()
    );
    pool = uniKey ? cache.carrerasMap[uniKey] : [];
  } else {
    pool = cache.carreras;
  }

  return pool
    .filter(c => c.toLowerCase().includes(q))
    .slice(0, limit);
}

/**
 * Fuerza recargar el caché (por ejemplo si el usuario sabe que hay datos nuevos).
 */
export function invalidateSIUCache() {
  _cache = null;
  localStorage.removeItem(CACHE_KEY);
}