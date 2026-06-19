import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const SUPABASE_URL = "https://awetfafplorxlmdifkqd.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3ZXRmYWZwbG9yeGxtZGlma3FkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTE3Nzc3NCwiZXhwIjoyMDk0NzUzNzc0fQ.2Gttv5i7cJ97SfeBM9Wt5Dr9uT1evLqW7LXNUCXyAZo";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: authUsers, error: authErr } = await supabase.auth.admin.listUsers();
  console.log("Auth Users:", authUsers?.users?.map(u => ({ email: u.email, id: u.id })) || authErr);

  const { data: publicUsers, error: pubErr } = await supabase.from("users").select("id, email, auth_id, role, status");
  console.log("Public Users:", publicUsers || pubErr);
}

check();
