import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Icon from 'react-native-vector-icons/Ionicons'

import {
  View,
  Text,
  StyleSheet,
  NativeModules,
  TouchableHighlight,
  Image
} from 'react-native';

import itypeof from 'itypeof';

const FBLoginManager = NativeModules.MFBLoginManager;

const styles = StyleSheet.create({
  login: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 20,
    borderRadius: 2,
    width: 300,
    backgroundColor: '#4265b7',
  },
  whiteFont: {
    color: 'white'
  },
  divider: {
    borderRightWidth: 10,
    borderRightColor: '#fff',
    marginHorizontal: 20
}
});

const statics = {
  loginText: 'Inicia sesión con Facebook',
  logoutText: 'Cerrar sesión de Facebook'
};

class FBLogin extends Component {
  constructor (props) {
    super(props);

    this.login = this.login.bind(this);
    this.logout = this.logout.bind(this);
    this._handleEvent = this._handleEvent.bind(this);
    this._getButtonView = this._getButtonView.bind(this);
    this.getChildContext = this.getChildContext.bind(this);
    this._onFacebookPress = this._onFacebookPress.bind(this);

    this.state = {
      statics:statics,
      isLoggedIn: false,
      buttonText: statics.loginText
    };
  }

  componentDidMount(){
    FBLoginManager.setLoginBehavior(this.props.loginBehavior)
      .then((behaviour)=>{
        console.log(`FbLogin: using ${behaviour.name} behaviour`, behaviour)
      });
    FBLoginManager.getCredentials((err, data) => {
      if (!this.mounted) return;
      if(data &&
        itypeof(data.credentials) === 'object' &&
        itypeof(data.credentials.token) === 'string' &&
        data.credentials.token.length > 0) {
        this.setState({isLoggedIn:true, buttonText: this.state.statics.logoutText});
      } else {
        this.setState({isLoggedIn:false, buttonText: this.state.statics.loginText});
      }
      this._handleEvent(null,data);
    });
    this.mounted = true;
  }

  componentWillUnmount(){
    this.mounted = false;
  }

  static childContextTypes = {
    isLoggedIn: PropTypes.bool,
    login: PropTypes.func,
    logout: PropTypes.func,
    props: PropTypes.shape({})
  }

  getChildContext () {
    return {
      isLoggedIn: this.state.isLoggedIn,
      login: this.login,
      logout: this.logout,
      props: this.props
    };

  }

  login(permissions) {
    FBLoginManager.loginWithPermissions(
      permissions || this.props.permissions,
      (err,data) => this._handleEvent(err,data)
    );
  }

  logout() {
    FBLoginManager.logout((err, data) => this._handleEvent(err, data));
  }

  _handleEvent(e, data) {
    const result = e || data;
    if(result.type === 'success' && result.profile){
      try{
        result.profile = JSON.parse(result.profile)
      } catch (err) {
        console.warn('Could not parse facebook profile: ', result.profile);
        console.error(err);
      }
    }

    if(result.eventName === 'onLogin' || result.eventName === 'onLoginFound'){
      this.setState({isLoggedIn:true, buttonText: this.state.statics.logoutText});
    } else if (result.eventName === 'onLogout'){
      this.setState({isLoggedIn:false, buttonText: this.state.statics.loginText});
    }

    if(result.eventName && this.props.hasOwnProperty(result.eventName)){
      const event = result.eventName;
      delete result.eventName;
      console.log('Triggering \'%s\' event', event)
      this.props[event](result);
    } else {
      console.log('\'%s\' Event is not defined or recognized', result.eventName)
    }
  }

  _onFacebookPress() {
    let permissions = [];
    if( itypeof(this.props.permissions) === 'array'){
      permissions = this.props.permissions;
    }

    if(this.state.isLoggedIn){
      this.logout()
    }else{
      this.login(permissions)
    }
  }

  _getButtonView () {
    const buttonText = this.props.facebookText ? this.props.facebookText:this.state.buttonText;
    return (this.props.buttonView)
      ? this.props.buttonView
      : (
        <View style={[styles.login, this.props.style]}>
          <Icon name="logo-facebook" size={32} />
          <View style={styles.divider}/>
          <Text style={[styles.whiteFont, this.fontStyle]}> {buttonText} </Text>
        </View>
      );
  }

  render(){
    return (
      <TouchableHighlight onPress={this._onFacebookPress} underlayColor={this.props.onClickColor} >
        <View style={[this.props.containerStyle]}>
          {this._getButtonView()}
        </View>
      </TouchableHighlight>
    )
  }
}

module.exports =  {
  FBLogin,
  FBLoginManager
};
