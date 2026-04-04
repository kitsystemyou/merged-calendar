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
    if (profile.is_google_sync_enabled && profile.google_refresh_token) {
      try {
        console.log('Google sync started...')
        const googleEvents = await fetchGoogleEvents(profile.google_refresh_token, profile.id)
        allNewEvents.push(...googleEvents)
        console.log(`Fetched ${googleEvents.length} events from Google.`)
      } catch (err) {
        console.error(`Google sync failed for user ${profile.id}:`, err)
      }
    }

    // 2. フリカレスクレイピング
    if (profile.frica_shared_url) {
      try {
        console.log('Frica scraping started...')
        const fricaEvents = await scrapeFricaEvents(profile.frica_shared_url, profile.id)
        allNewEvents.push(...fricaEvents)
        console.log(`Fetched ${fricaEvents.length} events from Frica.`)
      } catch (err) {
        console.error(`Frica scraping failed for user ${profile.id}:`, err)
      }
    }

    // 3. データベースへの保存
    if (allNewEvents.length > 0) {
      // 既存の予定を削除して入れ替え (全ソース分を一度に更新)
      await supabase.from('events').delete().eq('user_id', profile.id)
      const { error: upsertError } = await supabase.from('events').insert(allNewEvents)
      if (upsertError) {
        console.error('Upsert failed:', upsertError)
      } else {
        console.log(`Successfully synced ${allNewEvents.length} events total.`)
      }
    }
    
    // 更新日時と最終同期日時をアップデート
    await supabase.from('profiles').update({ 
      updated_at: new Date().toISOString(),
      last_sync_at: new Date().toISOString()
    }).eq('id', profile.id)
  }
}
