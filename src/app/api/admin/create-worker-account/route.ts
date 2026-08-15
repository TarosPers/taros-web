import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    // Ověření, že požadavek přišel od přihlášeného admina
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !userData?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { workerId, email, password } = body

    if (!workerId || !email || !password) {
      return NextResponse.json({ error: 'Chybí workerId, email nebo password' }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Heslo musí mít alespoň 6 znaků' }, { status: 400 })
    }

    // Vytvořit Auth uživatele s rolí 'worker'
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: 'worker' },
    })

    if (createError || !newUser?.user) {
      return NextResponse.json({ error: createError?.message ?? 'Nepodařilo se vytvořit účet' }, { status: 500 })
    }

    // Propojit s profilem pracovníka
    const { error: updateError } = await supabaseAdmin
      .from('shift_workers')
      .update({ auth_user_id: newUser.user.id, login_email: email })
      .eq('id', workerId)

    if (updateError) {
      // Účet se vytvořil, ale propojení selhalo - zkusíme ho smazat, ať nezůstane osiřelý
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)
      return NextResponse.json({ error: 'Účet vytvořen, ale nepodařilo se propojit s pracovníkem: ' + updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, userId: newUser.user.id })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Chyba při vytváření přístupu' }, { status: 500 })
  }
}