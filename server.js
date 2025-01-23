import express from 'express'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import cors from 'cors'
import connectDB from './src/utils/db.js'
import userRoutes from './src/routes/user-routes.js'
import subtaskRoutes from './src/routes/subtask-routes.js'

// 環境変数の読み込み
dotenv.config()

const app = express()
const port = process.env.PORT || 3000

// ESモジュールでの__dirnameの代替
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Middleware setup
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 静的ファイルの提供
app.use(express.static(join(__dirname, 'public')))

// ルートパスへのアクセス時の処理
app.get('/', (req, res) => {
  res.redirect('/login.html')
})

// データベース接続
connectDB().then(() => {
  console.log('データベースに接続しました')
}).catch((error) => {
  console.error('データベース接続エラー:', error)
  process.exit(1)
})

// ルートの登録
app.use('/api', userRoutes)
app.use('/api/subtasks', subtaskRoutes)

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({
    success: false,
    message: '内部サーバーエラーが発生しました'
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'リクエストされたリソースが見つかりません'
  })
})

// サーバーの起動
app.listen(port, () => {
  console.log(`サーバーが起動しました: http://localhost:${port}`)
})