import { describe, it, expect, vi, beforeEach } from 'vitest'
import { isAllowedUser } from './auth-config'

describe('isAllowedUser', () => {
  beforeEach(() => {
    vi.stubEnv('ALLOWED_EMAILS', 'user1@example.com,user2@example.com')
  })

  it('ホワイトリストに含まれるメールアドレスを許可すること', () => {
    expect(isAllowedUser('user1@example.com')).toBe(true)
    expect(isAllowedUser('user2@example.com')).toBe(true)
  })

  it('ホワイトリストに含まれないメールアドレスを拒否すること', () => {
    expect(isAllowedUser('stranger@example.com')).toBe(false)
  })

  it('メールアドレスが未定義（undefined）の場合に拒否すること', () => {
    expect(isAllowedUser(undefined)).toBe(false)
  })

  it('環境変数が設定されていない場合に警告を出しつつ拒否すること', () => {
    vi.stubEnv('ALLOWED_EMAILS', '')
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(isAllowedUser('user1@example.com')).toBe(false)
    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })
})
