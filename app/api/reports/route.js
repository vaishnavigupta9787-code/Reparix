import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const getClient = () => {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
};

const jsonResponse = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const isFutureDate = (value) => {
  if (!value) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const input = new Date(value);
  if (Number.isNaN(input.getTime())) return false;
  return input > today;
};

export async function GET(request) {
  const supabase = getClient();
  if (!supabase) {
    return jsonResponse({ error: "Supabase server config missing." }, 500);
  }

  const url = new URL(request.url);
  const kind = url.searchParams.get("kind");
  const date = url.searchParams.get("date");
  const query = url.searchParams.get("q");
  const mine = url.searchParams.get("mine");

  let builder = supabase.from("reports").select("*").order("created_at", { ascending: false });

  if (kind && ["lost", "found"].includes(kind)) {
    builder = builder.eq("kind", kind);
  }
  if (date) {
    builder = builder.eq("report_date", date);
  }
  if (query) {
    const q = `%${query.toLowerCase()}%`;
    builder = builder.or(`name.ilike.${q},description.ilike.${q},location.ilike.${q}`);
  }
  if (mine === "true") {
    const { userId } = await auth();
    if (!userId) {
      return jsonResponse({ error: "Unauthorized." }, 401);
    }
    builder = builder.eq("user_id", userId);
  }

  const { data, error } = await builder;
  if (error) {
    return jsonResponse({ error: error.message }, 500);
  }

  return jsonResponse({ reports: data || [] });
}

export async function POST(request) {
  const { userId } = await auth();
  if (!userId) {
    return jsonResponse({ error: "Unauthorized." }, 401);
  }

  const supabase = getClient();
  if (!supabase) {
    return jsonResponse({ error: "Supabase server config missing." }, 500);
  }

  const body = await request.json();
  const payload = {
    kind: body.kind,
    name: body.name?.trim(),
    description: body.description?.trim(),
    location: body.location?.trim(),
    report_date: body.report_date,
    email: body.email?.trim(),
    hide_email: Boolean(body.hide_email),
    image_url: body.image_url || null,
    user_id: userId,
  };

  if (!payload.kind || !payload.name || !payload.description || !payload.location || !payload.report_date || !payload.email) {
    return jsonResponse({ error: "All fields are required." }, 400);
  }

  if (isFutureDate(payload.report_date)) {
    return jsonResponse({ error: "Report date cannot be in the future." }, 400);
  }

  const { error } = await supabase.from("reports").insert(payload);
  if (error) {
    return jsonResponse({ error: error.message }, 500);
  }

  return jsonResponse({ ok: true }, 201);
}
