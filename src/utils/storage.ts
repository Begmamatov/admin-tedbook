import * as SessionKeys from 'src/constants/session-constants';

export const getFromStorage = (key: string) =>
  sessionStorage.getItem(key) || localStorage.getItem(key);

export class TokenService {
  static getToken() {
    return sessionStorage.getItem(SessionKeys.TOKEN);
  }

  static setToken(token: string) {
    sessionStorage.setItem(SessionKeys.TOKEN, token);
  }

  static getRefreshToken() {
    return sessionStorage.getItem(SessionKeys.REFRESH_TOKEN);
  }

  static setRefreshToken(refreshToken: string) {
    sessionStorage.setItem(SessionKeys.REFRESH_TOKEN, refreshToken);
  }

  static clearTokens() {
    sessionStorage.removeItem(SessionKeys.TOKEN);
    sessionStorage.removeItem(SessionKeys.REFRESH_TOKEN);
  }
}
