import { useEffect } from 'react'
import { useUserBarExtrasStore } from '../../learning/userBarExtrasStore'
import { useConquer } from '../ConquerContext'

/** 将征服星球 session 同步到全局右上角用户栏（种族分布、视察军队） */
export function ConquerUserBarSync() {
  const { session } = useConquer()
  const setFromPlanetSession = useUserBarExtrasStore((s) => s.setFromPlanetSession)
  const clear = useUserBarExtrasStore((s) => s.clear)

  useEffect(() => {
    if (session) setFromPlanetSession(session)
    else clear()
    return () => clear()
  }, [session, setFromPlanetSession, clear])

  return null
}
