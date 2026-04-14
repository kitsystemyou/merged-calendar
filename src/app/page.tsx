'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CalendarEvent, Profile } from '@/types/database.types'
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  eachDayOfInterval,
  parseISO
} from 'date-fns'
import { ja } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronLeft, ChevronRight, RefreshCw, Settings } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function CalendarPage() {
  const supabase = createClient()
  const router = useRouter()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [mounted, setMounted] = useState(false)

  const fetchEvents = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    // お互いの予定を表示するため、自分と相手のIDで取得する必要があります。
    // 今回は単純に全件取得（ホワイトリストの2名分のみ）します。
    const { data, error } = await supabase
      .from('events')
      .select('*')

    if (data) setEvents(data)
    setLoading(false)
  }

  useEffect(() => {
    setMounted(true)
    fetchEvents()
  }, [])

  const handleSync = async () => {
    setSyncing(true)
    try {
      const response = await fetch('/api/sync', { method: 'POST' })
      if (response.ok) {
        toast.success('同期が開始いたしましたわ。')
        fetchEvents()
      } else {
        toast.error('同期に失敗してしまいましたわ。')
      }
    } catch (e) {
      toast.error('エラーが発生いたしました。')
    } finally {
      setSyncing(false)
    }
  }

  // カレンダー生成ロジック
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart)
  const endDate = endOfWeek(monthEnd)
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate })

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="sticky top-0 z-10 bg-white border-b px-4 py-3 flex items-center justify-between shadow-sm">
        <h1 className="text-xl font-bold text-gray-800">Merged Calendar</h1>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
            <RefreshCw className={`h-4 w-4 mr-1 ${syncing ? 'animate-spin' : ''}`} />
            同期
          </Button>
          <Link href="/settings">
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </header>

      {/* カレンダーコントロール */}
      <div className="flex items-center justify-between p-4 bg-white">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-semibold">
            {format(currentMonth, 'yyyy年 M月', { locale: ja })}
          </h2>
          <div className="flex border rounded-md">
            <Button variant="ghost" size="icon" onClick={prevMonth}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
        <Button variant="outline" onClick={() => setCurrentMonth(new Date())}>今日</Button>
      </div>

      {/* カレンダーグリッド */}
      <main className="flex-grow overflow-auto p-4">
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden min-w-[700px]">
          {/* 曜日ヘッダー */}
          <div className="grid grid-cols-7 border-b bg-gray-50">
            {['日', '月', '火', '水', '木', '金', '土'].map((day) => (
              <div key={day} className="py-2 text-center text-sm font-medium text-gray-500">
                {day}
              </div>
            ))}
          </div>

          {/* 日付セル */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, idx) => {
              const dayEvents = events.filter(e => isSameDay(parseISO(e.start_at), day))
              const isCurrentMonth = isSameMonth(day, monthStart)
              
              return (
                <div 
                  key={day.toISOString()} 
                  className={`min-h-[120px] border-b border-r p-1 flex flex-col ${
                    !isCurrentMonth ? 'bg-gray-50' : ''
                  }`}
                >
                  <div className={`text-right text-xs mb-1 font-medium ${
                    !isCurrentMonth 
                      ? 'text-gray-300' 
                      : (mounted && isSameDay(day, new Date())) 
                        ? 'text-blue-600 font-bold' 
                        : 'text-gray-700'
                  }`}>
                    {format(day, 'd')}
                  </div>
                  
                  <div className="space-y-1 flex-grow overflow-y-auto">
                    {dayEvents.map(event => (
                      <div 
                        key={event.id}
                        className={`px-1.5 py-0.5 rounded text-[10px] truncate leading-tight border ${
                          event.source === 'google' 
                            ? 'bg-blue-50 text-blue-700 border-blue-200' 
                            : 'bg-pink-50 text-pink-700 border-pink-200'
                        }`}
                        title={event.title}
                      >
                        {event.title}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}
