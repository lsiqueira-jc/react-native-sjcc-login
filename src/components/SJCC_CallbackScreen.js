import React, { Component } from 'react';

import { ActivityIndicator, View } from 'react-native';
import { SJCC_Login } from '@react-native-sjcc-login';

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

class SJCC_CallbackScreen extends Component {
  code

  constructor(props) {
    super(props);

    this.process();
  }

  process() {
    this.code = this.props.code || this.getCode();

    const onSuccess = this.props.onSuccess || this.onSuccess;
    const onError = this.props.onError || this.onError;

    if (! this.code) {
      onError.call(this);
      return;
    }

    SJCC_Login.processCodeToToken(this.code).then((success) => {
      success ? onSuccess.call(this) : onError.call(this);
    });
  }

  getCode() {
    console.error('You must implement getCode on extending "SJCC_CallbackScreen" component.');
  }

  async onSuccess() {
    console.error('You must implement getCode on extending "SJCC_CallbackScreen" component.');
  }

  async onError() {
    console.error('You must implement getCode on extending "SJCC_CallbackScreen" component.');
  }

  render() {
    if (! this.code) {
      return (null);
    }

    return (
      <View style={ loadingContainerStyle }>
        <ActivityIndicator size="large" color="#f61f1f"/>
      </View>
    );
  }
};

export default SJCC_CallbackScreen;
