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

本アプリケーションは、**Next.js (Frontend/API)** と **Worker (Sync Job)** の2つのプロセスで構成されています。ローカルで動作を確認するには、両方を起動する必要がありますわ。

1. **リポジトリの準備**
   ```bash
   git clone <repository-url>
   cd merged-calendar
   npm install
   ```

2. **環境変数の設定**
   `.env.local.example` を `.env.local` にコピーし、各項目を設定してください。
   ```bash
   cp .env.local.example .env.local
   ```
   ※ローカル実行時は `WORKER_URL=http://localhost:3001/sync` を設定してください。

3. **Playwrightのセットアップ**
   スクレイピングに必要なブラウザをインストールします。
   ```bash
   npx playwright install chromium --with-deps
   ```

4. **データベースのマイグレーション**
   ```bash
   npm run db:push
   ```

5. **アプリケーションの起動**
   2つのターミナルを開いて、それぞれ以下のコマンドを実行してください。

   **ターミナル 1 (Next.js アプリケーション)**
   ```bash
   npm run dev
   ```

   **ターミナル 2 (非同期ジョブ・ワーカー)**
   ```bash
   npm run worker
   ```

6. **動作確認**
   - [http://localhost:3000](http://localhost:3000) でカレンダー画面が開けます。
   - 画面上の「同期」ボタンを押すと、`localhost:3000/api/sync` を経由して `localhost:3001/sync` (Worker) がバックグラウンドで処理を開始します。
