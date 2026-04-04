# デプロイ詳細ガイド

本アプリケーションを Vercel, Supabase, GCP を用いてデプロイするための詳細な手順書ですわ。

## 1. Supabase の詳細設定

Supabase は認証（Auth）とデータベース（PostgreSQL）の両方の役割を担います。

### A. データベース接続（Drizzle 用）
1. Supabase ダッシュボードでプロジェクトを選択。
2. 左メニューの **「Project Settings」（歯車アイコン）** > **「Database」** を開きます。
3. **「Connection string」** セクションで **「Transaction」** モードを選択します。
4. 表示される接続文字列をコピーし、環境変数 `POSTGRES_URL` として控えます。
   - ※ `[PASSWORD]` の部分は、プロジェクト作成時に設定したデータベースパスワードに置き換えてください。

### B. Google 認証の有効化
1. 左メニューの **「Authentication」（人型アイコン）** > **「Providers」** を開きます。
2. **「Google」** を探し、スイッチを **「ON」** にします。
3. 画面下部に表示される **「Redirect URL」**（例: `https://[REF].supabase.co/auth/v1/callback`）をコピーして控えます。これは後ほど GCP 側の設定で使用します。
4. 後述する GCP の設定で発行される **「Client ID」** と **「Client Secret」** をここに入力して保存します。

---

## 2. Google Cloud Platform (GCP) の詳細設定

「特定の二人以外を寄せ付けない」ための最も重要な砦となる設定です。

### A. API の有効化 (※ここを最初に行ってください)
1. [Google Cloud Console](https://console.cloud.google.com/) でプロジェクトを作成または選択。
2. **「API とサービス」 > 「ライブラリ」** から `Google Calendar API` を検索し、**「有効にする」** をクリックします。
   - **重要:** これを最初に行わないと、後のスコープ設定で Google Calendar API の項目が出現いたしませんわ。

### B. OAuth 同意画面 (OAuth Consent Screen) の構成
1. **「API とサービス」 > 「OAuth 同意画面」** を選択。
2. **User Type** で **「外部 (External)」** を選択して作成。
3. **アプリ情報**（アプリ名、メールアドレス等）を入力。
4. **スコープ (Scopes)** の設定で **「スコープを追加または削除」** をクリックします。
   - フィルタ欄に以下の文字列を直接入力して検索し、チェックを入れて追加してください：
     - `https://www.googleapis.com/auth/calendar.events.readonly`
   - **注意:** リストに見つからない場合は、手順 2-A の API 有効化が完了しているか再度ご確認くださいませ。
5. **テストユーザー (Test users) の設定（最重要）**:
   - **「+ ADD USERS」** をクリックし、**利用を許可するお二人の Gmail アドレスを正確に入力**して追加します。
   - **公開ステータスが「テスト中 (Testing)」である限り、ここに登録されたユーザー以外は Google ログインを試みてもブロックされます。**

### C. RLS (Row Level Security) の設定
1. Supabase ダッシュボードの左メニューから **「SQL Editor」** を選択します。
2. **「New query」** を作成し、プロジェクト内の `supabase/migrations/0000_setup_rls.sql` の内容を貼り付けて **「Run」** をクリックします。
3. 次に、API のスキーマキャッシュを強制リロードするため、以下の SQL を実行します：
   ```sql
   NOTIFY pgrst, 'reload schema';
   ```
   - ※これを行わないと、API からテーブルが正しく認識されず 406 エラー（Not Acceptable）が返ることがございます。

## 3. 認証情報 (Credentials) の作成

1. **「API とサービス」 > 「認証情報」** を選択。
2. **「+ 認証情報を作成」 > 「OAuth クライアント ID」** を選択。
3. **アプリケーションの種類** を **「ウェブ アプリケーション」** に設定。
4. **承認済みのリダイレクト URI** に、先ほど Supabase の画面でコピーした **「Redirect URL」** を追加します。
5. 作成後に表示される **「クライアント ID」** と **「クライアント シークレット」** を Supabase の設定画面へ入力してください。

---

## 3. Vercel / GitHub Actions の最終設定

### A. Vercel 環境変数
Vercel のプロジェクト設定 > `Environment Variables` に以下を登録します。
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (旧: anon key)
- `SUPABASE_SECRET_KEY` (旧: service_role key)
- `POSTGRES_URL` (手順 1-A で取得)
- `GOOGLE_CLIENT_ID` (手順 2-C で取得)
- `GOOGLE_CLIENT_SECRET` (手順 2-C で取得)
- `ALLOWED_EMAILS` (許可する二人のメールアドレスをカンマ区切りで)
- `SYNC_SECRET_TOKEN` (GitHub Actions と共通の任意の文字列)

### B. GitHub Actions Secrets
GitHub リポジトリの `Settings` > `Secrets and variables` > `Actions` に以下を登録します。
- `APP_URL`: Vercel で取得したアプリの URL（例: `https://your-app.vercel.app`）
- `SYNC_SECRET_TOKEN`: Vercel 側に設定したものと同じ合言葉
