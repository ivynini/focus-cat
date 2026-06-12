import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://btiyqvetbyepibrvkfon.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0aXlxdmV0YnllcGlicnZrZm9uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzMDU0MjAsImV4cCI6MjA5Mzg4MTQyMH0.96sapxNWG3JOic79E2Mf0Jin90ChNQah4LX9NG3_nzY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
