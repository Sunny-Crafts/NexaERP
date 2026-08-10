const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export async function checkApiHealth(): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/health`);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return await res.json();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown connection error';
    return {
      success: false,
      message: `Failed to connect to API: ${message}`
    };
  }
}
