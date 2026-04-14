import { NextResponse } from 'next/server'

/**
 * 同期API
 * 実際の同期処理は非同期ジョブ(Worker)が行うため、ここではワーカーをキックするだけですわ。
 */
export async function POST(request: Request) {

  // 非同期ジョブ(Worker)にリクエストを投げて、即座に応答します。
  // デフォルトはローカル実行を想定し、Docker等では環境変数 WORKER_URL で上書きする運用ですわ。
  const WORKER_URL = process.env.WORKER_URL || 'http://localhost:3001/sync'

  try {
    // 待たずに実行をキック
    fetch(WORKER_URL, { 
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.SYNC_SECRET_TOKEN}` }
    }).catch(err => {
      console.error('Failed to kick worker:', err)
    })

    return NextResponse.json({ 
      message: 'Sync job kicked successfully',
      status: 'accepted'
    }, { status: 202 }) // 202 Accepted を返しますわ
  } catch (err) {
    console.error('Error kicking sync job:', err)
    return NextResponse.json({ error: 'Failed to kick worker' }, { status: 500 })
  }
}
