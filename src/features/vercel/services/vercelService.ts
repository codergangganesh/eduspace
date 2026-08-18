import { supabase } from "@/integrations/supabase/client";
import {
  VercelConnectionData,
  VercelOAuthStartResponse,
  VercelActionResponse,
} from "../types/vercelTypes";

const FUNCTION_NAME = "vercel-oauth";

/**
 * Initiates the Vercel OAuth 2.0 flow by requesting an authorization URL with CSRF state
 */
export async function startVercelOAuth(): Promise<VercelOAuthStartResponse> {
  try {
    const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
      body: { action: "start" },
    });

    if (error) {
      return {
        success: false,
        error: error.message || "Failed to initialize Vercel connection",
      };
    }

    if (!data?.success || !data?.authUrl) {
      return {
        success: false,
        error: data?.error || "Invalid response from authorization server",
      };
    }

    return {
      success: true,
      authUrl: data.authUrl,
      state: data.state,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Failed to start Vercel authentication",
    };
  }
}

/**
 * Handles the OAuth callback by sending the authorization code and state to the serverless Edge Function
 */
export async function completeVercelOAuth(
  code: string,
  state: string
): Promise<VercelActionResponse<VercelConnectionData>> {
  try {
    const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
      body: {
        action: "callback",
        code,
        state,
      },
    });

    if (error) {
      return {
        success: false,
        error: error.message || "Failed to exchange authorization code",
      };
    }

    if (!data?.success) {
      return {
        success: false,
        error: data?.error || "Vercel authorization verification failed",
      };
    }

    return {
      success: true,
      data: data.data,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Error processing Vercel connection callback",
    };
  }
}

/**
 * Retrieves the current Vercel connection and cached stats for a student
 */
export async function getVercelConnection(
  userId?: string
): Promise<VercelActionResponse<VercelConnectionData>> {
  try {
    // 1. Try querying via Edge Function
    const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
      body: {
        action: "get-connection",
        userId,
      },
    });

    if (!error && data?.success && data?.data) {
      return {
        success: true,
        data: data.data,
      };
    }

    // 2. Direct fallback from public view if function is warming up
    if (userId) {
      const { data: dbData, error: dbError } = await supabase
        .from("vercel_connections" as any)
        .select("user_id, vercel_user_id, vercel_username, vercel_name, vercel_avatar_url, connected_at, last_synced_at, cached_data")
        .eq("user_id", userId)
        .maybeSingle();

      if (!dbError && dbData && (dbData as any).vercel_user_id) {
        const casted = dbData as any;
        return {
          success: true,
          data: {
            connected: true,
            userId: casted.user_id,
            vercelUserId: casted.vercel_user_id,
            vercelUsername: casted.vercel_username,
            vercelName: casted.vercel_name,
            vercelAvatarUrl: casted.vercel_avatar_url,
            connectedAt: casted.connected_at,
            lastSyncedAt: casted.last_synced_at,
            cachedData: casted.cached_data,
          },
        };
      }
    }

    return {
      success: true,
      data: { connected: false },
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Failed to load Vercel connection data",
      data: { connected: false },
    };
  }
}

/**
 * Synchronizes the latest Vercel projects and deployments
 */
export async function syncVercelProfile(): Promise<VercelActionResponse<VercelConnectionData>> {
  try {
    const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
      body: { action: "sync" },
    });

    if (error) {
      return {
        success: false,
        error: error.message || "Failed to synchronize Vercel data",
      };
    }

    if (!data?.success) {
      return {
        success: false,
        error: data?.error || "Failed to synchronize Vercel data",
      };
    }

    return {
      success: true,
      data: data.data,
      message: "Vercel profile synchronized successfully",
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Sync error",
    };
  }
}

/**
 * Disconnects the Vercel account and wipes stored access credentials
 */
export async function disconnectVercel(): Promise<VercelActionResponse<null>> {
  try {
    const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
      body: { action: "disconnect" },
    });

    if (error) {
      return {
        success: false,
        error: error.message || "Failed to disconnect Vercel account",
      };
    }

    if (!data?.success) {
      return {
        success: false,
        error: data?.error || "Failed to disconnect Vercel account",
      };
    }

    return {
      success: true,
      message: "Vercel account disconnected successfully",
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Disconnect error",
    };
  }
}
