export async function GET() {
  const hasSupabaseUrl = Boolean(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL);
  const hasSupabaseKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const hasClerkPub = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
  const hasClerkSecret = Boolean(process.env.CLERK_SECRET_KEY);

  const missing = [];
  if (!hasSupabaseUrl) missing.push("SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL");
  if (!hasSupabaseKey) missing.push("SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (!hasClerkPub) missing.push("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY");
  if (!hasClerkSecret) missing.push("CLERK_SECRET_KEY");

  const configured = missing.length === 0;

  return new Response(
    JSON.stringify({
      ok: configured,
      service: "reparix",
      timestamp: new Date().toISOString(),
      environment: {
        configured,
        missing,
        hasSupabaseBucket: Boolean(process.env.SUPABASE_BUCKET),
      },
    }),
    {
      status: configured ? 200 : 503,
      headers: { "Content-Type": "application/json" },
    }
  );
}
