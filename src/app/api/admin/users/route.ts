import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const { data, error } = await supabaseAdmin.auth.admin.listUsers()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const users = data.users.map(u => ({
    id: u.id,
    email: u.email,
    role: u.user_metadata?.role ?? 'admin',
    lang: u.user_metadata?.lang ?? 'cs',
    created_at: u.created_at,
    last_sign_in_at: u.last_sign_in_at,
  }))

  return NextResponse.json({ users })
}
