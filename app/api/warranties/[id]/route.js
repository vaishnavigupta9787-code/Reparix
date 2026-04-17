import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const getClient = () => {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
};

const jsonResponse = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const getUserIdSafe = async () => {
  try {
    const result = await auth();
    return result?.userId || null;
  } catch {
    return null;
  }
};

export async function DELETE(_, { params }) {
  const userId = await getUserIdSafe();
  if (!userId) return jsonResponse({ error: "Unauthorized." }, 401);

  const supabase = getClient();
  if (!supabase) return jsonResponse({ error: "Supabase config missing. Set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY." }, 500);

  const { error } = await supabase.from("warranties").delete().eq("id", params.id).eq("user_id", userId);
  if (error) return jsonResponse({ error: error.message }, 500);

  return jsonResponse({ ok: true });
}

