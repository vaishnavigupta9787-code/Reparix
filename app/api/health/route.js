const REQUIRED_ENV = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "CLERK_SECRET_KEY",
];

export async function GET() {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
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
