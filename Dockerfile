# 1. Playwright公式イメージをベースに使用します
# これにより、必要なブラウザの依存関係がすべて揃いますわ
FROM mcr.microsoft.com/playwright:v1.50.1-jammy

# 2. 作業ディレクトリを作成
WORKDIR /app

# 3. パッケージ定義をコピーして依存関係をインストール
COPY package*.json ./
RUN npm install

# 4. ブラウザをインストール（chromiumのみに絞りますわ）
RUN npx playwright install chromium --with-deps

# 5. ソースコードをコピー
COPY . .

# 6. 環境変数の設定 (実行時に上書きされます)
ENV PORT=3001
ENV NODE_ENV=production

# 7. ポートを開放
EXPOSE 3001

# 8. ワーカーを起動
# tsx を使用して TypeScript のまま直接起動しますわ
# 本番環境ではコンパイル後に node で動かすのが一般的ですが、
# シンプルにするために今回は tsx を使用いたします
CMD ["npm", "run", "worker"]
