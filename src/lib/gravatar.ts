// Helper to generate SHA256 hash for Gravatar
export async function sha256(message: string) {
  try {
    const msgBuffer = new TextEncoder().encode(message.trim().toLowerCase());
    
    // Check if crypto.subtle is available (requires secure context)
    if (typeof crypto === 'undefined' || !crypto.subtle) {
      return null;
    }

    const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch (error) {
    console.error("Error generating hash:", error);
    return null;
  }
}

export async function getGravatarUrl(email: string, size = 200) {
  if (!email || !email.includes("@")) return null;
  const hash = await sha256(email);
  
  // If hash fails (e.g. insecure context), return a default gravatar URL or null
  if (!hash) {
    return `https://www.gravatar.com/avatar/default?d=identicon&s=${size}`;
  }
  
  return `https://www.gravatar.com/avatar/${hash}?d=identicon&s=${size}`;
}
