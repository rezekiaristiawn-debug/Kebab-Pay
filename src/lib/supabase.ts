import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://uhqwpiqwkbmyxrfkeqha.supabase.co'
const supabaseAnonKey = 'sb_publishable_9C62KnYn0dB1WmNc5n2y8g_2FENAj-3'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
