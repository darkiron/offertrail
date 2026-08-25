import axios, {
  AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';

type ApiErrorBody = {
  code?: unknown;
  detail?: unknown;
  message?: unknown;
};

export class ApiError extends AxiosError {
  readonly apiCode?: string;
  readonly details?: unknown;

  constructor(options: {
    message: string;
    code?: string;
    status?: number;
    apiCode?: string;
    details?: unknown;
    config?: InternalAxiosRequestConfig;
    request?: unknown;
    response?: AxiosResponse;
    cause?: unknown;
  }) {
    super(
      options.message,
      options.code,
      options.config,
      options.request,
      options.response,
    );
    this.name = 'ApiError';
    this.status = options.status;
    this.apiCode = options.apiCode;
    this.details = options.details;
    this.cause = options.cause instanceof Error ? options.cause : undefined;
  }
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (!axios.isAxiosError(error)) {
    return new ApiError({ message: 'Unexpected client error', cause: error });
  }

  const body = error.response?.data as ApiErrorBody | undefined;
  const serverMessage =
    typeof body?.message === 'string'
      ? body.message
      : typeof body?.detail === 'string'
        ? body.detail
        : undefined;

  return new ApiError({
    message: serverMessage ?? error.message ?? 'Request failed',
    code: error.code,
    status: error.response?.status,
    apiCode: typeof body?.code === 'string' ? body.code : undefined,
    details: body?.detail,
    config: error.config,
    request: error.request,
    response: error.response,
    cause: error,
  });
}
