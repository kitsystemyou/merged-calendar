import { createClient } from '@/lib/supabase/server'
import { syncAllUsers } from '@/lib/sync/orchestrator'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 認証チェック (ユーザーログイン済み、またはGitHub Actions用のトークン)
  const authHeader = request.headers.get('authorization')
  const isSyncTokenValid = authHeader === `Bearer ${process.env.SYNC_SECRET_TOKEN}`

  if (!user && !isSyncTokenValid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await syncAllUsers()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Sync failed:', error)
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
}
