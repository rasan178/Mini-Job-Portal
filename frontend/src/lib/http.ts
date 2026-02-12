const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

type ApiOptions = RequestInit & {
  token?: string | null;
  isFormData?: boolean;
};

export const apiFetch = async <T>(path: string, options: ApiOptions = {}): Promise<T> => {
  const { token, isFormData, headers, ...rest } = options;
  const init: RequestInit = {
    ...rest,
    headers: {
      ...(headers || {}),
    },
  };

  if (token) {
    (init.headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }

  const bodyIsForm = typeof FormData !== "undefined" && rest.body instanceof FormData;
  if (!isFormData && rest.body && !bodyIsForm) {
    (init.headers as Record<string, string>)["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_URL}${path}`, init);
  const text = await response.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const errorData = data as { message?: string } | null;
    const message = errorData?.message || response.statusText || "Request failed";
    throw new Error(message);
  }

  return data as T;
};
