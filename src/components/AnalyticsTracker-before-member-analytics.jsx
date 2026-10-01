import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const APP_VERSION = '1.0.0'

function getDeviceType() {
  const width = window.innerWidth

  if (width <= 767) return 'mobile'
  if (width <= 1024) return 'tablet'

  return 'desktop'
}

function getBrowser() {
  const userAgent = navigator.userAgent

  if (userAgent.includes('Edg/')) return 'Edge'
  if (userAgent.includes('OPR/')) return 'Opera'
  if (userAgent.includes('Chrome/')) return 'Chrome'
  if (userAgent.includes('Firefox/')) return 'Firefox'
  if (userAgent.includes('Safari/')) return 'Safari'

  return 'Other'
}

function getOperatingSystem() {
  const userAgent = navigator.userAgent

  if (/Windows/i.test(userAgent)) return 'Windows'
  if (/Android/i.test(userAgent)) return 'Android'
  if (/iPhone|iPad|iPod/i.test(userAgent)) return 'iOS'
  if (/Mac/i.test(userAgent)) return 'macOS'
  if (/Linux/i.test(userAgent)) return 'Linux'

  return 'Other'
}

function getSessionId() {
  const key = 'netaji_analytics_session_id'

  let sessionId = sessionStorage.getItem(key)

  if (!sessionId) {
    sessionId =
      crypto.randomUUID?.() ||
      `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2)}`

    sessionStorage.setItem(key, sessionId)
  }

  return sessionId
}

function isPWA() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  )
}

/*
  Get approximate visitor location using IP geolocation.

  This does NOT use GPS or the user's exact address.
  If the service fails, location values remain null.
*/
async function getVisitorLocation() {
  try {
    const response = await fetch('https://ipapi.co/json/', {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Location request failed')
    }

    const data = await response.json()

    return {
      country: data.country_name || null,
      region: data.region || null,
      city: data.city || null,
    }
  } catch (error) {
    console.warn(
      'Visitor location could not be detected:',
      error
    )

    return {
      country: null,
      region: null,
      city: null,
    }
  }
}

export default function AnalyticsTracker() {
  const location = useLocation()

  useEffect(() => {
    let cancelled = false

    async function trackPageView() {
      try {
        /*
          Get approximate location first.
          If this fails, the page view is still recorded.
        */
        const visitorLocation = await getVisitorLocation()

        if (cancelled) return

        const eventData = {
          session_id: getSessionId(),

          event_type: 'page_view',

          page_path:
            location.pathname + location.search,

          page_title: document.title,

          device_type: getDeviceType(),

          browser: getBrowser(),

          operating_system: getOperatingSystem(),

          country: visitorLocation.country,

          region: visitorLocation.region,

          city: visitorLocation.city,

          app_version: APP_VERSION,

          is_pwa: isPWA(),
        }

        const { error } = await supabase
          .from('analytics_events')
          .insert(eventData)

        if (error) {
          console.error(
            'Analytics tracking error:',
            error
          )
        }
      } catch (error) {
        console.error(
          'Analytics tracker error:',
          error
        )
      }
    }

    trackPageView()

    return () => {
      cancelled = true
    }
  }, [location.pathname, location.search])

  return null
}