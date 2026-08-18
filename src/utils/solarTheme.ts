import { AppTheme } from "../types";

export interface SolarCoordinates {
  lat: number;
  lng: number;
  city?: string;
}

export interface SolarInfo {
  sunrise: Date;
  sunset: Date;
  sunriseFormatted: string;
  sunsetFormatted: string;
  isDaytime: boolean;
  nextTransitionTime: string;
  nextTransitionLabel: string;
  minutesToNextTransition: number;
  suggestedTheme: AppTheme;
  solarProgress: number; // 0 to 100% through current phase
  coordinatesUsed: SolarCoordinates | null;
  isUsingGeolocation: boolean;
}

const SOLAR_COORDS_STORAGE_KEY = "garia_solar_coordinates";

/**
 * Get cached coordinates from localStorage
 */
export function getCachedSolarCoordinates(): SolarCoordinates | null {
  try {
    const raw = localStorage.getItem(SOLAR_COORDS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed?.lat === "number" && typeof parsed?.lng === "number") {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Failed to load cached solar coordinates:", e);
  }
  return null;
}

/**
 * Cache coordinates into localStorage
 */
export function saveCachedSolarCoordinates(coords: SolarCoordinates): void {
  try {
    localStorage.setItem(SOLAR_COORDS_STORAGE_KEY, JSON.stringify(coords));
  } catch (e) {
    console.warn("Failed to save solar coordinates:", e);
  }
}

/**
 * Request device geolocation with graceful fallback
 */
export async function requestDeviceLocation(): Promise<SolarCoordinates | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return null;
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: SolarCoordinates = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        saveCachedSolarCoordinates(coords);
        resolve(coords);
      },
      (error) => {
        console.warn("Geolocation permission error or unavailable:", error.message);
        resolve(null);
      },
      { timeout: 8000, maximumAge: 600000 }
    );
  });
}

/**
 * Accurate Astronomical Calculation for Sunrise and Sunset times
 * Standard Solar Declination & Hour Angle equations (NOAA solar model)
 */
function calculateSolarTimes(
  date: Date,
  lat: number,
  lng: number
): { sunrise: Date; sunset: Date } {
  const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  // Day of the year (1-366)
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
  );

  // Approximate solar transit
  const rad = Math.PI / 180;
  const deg = 180 / Math.PI;

  // Fractional year in radians
  const gamma = (2 * Math.PI / 365) * (dayOfYear - 1 + (date.getHours() - 12) / 24);

  // Equation of time in minutes
  const eqtime =
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(gamma) -
      0.032077 * Math.sin(gamma) -
      0.014615 * Math.cos(2 * gamma) -
      0.040849 * Math.sin(2 * gamma));

  // Solar declination angle in radians
  const decl =
    0.006918 -
    0.399912 * Math.cos(gamma) +
    0.070257 * Math.sin(gamma) -
    0.006758 * Math.cos(2 * gamma) +
    0.000907 * Math.sin(2 * gamma) -
    0.002697 * Math.cos(3 * gamma) +
    0.00148 * Math.sin(3 * gamma);

  // Zenith angle for sunrise/sunset (official standard is 90.833° accounting for atmospheric refraction)
  const zenith = 90.833 * rad;

  // Hour angle calculation: cos(ha) = (cos(zenith) - sin(lat)*sin(decl)) / (cos(lat)*cos(decl))
  const cosHa =
    (Math.cos(zenith) - Math.sin(lat * rad) * Math.sin(decl)) /
    (Math.cos(lat * rad) * Math.cos(decl));

  // Clamp cosHa for extreme polar day/night conditions
  let haDeg = 90;
  if (cosHa < -1) {
    haDeg = 180; // Polar day
  } else if (cosHa > 1) {
    haDeg = 0; // Polar night
  } else {
    haDeg = Math.acos(cosHa) * deg;
  }

  // Timezone offset in minutes
  const timezoneOffsetMinutes = -date.getTimezoneOffset();

  // Solar noon in UTC minutes from midnight
  const solarNoonMinutes = 720 - 4 * lng - eqtime + timezoneOffsetMinutes;

  const sunriseMinutes = solarNoonMinutes - haDeg * 4;
  const sunsetMinutes = solarNoonMinutes + haDeg * 4;

  const sunrise = new Date(startOfDay.getTime() + sunriseMinutes * 60 * 1000);
  const sunset = new Date(startOfDay.getTime() + sunsetMinutes * 60 * 1000);

  return { sunrise, sunset };
}

/**
 * Fallback solar calculation when exact GPS coordinates are not provided.
 * Uses local timezone offset and day of year to approximate realistic sunrise (approx 06:00) and sunset (approx 18:30).
 */
function calculateFallbackSolarTimes(date: Date): { sunrise: Date; sunset: Date } {
  const sunrise = new Date(date);
  sunrise.setHours(6, 15, 0, 0);

  const sunset = new Date(date);
  sunset.setHours(18, 30, 0, 0);

  // Adjust slightly by season (month)
  const month = date.getMonth(); // 0-11
  // Summer months in northern hemisphere: longer days (sunrise earlier ~5:45, sunset later ~19:15)
  if (month >= 4 && month <= 7) {
    sunrise.setHours(5, 45, 0, 0);
    sunset.setHours(19, 15, 0, 0);
  } else if (month >= 10 || month <= 1) {
    // Winter months: shorter days
    sunrise.setHours(6, 45, 0, 0);
    sunset.setHours(17, 45, 0, 0);
  }

  return { sunrise, sunset };
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

/**
 * Computes full solar information for the current moment
 */
export function getSolarInfo(
  currentDate: Date = new Date(),
  overrideCoords?: SolarCoordinates | null
): SolarInfo {
  const cachedCoords = overrideCoords !== undefined ? overrideCoords : getCachedSolarCoordinates();
  const isUsingGeolocation = Boolean(cachedCoords && typeof cachedCoords.lat === "number");

  const { sunrise, sunset } = isUsingGeolocation && cachedCoords
    ? calculateSolarTimes(currentDate, cachedCoords.lat, cachedCoords.lng)
    : calculateFallbackSolarTimes(currentDate);

  const currentMs = currentDate.getTime();
  const sunriseMs = sunrise.getTime();
  const sunsetMs = sunset.getTime();

  const isDaytime = currentMs >= sunriseMs && currentMs < sunsetMs;
  const suggestedTheme: AppTheme = isDaytime ? "light" : "dark";

  let nextTransitionTime = "";
  let nextTransitionLabel = "";
  let minutesToNextTransition = 0;
  let solarProgress = 0;

  if (isDaytime) {
    // Next transition is sunset
    minutesToNextTransition = Math.max(0, Math.round((sunsetMs - currentMs) / (1000 * 60)));
    const hours = Math.floor(minutesToNextTransition / 60);
    const mins = minutesToNextTransition % 60;
    nextTransitionTime = formatTime(sunset);
    nextTransitionLabel = hours > 0 ? `Sunset in ${hours}h ${mins}m` : `Sunset in ${mins}m`;

    const totalDaylightMs = sunsetMs - sunriseMs;
    const elapsedDaylightMs = currentMs - sunriseMs;
    solarProgress = Math.min(100, Math.max(0, Math.round((elapsedDaylightMs / totalDaylightMs) * 100)));
  } else {
    // Next transition is sunrise
    let nextSunriseMs = sunriseMs;
    if (currentMs >= sunsetMs) {
      // It's evening after sunset; next sunrise is tomorrow morning
      nextSunriseMs = sunriseMs + 24 * 60 * 60 * 1000;
    }
    minutesToNextTransition = Math.max(0, Math.round((nextSunriseMs - currentMs) / (1000 * 60)));
    const hours = Math.floor(minutesToNextTransition / 60);
    const mins = minutesToNextTransition % 60;
    nextTransitionTime = formatTime(new Date(nextSunriseMs));
    nextTransitionLabel = hours > 0 ? `Sunrise in ${hours}h ${mins}m` : `Sunrise in ${mins}m`;

    const totalNightMs = 24 * 60 * 60 * 1000 - (sunsetMs - sunriseMs);
    const elapsedNightMs = currentMs >= sunsetMs ? currentMs - sunsetMs : (currentMs + (24 * 60 * 60 * 1000 - sunsetMs));
    solarProgress = Math.min(100, Math.max(0, Math.round((elapsedNightMs / totalNightMs) * 100)));
  }

  return {
    sunrise,
    sunset,
    sunriseFormatted: formatTime(sunrise),
    sunsetFormatted: formatTime(sunset),
    isDaytime,
    nextTransitionTime,
    nextTransitionLabel,
    minutesToNextTransition,
    suggestedTheme,
    solarProgress,
    coordinatesUsed: cachedCoords,
    isUsingGeolocation,
  };
}
