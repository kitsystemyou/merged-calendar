import { google } from 'googleapis'
import { CalendarEvent } from '@/types/database.types'

/**
 * Google Calendar APIから予定を取得します
 */
export async function fetchGoogleEvents(
  accessToken: string,
  refreshToken: string,
  userId: string
): Promise<Omit<CalendarEvent, 'id' | 'created_at'>[]> {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  )

  auth.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  })

  const calendar = google.calendar({ version: 'v3', auth })
  const now = new Date()
  const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const oneYearLater = new Date(now.getFullYear(), now.getMonth() + 12, 1)

  try {
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: oneMonthAgo.toISOString(),
      timeMax: oneYearLater.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    })

    const items = response.data.items || []
    const events: Omit<CalendarEvent, 'id' | 'created_at'>[] = []

    for (const item of items) {
      if (!item.summary) continue

      const start = item.start?.dateTime || item.start?.date
      const end = item.end?.dateTime || item.end?.date

      if (!start) continue

      events.push({
        user_id: userId,
        source: 'google',
        title: item.summary,
        start_at: new Date(start).toISOString(),
        end_at: end ? new Date(end).toISOString() : null,
        is_all_day: !!item.start?.date,
        external_id: item.id || null,
      })
    }

    return events
  } catch (error) {
    console.error('Google Calendar fetching error:', error)
    return []
  }
}
