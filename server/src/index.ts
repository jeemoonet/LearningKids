import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { cleanupExpiredAdminSessions } from './adminAuth.js'
import { cleanupExpiredSessions } from './auth.js'
import { getDb, getDbPath } from './db.js'
import { authRoutes } from './routes/auth.js'
import { adminAuthRoutes } from './routes/adminAuth.js'
import { adminRoutes } from './routes/admin.js'
import { progressRoutes } from './routes/progress.js'
import { vocabRoutes } from './routes/vocab.js'
import { wordbookRoutes } from './routes/wordbook.js'

const app = new Hono()

app.use(
  '/api/*',
  cors({
    origin: (origin) => origin ?? '*',
    credentials: true,
  }),
)

app.get('/api/health', (c) => {
  const db = getDb()
  const wordCount = db.prepare('SELECT COUNT(*) AS count FROM words').get() as { count: number }
  return c.json({
    ok: true,
    db: getDbPath(),
    words: wordCount?.count ?? 0,
  })
})

app.route('/api/auth', authRoutes)
app.route('/api/admin/auth', adminAuthRoutes)
app.route('/api/admin', adminRoutes)
app.route('/api/vocab', vocabRoutes)
app.route('/api/progress', progressRoutes)
app.route('/api/wordbook', wordbookRoutes)

const port = Number(process.env.PORT ?? 3001)

getDb()
cleanupExpiredSessions()
cleanupExpiredAdminSessions()

console.log(`[server] SQLite: ${getDbPath()}`)

type GlobalServer = typeof globalThis & { __vocabApiServer?: ReturnType<typeof serve> }

const globalServer = globalThis as GlobalServer
if (globalServer.__vocabApiServer) {
  globalServer.__vocabApiServer.close()
  globalServer.__vocabApiServer = undefined
}

const server = serve(
  { fetch: app.fetch, port },
  (info) => {
    const boundPort = typeof info === 'object' && info && 'port' in info ? info.port : port
    console.log(`[server] listening on http://localhost:${boundPort}`)
  },
)

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[server] 端口 ${port} 已被占用。请先结束旧进程后重试：`)
    console.error(
      `  PowerShell: Get-NetTCPConnection -LocalPort ${port} | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }`,
    )
    process.exit(1)
  }
  throw err
})

globalServer.__vocabApiServer = server
