#!/bin/bash

# エラーが発生したら即座に終了
set -e

# 環境変数の確認
if [ -z "$VERCEL_TOKEN" ]; then
  echo "Error: VERCEL_TOKEN is not set"
  exit 1
fi

# 依存パッケージのインストール
echo "Installing dependencies..."
npm ci

# テストの実行
echo "Running tests..."
npm test

# ビルド
echo "Building the application..."
npm run build

# Vercelへのデプロイ
echo "Deploying to Vercel..."
npx vercel deploy --token $VERCEL_TOKEN --prod

echo "Deployment completed successfully!" 