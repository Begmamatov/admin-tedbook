import Axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import { buildParams } from './helpers';
import { TokenService } from 'src/utils/storage';

const API_URL = process.env.VITE_API_URL;

declare module 'axios' {
  export interface AxiosRequestConfig {
    _retry?: boolean;
    unhandled?: boolean;
  }
}

export class HTTPError extends Error {
  constructor(
    public status: number,
    public cause: string
  ) {
    super(cause);
  }
}
export class BaseClient {
  private baseUrl = API_URL;
  private axios: AxiosInstance;

  constructor() {
    this.axios = Axios.create({
      baseURL: this.baseUrl,
    });

    this.axios.interceptors.request.use((req: InternalAxiosRequestConfig) => {
      // const token = TokenService.getToken()
      if (true) {
        req.headers = req.headers || {};
        req.headers['Authorization'] =
          `Bearer ${`eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3OTZiMmFmNi0zMzRlLTQ1ZTgtODY0Ny1hOWMzODM1Yjk4ZGUiLCJyZWZyZXNoLWV4cGlyZSI6MTcyNTk2NzQ3OSwicm9sZXMiOlsiUk9MRV9VU0VSIl0sImp0aSI6IjJkYmRmMjc5LTFlYjAtNDNkNy05OWUxLTNkZTI1MzhiZDExZiIsImlhdCI6MTcyNTk2NDI3OSwiaXNzIjoiUGhhcm0tYWdlbmN5IiwiZXhwIjoxNzI1OTY2MDc5fQ.D77UHefajcI1jrGqKNMqM4X4cqk03fnU21_HvWID67LuxJy7ATP2Rr-Ba0sjuQIz1CoUnvq5L1NnqXVe2TwLJO_AKXWSKmJAacjQ5wlWdph9lvGi7_oocDMxjU5hF3WWXji492Z-QcoYUdlW52PZ9dWYGjYjGT4zR7vyL3w-ubxo3IAUBHwjzEQdKeSXToKuh5uriS5YaiwqQhiOYG9VmhxxhT9HZE8ijzvMSFuKBTMGiQ3FSILF03AIhhLyh5sZ8BwExg7RBl_07jGeRnJ0iGyQHv_W2dS9HZfqTn4uAagbcIs2Fsbesf0272f88NoB8gbUp9V236BhnCqSdUhrVw`}`;
      }
      return req;
    });

    this.axios.interceptors.response.use((response: any) => response, this.onApiError);
  }

  private onApiError = async (error: AxiosError) => {
    const originalRequest = error.config;

    if (originalRequest && !originalRequest._retry && !originalRequest.unhandled) {
      switch (error.response?.status) {
        case 401:
          return this.handleUnauthorized(error);
        case 502:
          // return this.handleServerError(error);
          return Promise.reject(error);
      }
    }

    console.warn(error.response);
    return Promise.reject(error);
  };

  private handleUnauthorized = async (error: AxiosError) => {
    try {
      const originalRequest = error.config;
      if (originalRequest) {
        originalRequest._retry = true;
      }

      const refreshToken = TokenService.getRefreshToken();

      if (refreshToken) {
        const response = await this.axios.post('/auth/refresh', { refreshToken });

        const newAccessToken = response.data.accessToken;
        this.setAccessToken(newAccessToken);

        if (originalRequest) {
          originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
          return this.axios(originalRequest);
        }
      }
      return Promise.reject(error);
    } catch (refreshError) {
      console.warn('refreshError', refreshError);
      return Promise.reject(error);
    }
  };

  // private handleServerError = async (error: AxiosError) => {
  //   try {
  //     const res = await profileAPI.checkServerStatus();

  //     if (res) {
  //       const originalRequest = error.config;
  //       originalRequest._retry = true;
  //       return this.axios(originalRequest);
  //     }

  //     return Promise.reject(error);
  //   } catch (serverError) {
  //     console.warn('API ERROR', serverError);

  //     navigationService.reset(Routes.SERVER_ERROR_MODAL);

  //     return Promise.reject(error);
  //   }
  // };

  setAccessToken = (token: string) => {
    const newToken = `Bearer ${token}`;
    this.axios.defaults.headers.common.Authorization = newToken;

    return newToken;
  };

  get = async <T, K, C>(url: string, params?: K, config?: C): Promise<AxiosResponse<T>> => {
    const queryParams = params ? buildParams(params) : '';
    return this.axios.get(url + queryParams, {
      ...config,
    });
  };

  delete = async <T, K>(url: string, data?: K): Promise<AxiosResponse<T>> =>
    this.axios.delete(url, { params: data });

  post = async <T, K>(
    url: string,
    data?: K,
    config?: AxiosRequestConfig<K>
  ): Promise<AxiosResponse<T>> => this.axios.post(url, data, config);

  patch = async <T, K>(url: string, data?: K): Promise<AxiosResponse<T>> =>
    this.axios.patch(url, data);
}

export const baseApiClient = new BaseClient();
