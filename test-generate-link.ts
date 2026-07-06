import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function test() {
  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'recovery',
    email: 'sop.30tubing@icloud.com',
    options: { redirectTo: 'http://localhost:3000/auth/callback?next=/settings' }
  })
  console.log("Error:", error)
  console.log("Data:", JSON.stringify(data, null, 2))
}
test()
