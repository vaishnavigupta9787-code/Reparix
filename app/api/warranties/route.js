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

const getUserIdSafe = async () => {
  try {
    const result = await auth();
    return result?.userId || null;
  } catch {
    return null;
  }
};

const daysInMonth = (year, month) => {
  if (month === 2) {
    const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    return leap ? 29 : 28;
  }
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
};

const addMonths = (inputDate, months) => {
  const date = new Date(inputDate);
  if (Number.isNaN(date.getTime())) return null;
  const year = date.getUTCFullYear() + Math.floor((date.getUTCMonth() + months) / 12);
  const month = (date.getUTCMonth() + months) % 12;
  const day = Math.min(date.getUTCDate(), daysInMonth(year, month + 1));
  return new Date(Date.UTC(year, month, day)).toISOString().slice(0, 10);
};

const validatePayload = (payload) => {
  if (!payload.product_name || !payload.purchase_date || !payload.warranty_months) {
    return "Product name, purchase date, and warranty period are required.";
  }
  const months = Number(payload.warranty_months);
  if (!Number.isInteger(months) || months < 1 || months > 120) {
    return "Warranty months must be between 1 and 120.";
  }
  const purchase = new Date(payload.purchase_date);
  if (Number.isNaN(purchase.getTime())) {
    return "Invalid purchase date.";
  }
  return "";
};

export async function GET(request) {
  const supabase = getClient();
  if (!supabase) return jsonResponse({ error: "Supabase server config missing." }, 500);

  const url = new URL(request.url);
  const mine = url.searchParams.get("mine");

  let builder = supabase.from("warranties").select("*").order("expiry_date", { ascending: true });

  if (mine === "true") {
    const userId = await getUserIdSafe();
    if (!userId) return jsonResponse({ error: "Unauthorized." }, 401);
    builder = builder.eq("user_id", userId);
  }

  const { data, error } = await builder;
  if (error) return jsonResponse({ error: error.message }, 500);

  return jsonResponse({ warranties: data || [] });
}

export async function POST(request) {
  const userId = await getUserIdSafe();
  if (!userId) return jsonResponse({ error: "Unauthorized." }, 401);

  const supabase = getClient();
  if (!supabase) return jsonResponse({ error: "Supabase server config missing." }, 500);

  const body = await request.json();
  const payload = {
    product_name: body.product_name?.trim(),
    brand: body.brand?.trim() || null,
    purchase_date: body.purchase_date,
    warranty_months: Number(body.warranty_months),
    notes: body.notes?.trim() || null,
    invoice_url: body.invoice_url || null,
    user_id: userId,
  };

  const validationError = validatePayload(payload);
  if (validationError) return jsonResponse({ error: validationError }, 400);

  payload.expiry_date = addMonths(payload.purchase_date, payload.warranty_months);
  if (!payload.expiry_date) return jsonResponse({ error: "Unable to calculate expiry date." }, 400);

  const { error } = await supabase.from("warranties").insert(payload);
  if (error) return jsonResponse({ error: error.message }, 500);

  return jsonResponse({ ok: true }, 201);
}
