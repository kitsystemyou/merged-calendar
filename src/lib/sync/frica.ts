import * as cheerio from 'cheerio'
import { CalendarEvent } from '@/types/database.types'

/**
 * フリカレの共有URLから予定を抽出します
 */
export async function scrapeFricaEvents(url: string, userId: string): Promise<Omit<CalendarEvent, 'id' | 'created_at'>[]> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch Frica: ${response.status}`)
    }

    const html = await response.text()
    const $ = cheerio.load(html)
    const events: Omit<CalendarEvent, 'id' | 'created_at'>[] = []

    // フリカレのHTML構造（仮定）に基づき抽出を行います。
    // 実際の実装時には、共有URLのHTMLソースを確認してセレクタを調整いたしますわ。
    // 通常、月間カレンダーの各日付セルに予定が記載されています。
    
    // 例: .calendar-cell 内の .event-item を探す
    $('.calendar-cell').each((_, cell) => {
      const dateStr = $(cell).attr('data-date') // yyyy-mm-dd
      if (!dateStr) return

      $(cell).find('.event-item').each((_, item) => {
        const title = $(item).text().trim()
        if (!title) return

        events.push({
          user_id: userId,
          source: 'frica',
          title: title,
          start_at: new Date(dateStr).toISOString(),
          end_at: new Date(dateStr).toISOString(),
          is_all_day: true,
          external_id: `frica-${dateStr}-${title}`, // 簡易的な重複排除キー
        })
      })
    })

    // ※もしSPAなどでJavaScript実行が必要な場合は、GitHub ActionsでPuppeteerを動かす等の
    // アップグレードが必要になりますが、まずはCheerioで試みますわ。
    return events
  } catch (error) {
    console.error('Frica scraping error:', error)
    return []
  }
}
