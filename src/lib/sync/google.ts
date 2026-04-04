import { google } from 'googleapis'
import { CalendarEvent } from '@/types/database.types'

/**
 * リフレッシュトークンを使用して Google カレンダーから予定を取得します
 */
export async function fetchGoogleEvents(refreshToken: string, userId: string): Promise<Omit<CalendarEvent, 'id' | 'created_at'>[]> {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    // リダイレクトURIは認証時には必要ですが、リフレッシュ時は不要ですわ
  )

  oauth2Client.setCredentials({
    refresh_token: refreshToken
  })

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

  try {
    const now = new Date()
    const oneMonthLater = new Date()
    oneMonthLater.setMonth(now.getMonth() + 1)

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: now.toISOString(),
      timeMax: oneMonthLater.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    })

    const items = response.data.items || []

    return items.map((item) => {
      const start = item.start?.dateTime || item.start?.date
      const end = item.end?.dateTime || item.end?.date
      const isAllDay = !!item.start?.date

      return {
        user_id: userId,
        source: 'google' as const,
        title: item.summary || '(No Title)',
        start_at: new Date(start!),
        end_at: end ? new Date(end) : null,
        is_all_day: isAllDay,
        external_id: item.id || null,
      }
    })
  } catch (error) {
    console.error('Error fetching Google events:', error)
    throw error
  }
}
