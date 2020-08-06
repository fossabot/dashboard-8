import React, { Component } from 'react';
import Utils from '../../services/Utils';
import { withTheme } from '@rjsf/core';
import { Theme as AntDTheme } from '@rjsf/antd';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/mode-yaml';
import 'ace-builds/src-noconflict/theme-github';
import { Button, message, notification, Tabs, Typography } from 'antd';
import { widgets } from './CustomWidget';
import { CustomArrayFieldTemplate, fields, fieldsView } from './CustomField';
import { json } from 'generate-schema';
import CustomFieldTemplateViewer from './CustomFieldTemplateViewer';
import { APP_NAME } from '../../constants';
import CustomFieldTemplate from './CustomFieldTemplate';

const Form = withTheme(AntDTheme);

class FormViewer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      CRD: this.props.CRD,
      showButton: false
    };

    this.submit = this.submit.bind(this);

    this.util = new Utils();

    if(this.props.status){
      try{
        this.schema = this.util.OAPIV3toJSONSchema(this.props.CRD.spec.validation.openAPIV3Schema).properties.status;
      }catch{}
      this.schema = json(this.props.CR.status);
      delete this.schema.$schema;
    }else{
      try{
      this.schemaReal = this.util.OAPIV3toJSONSchema(this.props.CRD.spec.validation.openAPIV3Schema).properties.spec;
      }catch{}
      this.schema = json(this.props.CR.spec);
      delete this.schema.$schema;

      // console.log(this.schema);

      /**
       * This set the real schema properties to the leaves
       * of the autogenerated schema
       */
      this.util.setRealProperties(this.schema, this.schemaReal);
    }
  }

  submit(value){
    let item = {
      spec: value.formData
    }

    let namespace = null;

    if(this.props.CR.metadata.namespace){
      namespace = this.props.CR.metadata.namespace;
    }

    let promise = this.props.api.updateCustomResource(
      this.props.CRD.spec.group,
      this.props.CRD.spec.version,
      namespace,
      this.props.CRD.spec.names.plural,
      this.props.CR.metadata.name,
      item
    );

    promise
      .catch((error) => {
        console.log(error);
        notification.error({
          message: APP_NAME,
          description: 'Could not update the resource'
        });
      });
  }

  render() {
    return(
      <div>
        <Form
          uiSchema = {{ "ui:disabled": true }}
          schema={this.schema}
          formData={this.props.status ? this.props.CR.status : this.props.CR.spec}
          onChange={() => {
            if(!this.state.showButton && (!this.props.status && !this.props.onEditor))
              this.setState({showButton: true});
          }}
          fields={(this.props.status || this.props.onEditor) ? fields : fieldsView}
          FieldTemplate={(this.props.status || this.props.onEditor) ? CustomFieldTemplate : CustomFieldTemplateViewer}
          ArrayFieldTemplate={CustomArrayFieldTemplate}
          widgets={widgets}
          onSubmit={this.submit}
        >
          {this.state.showButton ? (
            <Button type="primary" htmlType={'submit'} style={{marginTop: 10}}>Save changes</Button>
          ) : <div/>}
        </Form>
      </div>
    )
  }
}

export default FormViewer;
