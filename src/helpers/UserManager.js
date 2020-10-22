import AsyncStorage from '@react-native-community/async-storage';

import SJCC_User from '../models/SJCC_User';

const USER = '_sjcc_userdata';

class UserManager {
  createUser = (userinfo) => {
    if (! userinfo || ! userinfo.profile || ! userinfo.profile.email) {
      return null;
    }

    userinfo = Object.assign({}, userinfo);
    return new SJCC_User(userinfo);
  }

  fromStorage = async () => {
    try {
      const data = await AsyncStorage.getItem(USER);
      const userinfo = JSON.parse(data);

      return this.createUser(userinfo);
    } catch (e) {
      console.error('[User]', e);
    }
  }

  persist = async (user) => {
    try {
      user = this.createUser(user);
      if (! user) {
        await AsyncStorage.removeItem(USER);
        return;
      }

      user = JSON.stringify(user);
      await AsyncStorage.setItem(USER, user);
    } catch (e) {
      console.error('[User]', e);
    }
  }
}

export default UserManager;
