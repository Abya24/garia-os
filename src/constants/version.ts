export const APP_NAME = "Garia OS";
export const APP_VERSION = "3.0.0";
export const APP_VERSION_CODE = 30001;
export const APP_VERSION_STRING = `Garia OS V${APP_VERSION}`;
export const APP_BUILD_DATE = "2026.08.17";
export const APP_BUILD_NAME = "Garia OS V3.0 Final Production";
export const APP_RELEASE_DATE = "2026-08-17";
export const APP_PACKAGE_NAME = "com.gariaos.app";

export type AppEnvironment = "Production" | "Staging" | "Development";

/**
 * Single source of truth environment resolver
 */
export function getAppEnvironment(): AppEnvironment {
  // Check explicit environment flag if defined
  if (typeof process !== "undefined" && process.env?.NODE_ENV === "development") {
    return "Development";
  }

  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host.includes("localhost") || host.includes("127.0.0.1")) {
      return "Development";
    }
    if (host.includes("staging") || host.includes("ais-stage")) {
      return "Staging";
    }
  }

  // Default to Production in cloud deployment
  return "Production";
}

export const APP_ENVIRONMENT = getAppEnvironment();

export interface SystemVersionDetails {
  appName: string;
  version: string;
  versionString: string;
  buildNumber: string;
  environment: AppEnvironment;
  releaseDate: string;
  packageName: string;
}

export const SYSTEM_VERSION_DETAILS: SystemVersionDetails = {
  appName: APP_NAME,
  version: APP_VERSION,
  versionString: APP_VERSION_STRING,
  buildNumber: APP_BUILD_DATE,
  environment: APP_ENVIRONMENT,
  releaseDate: APP_RELEASE_DATE,
  packageName: APP_PACKAGE_NAME,
};
