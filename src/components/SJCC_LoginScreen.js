import React, { Component } from 'react';

import { ActivityIndicator, Alert, BackHandler, Platform, View } from 'react-native';
import { WebView, } from 'react-native-webview';

import SJCC_Login from '../models/SJCC_Login';

const environment = process.env.NODE_ENV || '';

const loadingContainerStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  backgroundColor: '#FFFFFF',
  zIndex: 9,
  flex: 1,
  justifyContent: 'center',
  flexDirection: 'row',
  justifyContent: 'space-around',
  padding: 10
};

class SJCC_LoginScreen extends Component {
  webview = {}
  removeLoading = false;

  constructor(props) {
    super(props);

    this.state = {
      loading: true,
      canGoBack: false,
      source: SJCC_Login.getLoginUrl()
    };
  }

  componentDidMount() {
    if (environment === 'development' && Platform.OS === 'android') {
      console.log('Clearing cache');
      this.getWebView().clearCache(true);
    }

    this.backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (this.state.canGoBack) {
        this.getWebView().goBack();
        return true;
      }

      return false;
    });
  }

  componentWillUnmount() {
    this.backHandler.remove();
  }

  getWebView() {
    return this.refs['MAIN_WEBVIEW'];
  }

  /**
   * Try to change the userAgent to make Google login works
   * @link: https://developer.chrome.com/multidevice/user-agent#webview_user_agent
   *
   * @return string
   */
  createUserAgent() {
    if (! navigator || ! navigator.userAgent) {
      return 'Mozilla/5.0 (Linux; Android 9; Android SDK built for x86 Build/PSR1.180720.093) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Mobile Safari/537.36';
    }

    const ua = navigator.userAgent;

    if (Platform.OS === 'android') {
      return ua.replace(/[;]*\s*(wv)\s*/, '').replace(/Version\/([0-9]*\.[0-9]*)/, '');
    }

    return ua;
  }

  async onLoginSuccess() {}
  async onLoginError(response) {}

  render() {
    this.props.style || {}

    // Loading view is the default behaviour
    if (! this.removeLoading) {
      this.webview.startInLoadingState = true;
      this.webview.renderLoading = () => {
        if (! this.state.loading) {
          return null;
        }

        return (
          <View style={ loadingContainerStyle }>
            <ActivityIndicator size="large" color="#f61f1f"/>
          </View>
        )
      };
    }

    // On Message cannot be override
    this.webview.onMessage = (syntheticEvent) => {
      const { nativeEvent } = syntheticEvent;

      const data = JSON.parse(nativeEvent.data);

      if (data && data.ready) {
        this.setState({ loading: false });
        return;
      }

      if (data && data.link && data.provider && data.provider === 'google') {
        this.setState({ source: data.link });
        return;
      }

      if (! data.access_token) {
        return;
      }

      SJCC_Login.processLoginPostMessage(data).then((success) => {
        success ? this.onLoginSuccess.call(this) : this.onLoginError.call(this, data);
      });
    }

    this.webview.userAgent = this.createUserAgent();

    this.webview.onNavigationStateChange = (navState) => {
      this.setState({ canGoBack: navState.canGoBack });
    };

    return (
      <WebView
        ref={'MAIN_WEBVIEW'}
        source={{ uri: this.state.source }}
        style={[{ margin: 0, padding: 0, width: '100%', height: '100%' }, this.webview.style || this.props.style || {}]}

        {...this.webview}
      />
    );
  }
}

export default SJCC_LoginScreen;
