import React, { Component } from 'react';
import './App.css';
import {
  Route,
  withRouter,
  Switch, Redirect
} from 'react-router-dom';
import CRDList from '../CRD/CRDList';
import AppHeader from '../common/AppHeader';
import SideBar from '../common/SideBar';
import AppFooter from '../common/AppFooter';
import { Layout, notification, message } from 'antd';
import DashboardGeneral from '../dashboard/DashboardGeneral';
import NewCR from '../editors/NewCR';
import CustomView from '../views/CustomView'
import UpdateCR from '../editors/UpdateCR';
import ApiManager from '../services/ApiManager';
import CRD from '../CRD/CRD';
import DesignEditorCRD from '../editors/DesignEditorCRD';
import Authenticator from '../services/Authenticator';
import ErrorRedirect from '../error-handles/ErrorRedirect';

const { Content } = Layout;

function CallBackHandler(props) {
  props.func()
  return <div></div>
}

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      logged: false,
      api: null,
      user: {}
    }

    /** set global configuration for notifications and alert*/
    this.setGlobalConfig();

    /** all is needed to manage an OIDC session */
    this.manageOIDCSession();
  }

  render() {
    /** Always present routes */
    const routes = [
      <Route key={'login'}
             exact path="/login"
             render={() => {
               this.authManager.login();
             }}
      />,
      <Route key={'callback'}
             path="/callback"
             render={() => this.state.logged ? (
               <Redirect to="/" />
             ) : ( <CallBackHandler func={this.authManager.completeLogin} />)}
      />,
      <Route key={'logout'}
             path="/logout">
        <Redirect to="/login" />
      </Route>,
      <Route key={'error'}
             path="/error/:statusCode"
             component={(props) => <ErrorRedirect {...props} logout={this.authManager.logout} />}
      />
    ]

    /** Routes present only if logged in and apiManager created */
    if(this.state.api && this.state.logged){
      routes.push([
        <Route key={'/'}
               exact path="/"
               render={(props) =>
                 <DashboardGeneral {...props} api={this.state.api} user={this.state.user}/>
               }/>,
        <Route key={'customresources'}
               exact path="/customresources"
               component={(props) =>
                 <CRDList {...props} api={this.state.api} />
               }/>,
        <Route key={'crd'}
               exact path="/customresources/:crdName"
               component={(props) =>
                 <CRD {...props} api={this.state.api} />
               }/>,
        <Route key={'customview'}
               exact path="/customview/:viewName/"
               component={(props) =>
                 <CustomView {...props} api={this.state.api} />
               }/>
      ])
    } else {
      routes.push([
      <Route key={'*'}
             path="*">
        <Redirect to={'/login'} />
      </Route>])
    }

    return (
        <Layout>
          {this.state.api ? (
              <SideBar api={this.state.api} />
          ) : null}
          <Layout>
            {this.state.api ? (
              <AppHeader
                api={this.state.api}
                logout={this.authManager.logout}
                logged={this.state.logged}
              />) : null}
              <Content className="app-content">
                <Switch>
                  {routes}
                </Switch>
              </Content>
              <AppFooter />
            </Layout>
        </Layout>
    );
  }

  setGlobalConfig() {
    /** global notification config */
    notification.config({
      placement: 'bottomLeft',
      bottom: 30,
      duration: 3,
    });

    /** global message config */
    message.config({
      top: 10
    });
  }

  manageOIDCSession() {
    /** Check if previously logged */
    const retrievedSessionToken = JSON.parse(
      sessionStorage.getItem(`oidc.user:${OIDC_PROVIDER_URL}:${OIDC_CLIENT_ID}`)
    );
    if (retrievedSessionToken) {
      let api = new ApiManager({ id_token: retrievedSessionToken.id_token,
        token_type: retrievedSessionToken.token_type || 'Bearer'});
      this.state = {
        user: retrievedSessionToken.profile,
        logged: true,
        api: api
      };
      /** Get the CRDs at the start of the app */
      this.state.api.loadCustomViewsCRs();
      this.state.api.getCRDs().catch(error => {
        console.log(error);
        if(error.response)
          this.props.history.push("/error/" + error.response.statusCode);
      });
    }

    this.authManager = new Authenticator();
    this.authManager.manager.events.addUserLoaded(user => {
      let api = new ApiManager(user);
      this.setState({
        logged: true,
        api: api,
        user: user.profile
      });
      this.state.api.loadCustomViewsCRs();
      /** Get the CRDs at the start of the app */
      this.state.api.getCRDs().catch(error => {
        console.log(error);
        if(error.response)
          this.props.history.push("/error/" + error.response.statusCode);
      });
    });

    /** Refresh token (or logout is silent sign in is not enabled) */
    this.authManager.manager.events.addAccessTokenExpiring(() => {
      this.authManager.manager.signinSilent().then(user => {
        this.state.api.refreshConfig(user);
        this.setState({logged: true});
      }).catch((error) => {
        console.log(error);
        localStorage.clear();
        this.props.history.push("/logout");
      });
    });
  }
}

export default withRouter(App);
