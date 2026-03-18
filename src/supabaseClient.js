import { createClient } from "@supabase/supabase-js";

// Lee primero las variables de entorno de Vite (producción),
// con fallback a localStorage (configuración manual en dev)
const getSupabaseConfig = () => {
  const url = import.meta.env.VITE_SUPABASE_URL || localStorage.getItem("eq-supabase-url") || "";
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY || localStorage.getItem("eq-supabase-key") || "";
  return { url, key };
};

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