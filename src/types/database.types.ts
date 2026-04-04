export type Profile = {
  id: string
  email: string
  is_google_sync_enabled: boolean
  frica_shared_url: string | null
  updated_at: string
}

export type CalendarEvent = {
  id: string
  user_id: string
  source: 'google' | 'frica'
  title: string
  start_at: string
  end_at: string | null
  is_all_day: boolean
  external_id: string | null
  created_at: string
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'updated_at'>
        Update: Partial<Omit<Profile, 'id'>>
      }
      events: {
        Row: CalendarEvent
        Insert: Omit<CalendarEvent, 'id' | 'created_at'>
        Update: Partial<Omit<CalendarEvent, 'id' | 'user_id' | 'created_at'>>
      }
    }
  }
}
