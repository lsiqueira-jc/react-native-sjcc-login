import React, { Component } from 'react';

import { Text, View, Button } from 'react-native';
import AsyncStorage from '@react-native-community/async-storage';

import Tokens from '../helpers/Tokens';
import UserManager from '../helpers/UserManager';

const environments = {
  local: 'https://signin-wall.jc.localtest.me/api/v2/auth',
  staging: 'https://signin-wall-staging.accounts.ne10.com.br/api/v2/auth',
  production: 'https://signin-wall.accounts.ne10.com.br/api/v2/auth'
};

class SJCC_LoginManager {
  initialized = false;

  init(config) {
    // Check Api Token
    if (! config.apiToken) {
      console.error('The "apiToken" is missing from SJCC_Login.init');
    }

    this.config = config;

    // Make sure type is a integer
    this.config.type = parseInt(config.type || '1');

    // Set Base URL
    config.env = (config.env || 'staging').toString().toLowerCase();
    this.baseUrl = environments[config.env] || environments['staging'];

    // User
    this.user = null;
    this.usermanager = new UserManager();

    manager.initialized = true;
  }

  buildUrl = (path, parameters) => {
    const url = new URL(path, this.baseUrl);
    url.searchParams.append('api_token', this.config.apiToken);
    url.searchParams.append('type', this.config.type);

    if (parameters) {
      for (let parameter in parameters) {
        if (! parameter || ! parameters[parameter]) continue;
        url.searchParams.append(parameter, parameters[parameter]);
      }
    }

    return url.href;
  }

  getUser = async (refresh) => {
    if (refresh) {
      await this.refreshUser();
      return this.user;
    }

    // Try from storage
    if (! this.user) {
      this.user = await this.usermanager.fromStorage();
    }

    // Try from server (even if refresh is false)
    if (! this.user) {
      await this.refreshUser();
    }

    return this.user;
  }

  setUser = async (userinfo) => {
    this.user = await this.usermanager.createUser(userinfo);
    await this.usermanager.persist(this.user);
  }

  refreshUser = async () => {
    const accessToken = await Tokens.getAccessToken();

    if (! accessToken) {
      await Tokens.forgetTokens();
      this.setUser(null);

      return false;
    }

    const refreshToken = await Tokens.getRefreshToken();
    const userinfo = await this.getUserinfo({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (userinfo) {
      this.setUser(userinfo);
      return true;
    }

    await Tokens.forgetTokens();
    this.setUser(null);
    return false;
  }

  isLoggedIn = async (refresh) => {
    const user = await this.getUser(refresh);
    return user ? true : false;
  }

  getUserinfo = async (tokens) => {
    if (! tokens || ! tokens.access_token) return false;

    const url = this.buildUrl('/userinfo');
    const params = {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: 'Bearer ' + manager.config.apiToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tokens)
    };

    return fetch(url, params)
      .then((response) => response.json())
      .then((responseJson) => {
        if (! responseJson.access_token || ! responseJson.profile) {
          console.warn('[Auth API]', responseJson);
          return false;
        }

        return Tokens.saveTokens(responseJson).then(() => {
          return {
            profile: responseJson.profile,
            userdata: responseJson.userdata
          };
        });
      })
      .catch((error) => {
        console.error(error);
      });
  }

  logout = async () => {
    await Tokens.forgetTokens();
    await this.setUser(null);

    return true;
  }
};

const manager = new SJCC_LoginManager();

const SJCC_Login = {
  init: (args) => {
    if (manager.initialized) {
      console.error('Você só pode configurar o login uma vez.');
    }

    if (typeof args === 'string') {
      args = { apiToken: args };
    }

    manager.init(args);
  },

  getAccountUrl: () => manager.buildUrl('/account'),
  getRegisterUrl: () => manager.buildUrl('/register'),

  getLoginUrl: (redirectUrl) => {
    const parameters = redirectUrl ? {'redirect_url': redirectUrl} : null;
    return manager.buildUrl('/', parameters);
  },

  getUser: async (refresh) => {
    return manager.getUser(refresh);
  },

  getTokens: async () => {
    const accessToken = await Tokens.getAccessToken();
    const refreshToken = await Tokens.getRefreshToken();

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  },

  isLoggedIn: async (refresh) => {
    return manager.isLoggedIn(refresh);
  },

  logout: async () => {
    const accessToken = await Tokens.getAccessToken();
    const refreshToken = await Tokens.getRefreshToken();

    if (! accessToken && ! refreshToken) {
      return manager.logout();
    }

    const url = manager.baseUrl + '/logout';
    const params = {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: 'Bearer ' + manager.config.apiToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        'access_token': accessToken,
        'refresh_token': refreshToken
      })
    };

    return manager.logout().then(() => {
      return fetch(url, params)
        .then((response) => response.json())
        .then((responseJson) => {
          if (typeof responseJson !== 'object') {
            responseJson = {};
          }

          if (! responseJson.success) {
            responseJson.message = responseJson.message || 'Error';
            throw responseJson;
          }

          return true;
        })
        .catch((error) => {
          console.log(error);
        });
    });
  },

  processCodeToToken: async (code) => {
    if (! code) return false;

    const url = manager.baseUrl + '/token';
    const params = {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: 'Bearer ' + manager.config.apiToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        'code': code
      })
    };

    return fetch(url, params)
      .then((response) => response.json())
      .then((responseJson) => {
        if (! responseJson.access_token) {
          console.warn('[Auth API]', responseJson);
          return false;
        }

        return manager.getUserinfo(responseJson)
          .then((userinfo) => {
            if (! userinfo) {
              return manager.logout();
            }

            manager.setUser(userinfo);
            return Tokens.saveTokens(responseJson).then(() => true);
          });
      })
      .catch((error) => {
        console.error(error);
      });
  },

  processLoginPostMessage: async (message) => {
    if (typeof message === 'string') {
      message = JSON.parse(message);
    }

    if (! message.access_token || ! message.profile) {
      return false;
    }

    await Tokens.saveTokens(message);
    await manager.setUser(message);

    return true;
  },
}

export default SJCC_Login;
