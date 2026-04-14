import { chromium } from 'playwright-core'
import { CalendarEvent } from '@/types/database.types'

/**
 * Playwrightを使用して、JS実行後のフリカレHTMLから予定をスクレイピングします
 */
export async function scrapeFricaEvents(sharedUrl: string, userId: string): Promise<Omit<CalendarEvent, 'id' | 'created_at'>[]> {
  let browser;
  try {
    browser = await chromium.launch({ headless: true })
    const page = await browser.newPage()
    
    // ページへ移動
    await page.goto(sharedUrl, { waitUntil: 'networkidle' })
    
    // カレンダーのセルの出現を待機 (フリカレの構造に合わせます)
    await page.waitForSelector('.cal_cell, .calendar-day, .cal_event', { timeout: 15000 }).catch(() => {
      console.warn('Timed out waiting for calendar selectors. Attempting to parse anyway...')
    })

    // ブラウザ内でJSを実行してデータを抽出
    const extractedEvents = await page.evaluate(() => {
      const items: any[] = []
      
      // セレクタを網羅的に探しますわ
      document.querySelectorAll('.cal_cell, .calendar-day').forEach((dayCell: any) => {
        const dateStr = dayCell.getAttribute('data-date')
        if (!dateStr) return

        dayCell.querySelectorAll('.event_item, .event-text, .cal_event').forEach((eventItem: any) => {
          const text = eventItem.innerText.trim()
          if (!text) return
          items.push({ dateStr, text })
        })
      })
      
      return items
    })

    await browser.close()

    return extractedEvents.map((item: any) => {
      const { dateStr, text } = item
      const timeMatch = text.match(/^(\d{1,2}:\d{2})\s*(?:-|~)?\s*(\d{1,2}:\d{2})?\s*(.*)$/)
      
      let startAt = new Date(dateStr)
      let endAt: Date | null = null
      let title = text
      let isAllDay = true

      if (timeMatch) {
        const startTime = timeMatch[1]
        const endTime = timeMatch[2]
        title = timeMatch[3] || text
        isAllDay = false

        const [startHour, startMin] = startTime.split(':').map(Number)
        startAt.setHours(startHour, startMin)

        if (endTime) {
          endAt = new Date(dateStr)
          const [endHour, endMin] = endTime.split(':').map(Number)
          endAt.setHours(endHour, endMin)
        }
      }

      return {
        user_id: userId,
        source: 'frica',
        title: title,
        start_at: startAt.toISOString(),
        end_at: endAt ? endAt.toISOString() : null,
        is_all_day: isAllDay,
        external_id: `frica-${dateStr}-${title}`,
      }
    })

  } catch (error) {
    console.error('Error scraping Frica with Playwright:', error)
    if (browser) await browser.close()
    return []
  }
}
