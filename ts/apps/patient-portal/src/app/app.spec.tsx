import App from './app';
import { render, screen } from '../testUtils';
import { PATIENT_PORTAL_ROUTES } from '@*company-data-covered*/patient-portal/feature';
import * as patientPortalFeature from '@*company-data-covered*/patient-portal/feature';
import * as patientPortalUi from '@*company-data-covered*/patient-portal/ui';
import { TEST_IDS } from '@*company-data-covered*/patient-portal/ui';
import { CREATE_PATIENT_TEST_ID_PREFIX } from './pages/PatientCreatePage';
import { CREATE_ADDRESS_TEST_ID_PREFIX } from './pages/AddressCreatePage';
import { LANDING_PAGE_TEST_ID_PREFIX } from './pages/LandingPage';
import { PATIENT_DETAILS_TEST_ID_PREFIX } from './pages/PatientDetailsPage';
import { MemoryRouterProps } from 'react-router-dom';

vi.mock('@*company-data-covered*/patient-portal/feature', async () => {
  const actualModule = await vi.importActual<typeof patientPortalFeature>(
    '@*company-data-covered*/patient-portal/feature'
  );

  return {
    ...actualModule,
    CreatePatientForm: vi.fn(() => <div>Mock CreatePatientForm</div>),
    MySettingsSection: vi.fn(() => <div>Mock MySettingsSection</div>),
    OtherPatientsSection: vi.fn(() => <div>Mock OtherPatientsSection</div>),
    SavedAddresses: vi.fn(() => <div>Mock SavedAddresses</div>),
    CreateAddressForm: vi.fn(() => <div>Mock CreateAddressForm</div>),
    PatientDetails: vi.fn(() => <div>Mock PatientDetails</div>),
  };
});

vi.mock('@*company-data-covered*/patient-portal/ui', async () => {
  const actualModule = await vi.importActual<typeof patientPortalUi>(
    '@*company-data-covered*/patient-portal/ui'
  );

  return {
    ...actualModule,
    AppBar: vi.fn(() => <div>Mock AppBar</div>),
  };
});

const setup = (routerProps?: MemoryRouterProps) =>
  render(<App />, {
    withRouter: true,
    routerProps,
  });

describe('App', () => {
  it('should render LandingPage', async () => {
    setup({
      initialEntries: [PATIENT_PORTAL_ROUTES.LANDING_PAGE],
    });

    const page = await screen.findByTestId(
      TEST_IDS.PAGE.getPageTestId(LANDING_PAGE_TEST_ID_PREFIX)
    );

    expect(page).toBeVisible();
  });

  it('should render PatientCreatePage', async () => {
    setup({
      initialEntries: [PATIENT_PORTAL_ROUTES.PATIENT_CREATE],
    });

    const page = await screen.findByTestId(
      TEST_IDS.PAGE.getPageTestId(CREATE_PATIENT_TEST_ID_PREFIX)
    );

    expect(page).toBeVisible();
  });

  it('should render PatientDetailsPage', async () => {
    const mockId = 123;

    setup({
      initialEntries: [
        PATIENT_PORTAL_ROUTES.buildPatientDetailsPath({ patientId: mockId }),
      ],
    });

    const page = await screen.findByTestId(
      TEST_IDS.PAGE.getPageTestId(PATIENT_DETAILS_TEST_ID_PREFIX)
    );

    expect(page).toBeVisible();
  });

  it('should render AddressCreatePage', async () => {
    setup({
      initialEntries: [PATIENT_PORTAL_ROUTES.ADDRESS_CREATE],
    });

    const page = await screen.findByTestId(
      TEST_IDS.PAGE.getPageTestId(CREATE_ADDRESS_TEST_ID_PREFIX)
    );

    expect(page).toBeVisible();
  });

  it('should render AddressDetailsPage', async () => {
    const mockId = 123;
    setup({
      initialEntries: [
        PATIENT_PORTAL_ROUTES.buildAddressDetailsPath({ addressId: mockId }),
      ],
    });

    const page = await screen.findByText(
      new RegExp(`Editing address ${mockId}`)
    );

    expect(page).toBeVisible();
  });
});
