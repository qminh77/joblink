import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://awetfafplorxlmdifkqd.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3ZXRmYWZwbG9yeGxtZGlma3FkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNzc3NzQsImV4cCI6MjA5NDc1Mzc3NH0.afzzLb7-FWQQ6NbJgqAzWpd-u5sRpMMVzF9PGnzbO0o";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testLogin() {
  const email = "testuser_abc123@gmail.com";
  const password = "Password123!";
  
  console.log("Registering...");
  const { data: regData, error: regErr } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: "Test User",
        role: "member"
      }
    }
  });

  if (regErr) {
    console.error("Register Error:", regErr.message);
    if (regErr.message.includes("already registered")) {
      console.log("Already registered, proceeding to login...");
    } else {
      return;
    }
  }

  console.log("Logging in...");
  const { data: loginData, error: loginErr } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (loginErr) {
    console.error("Login Error:", loginErr.message);
    return;
  }

  console.log("Logged in. UID:", loginData.user.id);

  console.log("Querying public.users...");
  const { data: users, error: usersErr } = await supabase
    .from("users")
    .select("role, status")
    .eq("auth_id", loginData.user.id);

  console.log("Public Users query result:", users || usersErr);
}

testLogin();
