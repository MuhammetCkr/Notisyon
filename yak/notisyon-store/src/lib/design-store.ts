import "server-only";
import { getDb } from "@/lib/db";
import { DEFAULT_DESIGN_CONFIG, mergeDesignConfig, type DesignConfig } from "@/lib/design-config";

export async function readDesignConfig(): Promise<DesignConfig> {
  try {
    const result = await getDb().query<{ value: Partial<DesignConfig> }>("SELECT value FROM store_settings WHERE key='design_config'");
    return mergeDesignConfig(result.rows[0]?.value);
  } catch {
    return DEFAULT_DESIGN_CONFIG;
  }
}
