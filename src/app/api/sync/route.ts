import { NextResponse } from 'next/server'

/**
 * 同期API
 * Vercel環境ではPlaywrightを実行できないため、GitHub Actionsをトリガーします。
 */
export async function POST(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  // 同期用の合言葉チェック
  if (token !== process.env.SYNC_SECRET_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN
  const REPO_OWNER = process.env.GITHUB_REPO_OWNER
  const REPO_NAME = process.env.GITHUB_REPO_NAME

  if (GITHUB_TOKEN && REPO_OWNER && REPO_NAME) {
    try {
      // GitHub Actions の workflow_dispatch をトリガー
      const response = await fetch(
        `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/workflows/sync.yml/dispatches`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${GITHUB_TOKEN}`,
            Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
          },
          body: JSON.stringify({
            ref: 'main',
          }),
        }
      )

      if (response.ok) {
        return NextResponse.json({ message: 'Sync triggered via GitHub Actions' })
      } else {
        const error = await response.text()
        console.error('Failed to trigger GitHub Actions:', error)
        return NextResponse.json({ error: 'Failed to trigger sync' }, { status: 500 })
      }
    } catch (err) {
      console.error('Error triggering GH Action:', err)
    }
  }

  // フォールバック: ローカル開発環境などで直接実行する場合
  // (ただし Playwright がインストールされている必要がありますわ)
  if (process.env.NODE_ENV === 'development') {
    const { syncAllUsers } = await import('@/lib/sync/orchestrator')
    await syncAllUsers()
    return NextResponse.json({ message: 'Sync completed locally' })
  }

  return NextResponse.json({ error: 'GitHub configuration missing' }, { status: 500 })
}
