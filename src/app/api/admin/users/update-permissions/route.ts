import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const { email, role, lang, permissions } = await req.json()

  // Oprávnění dávají smysl jen pro obyčejné adminy - superadmin vždy vidí vše
  const metadata: Record<string, unknown> = { role, lang: lang ?? 'cs' }
  if (role === 'admin' && Array.isArray(permissions)) {
    metadata.permissions = permissions
  }

  const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    data: metadata,
    redirectTo: 'https://www.taros-personal.cz/cs/auth/callback',
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}