/**
 * Reads a fetch Response body and parses JSON when the body is actually JSON.
 * In production, gateways, timeouts, or misconfigured hosts often return HTML
 * (e.g. <!DOCTYPE html>...) which would make response.json() throw.
 */
export async function parseApiJsonResponse(res: Response): Promise<{
  status: number;
  contentType: string | null;
  json: Record<string, unknown> | null;
  /** First chars of body when not JSON (for logs / short UI preview). */
  bodyPreview: string;
}> {
  const contentType = res.headers.get('content-type');
  const raw = await res.text();
  const trimmed = raw.trim();
  const bodyPreview = trimmed.slice(0, 400).replace(/\s+/g, ' ');

  const looksJson = trimmed.startsWith('{') || trimmed.startsWith('[');
  if (!looksJson) {
    return { status: res.status, contentType, json: null, bodyPreview };
  }

  try {
    const parsed: unknown = JSON.parse(trimmed);
    const json = parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : null;
    return { status: res.status, contentType, json, bodyPreview };
  } catch {
    return { status: res.status, contentType, json: null, bodyPreview };
  }
}
