import { Hono } from 'hono'
import type { AdminUser } from '../adminAuth.js'
import { requireAdminAuth } from '../adminAuth.js'
import { getDb } from '../db.js'
import {
  listAdminKingdoms,
  resetKingdomSettings,
  updateKingdomSettings,
  type BattleMapLayoutConfig,
} from '../lib/learning/planetKingdomSettings.js'

type AppEnv = { Variables: { admin: AdminUser } }

export const adminPlanetRoutes = new Hono<AppEnv>()

adminPlanetRoutes.use('*', requireAdminAuth)

adminPlanetRoutes.get('/kingdoms', (c) => {
  return c.json({ kingdoms: listAdminKingdoms(getDb()) })
})

adminPlanetRoutes.patch('/kingdoms/:kingdomId', async (c) => {
  const kingdomId = c.req.param('kingdomId')
  const body = await c.req.json<{
    name?: string
    subtitle?: string
    mapX?: number
    mapY?: number
    mapRegion?: string
    battleMapLayout?: BattleMapLayoutConfig | null
  }>()

  try {
    const kingdom = updateKingdomSettings(getDb(), kingdomId, {
      name: body.name,
      subtitle: body.subtitle,
      mapX: body.mapX,
      mapY: body.mapY,
      mapRegion: body.mapRegion,
      battleMapLayout: body.battleMapLayout,
    })
    return c.json({ kingdom })
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : '保存失败' }, 400)
  }
})

adminPlanetRoutes.delete('/kingdoms/:kingdomId/override', (c) => {
  const kingdomId = c.req.param('kingdomId')
  try {
    const kingdom = resetKingdomSettings(getDb(), kingdomId)
    return c.json({ kingdom })
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : '重置失败' }, 400)
  }
})
