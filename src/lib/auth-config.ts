// 許可されたユーザーのメールアドレスリスト
// 環境変数 ALLOWED_EMAILS から取得します（カンマ区切りで指定してくださいませ）
// 例: ALLOWED_EMAILS=user1@example.com,user2@example.com
export const ALLOWED_EMAILS = process.env.ALLOWED_EMAILS
  ? process.env.ALLOWED_EMAILS.split(',').map((email) => email.trim())
  : []

export function isAllowedUser(email: string | undefined): boolean {
  if (!email) return false
  if (ALLOWED_EMAILS.length === 0) {
    console.warn('ALLOWED_EMAILS が設定されておりませんわ。誰もログインできませんのよ。')
    return false
  }
  return ALLOWED_EMAILS.includes(email)
}
