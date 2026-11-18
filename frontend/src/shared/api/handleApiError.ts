import axios from 'axios';

export function handleApiError(error: unknown, fallbackMessage = 'Ha ocurrido un error inesperado'): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (data && typeof data === 'object' && 'detail' in data) {
      const detail = data.detail;
      if (typeof detail === 'string') {
        return detail;
      }
      if (Array.isArray(detail)) {
        return detail.map((err) => (typeof err === 'object' && err.msg ? err.msg : JSON.stringify(err))).join(', ');
      }
    }
    if (error.message) {
      return error.message;
    }
  } else if (error instanceof Error) {
    return error.message;
  }
  return fallbackMessage;
}
