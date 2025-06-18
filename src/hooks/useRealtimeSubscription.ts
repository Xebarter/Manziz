import { useEffect, useRef } from 'react'
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

type EventType = 'INSERT' | 'UPDATE' | 'DELETE' | '*'

interface SubscriptionOptions {
  table: string
  event?: EventType
  schema?: string
  filter?: string
  callback?: (payload: RealtimePostgresChangesPayload<any>) => void
}

export function useRealtimeSubscription(options: SubscriptionOptions | SubscriptionOptions[]) {
  const channelRefs = useRef<Map<string, RealtimeChannel>>(new Map())

  useEffect(() => {
    let mounted = true

    const setupSubscription = async (option: SubscriptionOptions) => {
      try {
        // Clean up existing subscription if it exists
        const existingChannel = channelRefs.current.get(option.table)
        if (existingChannel) {
          await existingChannel.unsubscribe()
          channelRefs.current.delete(option.table)
        }

        if (!option.table) {
          console.error('Table name is required for subscription')
          return
        }

        // Create a new channel with a unique name
        const channelName = `public_${option.table}_${Math.random().toString(36).substring(7)}`
        
        // Create and subscribe to the channel
        const channel = supabase.channel(channelName)
        
        channel.on(
          'postgres_changes',
          {
            event: option.event || '*',
            schema: option.schema || 'public',
            table: option.table,
            filter: option.filter
          },
          (payload) => {
            if (mounted && option.callback) {
              console.log(`Realtime change in ${option.table}:`, payload)
              option.callback(payload)
            }
          }
        )

        const response = await channel.subscribe()
        if (mounted) {
          channelRefs.current.set(option.table, channel)
          if (response === 'SUBSCRIBED') {
            console.log(`Successfully subscribed to ${option.table} changes`)
          } else {
            console.warn(`Subscription status for ${option.table}:`, response)
            // Attempt to reconnect after a delay
            setTimeout(() => setupSubscription(option), 5000)
          }
        }
      } catch (error) {
        console.error(`Error setting up subscription for ${option.table}:`, error)
        if (mounted) {
          // Attempt to reconnect after a delay
          setTimeout(() => setupSubscription(option), 5000)
        }
      }
    }

    // Handle both single option and array of options
    const optionsArray = Array.isArray(options) ? options : [options]
    optionsArray.forEach(option => setupSubscription(option))

    // Cleanup function
    return () => {
      mounted = false
      channelRefs.current.forEach(channel => {
        channel.unsubscribe()
      })
      channelRefs.current.clear()
    }
  }, [options])
} 