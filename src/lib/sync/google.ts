import { CalendarEvent } from '@/types/database.types'

/**
 * Google Calendar APIから予定を取得するためのスケルトンです。
 * 実装は将来的に行いますわ。
 */
export async function fetchGoogleEvents(
  userId: string
): Promise<Omit<CalendarEvent, 'id' | 'created_at'>[]> {
  console.log(`Google sync skeleton for user: ${userId}`);
  // いったん空の配列を返しておきますわ
  return [];
}
