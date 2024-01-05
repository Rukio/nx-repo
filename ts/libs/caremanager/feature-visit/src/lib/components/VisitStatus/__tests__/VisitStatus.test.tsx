import { SpyInstance } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { theme } from '@*company-data-covered*/design-system';
import { renderWithClient } from '@*company-data-covered*/caremanager/utils-react';
import { JSONMocks } from '@*company-data-covered*/caremanager/utils-mocks';
import {
  GetVisitResponseFromJSON,
  Visit,
} from '@*company-data-covered*/caremanager/data-access-types';
import { VisitStatus, getConfiguration, getMapURL } from '../VisitStatus';

const { visit } = GetVisitResponseFromJSON(JSONMocks.visit);

const setup = (visitOverride?: Partial<Visit>, timezoneOverride?: string) => {
  if (!visit) {
    return;
  }
  renderWithClient(
    <MemoryRouter>
      <VisitStatus
        visit={{ ...visit, ...visitOverride }}
        timezone={timezoneOverride}
      />
    </MemoryRouter>
  );
};

describe('VisitStatus', () => {
  let windowSpy: SpyInstance;

  beforeEach(() => {
    windowSpy = vi.spyOn(window, 'open');
  });

  afterEach(() => {
    windowSpy.mockRestore();
  });

  it('should render all components', async () => {
    setup();

    expect(await screen.findByText('Scheduled')).toBeInTheDocument();
    expect(await screen.findByText('Location')).toBeInTheDocument();
    expect(
      await screen.findByText('Volcán Vesubio 2228 A')
    ).toBeInTheDocument();
    expect(await screen.findByText('Col. Colli Urbano')).toBeInTheDocument();
    expect(
      await screen.findByText('Zapopan, Jalisco 45070')
    ).toBeInTheDocument();
    expect(
      await screen.findByText(
        'Long-term care facility. Ring Doorbell, it will take them a while to get up'
      )
    ).toBeInTheDocument();
    expect(await screen.findByText('Patient Availability')).toBeInTheDocument();
    expect(
      await screen.findByText('1:09 PM - 3:09 PM MST')
    ).toBeInTheDocument();
    expect(await screen.findByText('Care Team: DEN004')).toBeInTheDocument();
    expect(await screen.findByText('Gustav Mahler')).toBeInTheDocument();
    expect(await screen.findByText('MUS')).toBeInTheDocument();
    expect(await screen.findByText('Pablasso Ortiz')).toBeInTheDocument();
    expect(await screen.findByText('IOP')).toBeInTheDocument();
    expect(await screen.findByText('Gabo Acosta')).toBeInTheDocument();
    expect(await screen.findByText('PPP')).toBeInTheDocument();
    expect(
      await screen.findByText(
        'Tap to signal you are on your way to see the patient'
      )
    ).toBeInTheDocument();
    expect(await screen.findByText('Mark As En Route')).toBeInTheDocument();
    expect(await screen.findByText('CR 2345678')).toBeInTheDocument();
  });

  it('should render empty state for patient availability', async () => {
    setup({ patientAvailabilityStart: undefined });
    expect(
      await screen.findByText('No patient availability found.')
    ).toBeInTheDocument();
  });

  it('should render empty state for car name', () => {
    setup({ carName: undefined });
    expect(screen.getByText('Care Team')).toBeInTheDocument();
  });

  it('should send to station url', async () => {
    setup({ status: 'other' });
    fireEvent.click(await screen.findByText('Go to Dashboard'));
    expect(windowSpy).toBeCalledWith('stationurl', '_blank');
  });

  it('should display the correct timezone', async () => {
    setup(undefined, 'America/Los_Angeles');
    expect(
      await screen.findByText('12:09 PM - 2:09 PM PST')
    ).toBeInTheDocument();
  });

  it('should get the right configuration based on all the different statuses', () => {
    expect(getConfiguration(theme, 'requested')).toMatchInlineSnapshot(`
      {
        "actionPrompt": "The care request will be enabled when it is up next in schedule",
        "buttonDisabled": true,
        "buttonText": "Mark As Committed",
        "cardTitle": "Scheduled",
        "linkToDashboard": false,
        "showAction": true,
        "tint": "#0074B8",
      }
    `);

    expect(getConfiguration(theme, 'accepted')).toMatchInlineSnapshot(`
      {
        "actionPrompt": "Tap to commit visit to an available care team",
        "buttonDisabled": false,
        "buttonText": "Mark As Committed",
        "cardTitle": "Scheduled",
        "linkToDashboard": false,
        "showAction": true,
        "tint": "#0074B8",
        "updateToStatus": "UPDATE_VISIT_STATUS_OPTION_COMMITTED",
      }
    `);

    expect(getConfiguration(theme, 'committed')).toMatchInlineSnapshot(`
      {
        "actionPrompt": "Tap to signal you are on your way to see the patient",
        "buttonDisabled": false,
        "buttonText": "Mark As En Route",
        "cardTitle": "Scheduled",
        "linkToDashboard": false,
        "showAction": true,
        "tint": "#0074B8",
        "updateToStatus": "UPDATE_VISIT_STATUS_OPTION_ON_ROUTE",
      }
    `);

    expect(getConfiguration(theme, 'on_route')).toMatchInlineSnapshot(`
      {
        "actionPrompt": "Tap to signal you have arrived with the patient",
        "buttonDisabled": false,
        "buttonText": "Mark As On Scene",
        "cardTitle": "En Route",
        "linkToDashboard": false,
        "showAction": true,
        "tint": "#0074B8",
        "updateToStatus": "UPDATE_VISIT_STATUS_OPTION_ON_SCENE",
      }
    `);

    expect(getConfiguration(theme, 'on_scene')).toMatchInlineSnapshot(`
      {
        "actionPrompt": "Tap to signal you have completed the care request",
        "buttonDisabled": false,
        "buttonText": "Resolve Case",
        "cardTitle": "On Scene",
        "linkToDashboard": false,
        "showAction": true,
        "tint": "#1AA251",
        "updateToStatus": "UPDATE_VISIT_STATUS_OPTION_ARCHIVED",
      }
    `);

    expect(getConfiguration(theme, 'archived')).toMatchInlineSnapshot(`
      {
        "buttonDisabled": false,
        "cardTitle": "Resolved",
        "linkToDashboard": false,
        "showAction": false,
        "tint": "#90B1C8",
      }
    `);

    expect(getConfiguration(theme, 'unknown status')).toMatchInlineSnapshot(`
      {
        "actionPrompt": "Tap to view the care request in Dashboard",
        "buttonDisabled": false,
        "buttonText": "Go to Dashboard",
        "cardTitle": "Needs Action",
        "linkToDashboard": true,
        "showAction": true,
        "tint": "#EBAC17",
      }
    `);
  });

  it('should compose a correct google maps search url', () => {
    const baseAddress = { id: '1', createdAt: '2', updatedAt: '3' };

    const addressWithCoordinates = {
      ...baseAddress,
      latitude: 123,
      longitude: 456,
    };
    expect(getMapURL(addressWithCoordinates)).toBe(
      'https://www.google.com/maps/search/?api=1&query=123%2C456'
    );

    const addressWithoutCoordinates = {
      ...baseAddress,
      streetAddress1: 'somestreet',
      state: 'somestate',
      zipcode: 'somezipcode',
    };
    expect(getMapURL(addressWithoutCoordinates)).toBe(
      'https://www.google.com/maps/search/?api=1&query=somestreet%2Csomestate%2Csomezipcode'
    );
  });
});
