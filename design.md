# 画面・API・データベース設計書

## 1. 画面設計

### 1.1. ログイン画面 (`/login`)
- **目的:** 特定ユーザーのみをシステムに招き入れる。
- **UI:** シンプルなロゴと「Googleでログイン」ボタン。
- **認可:** ログイン後、サーバーサイドで事前定義されたホワイトリストと照合。

### 1.2. メインカレンダー画面 (`/`)
- **目的:** 統合された予定の閲覧。
- **UI:**
  - フルサイズカレンダー（月間/週間切り替え）。
  - 予定のソース（Google/フリカレ）に応じた色分け表示。
  - 「手動同期」ボタン、年月ナビゲーション。
  - 「設定」ページへのリンク。

### 1.3. 設定画面 (`/settings`)
- **目的:** 連携設定の変更。
- **UI:**
  - Googleカレンダー同期のON/OFF切り替え（トグル）。
  - フリカレ共有URLの入力フォーム。

## 2. API設計 (Next.js Route Handlers)

### 2.1. 予定取得 API
- `GET /api/events`
  - 戻り値: マージされた予定データのJSON配列。

### 2.2. 設定管理 API
- `GET /api/settings`
  - 戻り値: 現在の同期設定およびフリカレURL。
- `PATCH /api/settings`
  - 引数: `{ is_google_sync_enabled?: boolean, frica_shared_url?: string }`
  - 動作: 設定の更新。

### 2.3. 同期実行 API
- `POST /api/sync`
  - 動作:
    1. フリカレのスクレイピング実行。
    2. Google Calendar APIの呼び出し。
    3. 結果をSupabase DBへ保存。
  - 認証: ユーザーセッション、またはGitHub Actions用のシークレットトークン。

## 3. データベース設計 (Supabase/PostgreSQL)

### 3.1. `profiles` テーブル
| カラム名 | 型 | 説明 |
| :--- | :--- | :--- |
| `id` | uuid | PK, Auth.users.id と紐付け |
| `email` | text | ホワイトリスト確認用 |
| `is_google_sync_enabled` | boolean | Google同期設定 |
| `frica_shared_url` | text | フリカレ共有URL |

### 3.2. `events` テーブル
| カラム名 | 型 | 説明 |
| :--- | :--- | :--- |
| `id` | uuid | PK |
| `user_id` | uuid | 所有者のID |
| `source` | text | 'google' or 'frica' |
| `title` | text | 予定名 |
| `start_at` | timestamptz | 開始日時 |
| `end_at` | timestamptz | 終了日時 |
| `is_all_day` | boolean | 終日予定 |
| `external_id` | text | 外部ID（重複排除用） |
