import * as cheerio from 'cheerio'
import { CalendarEvent } from '@/types/database.types'

/**
 * フリカレの共有URLから予定をスクレイピングします
 * 共有URLの例: https://fricare.com/share/xxxxxx
 */
export async function scrapeFricaEvents(sharedUrl: string, userId: string): Promise<Omit<CalendarEvent, 'id' | 'created_at'>[]> {
  try {
    const response = await fetch(sharedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch Frica: ${response.statusText}`)
    }

    const html = await response.text()
    const $ = cheerio.load(html)
    const events: Omit<CalendarEvent, 'id' | 'created_at'>[] = []

    // フリカレの典型的なHTML構造（カレンダーセル）を想定しますわ
    // 実際の実装では、公開されているフリカレのセレクタに合わせて調整が必要です
    $('.cal_cell, .calendar-day').each((_, dayCell) => {
      const dateStr = $(dayCell).attr('data-date') // 例: 2026-04-05
      if (!dateStr) return

      $(dayCell).find('.event_item, .event-text').each((_, eventItem) => {
        const titleText = $(eventItem).text().trim()
        if (!titleText) return

        // 時間の抽出を試みます (例: "10:00 会議")
        const timeMatch = titleText.match(/^(\d{1,2}:\d{2})\s*(?:-|~)?\s*(\d{1,2}:\d{2})?\s*(.*)$/)
        
        let startAt = new Date(dateStr)
        let endAt: Date | null = null
        let title = titleText
        let isAllDay = true

        if (timeMatch) {
          const startTime = timeMatch[1]
          const endTime = timeMatch[2]
          title = timeMatch[3] || titleText
          isAllDay = false

          const [startHour, startMin] = startTime.split(':').map(Number)
          startAt.setHours(startHour, startMin)

          if (endTime) {
            endAt = new Date(dateStr)
            const [endHour, endMin] = endTime.split(':').map(Number)
            endAt.setHours(endHour, endMin)
          }
        }

        events.push({
          user_id: userId,
          source: 'frica',
          title: title,
          start_at: startAt,
          end_at: endAt,
          is_all_day: isAllDay,
          external_id: `frica-${dateStr}-${title}`, // 簡易的な一意識別子
        })
      })
    })

    return events
  } catch (error) {
    console.error('Error scraping Frica events:', error)
    return []
  }
}
