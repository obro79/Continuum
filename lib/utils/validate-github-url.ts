/**
 * Validates if a string is a valid GitHub repository URL
 * Supports formats:
 * - https://github.com/user/repo
 * - http://github.com/user/repo
 * - github.com/user/repo
 * - www.github.com/user/repo
 */
export function validateGithubUrl(url: string): boolean {
  try {
    // Add protocol if missing
    const urlWithProtocol = url.startsWith('http') ? url : `https://${url}`;
    const parsedUrl = new URL(urlWithProtocol);

    // Check if hostname is github.com
    const hostname = parsedUrl.hostname.toLowerCase();
    if (hostname !== 'github.com' && hostname !== 'www.github.com') {
      return false;
    }

    // Check if path matches user/repo pattern
    const pathParts = parsedUrl.pathname.split('/').filter(part => part.length > 0);
    if (pathParts.length < 2) {
      return false;
    }

    // Basic validation: user and repo should be non-empty
    const [user, repo] = pathParts;
    return user.length > 0 && repo.length > 0;
  } catch {
    return false;
  }
}

/**
 * Normalizes a GitHub URL to a standard format
 * Returns: https://github.com/user/repo
 */
export function normalizeGithubUrl(url: string): string {
  // Add protocol if missing
  const urlWithProtocol = url.startsWith('http') ? url : `https://${url}`;
  const parsedUrl = new URL(urlWithProtocol);

  // Extract user and repo
  const pathParts = parsedUrl.pathname.split('/').filter(part => part.length > 0);
  const [user, repo] = pathParts;

  // Remove .git suffix if present
  const cleanRepo = repo.endsWith('.git') ? repo.slice(0, -4) : repo;

  return `https://github.com/${user}/${cleanRepo}`;
}
