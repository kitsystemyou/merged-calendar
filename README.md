# Merged Calendar

お二人のスケジュール管理を、もっとシンプルに、もっと美しく。
「Googleカレンダー」と「フリカレ」の予定を一つのカレンダーに統合して表示する、プライベートな共有カレンダーアプリケーションです。

## 主な機能

- **カレンダー統合表示**: Googleカレンダーの予定（青）とフリカレの予定（ピンク）を一つの画面にマージして表示します。
- **ホワイトリスト制認証**: 事前に許可された2名のユーザーのみがログイン可能。強固なプライバシー保護を実現します。
- **柔軟な同期設定**: 自身のGoogleカレンダーを同期するかどうかを、ユーザーごとに個別に切り替え可能です。
- **自動同期 (JST 0:00)**: GitHub Actionsにより、毎日深夜に最新の予定を自動的にバックグラウンドで収集します。
- **手動同期**: 画面上の「同期」ボタンから、いつでも最新の状態へ更新可能です。

## 技術スタック

- **Frontend/Backend**: [Next.js (App Router)](https://nextjs.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/)
- **Database/Auth**: [Supabase](https://supabase.com/)
- **ORM/Migration**: [Drizzle ORM](https://orm.drizzle.team/)
- **Hosting**: [Vercel](https://vercel.com/)
- **Sync Batch**: [GitHub Actions](https://github.com/features/actions)

## 環境構築・セットアップ

### 1. 外部サービスの設定

#### Supabase
1. プロジェクトを作成します。
2. `Authentication` > `Providers` で `Google` を有効にします。
3. `Settings` > `API` から `Project URL` と `publishable key` を取得します。

#### Google Cloud Platform (GCP)
1. 新しいプロジェクトを作成し `Google Calendar API` を有効にします。
2. `OAuth 同意画面` を設定し、以下の通り構成します：
   - **User Type**: `外部` (External)
   - **アプリの公開ステータス**: `テスト中` (Testing) ※**ここが重要ですわ**
3. `テストユーザー` セクションに、**利用を許可する2名のメールアドレスを追加**します。
   - これにより、リストにないユーザーはGoogleの認証画面でブロックされますの。
4. 認証スコープに `https://www.googleapis.com/auth/calendar.readonly` を追加します。
5. `認証情報` > `OAuth 2.0 クライアント ID` を作成し、クライアントIDとシークレットを取得します。
6. Supabase の Google Auth 設定にこれらを登録します。

### 2. 環境変数の設定

`.env.local.example` を `.env.local` にコピーし、必要な値を設定してください。

```bash
cp .env.local.example .env.local
```

- `ALLOWED_EMAILS`: 許可する2名のメールアドレスをカンマ区切りで入力します。
- `POSTGRES_URL`: データベースの接続文字列。Supabaseの `Settings` > `Database` > `Connection string` (Transaction mode推奨) を使用します。
- `SYNC_SECRET_TOKEN`: 同期APIを叩くための任意の合言葉を設定してください。

### 3. インストールとデータベース同期

```bash
npm install
npm run db:push
```

### 4. 開発サーバーの起動

```bash
npm run dev
```

## テストの実行

```bash
npm test
```

## デプロイについて

Vercelにリポジトリを連携する際、以下の環境変数を設定してください。
ビルド時に自動的にデータベースのマイグレーション (`npm run db:push`) が実行されます。

GitHub Actionsでの自動同期を有効にするには、GitHubリポジトリの `Secrets` に `APP_URL` と `SYNC_SECRET_TOKEN` を設定してください。
