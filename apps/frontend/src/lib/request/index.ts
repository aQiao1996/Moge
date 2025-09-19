export interface ClientHandlers {
  notify?: (message: string, level?: 'info' | 'error' | 'success') => void;
  onAuthError?: () => void;
  getToken?: () => string | undefined;
  setToken?: (token: string) => void;
  removeToken?: () => void;
}

let globalHandlers: ClientHandlers = {};

export function setClientHandlers(h: ClientHandlers) {
  globalHandlers = h;
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface FetchOptions {
  method?: HttpMethod;
  headers?: Record<string, string>;
  params?: Record<string, unknown>;
  body?: unknown;
  timeout?: number;
  credentials?: RequestCredentials;
  requiresToken?: boolean; // 是否需要token, 默认为true
  silent?: boolean; // 是否静默模式，不显示Toast
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

  // 如果是后端返回的错误格式，需要转换method字段类型
  if (isErrorResponse(errorPayload)) {
    error.response = {
      ...errorPayload,
      method: (errorPayload.method as HttpMethod) || 'GET',
    };
  } else {
    error.response = {
      code: response.status,
      message:
        typeof errorPayload === 'string'
          ? errorPayload
          : `HTTP ${response.status} ${response.statusText}`,
      method: 'GET' as HttpMethod,
      path: 'unknown',
      timestamp: new Date().toISOString(),
    };
  }
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

function isErrorResponse(
  data: unknown
): data is { code: number; message: string; timestamp: string; path: string; method: string } {
  return (
    data !== null &&
    typeof data === 'object' &&
    'code' in data &&
    'message' in data &&
    'timestamp' in data &&
    'path' in data &&
    'method' in data
  );
}

const requestInterceptor = (url: string, options: FetchOptions) => {
  const { requiresToken = true } = options;
  const token: string | undefined =
    globalHandlers.getToken?.() || typeof window !== 'undefined'
      ? localStorage.getItem('auth-token') || undefined
      : undefined;
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

const errorHandler = (error: unknown, silent?: boolean): never => {
  // 静默模式下不显示Toast,交给调用方处理
  if (silent) throw error;
  // 非静默模式下显示Toast
  if (isApiError(error)) {
    const res = error.response;
    if (res) {
      // 对于所有HTTP错误，都使用后端返回的具体错误信息
      const errorMessage = res.message || `HTTP ${res.code} 错误`;
      switch (res.code) {
        case 400:
          globalHandlers.notify?.(errorMessage, 'error');
          break;
        case 401:
          globalHandlers.notify?.(errorMessage, 'error');
          globalHandlers.onAuthError?.(); // 触发认证失败回调
          break;
        case 403:
          globalHandlers.notify?.(errorMessage, 'error');
          break;
        case 404:
          globalHandlers.notify?.(errorMessage, 'error');
          break;
        case 500:
          globalHandlers.notify?.(errorMessage, 'error');
          break;
        default:
          globalHandlers.notify?.(errorMessage, 'error');
      }

      // 创建包含具体错误信息的Error对象
      const errorObj = new Error(errorMessage);
      (errorObj as ApiError).response = res;
      throw errorObj;
    } else {
      if (String(error.message).includes('timeout')) {
        globalHandlers.notify?.('请求超时', 'error');
      } else {
        globalHandlers.notify?.('网络异常，请联系管理员', 'error');
      }
    }
  } else if (error instanceof TypeError) {
    globalHandlers.notify?.(`网络异常:${error.message}`, 'error');
  } else if (error instanceof Error) {
    globalHandlers.notify?.(error.message, 'error');
  } else {
    globalHandlers.notify?.('未知错误', 'error');
  }
  throw error;
};

const fetchRequest = async <T>(
  url: string,
  options: FetchOptions = {}
): Promise<ApiResponse<T>> => {
  const { method = 'GET', headers, body, timeout = 10000, silent = false } = options;

  let reqUrl: string;
  if (typeof window === 'undefined') {
    // 服务端环境：直接请求后端服务
    const backendUrl = process.env.NEXT_APP_API_URL || 'http://localhost:8888';
    reqUrl = backendUrl + url;
  } else {
    // 客户端环境：使用代理前缀
    reqUrl = '/moge-api' + url;
  }
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
    errorHandler(err, silent);
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
