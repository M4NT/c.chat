import { createClient } from "@supabase/supabase-js"

let supabaseClient: ReturnType<typeof createClient> | null = null

export function initSupabase(url: string, key: string) {
  supabaseClient = createClient(url, key)
  return supabaseClient
}

export function getSupabase() {
  if (!supabaseClient) {
    throw new Error("Supabase client not initialized")
  }
  return supabaseClient
}

export async function uploadFile(file: File) {
  const supabase = getSupabase()
  const { data, error } = await supabase.storage.from("files").upload(`${Date.now()}-${file.name}`, file)

  if (error) {
    console.error("Error uploading file:", error)
    return null
  }

  return data
}

