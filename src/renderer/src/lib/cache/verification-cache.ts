import type { ExpertFeedback, VerificationSession } from '../../types/node.types'
import type { CornellContent } from '../../types/note.types'

interface CacheKey {
  nodeLabel: string
  userExplanation: string
  cornellHash: string
}

interface CacheEntry {
  feedback: ExpertFeedback
  session: VerificationSession
  timestamp: number
  hitCount: number
}

const CACHE_KEY = 'feiman_verification_cache'
const MAX_CACHE_SIZE = 100
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000 // 7 days

class VerificationCache {
  private cache: Map<string, CacheEntry>

  constructor() {
    this.cache = this.loadFromStorage()
    this.cleanup()
  }

  private loadFromStorage(): Map<string, CacheEntry> {
    try {
      const data = localStorage.getItem(CACHE_KEY)
      if (data) {
        const parsed = JSON.parse(data)
        return new Map(Object.entries(parsed))
      }
    } catch (e) {
      console.error('Failed to load verification cache:', e)
    }
    return new Map()
  }

  private saveToStorage(): void {
    try {
      const data = Object.fromEntries(this.cache)
      localStorage.setItem(CACHE_KEY, JSON.stringify(data))
    } catch (e) {
      console.error('Failed to save verification cache:', e)
    }
  }

  private generateKey(nodeLabel: string, userExplanation: string, cornell: CornellContent): string {
    // Normalize explanation for better cache hit rate
    const normalized = userExplanation
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 500) // Only use first 500 chars for key
    
    const cornellHash = this.hashCornell(cornell)
    return `${nodeLabel}:${normalized}:${cornellHash}`
  }

  private hashCornell(cornell: CornellContent): string {
    // Simple hash of cornell content
    const content = `${cornell.cues}:${cornell.notes}:${cornell.summary}`
    let hash = 0
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return hash.toString(16)
  }

  get(
    nodeLabel: string,
    userExplanation: string,
    cornell: CornellContent
  ): { feedback: ExpertFeedback; session: VerificationSession } | null {
    const key = this.generateKey(nodeLabel, userExplanation, cornell)
    const entry = this.cache.get(key)

    if (!entry) return null

    // Check TTL
    if (Date.now() - entry.timestamp > CACHE_TTL) {
      this.cache.delete(key)
      this.saveToStorage()
      return null
    }

    // Update hit count
    entry.hitCount++
    this.cache.set(key, entry)
    this.saveToStorage()

    return {
      feedback: entry.feedback,
      session: entry.session
    }
  }

  set(
    nodeLabel: string,
    userExplanation: string,
    cornell: CornellContent,
    feedback: ExpertFeedback,
    session: VerificationSession
  ): void {
    const key = this.generateKey(nodeLabel, userExplanation, cornell)
    
    // Check if cache is full
    if (this.cache.size >= MAX_CACHE_SIZE) {
      // Remove oldest entry (LRU)
      let oldestKey: string | null = null
      let oldestTime = Infinity
      
      for (const [k, v] of this.cache) {
        if (v.timestamp < oldestTime) {
          oldestTime = v.timestamp
          oldestKey = k
        }
      }
      
      if (oldestKey) {
        this.cache.delete(oldestKey)
      }
    }

    this.cache.set(key, {
      feedback,
      session,
      timestamp: Date.now(),
      hitCount: 1
    })

    this.saveToStorage()
  }

  clear(): void {
    this.cache.clear()
    localStorage.removeItem(CACHE_KEY)
  }

  getStats(): { size: number; hitRate: number; oldestEntry: number } {
    let totalHits = 0
    let oldestTime = Date.now()
    
    for (const entry of this.cache.values()) {
      totalHits += entry.hitCount
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp
      }
    }
    
    return {
      size: this.cache.size,
      hitRate: totalHits / (this.cache.size || 1),
      oldestEntry: oldestTime
    }
  }

  private cleanup(): void {
    const now = Date.now()
    let changed = false
    
    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp > CACHE_TTL) {
        this.cache.delete(key)
        changed = true
      }
    }
    
    if (changed) {
      this.saveToStorage()
    }
  }
}

export const verificationCache = new VerificationCache()
export default verificationCache
