import React, { Component } from 'react';
import { Badge, Col, Collapse, Divider, PageHeader, Progress, Row, Space, Typography, Tooltip } from 'antd';
import QuestionCircleOutlined from '@ant-design/icons/lib/icons/QuestionCircleOutlined';
import { addZero, getColor } from './HomeUtils';
import LineChart from '../templates/linechart/LineChart';

class Status extends Component {
  constructor(props) {
    super(props);
    this.state = {
      nodes: [],
      totalHome: {
        CPU: 0,
        RAM: 0
      },
      totalForeign: {
        CPU: 0,
        RAM: 0
      },
      consumedHome: {
        CPU: 0,
        RAM: 0
      },
      consumedForeign: {
        CPU: 0,
        RAM: 0
      },
      historyHome: [],
      historyForeign: []
    };

    /**
     * Every 30 seconds the metrics are retrieved and the view updated
     */
    this.interval = setInterval( () => {
      this.updateHistory();
    }, 30000);
  }

  updateHistory(){
    this.getConsumedResources();
    let date = new Date;
    let date_format = addZero(date.getHours()) + ':' + addZero(date.getMinutes()) + ':' + addZero(date.getSeconds());

    const resourcesHome = this.getPercentages(true);
    const resourcesForeign = this.getPercentages(false);

    this.state.historyHome.push(
      {"resource": "CPU", "date": date_format, "value": resourcesHome.CPU },
      {"resource": "RAM", "date": date_format, "value": resourcesHome.RAM }
    )

    this.state.historyForeign.push(
      {"resource": "CPU", "date": date_format, "value": resourcesForeign.CPU },
      {"resource": "RAM", "date": date_format, "value": resourcesForeign.RAM }
    )
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  /**
   * Gets the total allocatable resources for a cluster
   * @nodes the total of nodes (home or foreign)
   * @home if the cluster is the home one or a foreign
   */
  getTotalResources(nodes, home){
    let totalMemory = 0;
    let totalCPU = 0;
    nodes.forEach(no => {
      totalMemory += parseInt(no.status.allocatable.memory);
      totalCPU += parseInt(no.status.allocatable.cpu);
    })
    if(home){
      this.setState({
        totalHome: {
          RAM: totalMemory,
          CPU: totalCPU*1000000000
        },
      }, this.getConsumedResources)
    } else {
      this.setState({
        totalForeign: {
          RAM: totalMemory,
          CPU: totalCPU
        },
      }, this.getConsumedResources)
    }
  }

  /**
   * Get the total of the available resources on the home or foreign cluster
   * only once, when the component is mounted
   */
  componentDidMount() {
    this.props.api.getNodes()
      .then(res => {
        let nodes = res.body.items;
        this.setState({
          nodes: nodes
        })
        this.getTotalResources(nodes.filter(no => {return no.metadata.labels.type !== 'virtual-node'}), true);
        this.getTotalResources(nodes.filter(no => {return no.metadata.labels.type === 'virtual-node'}));
      })
      .catch(error => {
        console.log(error);
      })
  }

  /**
   * Get the total of consumed resources
   */
  getConsumedResources() {
    let consumedHome = {
        CPU: 0,
        RAM: 0
      }

    let consumedForeign = {
        CPU: 0,
        RAM: 0
      }

    this.props.api.getMetricsNodes()
      .then(res => {
        /**
         * The virtual kubelet do not export metrics for now
         */
        res.items.forEach(no => {
          /**
           * It's assumed the nodes called vk-<ClusterID>
           * are the virtual nodes (so, foreign)
           */
          if(no.metadata.name.substring(0, 2) === 'vk'){
            consumedForeign.CPU += parseInt(no.usage.cpu);
            consumedForeign.RAM += parseInt(no.usage.memory);
          }else{
            consumedHome.CPU += parseInt(no.usage.cpu);
            consumedHome.RAM += parseInt(no.usage.memory);
          }
        })

        this.setState({consumedHome, consumedForeign});
      })
      .catch(error => {
        console.log(error);
      })
  }

  /**
   * Use the consumed resources and the total to get percentages
   * @home: if the percentages refer to the home cluster or not
   * @returns percentages of CPU and RAM
   */
  getPercentages(home) {
    let RAMPercentage;
    let CPUPercentage;
    let consumedResources = home ? this.state.consumedHome : this.state.consumedForeign;
    let totalResources = home ? this.state.totalHome : this.state.totalForeign;

    RAMPercentage = Math.round((consumedResources.RAM/totalResources.RAM)*100);
    CPUPercentage = Math.round((consumedResources.CPU/totalResources.CPU)*100)

    return {
      CPU: CPUPercentage,
      RAM: RAMPercentage
    }
  }

  render() {
    const resourcesHome = this.getPercentages(true);
    const resourcesForeign = this.getPercentages(false);

    const resourcePanel = (resources, data) => (
      <div style={{marginTop: 10}}>
        <Row>
          <Badge text={<Typography.Text strong>Consumption</Typography.Text>}
                 status={'processing'} style={{marginLeft: '1em', marginBottom: '1em'}}
          />
        </Row>
        <Row gutter={[20, 20]} align={'center'} justify={'center'}>
          <Col>
            <Row justify={'center'}>
              <Typography.Text strong>CPU</Typography.Text>
            </Row>
            <Row justify={'center'}>
              <Progress type={'dashboard'} percent={resources.CPU}
                        strokeColor={getColor(resources.CPU)}
              />
            </Row>
          </Col>
          <Col>
            <Row justify={'center'}>
              <Typography.Text strong>RAM</Typography.Text>
            </Row>
            <Row justify={'center'}>
              <Progress type={'dashboard'} percent={resources.RAM}
                        strokeColor={getColor(resources.RAM)}
              />
            </Row>
          </Col>
        </Row>
        <Row>
          <Badge text={<Typography.Text strong>Consumption trend</Typography.Text>}
                 status={'processing'} style={{marginLeft: '1em', marginBottom: '1em'}}
          />
        </Row>
        <Row>
          <LineChart data={data} />
        </Row>
      </div>
    )

    return(
      <div className="home-header">
        <PageHeader style={{paddingTop: 4, paddingBottom: 4, paddingLeft: 16, paddingRight: 16}}
                    title={
                      <Space>
                        <Typography.Text strong style={{fontSize: 24}}>Cluster Status</Typography.Text>
                      </Space>
                    }
                    className={'draggable'}
        />
        <Divider style={{marginTop: 0, marginBottom: 10}}/>
        <div style={{paddingTop: 4, paddingBottom: 4, paddingLeft: 16, paddingRight: 16}}>
          <Collapse defaultActiveKey={['1']} className={'crd-collapse'} style={{backgroundColor: '#fafafa'}}>
            <Collapse.Panel style={{ borderBottomColor: '#f0f0f0' }}
                            header={<span>Home</span>} key="1"
                            extra={
                              <Tooltip title={'Consumption on your cluster'}
                                       placement={'left'}
                              >
                                <QuestionCircleOutlined />
                              </Tooltip>
                            }
            >
              {resourcePanel(resourcesHome, this.state.historyHome)}
            </Collapse.Panel>
          </Collapse>
          <Collapse defaultActiveKey={['1']} className={'crd-collapse'} style={{backgroundColor: '#fafafa', marginTop: 16}}>
            <Collapse.Panel style={{ borderBottomColor: '#f0f0f0' }}
                            header={<span>Foreign (Total)</span>} key="1"
                            extra={
                              <Tooltip title={'Consumption on others\' cluster'}
                                       placement={'left'}
                              >
                                <QuestionCircleOutlined />
                              </Tooltip>
                            }
            >
              {resourcePanel(resourcesForeign, this.state.historyForeign)}
            </Collapse.Panel>
          </Collapse>
        </div>
      </div>
    )
  }
}

export default Status;
