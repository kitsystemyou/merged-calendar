import { createClient } from '@/lib/supabase/server'
import { isAllowedUser } from '@/lib/auth-config'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in search params, use it as the redirection URL
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error, data: { session } } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && session?.user?.email) {
      // ホワイトリストチェック (アプリケーションレベルの認可)
      // Google Cloud Console の「テストユーザー」設定により、
      // 認証レベルでは既に制限されておりますが、念のためアプリ側でもチェックいたしますわ。
      if (!isAllowedUser(session.user.email)) {
        await supabase.auth.signOut()
        return NextResponse.redirect(`${origin}/login?error=unauthorized`)
      }

      // プロフィール情報の初期化/更新 (upsert)
      await supabase.from('profiles').upsert({
        id: session.user.id,
        email: session.user.email,
        is_google_sync_enabled: true,
      })

      const forwardedHost = request.headers.get('x-forwarded-host') // サーバーデプロイ時用
      const isLocalEnv = process.env.NODE_ENV === 'development'
      if (isLocalEnv) {
        // We can return to origin directly in local dev
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth-failed`)
}
