/**
 * Sanitizes a GitHub URL to a valid Supabase bucket name
 * Converts: https://github.com/user/repo → github-com-user-repo
 *
 * Supabase bucket naming rules:
 * - Only lowercase letters, numbers, hyphens, and underscores
 * - Must start with a letter or number
 * - 3-63 characters long
 */
export function sanitizeGithubUrlToBucketName(url: string): string {
  try {
    // Add protocol if missing
    const urlWithProtocol = url.startsWith('http') ? url : `https://${url}`;
    const parsedUrl = new URL(urlWithProtocol);

    // Extract hostname and path
    const hostname = parsedUrl.hostname.toLowerCase().replace(/\./g, '-');
    const pathParts = parsedUrl.pathname
      .split('/')
      .filter(part => part.length > 0)
      .map(part => part.toLowerCase());

    // Remove .git suffix if present
    const lastPart = pathParts[pathParts.length - 1];
    if (lastPart && lastPart.endsWith('.git')) {
      pathParts[pathParts.length - 1] = lastPart.slice(0, -4);
    }

    // Combine hostname and path parts
    const parts = [hostname, ...pathParts];

    // Join with hyphens and sanitize
    let bucketName = parts.join('-');

    // Replace any non-alphanumeric characters (except hyphens) with hyphens
    bucketName = bucketName.replace(/[^a-z0-9-]/g, '-');

    // Remove consecutive hyphens
    bucketName = bucketName.replace(/-+/g, '-');

    // Remove leading/trailing hyphens
    bucketName = bucketName.replace(/^-+|-+$/g, '');

    // Ensure it starts with a letter or number
    if (!/^[a-z0-9]/.test(bucketName)) {
      bucketName = 'bucket-' + bucketName;
    }

    // Limit to 63 characters
    if (bucketName.length > 63) {
      bucketName = bucketName.substring(0, 63).replace(/-+$/, '');
    }

    // Ensure minimum length of 3
    if (bucketName.length < 3) {
      bucketName = bucketName.padEnd(3, '0');
    }

    return bucketName;
  } catch (error) {
    throw new Error('Invalid GitHub URL');
  }
}
