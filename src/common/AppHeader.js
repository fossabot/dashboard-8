import React, { Component } from 'react';
import {
    withRouter
} from 'react-router-dom';
import './AppHeader.css';
import { Col, Layout, Menu, Row, Input, Divider, AutoComplete } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import NotificationOutlined from '@ant-design/icons/lib/icons/NotificationOutlined';
import LogoutOutlined from '@ant-design/icons/lib/icons/LogoutOutlined';
const Header = Layout.Header;
    
class AppHeader extends Component {
  constructor(props) {
    super(props);
    this.autoCompleteSearch = this.autoCompleteSearch.bind(this);
    this.state = {
      CRDs: []
    }
    this.onSearch = this.onSearch.bind(this);
    if(this.props.api){
      if(this.props.api.CRDs){
        this.state.CRDs = this.props.api.CRDs;
      }
      this.props.api.autoCompleteCallback = this.autoCompleteSearch;
    }
  }

  autoCompleteSearch(CRDs){
    let tempCRDs = [];
    CRDs.forEach(item =>{
      tempCRDs.push({
        value: item.spec.names.kind + '@' + item.metadata.name,
        singular: item.spec.names.singular,
        name: item.metadata.name
      })
    });
    this.setState({CRDs: tempCRDs});
  }

  onSearch(value){
    let CRD = this.state.CRDs.find(item=>{
      if(item.value === value || item.singular === value){
        return item;
      }
    });
    if(CRD){
      this.props.history.push("/customresources/" + CRD.name);
    }
  }

  componentDidMount() {
    this.autoCompleteSearch(this.state.CRDs);
  }

  render() {
      const options = this.state.CRDs;

      let menuItems;

      menuItems =
      [
        <Menu.Item key="/">
          <NotificationOutlined style={{ fontSize: '20px' }} />
        </Menu.Item>,
        <Menu.Item key="/question">
          <QuestionCircleOutlined style={{ fontSize: '20px' }} />
        </Menu.Item>
      ];

      if(this.props.logged){
        menuItems.push(
          <Menu.Item key="logout" >
            <LogoutOutlined style={{ fontSize: '20px', color: 'rgba(220,21,21,0.79)' }}
                            onClick={() => {
                              if(this.props.authManager.OIDC)
                                this.props.authManager.logout();
                              else{
                                this.props.tokenLogout();
                              }
                            }} />
          </Menu.Item>
        )
      }

      return (
        <div>
          <Header className="app-header">
            <div className="container">
              <Row className="app-title" align="middle">
                <Col>
                  <div aria-label={'autocompletesearch'}>
                    <AutoComplete
                      filterOption={(inputValue, option) =>
                        option.name.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                      }
                      options={options}
                      onSelect={this.onSearch}
                      style={{ width: '22vw', marginLeft: 5, lineHeight: '31px' }}
                    >
                      <Input.Search placeholder="input CRD" enterButton onSearch={this.onSearch} allowClear />
                    </AutoComplete>
                  </div>
                </Col>
              </Row>
            </div>
          </Header>
          <Menu
            className="app-menu"
            mode="horizontal"
            style={{ lineHeight: '64px' }} >
            {menuItems}
          </Menu>
        </div>
      );
    }
}

export default withRouter(AppHeader);
