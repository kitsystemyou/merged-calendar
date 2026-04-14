import dotenv from 'dotenv'
import path from 'path'

// Next.jsの環境変数を読み込みますわ
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
dotenv.config() // .env があればそれも読み込みますわ

import express from 'express'
import { syncAllUsers } from '../lib/sync/orchestrator'

const app = express()
const port = process.env.WORKER_PORT || 3001
const syncToken = process.env.SYNC_SECRET_TOKEN

let isSyncing = false

app.use(express.json())

app.post('/sync', async (req, res) => {
  const authHeader = req.headers.authorization
  console.log("start sync")
  // if (authHeader !== `Bearer ${syncToken}`) {
  //   return res.status(401).json({ error: 'Unauthorized' })
  // }
  console.log("🔴")

  if (isSyncing) {
    return res.status(429).json({ message: 'Sync is already in progress' })
  }

  // 非同期で実行を開始しますわ
  isSyncing = true
  console.log('--- Sync job started ---')

  // バックグラウンドで実行
  syncAllUsers().then(() => {
    console.log('--- Sync job finished successfully ---')
  }).catch((err) => {
    console.error('--- Sync job failed ---', err)
  }).finally(() => {
    isSyncing = false
  })

  // 即座に応答を返しますわ
  return res.status(202).json({ message: 'Sync started in background' })
})

app.get('/health', (req, res) => {
  res.json({ status: 'ok', isSyncing })
})

app.listen(port, () => {
  console.log(`Worker listening at http://localhost:${port}`)
})
