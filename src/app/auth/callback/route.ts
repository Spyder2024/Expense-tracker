import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next") ?? "/";

  // Prevent open redirect: validate that next is a safe relative path
  // Disallows external hostnames, protocol-relative '//', authority '@', and backslashes
  const isSafeRelative =
    rawNext.startsWith("/") &&
    !rawNext.startsWith("//") &&
    !rawNext.includes("@") &&
    !rawNext.includes("\\");

  const next = isSafeRelative ? rawNext : "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return user to login page with error param if code exchange fails
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
