import { toast } from 'sonner';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface FetchOptions {
  method?: HttpMethod;
  headers?: Record<string, string>;
  params?: Record<string, unknown>;
  body?: unknown;
  timeout?: number;
  credentials?: RequestCredentials;
  requiresToken?: boolean;
}

export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
}

export interface ApiError extends Error {
  response?: {
    code: number;
    message: string;
    method: HttpMethod;
    path: string;
    timestamp: string;
  };
}

function isApiError(error: unknown): error is ApiError {
  return (error as ApiError).response !== undefined;
}

const defaultOptions: FetchOptions = {
  method: 'GET',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
  requiresToken: true,
};

const checkStatus = async (response: Response) => {
  if (response.ok) {
    return;
  }
  let errorPayload: unknown;
  const contentType = response.headers.get('content-type');
  const clone = response.clone();
  try {
    errorPayload = contentType?.includes('application/json')
      ? await clone.json()
      : await clone.text();
  } catch {
    errorPayload = `Failed to parse error response (status ${clone.status})`;
  }

  const error = new Error(`HTTP ${response.status} ${response.statusText}`) as ApiError;
  error.response = errorPayload as {
    code: number;
    message: string;
    method: HttpMethod;
    path: string;
    timestamp: string;
  };
  throw error;
};

const formatParams = (params: Record<string, unknown>): string =>
  Object.keys(params)
    .map((k) => {
      const value = params[k];
      // 处理参数值为对象的情况
      if (value !== null && typeof value === 'object') {
        return `${encodeURIComponent(k)}=${encodeURIComponent(JSON.stringify(value))}`;
      }
      // 处理其他类型
      return `${encodeURIComponent(k)}=${encodeURIComponent(String(value as string))}`;
    })
    .join('&');

const createUrl = (url: string, params?: Record<string, unknown>): string => {
  if (!params) {
    return url;
  }
  const qs = formatParams(params);
  return qs ? `${url}?${qs}` : url;
};

function isApiResponse<T>(data: unknown): data is ApiResponse<T> {
  return (
    data !== null &&
    typeof data === 'object' &&
    'code' in data &&
    'message' in data &&
    'data' in data
  );
}

const requestInterceptor = (url: string, options: FetchOptions) => {
  const { requiresToken = true } = options;
  const token: string | undefined =
    typeof window !== 'undefined' ? localStorage.getItem('auth-token') || undefined : undefined;
  const newOpts = { ...options };
  if (requiresToken && token) {
    newOpts.headers = { ...newOpts.headers, Authorization: `Bearer ${token}` };
  }
  if (newOpts.method === 'GET' && newOpts.params) {
    url = createUrl(url, newOpts.params);
    delete newOpts.params;
  }
  return { url, options: newOpts };
};

const responseInterceptor = <T>(res: ApiResponse<T>) => {
  if (res.code !== 200) {
    throw new Error(res.message || 'Error');
  }
  return res;
};

const errorHandler = (error: unknown): never => {
  if (isApiError(error)) {
    const res = error.response;
    if (res) {
      switch (res.code) {
        case 400:
          toast.error(res.message || '请求错误');
          break;
        case 401:
          toast.error('未授权，请登录');
          break;
        case 403:
          toast.error(`拒绝访问 ${res.message || ''}`);
          break;
        case 404:
          toast.error(`请求地址出错: ${res.path || ''}`);
          break;
        case 500:
          toast.error(res.message || '服务器内部错误');
          break;
        default:
          toast.error(`连接错误 ${res.code}`);
      }
    } else {
      if (String(error.message).includes('timeout')) {
        toast.error('请求超时');
      } else {
        toast.error('网络异常，请联系管理员');
      }
    }
  } else if (error instanceof TypeError) {
    toast.error(`网络异常:${error.message}`);
  } else if (error instanceof Error) {
    toast.error(error.message);
  } else {
    toast.error('未知错误');
  }
  throw error;
};

const fetchRequest = async <T>(
  url: string,
  options: FetchOptions = {}
): Promise<ApiResponse<T>> => {
  const { method = 'GET', headers, body, timeout = 10000 } = options;
  const base = process.env.NEXT_APP_BASE_URL ?? '';
  const reqUrl = base + url;
  const { url: finalUrl, options: finalOpts } = requestInterceptor(reqUrl, {
    ...defaultOptions,
    ...options,
    method: method.toUpperCase() as HttpMethod,
    headers: { ...defaultOptions.headers, ...headers },
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeout);

  try {
    const res = await fetch(finalUrl, {
      ...finalOpts,
      headers: finalOpts.headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    await checkStatus(res);
    const data = (await res.json()) as unknown;
    if (isApiResponse<T>(data)) {
      return responseInterceptor<T>(data);
    }
    return data as ApiResponse<T>;
  } catch (err) {
    clearTimeout(timeoutId);
    errorHandler(err);
    throw err;
  }
};

export const get = <T>(
  url: string,
  params?: Record<string, unknown>,
  opts?: Omit<FetchOptions, 'method' | 'body'>
): Promise<ApiResponse<T>> => fetchRequest<T>(url, { ...opts, method: 'GET', params });

export const post = <T>(
  url: string,
  body?: unknown,
  opts?: Omit<FetchOptions, 'method' | 'body'>
): Promise<ApiResponse<T>> => fetchRequest<T>(url, { ...opts, method: 'POST', body });

export const put = <T>(
  url: string,
  body?: unknown,
  opts?: Omit<FetchOptions, 'method' | 'body'>
): Promise<ApiResponse<T>> => fetchRequest<T>(url, { ...opts, method: 'PUT', body });

export const del = <T>(
  url: string,
  params?: Record<string, unknown>,
  opts?: Omit<FetchOptions, 'method' | 'body'>
): Promise<ApiResponse<T>> => fetchRequest<T>(url, { ...opts, method: 'DELETE', params });

export const patch = <T>(
  url: string,
  body?: unknown,
  opts?: Omit<FetchOptions, 'method' | 'body'>
): Promise<ApiResponse<T>> => fetchRequest<T>(url, { ...opts, method: 'PATCH', body });

export default { get, post, put, delete: del, patch };
