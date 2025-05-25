import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      maps: {
        Row: {
          id: string
          name: string
          description: string | null
          map_data: any
          width: number
          height: number
          is_public: boolean
          created_at: string
          updated_at: string
          user_id: string
          github_repo: string | null
          github_path: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          map_data: any
          width: number
          height: number
          is_public?: boolean
          created_at?: string
          updated_at?: string
          user_id: string
          github_repo?: string | null
          github_path?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          map_data?: any
          width?: number
          height?: number
          is_public?: boolean
          created_at?: string
          updated_at?: string
          user_id?: string
          github_repo?: string | null
          github_path?: string | null
        }
      }
      profiles: {
        Row: {
          id: string
          github_username: string | null
          avatar_url: string | null
          full_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          github_username?: string | null
          avatar_url?: string | null
          full_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          github_username?: string | null
          avatar_url?: string | null
          full_name?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

// Auth helpers
export const signInWithGitHub = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })
  return { data, error }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export const getCurrentUser = async () => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  return { user, error }
}

// Map operations
export const saveMapToCloud = async (mapData: any, mapName: string, mapId?: string) => {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("User not authenticated")

  const mapPayload = {
    name: mapName,
    map_data: mapData,
    width: 30,
    height: 20,
    user_id: user.id,
  }

  if (mapId) {
    // Update existing map
    const { data, error } = await supabase
      .from("maps")
      .update(mapPayload)
      .eq("id", mapId)
      .eq("user_id", user.id)
      .select()
      .single()
    return { data, error }
  } else {
    // Create new map
    const { data, error } = await supabase.from("maps").insert(mapPayload).select().single()
    return { data, error }
  }
}

export const getUserMaps = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("User not authenticated")

  const { data, error } = await supabase
    .from("maps")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })

  return { data, error }
}

export const getMapById = async (mapId: string) => {
  const { data, error } = await supabase.from("maps").select("*").eq("id", mapId).single()

  return { data, error }
}

export const deleteMap = async (mapId: string) => {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("User not authenticated")

  const { error } = await supabase.from("maps").delete().eq("id", mapId).eq("user_id", user.id)

  return { error }
}

export const getUserProfile = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { data: null, error: null }

  const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  return { data, error }
}
