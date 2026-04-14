# Merged Calendar (フリカレ & Google カレンダー統合表示)

お二人のための共有カレンダーWebアプリケーションですわ。
Googleカレンダーとフリカレ（HTMLスクレイピング）の予定を一つの画面でマージして表示します。

## 主な機能
- **Googleカレンダー同期**: APIを使用して自身のカレンダー予定を取得します。
- **フリカレ同期**: Playwrightを用いてJavaScript実行後のHTMLから予定を抽出します。
- **共有表示**: お二人の予定を色分けして一つのマンスリーカレンダーに表示します。
- **自動同期**: GitHub Actionsにより毎日 0:00 (JST) に自動更新されます。
- **セキュア**: 指定したメールアドレス（ホワイトリスト）以外はログインできません。

## 外部サービスの設定

詳細は [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) をご覧くださいませ。
- **Supabase**: 認証、PostgreSQL、RLS。
- **Google Cloud Platform**: Google Calendar API 有効化、OAuth クライアントID発行。
- **GitHub Actions**: 同期ジョブの実行環境。

## 環境変数の設定 (Vercel)

Vercel の `Environment Variables` に以下の値を設定してくださいませ。

### Supabase & Auth
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase の Project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: Supabase の Publishable Key (旧 anon key)
- `SUPABASE_SECRET_KEY`: Supabase の Secret Key (旧 service_role key)
- `ALLOWED_EMAILS`: 許可するメールアドレス（カンマ区切り、例: `user1@gmail.com,user2@gmail.com`）

### Database
- `POSTGRES_URL`: Supabase の Connection string (Transaction モード推奨)

### Google Calendar API
- `GOOGLE_CLIENT_ID`: GCP で発行した OAuth 2.0 クライアント ID
- `GOOGLE_CLIENT_SECRET`: GCP で発行した OAuth 2.0 クライアント シークレット

### GitHub Sync Trigger (Vercel API -> GitHub Actions)
Vercel 画面から同期をキックするために必要です。
- `GITHUB_TOKEN`: GitHub の Personal Access Token (classic, `repo` & `workflow` スコープ必須)
- `GITHUB_REPO_OWNER`: GitHub ユーザー名
- `GITHUB_REPO_NAME`: リポジトリ名
- `SYNC_SECRET_TOKEN`: 同期APIを叩くための任意の合言葉 (GitHub Actions の `SYNC_SECRET_TOKEN` と同じ値)

---

## 開発者向け (Local Setup)

1. リポジトリをクローンします。
2. `.env.local.example` を `.env.local` にコピーし、値を設定します。
3. `npm install`
4. `npx playwright install chromium` (フリカレ同期のローカル実行に必要です)
5. `npm run dev` で起動します。
