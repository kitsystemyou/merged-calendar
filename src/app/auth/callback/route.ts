import { createClient, createAdminClient } from '@/lib/supabase/server'
import { isAllowedUser } from '@/lib/auth-config'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error: sessionError, data: { session } } = await supabase.auth.exchangeCodeForSession(code)
    
    if (sessionError) {
      console.error('Auth exchange error:', sessionError)
      return NextResponse.redirect(`${origin}/login?error=auth-failed`)
    }

    if (session?.user?.email) {
      // 1. ホワイトリストチェック
      if (!isAllowedUser(session.user.email)) {
        await supabase.auth.signOut()
        return NextResponse.redirect(`${origin}/login?error=unauthorized`)
      }

      // 2. プロフィール情報の初期化 (Admin Client を使用して RLS をバイパス)
      // Google の provider_refresh_token が取得できている場合は保存します
      const adminClient = await createAdminClient()
      const profileData: any = {
        id: session.user.id,
        email: session.user.email,
        is_google_sync_enabled: true,
      }

      if (session.provider_refresh_token) {
        profileData.google_refresh_token = session.provider_refresh_token
      }

      const { error: profileError } = await adminClient.from('profiles').upsert(profileData, { onConflict: 'id' })

      if (profileError) {
        console.error('Admin Profile initialization error:', profileError)
      }

      const forwardedHost = request.headers.get('x-forwarded-host')
      const targetOrigin = forwardedHost ? `https://${forwardedHost}` : origin
      return NextResponse.redirect(`${targetOrigin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth-failed`)
}
