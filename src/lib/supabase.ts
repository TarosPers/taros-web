import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type JobType = 'fulltime' | 'parttime' | 'temporary'
export type ApplicantStatus = 'new' | 'reviewing' | 'invited' | 'rejected' | 'hired'

export interface Job {
  id: string
  slug: string
  title_cs: string
  title_de: string
  description_cs: string
  description_de: string
  location: string
  salary_range: string | null
  type: JobType
  sector: string
  active: boolean
  og_image_url: string | null
  created_at: string
}

export interface Applicant {
  id: string
  job_id: string
  job?: Job
  first_name: string
  last_name: string
  email: string
  phone: string | null
  message: string | null
  cv_url: string | null
  status: ApplicantStatus
  notes: string | null
  created_at: string
}