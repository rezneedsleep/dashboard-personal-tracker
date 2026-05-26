import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

// Read env file
const envText = fs.readFileSync('.env', 'utf-8')
const urlMatch = envText.match(/VITE_SUPABASE_URL=(.+)/)
const keyMatch = envText.match(/VITE_SUPABASE_KEY=(.+)/)
const supabaseUrl = urlMatch ? urlMatch[1].trim() : ''
const supabaseKey = keyMatch ? keyMatch[1].trim() : ''

const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  console.log("Checking expenses table columns...")
  const { data: exp, error: expErr } = await supabase.from('expenses').select('*').limit(1)
  console.log("Expenses data:", exp, "Error:", expErr)

  console.log("Checking habits table columns...")
  const { data: hab, error: habErr } = await supabase.from('habits').select('*').limit(1)
  console.log("Habits data:", hab, "Error:", habErr)

  console.log("Checking if income table exists...")
  const { data: inc, error: incErr } = await supabase.from('income').select('*').limit(1)
  console.log("Income table status:", inc ? "Exists" : "Doesn't exist or error", "Error:", incErr)
}

test()
