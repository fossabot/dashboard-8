import React from 'react';
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect';
import fetchMock from 'jest-fetch-mock';
import ApiManager from '../src/services/__mocks__/ApiManager';
import CRDmockEmpty from '../__mocks__/crd_fetch.json';
import ViewMockResponse from '../__mocks__/views.json';
import LiqoDashMockResponse from '../__mocks__/liqodashtest.json';
import PieMockResponse from '../__mocks__/piecharts.json';
import userEvent from '@testing-library/user-event';
import CR from '../src/CRD/CR';
import CRDmockResponse from '../__mocks__/crd_fetch.json';
import LiqoDashAlteredMockResponse from '../__mocks__/liqodashtest_noSpec_noStatus.json';
import { setup_resource } from './RTLUtils';
import { MemoryRouter } from 'react-router-dom';

fetchMock.enableMocks();

function mockFetch() {
  fetch.mockImplementation((url) => {
    if (url === 'http://localhost:3001/customresourcedefinition') {
      return Promise.resolve(new Response(JSON.stringify(CRDmockEmpty)))
    } else if (url === 'http://localhost:3001/clustercustomobject/views') {
      return Promise.resolve(new Response(JSON.stringify({body: ViewMockResponse})))
    } else if (url === 'http://localhost:3001/clustercustomobject/liqodashtests') {
      return Promise.resolve(new Response(JSON.stringify({ body: LiqoDashMockResponse })))
    } else if (url === 'http://localhost:3001/clustercustomobject/piecharts') {
      return Promise.resolve(new Response(JSON.stringify({ body: PieMockResponse })))
    }
  })
}

async function setup() {
  let api = new ApiManager();
  api.getCRDs().then(async () => {

    let liqo_crd = await api.getCRDfromKind('LiqoDashTest');
    let pie_crd = await api.getCRDfromKind('PieChart');
    let l = await api.getCustomResourcesAllNamespaces(liqo_crd);
    let p = await api.getCustomResourcesAllNamespaces(pie_crd);

    render(
      <MemoryRouter>
        <CR api={api}
            cr={l.body.items[0]}
            crd={liqo_crd}
            template={p.body.items[0]}
        />
      </MemoryRouter>
    )
  });
}

describe('CR', () => {
  test('CR shows every information', async () => {
    mockFetch();
    await setup();

    expect(await screen.findByLabelText('cr')).toBeInTheDocument();
    expect(screen.getByText('test-1')).toBeInTheDocument();
    expect(screen.getByLabelText('edit')).toBeInTheDocument();
    expect(screen.getByLabelText('delete')).toBeInTheDocument();
    expect(screen.getByText('JSON')).toBeInTheDocument();
  })

  test('CR edit drawer show on click', async () => {
    mockFetch();
    await setup();

    expect(await screen.findByLabelText('cr')).toBeInTheDocument();

    const edit = screen.getByLabelText('edit');
    userEvent.click(edit);

    expect(await screen.findByText(/update/i)).toBeInTheDocument();
  })

  test('CR edit drawer closes', async () => {
    mockFetch();
    await setup();

    expect(await screen.findByLabelText('cr')).toBeInTheDocument();

    const edit = screen.getByLabelText('edit');
    userEvent.click(edit);

    const close = await screen.findByLabelText('Close');
    expect(close).toBeInTheDocument();
    userEvent.click(close);
  })

  test('CR JSON show on click', async () => {
    mockFetch();
    await setup();

    expect(await screen.findByLabelText('cr')).toBeInTheDocument();
    userEvent.click(screen.getByText('test-1'));

    userEvent.click(screen.getByText('JSON'));

    expect(await screen.findByLabelText('json')).toBeInTheDocument();
  })

  test('CR JSON show no spec or status when there is none', async () => {
    fetch.mockImplementation((url) => {
      if (url === 'http://localhost:3001/customresourcedefinition') {
        return Promise.resolve(new Response(JSON.stringify(CRDmockResponse)))
      } else if (url === 'http://localhost:3001/clustercustomobject/views') {
        return Promise.resolve(new Response(JSON.stringify({ body: ViewMockResponse })))
      } else if (url === 'http://localhost:3001/clustercustomobject/liqodashtests') {
        return Promise.resolve(new Response(JSON.stringify({ body: LiqoDashAlteredMockResponse })))
      } else if (url === 'http://localhost:3001/clustercustomobject/piecharts') {
        return Promise.resolve(new Response(JSON.stringify({ body: PieMockResponse })))
      }
    })
    await setup();

    expect(await screen.findByLabelText('cr')).toBeInTheDocument();
    userEvent.click(screen.getByText('test-1'));

    userEvent.click(screen.getByText('JSON'));

    const json = await screen.findByLabelText('json');
    expect(json).toBeInTheDocument();

    expect(json.firstChild).toBeNull();
  })

  test('CR delete popup show on click and resource is deleted', async () => {
    mockFetch();
    await setup();

    expect(await screen.findByLabelText('cr')).toBeInTheDocument();

    userEvent.click(screen.getByLabelText('delete'));

    expect(await screen.findByText('Are you sure?')).toBeInTheDocument();

    const no = await screen.findByText('No');
    expect(no).toBeInTheDocument();

    const yes = await screen.findByText('Yes');
    expect(yes).toBeInTheDocument();

    userEvent.click(yes);
    expect(await screen.queryByAltText('test-1')).not.toBeInTheDocument();
  })

  test('CR deletion error catch works', async () => {
    await setup_resource('404', 'DELETE', 'liqodashtests');

    const del = await screen.findAllByLabelText('delete');
    expect(del).toHaveLength(2);

    userEvent.click(del[0]);

    expect(await screen.findByText('Are you sure?')).toBeInTheDocument();
    const yes = await screen.findByText('Yes');
    userEvent.click(yes);

    expect(await screen.findByText(/404/i)).toBeInTheDocument();
  }, 30000)

})
