import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET || "warranty-docs";

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

const getUserIdSafe = async () => {
  try {
    const result = await auth();
    return result?.userId || null;
  } catch {
    return null;
  }
};

export async function POST(request) {
  const userId = await getUserIdSafe();
  if (!userId) {
    return jsonResponse({ error: "Unauthorized." }, 401);
  }

  const supabase = getClient();
  if (!supabase) {
    return jsonResponse({ error: "Supabase server config missing." }, 500);
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || typeof file === "string") {
    return jsonResponse({ error: "No file uploaded." }, 400);
  }

  const allowedTypes = ["application/pdf", "image/png", "image/jpeg", "image/webp", "image/jpg"];

  if (!allowedTypes.includes(file.type)) {
    return jsonResponse({ error: "Only PDF or image files are allowed." }, 400);
  }

  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return jsonResponse({ error: "File must be under 10MB." }, 400);
  }

  const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const filePath = `${userId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from(SUPABASE_BUCKET)
    .upload(filePath, file, { contentType: file.type, upsert: false });

  if (error) {
    return jsonResponse({ error: error.message }, 500);
  }

  const { data } = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(filePath);
  return jsonResponse({ url: data.publicUrl, mimeType: file.type });
}
