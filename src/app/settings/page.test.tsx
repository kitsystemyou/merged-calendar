import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import SettingsPage from './page'

// Next.js のモック
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

// Supabase クライアントのモック
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'test-user' } }, error: null })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ 
            data: { is_google_sync_enabled: true, frica_shared_url: 'https://frica.com/test' }, 
            error: null 
          })),
        })),
      })),
    })),
  }),
}))

// Toast のモック
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('設定画面のタイトルが正しく表示されること', async () => {
    render(<SettingsPage />)
    // 読み込み中が終わるのを待つ代わりに、要素が出現するのを非同期で確認
    const title = await screen.findByText('Settings')
    expect(title).toBeInTheDocument()
  })

  it('Googleカレンダー連携のスイッチが表示されること', async () => {
    render(<SettingsPage />)
    const switchLabel = await screen.findByText('Googleカレンダーの同期を有効にする')
    expect(switchLabel).toBeInTheDocument()
  })

  it('フリカレ共有URLの入力フィールドが表示されること', async () => {
    render(<SettingsPage />)
    const inputLabel = await screen.findByText('フリカレ共有URL')
    expect(inputLabel).toBeInTheDocument()
  })
})
