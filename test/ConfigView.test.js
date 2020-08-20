import ViewMockResponse from '../__mocks__/views.json';
import CRDmockResponse from '../__mocks__/crd_fetch.json';
import ClusterConfigMockResponse from '../__mocks__/configs.json';
import { render, screen } from '@testing-library/react';
import Error409 from '../__mocks__/409.json';
import { loginTest } from './RTLUtils';
import userEvent from '@testing-library/user-event';
import FCMockResponse from '../__mocks__/foreigncluster.json';
import AdvMockResponse from '../__mocks__/advertisement.json';
import PRMockResponse from '../__mocks__/peeringrequest.json';
import ApiManager from '../src/services/__mocks__/ApiManager';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import ConfigView from '../src/views/ConfigView';
import NodesMockResponse from '../__mocks__/nodes.json';
import NodesMetricsMockResponse from '../__mocks__/nodes_metrics.json';
import ConfigMockResponse from '../__mocks__/configs.json';

function mocks(error, get){
  fetch.mockResponse(req => {
    if (req.url === 'http://localhost:3001/customresourcedefinition') {
      return Promise.resolve(new Response(JSON.stringify(CRDmockResponse)))
    } else if (req.url === 'http://localhost:3001/clustercustomobject/views') {
      return Promise.resolve(new Response(JSON.stringify({body: ViewMockResponse})))
    } else if (req.url === 'http://localhost:3001/clustercustomobject/foreignclusters') {
      return Promise.resolve(new Response(JSON.stringify({body: FCMockResponse})));
    } else if (req.url === 'http://localhost:3001/clustercustomobject/advertisements') {
      return Promise.resolve(new Response(JSON.stringify({body: AdvMockResponse})));
    } else if (req.url === 'http://localhost:3001/clustercustomobject/peeringrequests') {
      return Promise.resolve(new Response(JSON.stringify({body: PRMockResponse})));
    } else if (req.url === 'http://localhost:3001/clustercustomobject/clusterconfigs') {
      if (req.method === 'GET') {
        if(!get)
          return Promise.resolve(new Response(JSON.stringify({ body: ClusterConfigMockResponse })))
        else return Promise.reject(Error409.body);
      } else if (req.method === 'PUT') {
        if (error) {
          if (error === '409') {
            return Promise.reject(Error409.body);
          }
        } else {
          let ClusterConfigMockResponseMod = ClusterConfigMockResponse.items[0];
          ClusterConfigMockResponseMod.resourceVersion++;
          ClusterConfigMockResponseMod.spec.advertisementConfig.autoAccept = false;
          return Promise.resolve(new Response(JSON.stringify({ body: ClusterConfigMockResponseMod })))
        }
      }
    } else if (req.url === 'http://localhost:3001/nodes') {
      return Promise.resolve(new Response(JSON.stringify({body: NodesMockResponse})));
    } else if (req.url === 'http://localhost:3001/metrics/nodes') {
      return Promise.resolve(new Response(JSON.stringify(NodesMetricsMockResponse)));
    }
  })
}

async function setup_with_error(error) {
  mocks(error);

  await loginTest();

  const configview = await screen.findByText('Settings');
  userEvent.click(configview);

  expect(await screen.findByText('Liqo configuration'));

}

let api;

async function setup_from_ConfigView(error) {
  api = new ApiManager();
  api.getCRDs().then(() => {

    if(error) api.CRDs = [];

    render(
      <MemoryRouter>
        <ConfigView api={api} />
      </MemoryRouter>
    )
  })
}

describe('ConfigView', () => {
  test('Sidebar redirect works and general information are displayed', async () => {
    await setup_with_error();

    expect(screen.getByText(/Choose the best/i));
    expect(screen.getByText('Advertisement Config'));
    expect(screen.getByText('Discovery Config'));
    userEvent.click(screen.getByText('Liqonet Config'));

    userEvent.click(await screen.findByText('General'));
    userEvent.click(await screen.findByText('Reserved Subnets'));
  })

  test('Config update works', async () => {
    await setup_with_error();

    let switchButton = screen.getAllByRole('switch');

    expect(switchButton[0]).toHaveAttribute('aria-checked', 'true');
    userEvent.click(switchButton[0]);

    let textbox = screen.getAllByRole('textbox');

    await userEvent.type(textbox[0], '0');

    textbox[1].setSelectionRange(0, 2);

    await userEvent.type(textbox[1], '{backspace}50');

    userEvent.click(screen.getByText('Save configuration'));

    expect(await screen.findByText(/updated/i));

    switchButton = screen.getAllByRole('switch');

    expect(switchButton[0]).toHaveAttribute('aria-checked', 'false');

  }, 30000)

  test('Error notification when config not updated', async () => {
    await setup_with_error('409');

    let switchButton = screen.getAllByRole('switch');

    userEvent.click(switchButton[0]);
    userEvent.click(screen.getByText('Save configuration'));

    expect(await screen.findByText('Could not update the configuration'))
  }, 30000)

  test('ConfigView with no Config CRD', async () => {
    mocks();
    await setup_from_ConfigView(true);

    expect(await screen.findByText('No configuration CRD has been found.'))
  }, 30000)

  test('ConfigView with error on Config CR', async () => {
    mocks('409', true);
    await setup_from_ConfigView();

    expect(await screen.findByText('No configuration file has been found.'))
  }, 30000)
})
