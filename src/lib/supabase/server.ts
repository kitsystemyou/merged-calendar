import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * 通常のユーザーセッション（RLSに従う）用クライアント
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
          }
        },
      },
    }
  )
}

/**
 * RLSをバイパスする管理用クライアント (Secret Keyを使用)
 * バッチ処理や同期処理など、全ユーザーのデータを扱う場合に使用します。
 */
export async function createAdminClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    {
      cookies: {
        getAll() { return [] },
        setAll() {},
      },
    }
  )
}
