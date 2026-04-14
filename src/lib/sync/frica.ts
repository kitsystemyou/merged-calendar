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

    // ブラウザ内でJSを実行してデータを抽出
    const extractedEvents = await page.evaluate(() => {
      const items: any[] = []
      
      // ccexp クラスを持つ要素をすべて取得しますわ
      // IDの形式: ccexp-136520-2026-4-18
      console.log('Extracting events from DOM...', document.body.innerHTML) // デバッグ用にDOMの内容をログ出力しますわ
      document.querySelectorAll('.ccexp').forEach((eventItem: any) => {
        const text = eventItem.innerText.trim()
        if (!text) return // テキストがない場合はスキップしますわ

        const id = eventItem.id || ''
        const parts = id.split('-')
        
        // IDが期待通りの形式（ccexp-ユーザーID-年-月-日）か確認しますわ
        if (parts.length >= 5 && parts[0] === 'ccexp') {
          const year = parts[2]
          const month = parts[3]
          const day = parts[4]
          const dateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
          items.push({ dateStr, text })
        }
      })
      
      return items
    })

    await browser.close()

    return extractedEvents.map((item: any) => {
      const { dateStr, text } = item
      // 前方に時間がある場合 (例: "14:45〜 カービィカフェ")
      const timePrefixMatch = text.match(/^(\d{1,2}:\d{2})\s*(?:-|~|〜)\s*(\d{1,2}:\d{2})?\s*(.*)$/)
      // 後方に時間がある場合 (例: "カービィカフェ 14:45〜")
      const timeSuffixMatch = text.match(/^(.*?)\s*(\d{1,2}:\d{2})\s*(?:-|~|〜)\s*(\d{1,2}:\d{2})?$/)
      
      let startAt = new Date(dateStr)
      let endAt: Date | null = null
      let title = text
      let isAllDay = true

      if (timePrefixMatch) {
        const startTime = timePrefixMatch[1]
        const endTime = timePrefixMatch[2]
        title = timePrefixMatch[3] || text
        isAllDay = false
        const [startHour, startMin] = startTime.split(':').map(Number)
        startAt.setHours(startHour, startMin)
        if (endTime) {
          endAt = new Date(dateStr)
          const [endHour, endMin] = endTime.split(':').map(Number)
          endAt.setHours(endHour, endMin)
        }
      } else if (timeSuffixMatch) {
        const startTime = timeSuffixMatch[2]
        const endTime = timeSuffixMatch[3]
        title = timeSuffixMatch[1] || text
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
