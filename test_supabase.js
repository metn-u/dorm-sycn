import { createClient } from '@supabase/supabase-js'

try {
    const client = createClient('', '')
    console.log('Client created successfully (unexpectedly)')
} catch (error) {
    console.error('Client creation failed as expected:', error.message)
}
