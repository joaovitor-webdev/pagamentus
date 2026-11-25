const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export interface HealthResponse {
  status: string;
  timestamp: string;
  uptime: number;
  versao: string;
}

export async function consultarHealthcheck(): Promise<HealthResponse | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/health`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return (await res.json()) as HealthResponse;
  } catch {
    return null;
  }
}
