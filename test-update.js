import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function test() {
  const { data: before } = await supabase.from("users").select("id, role, role_id").eq("id", 2).single()
  console.log("Before:", before)

  const { data, error } = await supabase.from("users").update({ role_id: 2 }).eq("id", 2).select()
  console.log("Update Error:", error)
  console.log("Update Data:", data)

  const { data: after } = await supabase.from("users").select("id, role, role_id").eq("id", 2).single()
  console.log("After:", after)
}
test()
