import React, { Component } from 'react';
import { Link, withRouter } from 'react-router-dom';
import { Layout, Menu, Typography } from 'antd';
import DesktopOutlined from '@ant-design/icons/lib/icons/DesktopOutlined';
import './SideBar.css';
import DashboardOutlined from '@ant-design/icons/lib/icons/DashboardOutlined';
import SettingOutlined from '@ant-design/icons/lib/icons/SettingOutlined';
import LayoutOutlined from '@ant-design/icons/lib/icons/LayoutOutlined';
import StarOutlined from '@ant-design/icons/lib/icons/StarOutlined';
import { APP_NAME } from '../constants';

const Sider = Layout.Sider;

class SideBar extends Component {
  constructor(props) {
    super(props);

    this.state = {
      favourites: [],
      customViews: [],
      collapsed: false
    }
    this.getFavourite = this.getFavourite.bind(this);
    this.getCustomViews = this.getCustomViews.bind(this);
    this.onCollapse = this.onCollapse.bind(this);
  }

  componentDidMount() {
    if(this.props.api){
      /** set customView array */
      this.props.api.CVArrayCallback.push(this.getCustomViews);
      this.state.customViews = this.props.api.customViews;

      /** set favourite array */
      this.props.api.sidebarCallback = this.getFavourite;
      this.state.favourites = this.props.api.CRDs.filter(item => {
        return item.metadata.annotations && item.metadata.annotations.favourite;
      })
    }
  }

  getFavourite(CRDs){
    this.setState({favourites: CRDs});
  }

  getCustomViews(customViews){
    this.setState({customViews: customViews});
  }

  onCollapse(collapsed){
    this.setState({collapsed: collapsed});
  }

  render() {
    let cv = [];
    let fav = [];

    /** If there are custom views, show them in the sider */
    if(this.state.customViews.length !== 0) {
      this.state.customViews.forEach(item => {
        cv.push(
          <Menu.Item key={item.metadata.name} style={{ marginTop: 8}}>
            <Link to={{
              pathname: '/customview/' +  item.metadata.name,
              }}>
              <LayoutOutlined style={{ fontSize: '20px' }} />
              {
                item.spec.name ? (
                  <span>{ item.spec.name }</span>
                ) : (
                  <span>{ item.metadata.name }</span>
                )
              }
            </Link>
          </Menu.Item>
        )
      });
    }

    /** If there are favourite CRDs, show them in the sider */
    if(this.state.favourites.length !== 0) {
      this.state.favourites.forEach(item => {
        fav.push(
          <Menu.Item key={item.metadata.name} style={{ marginTop: 8}}>
            <Link to={{
              pathname: '/customresources/' +  item.metadata.name}}
            >
              <span>{item.spec.names.kind}</span>
            </Link>
          </Menu.Item>
        )
      });
    }

    return (
      <div>
        <Sider className="sidebar" width={250}
               theme={'light'}
               collapsible collapsed={this.state.collapsed}
               onCollapse={this.onCollapse}
               breakpoint="lg"
        >
          <div className="app-title" align="middle">
              <img src={require('../assets/logo_4.png')}
                   className="image" alt="image"
                   style={this.state.collapsed ? {marginLeft: 22} : null}
              />
              {!this.state.collapsed ? (
                {/*<Link to="/">
                  <Title level={3} style={{color: '#326be2'}} className="title" ellipsis>{APP_NAME}</Title>
                </Link>*/},
                <img src={require('../assets/name.png')}
                     alt="image"
                     style={{height: 30, width: 120, marginTop: 17}}
                />
              ) : null}
          </div>
          <Menu mode="inline" defaultOpenKeys={['sub_fav']}
                defaultSelectedKeys={'1'} style={{ marginTop: 16}}>
            <Menu.Item key="1">
              <Link to="/">
                <DashboardOutlined style={{ fontSize: '20px' }} />
                <span>Home</span>
              </Link>
            </Menu.Item>
            <Menu.Divider/>
            {cv}
            {cv.length ? <Menu.Divider/> : null}
            <Menu.Item key="2" style={{ marginTop: 8}}>
              <Link to="/customresources">
                <DesktopOutlined style={{ fontSize: '20px' }} />
                <span>Custom Resources</span>
              </Link>
            </Menu.Item>
            <Menu.SubMenu key={"sub_fav"}
                          icon={<StarOutlined style={{ fontSize: '20px' }} />}
                          title={'Favourites'}
            >
              {fav}
            </Menu.SubMenu>
            <Menu.Divider/>
            <Menu.Item key="3" style={{ marginTop: 8}}>
              <Link to="/settings">
                <SettingOutlined style={{ fontSize: '20px' }} />
                <span>Settings</span>
              </Link>
            </Menu.Item>
          </Menu>
        </Sider>
      </div>
    );
  }
}

export default withRouter(SideBar);
