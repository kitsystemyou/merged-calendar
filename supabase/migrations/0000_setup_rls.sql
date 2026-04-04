-- profiles テーブルの RLS 有効化
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 自身のプロフィールを参照できるポリシー
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- 自身のプロフィールを更新できるポリシー (設定画面で使用)
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- プロフィールを初期作成できるポリシー (Auth Callbackで使用)
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- events テーブルの RLS 有効化
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- 自身の予定を参照できるポリシー
CREATE POLICY "Users can view own events"
  ON events FOR SELECT
  USING (auth.uid() = user_id);

-- 自身の予定を挿入できるポリシー (同期エンジンで使用)
CREATE POLICY "Users can insert own events"
  ON events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 自身の予定を削除できるポリシー (同期のリフレッシュで使用)
CREATE POLICY "Users can delete own events"
  ON events FOR DELETE
  USING (auth.uid() = user_id);
