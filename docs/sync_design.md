# 同期処理詳細設計書 (Revised Architecture)

本ドキュメントでは、Google カレンダーおよびフリカレの同期ロジックの最新のアーキテクチャおよび実装仕様を定義しますわ。

## 1. システムアーキテクチャ

同期処理は重負荷かつブラウザ（Playwright）の実行を伴うため、メインの API サーバーから分離された**非同期ワーカー（Worker）**で実行されます。

### 1.1 構成要素
- **API Server (Next.js / Vercel)**:
  - ユーザーインターフェースと認証を担当。
  - 同期要求を受け取ると、Worker に対して HTTP リクエスト（Webhook）を送信してジョブをキックします。
- **Worker (Node.js Express / Docker)**:
  - Playwright (Headless Chromium) を含む Docker コンテナ環境で動作。
  - 実際のスクレイピングおよび API 同期処理を実行します。
  - デプロイ先候補: GCP Cloud Run, AWS App Runner など。

### 1.2 同期フロー
1. ユーザーが画面上の「同期」ボタンを押下、または外部スケジューラーが `POST /api/sync` を実行。
2. API Server が `SYNC_SECRET_TOKEN` を添えて Worker の `/sync` エンドポイントを叩く。
3. Worker が即座に `202 Accepted` を返し、バックグラウンドで `syncAllUsers()` を開始。
4. Worker が Supabase Admin Client を使用して DB を更新。

## 2. フリカレ同期ロジック (Playwright)

フリカレ（Frica）の共有 URL から、JavaScript 実行後のレンダリング済み HTML を解析して予定を抽出します。

### 2.1 スクレイピング仕様
- **ブラウザ**: Playwright (Chromium) を使用。
- **待機条件**: `networkidle` および特定のセレクタ（`.ccexp` 等）の出現。
- **解析ロジック**:
  - `class="ccexp"` を持つ要素を全走査。
  - **日付抽出**: 要素の `id`（例: `ccexp-136520-2026-4-18`）をパースし、`年-月-日` を特定。
  - **タイトル抽出**: 要素内の `innerText` を取得。
  - **時間抽出**: タイトルの前方または後方にある時刻形式（例: `14:45〜`）を正規表現で抽出。
    - 対応形式: `HH:mm〜`, `〜HH:mm`, `HH:mm〜HH:mm` (全角・半角対応)。

### 2.2 データ変換
- 抽出したデータを `CalendarEvent` 型（source: 'frica'）に変換。
- `external_id` は `frica-{年-月-日}-{タイトル}` の形式で生成し、一意性を確保します。

## 3. Google カレンダー同期フロー

現在は将来の拡張のためのスケルトン構成となっていますわ。

- **現状**: `fetchGoogleEvents(userId)` 関数が定義されており、ログ出力のみを行い空の配列を返します。
- **今後**: Google OAuth リフレッシュトークンを使用して最新の予定を取得するロジックを実装予定です。

## 4. 共通オーケストレーション (orchestrator.ts)

同期の整合性を保つため、以下のステップで更新を行います：

1. **ユーザー抽出**: `profiles` テーブルから全ユーザーをループ。
2. **予定収集**:
   - Google 同期（有効な場合のみ）。
   - フリカレ同期（共有 URL が設定されている場合のみ）。
3. **DB 更新（トランザクション的処理）**:
   - 該当ユーザーの `events` テーブルから既存データを全削除（冪等性の確保）。
   - 新しく取得した予定を `insert`（一括挿入）。
4. **メタデータ更新**: `profiles.updated_at` を現在時刻に更新。

## 5. 実行環境 (Dockerfile)

Worker は以下の環境で動作します：
- **ベースイメージ**: `mcr.microsoft.com/playwright:v1.50.1-jammy`
- **言語**: TypeScript (tsx による直接実行)
- **依存関係**: Playwright (Chromium), Express, Supabase SDK, dotenv

## 6. エラーハンドリング

- **Worker 呼び出し失敗**: API Server 側でログを記録し、ユーザーにはジョブの受け入れに失敗した旨を通知。
- **スクレイピング失敗**: 特定ユーザーの処理でエラーが発生しても、他のユーザーの処理を継続します。
- **多重起動防止**: Worker 内で `isSyncing` フラグを管理し、既に同期中の場合は `429 Too Many Requests` を返します。
