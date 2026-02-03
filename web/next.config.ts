import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

// Debug Vercel Env Vars
console.log("---------------------------------------------------");
console.log("📍 BUILD TIME ENVIRONMENT CHECK");
console.log("NEXT_PUBLIC_SUPABASE_URL defined:", !!process.env.NEXT_PUBLIC_SUPABASE_URL);
if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.log("NEXT_PUBLIC_SUPABASE_URL val:", process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 10) + "...");
} else {
  console.log("❌ NEXT_PUBLIC_SUPABASE_URL IS MISSING");
}
console.log("---------------------------------------------------");

export default nextConfig;
