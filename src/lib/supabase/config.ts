/**
 * Helper utility to validate and extract Supabase environment variables safely.
 * Prevents network timeouts and server crashes when credentials are dummy placeholders.
 */

export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || "";

  // Check if credentials are placeholders or invalid
  const isPlaceholder =
    !url ||
    !key ||
    url.includes("xxxmdaazslzgefwydlpg") ||
    key.includes("sb_publishable_m421-D7S-il68iR3TCMO9w") ||
    !url.startsWith("http");

  return {
    url: isPlaceholder ? "https://placeholder.supabase.co" : url,
    key: isPlaceholder ? "placeholder-key" : key,
    isConfigured: !isPlaceholder,
  };
}
