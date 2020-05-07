
import React from 'react';
import {
  View,
  Modal,
  Button,
  Alert,
  Dimensions,
  TouchableOpacity,
  Text,
} from 'react-native';
import CookieManager from 'react-native-cookies';
import WebView from 'react-native-webview';
import AsyncStorage from '@react-native-community/async-storage';
let Dim = {
  width: Dimensions.get('window').width,
  height: Dimensions.get('window').height,
};

class credentials {
  clientId: string;
  clientSecret: string;
  scope: string;
  response_type: string;
  state: string;
  redirect_uri: string;

  constructor(
    _clientId: string,
    _clientSecret: string,
    _scope: string,
    _response_type: string,
    _state: string,
    _redirect_uri: string,
  ) {
    this.clientId = _clientId;
    this.clientSecret = _clientSecret;
    this.scope = _scope;
    this.response_type = _response_type;
    this.state = _state;
    this.redirect_uri = _redirect_uri;
  }
}

const config: credentials = {
  clientId: '<Redacted>',
  clientSecret: '<Redacted>',
  scope: 'r_emailaddress,r_liteprofile,w_member_social',
  response_type: 'code',
  state: '<Redacted>',
  redirect_uri: '<Redacted>',
};

function getURLForAuth(_config: credentials): string {
  let _baseURL = 'https://www.linkedin.com/oauth/v2/authorization?';
  _baseURL += 'client_id=' + _config.clientId + '&'; // adding clientID
  _baseURL += 'response_type=' + _config.response_type + '&'; //adding response type
  _baseURL += 'redirect_uri=' + _config.redirect_uri + '&'; //add redirect uri
  _baseURL += 'state=' + _config.state + '&'; // add state
  _baseURL += 'scope=' + _config.scope; // add scopes
  return _baseURL;
}

class App extends React.Component<any, any> {
  state = {
    showLoginWebview: false,
    linkedIn_Code: null,
    linkedin_accessToken: null,
    linkedin_expiresIn: null,
  };
  _handleNav = (obj: any) => {
    var url = decodeURIComponent(obj.url);
    const hashes = url.slice(url.indexOf('?') + 1).split('&');
    const params: any = {};
    hashes.map((hash) => {
      const [key, val] = hash.split('=');
      params[key] = decodeURIComponent(val);
    });
    hashes.forEach((value) => {
      const [key, val] = value.split('=');
      console.log(key, decodeURIComponent(val));
      params[key.replace('"', '')] = decodeURIComponent(val);
    });
    if (params.code) {
      console.log({token: params.code, status: 'sucess'});
      this.setState({showLoginWebview: false, linkedIn_Code: params.code});
      CookieManager.clearAll();
      this.fetchAcessToken(params.code, config);
    } else if (params.error) {
      alert(
        'Error occured : ' +
          params.error +
          '\nError Description: ' +
          params.error_description,
      );
      CookieManager.clearAll();
    }
  };
  render(): any {
    return (
      <View style={{flex: 1}}>
        {this.state.showLoginWebview ? (
          <Modal
            animationType="fade"
            transparent={true}
            visible={this.state.showLoginWebview}
            onRequestClose={() => {
              CookieManager.clean();
              this.setState({
                showLoginWebview: false,
              });
            }}
            hardwareAccelerated={true}>
            <View
              style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'rgba(0,0,0,0.75)',
                back: 0.5,
              }}>
              <View
                style={{
                  flex: 1,
                  borderRadius: 40,
                }}>
                <WebView
                  source={{uri: getURLForAuth(config)}}
                  style={{
                    maxHeight: Dim.height * 0.9,
                    width: Dim.width * 0.9,
                    maxWidth: Dim.width * 0.9,
                  }}
                  onNavigationStateChange={this._handleNav}
                />
              </View>
              <TouchableOpacity
                style={{
                  backgroundColor: 'orange',
                  height: Dim.height * 0.05,
                  width: Dim.width * 0.75,
                  margin: 10,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onPress={() => {
                  CookieManager.clean();
                  this.setState({
                    showLoginWebview: false,
                  });
                }}>
                <Text
                  style={{
                    fontSize: Dim.height * 0.04 - 20,
                    color: 'white',
                  }}>
                  CLOSE
                </Text>
              </TouchableOpacity>
            </View>
          </Modal>
        ) : null}
        {this.state.linkedin_accessToken ? (
          <Button
            title="logout"
            onPress={async () => {
              this.setState({linkedin_accessToken: null});
              await AsyncStorage.setItem('linkedinAccessToken', '');
            }}
          />
        ) : (
          <Button
            title="login"
            onPress={() =>
              this.setState({
                showLoginWebview: true,
              })
            }
          />
        )}
      </View>
    );
  }

  fetchAcessToken = async (codeVal: string, _config: credentials) => {
    let _string =
      'grant_type=authorization_code&' +
      'code=' +
      codeVal +
      '&redirect_uri=' +
      _config.redirect_uri;
    _string +=
      '&client_id=' +
      _config.clientId +
      '&client_secret=' +
      _config.clientSecret;
    const returnValue: any = await fetch(
      'https://www.linkedin.com/oauth/v2/accessToken',
      {
        method: 'POST',
        body: _string,
        headers: {
          'Content-type': 'application/x-www-form-urlencoded',
        },
      },
    ).catch((error: any) => {
      console.log(error);
    });
    const result: any = await returnValue.json();
    console.log(result);
    this.setState({
      linkedin_accessToken: result.access_token,
      linkedin_expiresIn: result.expires_in,
    });
    await AsyncStorage.setItem('linkedinAccessToken', result.access_token, () =>
      alert('Login Successful'),
    ).catch((error: any) => console.log(error));
    await AsyncStorage.setItem(
      'linkedinExpiresIn',
      result.expires_in.toString(),
    ).catch((error) => console.log(error));
  };
  async componentDidMount(): Promise<any> {
    this.setState({
      linkedin_accessToken: await AsyncStorage.getItem('linkedinAccessToken'),
      linkedin_expiresIn: await AsyncStorage.getItem('linkedinExpiresIn'),
    });
    console.log(
      await AsyncStorage.getItem('linkedinAccessToken'),
      await AsyncStorage.getItem('linkedinExpiresIn'),
    );
  }
}

export default App;
