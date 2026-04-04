import { createAdminClient } from '@/lib/supabase/server'
import { fetchGoogleEvents } from './google'
import { scrapeFricaEvents } from './frica'
import { CalendarEvent } from '@/types/database.types'

/**
 * すべての有効なユーザーの予定を同期します
 */
export async function syncAllUsers() {
  // 全ユーザーの情報を取得するため、Adminクライアント(Secret Key)を使用します
  const supabase = await createAdminClient()

  // 全ユーザーのプロフィールを取得
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('*')

  if (profileError || !profiles) {
    console.error('Failed to fetch profiles for sync:', profileError)
    return
  }

  for (const profile of profiles) {
    console.log(`Syncing for user: ${profile.email}`)
    let allNewEvents: Omit<CalendarEvent, 'id' | 'created_at'>[] = []

    // 1. Googleカレンダー同期
    if (profile.is_google_sync_enabled) {
      console.log('Google sync logic here...')
      // リフレッシュトークンを使用して fetchGoogleEvents を実行するロジックをここに
    }

    // 2. フリカレスクレイピング
    if (profile.frica_shared_url) {
      console.log('Frica scraping started...')
      const fricaEvents = await scrapeFricaEvents(profile.frica_shared_url, profile.id)
      allNewEvents.push(...fricaEvents)
    }

    // 3. データベースへの保存
    if (allNewEvents.length > 0) {
      // 既存の予定を削除して入れ替え
      await supabase.from('events').delete().eq('user_id', profile.id)
      const { error: upsertError } = await supabase.from('events').insert(allNewEvents)
      if (upsertError) console.error('Upsert failed:', upsertError)
    }
    
    // 更新日時をアップデート
    await supabase.from('profiles').update({ updated_at: new Date().toISOString() }).eq('id', profile.id)
  }
}
