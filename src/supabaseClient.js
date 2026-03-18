import { createClient } from "@supabase/supabase-js";

// Lee las credenciales desde localStorage (configuradas en la app)
// Si están hardcodeadas en el entorno, usarlas; si no, cargarlas dinámicamente
const getSupabaseConfig = () => {
  const url = localStorage.getItem("eq-supabase-url") || "";
  const key = localStorage.getItem("eq-supabase-key") || "";
  return { url, key };
};

// Lazy client — se recrea cuando cambian las credenciales
let _client = null;
let _lastUrl = null;
let _lastKey = null;

export function getSupabaseClient() {
  const { url, key } = getSupabaseConfig();
  if (!url || !key) return null;
  if (_client && url === _lastUrl && key === _lastKey) return _client;
  _client = createClient(url, key);
  _lastUrl = url;
  _lastKey = key;
  return _client;
}

export function resetSupabaseClient() {
  _client = null;
  _lastUrl = null;
  _lastKey = null;
}
