import { fireEvent, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { rest } from 'msw';
import { differenceInYears, format } from 'date-fns';
import { JSONMocks } from '@*company-data-covered*/caremanager/utils-mocks';
import {
  ExternalCareProviderFromJSON,
  PatientFromJSON,
} from '@*company-data-covered*/caremanager/data-access-types';
import {
  labelAndValueQueryMatcher,
  renderWithClient,
} from '@*company-data-covered*/caremanager/utils-react';
import { PatientSummaryCard } from '../PatientSummaryCard';
import { server } from '../../../../test/mockServer';

const mockedPatient = PatientFromJSON(JSONMocks.patients.patients[0]);
const mockedExternalCareProvider = ExternalCareProviderFromJSON(
  JSONMocks.externalCareProvider
);
const mockedDateOfBirth = new Date(mockedPatient.dateOfBirth);

const expectedDOBFormatted = format(mockedDateOfBirth, 'MM/dd/yyyy');
const expectedPatientAge = differenceInYears(new Date(), mockedDateOfBirth);

const setup = () => {
  const router = createMemoryRouter([
    {
      path: '/',
      element: <PatientSummaryCard patientId={'1'} />,
    },
  ]);

  renderWithClient(<RouterProvider router={router} />);

  return router;
};

describe('PatientSummaryCard', () => {
  it('should render patient details', async () => {
    setup();

    expect(await screen.findByText('Patient Summary')).toBeInTheDocument();

    expect(
      screen.getByText(
        labelAndValueQueryMatcher(
          'Name',
          `${mockedPatient.firstName} ${mockedPatient.lastName}`
        )
      )
    ).toBeDefined();
    expect(await screen.findByText('21789057')).toBeInTheDocument();
    expect(
      screen.getByText(
        labelAndValueQueryMatcher(
          'DOB',
          `${expectedDOBFormatted} (${expectedPatientAge}yo)`
        )
      )
    ).toBeDefined();
    expect(
      screen.getByText(
        labelAndValueQueryMatcher('Phone', mockedPatient.phoneNumber)
      )
    ).toBeDefined();

    expect(
      screen.getByText(
        labelAndValueQueryMatcher(
          'Phone',
          mockedExternalCareProvider.phoneNumber
        )
      )
    ).toBeDefined();
    expect(
      screen.getByText(
        labelAndValueQueryMatcher('Fax', mockedExternalCareProvider.faxNumber)
      )
    ).toBeDefined();
    expect(
      screen.getByText(
        labelAndValueQueryMatcher('Name', mockedExternalCareProvider.name)
      )
    ).toBeDefined();
    expect(
      screen.getByText(
        labelAndValueQueryMatcher('Address', mockedExternalCareProvider.address)
      )
    ).toBeDefined();
  });

  it('should not render an empty state for PCP', async () => {
    server.use(
      rest.get('/v1/patients/:patientId', (_, res, ctx) =>
        res.once(
          ctx.status(200),
          ctx.json({
            patient: JSONMocks.patients.patients[0],
            external_care_providers: [],
          })
        )
      )
    );
    setup();

    expect(await screen.findByText('Patient Summary')).toBeInTheDocument();

    expect(
      screen.getByText(
        labelAndValueQueryMatcher(
          'Name',
          `${mockedPatient.firstName} ${mockedPatient.lastName}`
        )
      )
    ).toBeDefined();

    expect(screen.queryByText('PCP')).not.toBeInTheDocument();
  });

  it('should redirect to the patient details path', async () => {
    const router = setup();

    fireEvent.click(await screen.findByText('Go To Full Patient Details'));
    expect(router.state.location.pathname).toBe('/patients/1');
  });
});
