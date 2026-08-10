export async function hashPassword(password: string): Promise<string> {
  if (!password) return "";
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + "_garia_os_v2_salt");
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch (e) {
    // Fallback simple hash for compatibility
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return "h_" + Math.abs(hash).toString(16);
  }
}
