import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://lhzvsuvlefmwbivdhcfz.supabase.co' // 본인의 Project URL 입력
const SUPABASE_ANON_KEY = 'sb_publishable_XjOECr2qHXXCjwtn1u2ooQ_u3hOsxZL' // 본인의 anon public key 입력

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)