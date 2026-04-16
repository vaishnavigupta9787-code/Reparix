import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

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

export async function DELETE(_, { params }) {
  const { userId } = await auth();
  if (!userId) return jsonResponse({ error: "Unauthorized." }, 401);

  const supabase = getClient();
  if (!supabase) return jsonResponse({ error: "Supabase server config missing." }, 500);

  const { error } = await supabase.from("warranties").delete().eq("id", params.id).eq("user_id", userId);
  if (error) return jsonResponse({ error: error.message }, 500);

  return jsonResponse({ ok: true });
}
