import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import fetchMock from 'jest-fetch-mock';
import ApiManager from '../src/services/__mocks__/ApiManager';
import CRDmockEmpty from '../__mocks__/crd_fetch.json';
import ViewMockResponse from '../__mocks__/views.json';
import LiqoDashMockResponse from '../__mocks__/liqodashtest.json';
import PieMockResponse from '../__mocks__/piecharts.json';
import PieMockResponseWrong from '../__mocks__/piecharts_wrong.json';
import PieChart from '../src/templates/piechart/PieChart';

fetchMock.enableMocks();

async function setup(pie) {
  fetch.mockImplementation((url) => {
    if (url === 'http://localhost:3001/customresourcedefinition') {
      return Promise.resolve(new Response(JSON.stringify(CRDmockEmpty)))
    } else if (url === 'http://localhost:3001/clustercustomobject/views') {
      return Promise.resolve(new Response(JSON.stringify({body: ViewMockResponse})))
    } else if (url === 'http://localhost:3001/clustercustomobject/liqodashtests') {
      return Promise.resolve(new Response(JSON.stringify({ body: LiqoDashMockResponse })))
    } else if (url === 'http://localhost:3001/clustercustomobject/piecharts') {
      return Promise.resolve(new Response(JSON.stringify({ body: pie })))
    }
  })

  let api = new ApiManager();
  api.getCRDs().then(async () => {

    let liqo_crd = await api.getCRDfromKind('LiqoDashTest');
    let pie_crd = await api.getCRDfromKind('PieChart');
    let liqo_cr = await api.getCustomResourcesAllNamespaces(liqo_crd);
    let pie_cr = await api.getCustomResourcesAllNamespaces(pie_crd);

    render(
      <PieChart CR={liqo_cr.body.items[0].spec} template={pie_cr.body.items[0]}/>
    )
  });
}

describe('PieChart', () => {
  test('Pie chart is well formed', async () => {
    await setup(PieMockResponse);
  })

  test('Pie chart show error when wrong input', async () => {
    await setup(PieMockResponseWrong);
    expect(await screen.findByText(/Something/i)).toBeInTheDocument();
  })
})
