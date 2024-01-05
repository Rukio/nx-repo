import { JSONMocks } from '@*company-data-covered*/caremanager/utils-mocks';
import {
  labelAndValueQueryMatcher,
  renderWithClient,
} from '@*company-data-covered*/caremanager/utils-react';
import { screen, waitFor, within } from '@testing-library/react';
import { rest } from 'msw';
import { server } from '../../../test/mockServer';
import { NOTES_CHIP_TEST_ID } from '../NotesChip';
import {
  SERVICE_REQUEST_DETAILS_CLINICAL_SUMMARY_TEST_ID,
  SERVICE_REQUEST_DETAILS_HEADER_TEST_ID,
  SERVICE_REQUEST_DETAILS_INSURANCE_TEST_ID,
  SERVICE_REQUEST_DETAILS_REQUESTER_TEST_ID,
  SERVICE_REQUEST_DETAILS_TEST_ID,
  ServiceRequestDetails,
} from '../ServiceRequestDetails';
import { getPreviousAdvCareLabel } from '../ServiceRequestDetails/ClinicalSummary';

const setup = () => {
  return renderWithClient(
    <ServiceRequestDetails
      serviceRequestId={'1'}
      onClose={() => {
        throw new Error('Function not implemented.');
      }}
    />
  );
};

describe('ServiceRequestDetails', () => {
  beforeEach(() => {
    vi.setSystemTime(new Date('2024-08-01T00:00:00.000Z'));
  });

  it('should render the patient details on the sidebar header', async () => {
    setup();

    await waitFor(() => screen.findByTestId(SERVICE_REQUEST_DETAILS_TEST_ID));
    const header = within(
      await screen.findByTestId(SERVICE_REQUEST_DETAILS_HEADER_TEST_ID)
    );

    expect(header.getByText('William Patton')).toBeInTheDocument();
    expect(header.getByText('MRN 33667')).toBeInTheDocument();
    expect(header.getByText('11/09/1938')).toBeInTheDocument();
    expect(header.getByText('85yo M')).toBeInTheDocument();
    expect(header.getByText('555-555-5555')).toBeInTheDocument();
  });

  it('should render placeholder text when the patient name is missing', async () => {
    server.use(
      rest.get('v1/service-requests/:id', (_, res, ctx) =>
        res(
          ctx.status(200),
          ctx.json({
            service_request: JSONMocks.serviceRequest,
            station_patient: {
              ...JSONMocks.stationPatient,
              first_name: undefined,
              last_name: undefined,
            },
            station_care_request: JSONMocks.stationCareRequest,
          })
        )
      )
    );
    setup();

    await waitFor(() => screen.findByTestId(SERVICE_REQUEST_DETAILS_TEST_ID));

    expect(screen.getByText('Missing patient name')).toBeInTheDocument();
  });

  it('should render placeholder text when the patient MRN is missing', async () => {
    server.use(
      rest.get('v1/service-requests/:id', (_, res, ctx) =>
        res(
          ctx.status(200),
          ctx.json({
            service_request: JSONMocks.serviceRequest,
            station_patient: {
              ...JSONMocks.stationPatient,
              ehr_id: undefined,
            },
            station_care_request: JSONMocks.stationCareRequest,
          })
        )
      )
    );
    setup();

    await waitFor(() => screen.findByTestId(SERVICE_REQUEST_DETAILS_TEST_ID));

    expect(screen.getByText('MRN -')).toBeInTheDocument();
  });

  it('should render placeholder text when the patient sex is missing', async () => {
    server.use(
      rest.get('v1/service-requests/:id', (_, res, ctx) =>
        res(
          ctx.status(200),
          ctx.json({
            service_request: JSONMocks.serviceRequest,
            station_patient: {
              ...JSONMocks.stationPatient,
              sex: undefined,
            },
            station_care_request: JSONMocks.stationCareRequest,
          })
        )
      )
    );
    setup();

    await waitFor(() => screen.findByTestId(SERVICE_REQUEST_DETAILS_TEST_ID));

    expect(screen.getByText('85yo')).toBeInTheDocument();
  });

  it('should render the service request details in header', async () => {
    setup();

    await waitFor(() => screen.findByTestId(SERVICE_REQUEST_DETAILS_TEST_ID));

    expect(await screen.findByText('DEN (MDT)')).toBeInTheDocument();
    expect(
      within(await screen.findByTestId(NOTES_CHIP_TEST_ID)).getByText('2')
    ).toBeInTheDocument();
  });

  it('should render placeholder text when the market is not found', async () => {
    server.use(
      rest.get('v1/config', (_, res, ctx) =>
        res(
          ctx.status(200),
          ctx.json({
            markets: [],
            service_lines: [],
            care_phases: [],
          })
        )
      )
    );
    setup();

    await waitFor(() => screen.findByTestId(SERVICE_REQUEST_DETAILS_TEST_ID));

    expect(await screen.findByText('Unknown market')).toBeInTheDocument();
  });

  it('should render the short name of the marked if timezone is invalid', async () => {
    server.use(
      rest.get('v1/config', (_, res, ctx) =>
        res(
          ctx.status(200),
          ctx.json({
            markets: [{ ...JSONMocks.config.markets[0], tz_name: 'invalid' }],
            service_lines: [],
            care_phases: [],
          })
        )
      )
    );
    setup();

    await waitFor(() => screen.findByTestId(SERVICE_REQUEST_DETAILS_TEST_ID));

    expect(await screen.findByText('DEN')).toBeInTheDocument();
  });

  it('should not render any owner information if the service request is unassigned', async () => {
    server.use(
      rest.get('v1/service-requests/:id', (_, res, ctx) =>
        res(
          ctx.status(200),
          ctx.json({
            service_request: {
              ...JSONMocks.serviceRequest,
              assigned_user_id: null,
            },
            station_patient: JSONMocks.stationPatient,
            station_care_request: JSONMocks.stationCareRequest,
          })
        )
      )
    );
    setup();

    await waitFor(() => screen.findByTestId(SERVICE_REQUEST_DETAILS_TEST_ID));

    expect(screen.getByLabelText('Select an owner')).toBeInTheDocument();
  });

  it('should render the owner information if the service request is assigned', async () => {
    setup();

    await waitFor(() => screen.findByTestId(SERVICE_REQUEST_DETAILS_TEST_ID));

    expect(await screen.findByDisplayValue('John Doe')).toBeInTheDocument();
    expect(screen.queryByLabelText('Select an owner')).not.toBeInTheDocument();
  });

  it('should render the updated by information', async () => {
    setup();

    await waitFor(() => screen.findByTestId(SERVICE_REQUEST_DETAILS_TEST_ID));

    expect(
      await screen.findByText(
        labelAndValueQueryMatcher(
          'Last Updated By',
          'Jack Johnson - 07/14/2023'
        )
      )
    ).toBeInTheDocument();
  });

  it('should render the rejected date if the service request is rejected', async () => {
    server.use(
      rest.get('v1/service-requests/:id', (_, res, ctx) =>
        res(
          ctx.status(200),
          ctx.json({
            service_request: {
              ...JSONMocks.serviceRequest,
              rejected_at: '2023-07-20T00:00:00.000Z',
            },
            station_patient: JSONMocks.stationPatient,
            station_care_request: JSONMocks.stationCareRequest,
          })
        )
      )
    );
    setup();

    await waitFor(() => screen.findByTestId(SERVICE_REQUEST_DETAILS_TEST_ID));

    expect(
      await screen.findByText(
        labelAndValueQueryMatcher('Rejection Date', '07/20/2023')
      )
    ).toBeInTheDocument();
  });

  it('should render the clinical summary', async () => {
    setup();

    const clinicalSummary = await waitFor(() =>
      screen.findByTestId(SERVICE_REQUEST_DETAILS_CLINICAL_SUMMARY_TEST_ID)
    );
    const clinicalSummaryContainer = within(clinicalSummary);

    expect(
      clinicalSummaryContainer.getByText(
        labelAndValueQueryMatcher('Chief Complaint', 'Sore throat')
      )
    ).toBeInTheDocument();
    expect(
      clinicalSummaryContainer.getByText(
        labelAndValueQueryMatcher('Risk Strat Score', 'High')
      )
    ).toBeInTheDocument();
    expect(
      clinicalSummaryContainer.getByText(
        labelAndValueQueryMatcher('Screening Note', 'a note')
      )
    ).toBeInTheDocument();
    expect(
      await clinicalSummaryContainer.findByText(
        labelAndValueQueryMatcher('Screener', 'John Doe, CRN')
      )
    ).toBeInTheDocument();
    expect(
      clinicalSummaryContainer.getByText(
        labelAndValueQueryMatcher('DH Patient', 'MRN 33667')
      )
    ).toBeInTheDocument();
    expect(
      clinicalSummaryContainer.getByText(
        labelAndValueQueryMatcher('DH Visits in Past 90 Days', '2')
      )
    ).toBeInTheDocument();
    expect(
      clinicalSummaryContainer.getByText(
        labelAndValueQueryMatcher('Previous Adv Care', 'No')
      )
    ).toBeInTheDocument();
  });

  it('should render placeholder text when the chief complaint is missing', async () => {
    server.use(
      rest.get('v1/service-requests/:id', (_, res, ctx) =>
        res(
          ctx.status(200),
          ctx.json({
            service_request: JSONMocks.serviceRequest,
            station_patient: JSONMocks.stationPatient,
            station_care_request: {
              ...JSONMocks.stationCareRequest,
              chief_complaint: undefined,
            },
          })
        )
      )
    );
    setup();

    const clinicalSummary = await waitFor(() =>
      screen.findByTestId(SERVICE_REQUEST_DETAILS_CLINICAL_SUMMARY_TEST_ID)
    );
    const clinicalSummaryContainer = within(clinicalSummary);

    expect(
      clinicalSummaryContainer.getByText(
        labelAndValueQueryMatcher('Chief Complaint', '-')
      )
    ).toBeInTheDocument();
  });

  it('should render placeholder text when the risk strat score is missing', async () => {
    server.use(
      rest.get('v1/service-requests/:id', (_, res, ctx) =>
        res(
          ctx.status(200),
          ctx.json({
            service_request: JSONMocks.serviceRequest,
            station_patient: JSONMocks.stationPatient,
            station_care_request: {
              ...JSONMocks.stationCareRequest,
              risk_strat_score: undefined,
            },
          })
        )
      )
    );
    setup();

    const clinicalSummary = await waitFor(() =>
      screen.findByTestId(SERVICE_REQUEST_DETAILS_CLINICAL_SUMMARY_TEST_ID)
    );
    const clinicalSummaryContainer = within(clinicalSummary);

    expect(
      clinicalSummaryContainer.getByText(
        labelAndValueQueryMatcher('Risk Strat Score', '-')
      )
    ).toBeInTheDocument();
  });

  it('should render the risk strat score chip when the risk strat score is low', async () => {
    server.use(
      rest.get('v1/service-requests/:id', (_, res, ctx) =>
        res(
          ctx.status(200),
          ctx.json({
            service_request: JSONMocks.serviceRequest,
            station_patient: JSONMocks.stationPatient,
            station_care_request: {
              ...JSONMocks.stationCareRequest,
              risk_strat_score: 0,
            },
          })
        )
      )
    );
    setup();

    const clinicalSummary = await waitFor(() =>
      screen.findByTestId(SERVICE_REQUEST_DETAILS_CLINICAL_SUMMARY_TEST_ID)
    );
    const clinicalSummaryContainer = within(clinicalSummary);

    expect(
      clinicalSummaryContainer.getByText(
        labelAndValueQueryMatcher('Risk Strat Score', 'Low')
      )
    ).toBeInTheDocument();
  });

  it('should render the risk strat score chip when the risk strat score is medium', async () => {
    server.use(
      rest.get('v1/service-requests/:id', (_, res, ctx) =>
        res(
          ctx.status(200),
          ctx.json({
            service_request: JSONMocks.serviceRequest,
            station_patient: JSONMocks.stationPatient,
            station_care_request: {
              ...JSONMocks.stationCareRequest,
              risk_strat_score: 5.5,
            },
          })
        )
      )
    );
    setup();

    const clinicalSummary = await waitFor(() =>
      screen.findByTestId(SERVICE_REQUEST_DETAILS_CLINICAL_SUMMARY_TEST_ID)
    );
    const clinicalSummaryContainer = within(clinicalSummary);

    expect(
      clinicalSummaryContainer.getByText(
        labelAndValueQueryMatcher('Risk Strat Score', 'Medium')
      )
    ).toBeInTheDocument();
  });

  it('should render the risk strat score chip when the risk strat score is high', async () => {
    server.use(
      rest.get('v1/service-requests/:id', (_, res, ctx) =>
        res(
          ctx.status(200),
          ctx.json({
            service_request: JSONMocks.serviceRequest,
            station_patient: JSONMocks.stationPatient,
            station_care_request: {
              ...JSONMocks.stationCareRequest,
              risk_strat_score: 10,
            },
          })
        )
      )
    );
    setup();

    const clinicalSummary = await waitFor(() =>
      screen.findByTestId(SERVICE_REQUEST_DETAILS_CLINICAL_SUMMARY_TEST_ID)
    );
    const clinicalSummaryContainer = within(clinicalSummary);

    expect(
      clinicalSummaryContainer.getByText(
        labelAndValueQueryMatcher('Risk Strat Score', 'High')
      )
    ).toBeInTheDocument();
  });

  it('should render placeholder text when the screening note is missing', async () => {
    server.use(
      rest.get('v1/service-requests/:id', (_, res, ctx) =>
        res(
          ctx.status(200),
          ctx.json({
            service_request: JSONMocks.serviceRequest,
            station_patient: JSONMocks.stationPatient,
            station_care_request: {
              ...JSONMocks.stationCareRequest,
              secondary_screening_note: undefined,
            },
          })
        )
      )
    );
    setup();

    const clinicalSummary = await waitFor(() =>
      screen.findByTestId(SERVICE_REQUEST_DETAILS_CLINICAL_SUMMARY_TEST_ID)
    );
    const clinicalSummaryContainer = within(clinicalSummary);

    expect(
      clinicalSummaryContainer.getByText(
        labelAndValueQueryMatcher('Screening Note', '-')
      )
    ).toBeInTheDocument();
  });

  it('should render placeholder text when the screener is missing', async () => {
    server.use(
      rest.get('v1/service-requests/:id', (_, res, ctx) =>
        res(ctx.status(200), ctx.json(JSONMocks.serviceRequest))
      )
    );
    setup();

    const clinicalSummary = await waitFor(() =>
      screen.findByTestId(SERVICE_REQUEST_DETAILS_CLINICAL_SUMMARY_TEST_ID)
    );
    const clinicalSummaryContainer = within(clinicalSummary);

    expect(
      clinicalSummaryContainer.getByText(
        labelAndValueQueryMatcher('Screener', '-')
      )
    ).toBeInTheDocument();
  });

  it('should render placeholder text when the MRN is missing', async () => {
    server.use(
      rest.get('v1/service-requests/:id', (_, res, ctx) =>
        res(
          ctx.status(200),
          ctx.json({
            service_request: JSONMocks.serviceRequest,
            station_patient: {
              ...JSONMocks.stationPatient,
              ehr_id: undefined,
            },
            station_care_request: JSONMocks.stationCareRequest,
          })
        )
      )
    );
    setup();

    const clinicalSummary = await waitFor(() =>
      screen.findByTestId(SERVICE_REQUEST_DETAILS_CLINICAL_SUMMARY_TEST_ID)
    );
    const clinicalSummaryContainer = within(clinicalSummary);

    expect(
      clinicalSummaryContainer.getByText(
        labelAndValueQueryMatcher('DH Patient', 'No')
      )
    ).toBeInTheDocument();
  });

  it('should render placeholder text when the number of DH visits in the past 90 days is missing', async () => {
    server.use(
      rest.get('v1/service-requests/:id', (_, res, ctx) =>
        res(
          ctx.status(200),
          ctx.json({
            service_request: JSONMocks.serviceRequest,
            station_patient: {
              ...JSONMocks.stationPatient,
              visits_in_past_90_days: undefined,
            },
            station_care_request: JSONMocks.stationCareRequest,
          })
        )
      )
    );
    setup();

    const clinicalSummary = await waitFor(() =>
      screen.findByTestId(SERVICE_REQUEST_DETAILS_CLINICAL_SUMMARY_TEST_ID)
    );
    const clinicalSummaryContainer = within(clinicalSummary);

    expect(
      clinicalSummaryContainer.getByText(
        labelAndValueQueryMatcher('DH Visits in Past 90 Days', '-')
      )
    ).toBeInTheDocument();
  });

  it('should render "No" when the patient has not been in advanced care', async () => {
    server.use(
      rest.get('v1/service-requests/:id', (_, res, ctx) =>
        res(
          ctx.status(200),
          ctx.json({
            service_request: JSONMocks.serviceRequest,
            station_patient: {
              ...JSONMocks.stationPatient,
              has_been_in_advanced_care: false,
            },
            station_care_request: JSONMocks.stationCareRequest,
          })
        )
      )
    );
    setup();

    const clinicalSummary = await waitFor(() =>
      screen.findByTestId(SERVICE_REQUEST_DETAILS_CLINICAL_SUMMARY_TEST_ID)
    );
    const clinicalSummaryContainer = within(clinicalSummary);

    expect(
      clinicalSummaryContainer.getByText(
        labelAndValueQueryMatcher('Previous Adv Care', 'No')
      )
    ).toBeInTheDocument();
  });

  it('should render "Yes" when the patient has been in advanced care', async () => {
    server.use(
      rest.get('v1/service-requests/:id', (_, res, ctx) =>
        res(
          ctx.status(200),
          ctx.json({
            service_request: JSONMocks.serviceRequest,
            station_patient: {
              ...JSONMocks.stationPatient,
              has_been_in_advanced_care: true,
            },
            station_care_request: JSONMocks.stationCareRequest,
          })
        )
      )
    );
    setup();

    const clinicalSummary = await waitFor(() =>
      screen.findByTestId(SERVICE_REQUEST_DETAILS_CLINICAL_SUMMARY_TEST_ID)
    );
    const clinicalSummaryContainer = within(clinicalSummary);

    expect(
      clinicalSummaryContainer.getByText(
        labelAndValueQueryMatcher('Previous Adv Care', 'Yes')
      )
    ).toBeInTheDocument();
  });

  it('should render placeholder text when the patient is missing', async () => {
    server.use(
      rest.get('v1/service-requests/:id', (_, res, ctx) =>
        res(
          ctx.status(200),
          ctx.json({
            service_request: JSONMocks.serviceRequest,
            station_care_request: JSONMocks.stationCareRequest,
          })
        )
      )
    );
    setup();

    const clinicalSummary = await waitFor(() =>
      screen.findByTestId(SERVICE_REQUEST_DETAILS_CLINICAL_SUMMARY_TEST_ID)
    );
    const clinicalSummaryContainer = within(clinicalSummary);

    expect(
      clinicalSummaryContainer.getByText(
        labelAndValueQueryMatcher('Previous Adv Care', '-')
      )
    ).toBeInTheDocument();
  });

  it('should render insurance information', async () => {
    setup();

    const insurance = await waitFor(() =>
      screen.findByTestId(SERVICE_REQUEST_DETAILS_INSURANCE_TEST_ID)
    );
    const insuranceContainer = within(insurance);

    expect(
      insuranceContainer.getByText(
        labelAndValueQueryMatcher('Payer', 'Humana Gold Plus HMO')
      )
    ).toBeInTheDocument();
    expect(
      insuranceContainer.getByText(
        labelAndValueQueryMatcher('Network', 'Humana')
      )
    ).toBeInTheDocument();
    expect(
      insuranceContainer.getByText(
        labelAndValueQueryMatcher('Member ID', '123456789')
      )
    ).toBeInTheDocument();
    expect(
      insuranceContainer.getByRole('checkbox', { checked: false })
    ).toBeInTheDocument();
    expect(
      insuranceContainer.queryByText('Insert the CMS number below if available')
    ).not.toBeInTheDocument();
  });

  it('should render the CMS form when the insurance is verified', async () => {
    const { user: userEvent } = setup();

    const insurance = await waitFor(() =>
      screen.findByTestId(SERVICE_REQUEST_DETAILS_INSURANCE_TEST_ID)
    );
    const insuranceContainer = within(insurance);

    expect(
      insuranceContainer.getByRole('checkbox', { checked: false })
    ).toBeInTheDocument();

    await userEvent.click(insuranceContainer.getByRole('checkbox'));

    expect(
      insuranceContainer.getByRole('checkbox', { checked: true })
    ).toBeInTheDocument();
    expect(
      insuranceContainer.getByText('Insert the CMS number below if available')
    ).toBeInTheDocument();
    expect(insuranceContainer.getByText('Not Available')).toBeInTheDocument();
    expect(
      insuranceContainer.queryByRole('button', { name: 'Save' })
    ).not.toBeInTheDocument();
    expect(
      insuranceContainer.queryByRole('button', { name: 'Cancel' })
    ).not.toBeInTheDocument();
  });

  it('should render the CMS number input when clicking on the Add button', async () => {
    const { user: userEvent } = setup();

    const insurance = await waitFor(() =>
      screen.findByTestId(SERVICE_REQUEST_DETAILS_INSURANCE_TEST_ID)
    );
    const insuranceContainer = within(insurance);

    await userEvent.click(insuranceContainer.getByRole('checkbox'));
    await userEvent.click(insuranceContainer.getByText('Add'));

    expect(insuranceContainer.getByLabelText('CMS')).toBeInTheDocument();
    expect(
      insuranceContainer.getByRole('button', { name: 'Save' })
    ).toBeInTheDocument();
    expect(
      insuranceContainer.getByRole('button', { name: 'Cancel' })
    ).toBeInTheDocument();
  });

  it('should update the CMS number when clicking on the Save button', async () => {
    const { user: userEvent } = setup();

    const insurance = await waitFor(() =>
      screen.findByTestId(SERVICE_REQUEST_DETAILS_INSURANCE_TEST_ID)
    );
    const insuranceContainer = within(insurance);

    await userEvent.click(insuranceContainer.getByRole('checkbox'));
    await userEvent.click(insuranceContainer.getByText('Add'));
    await userEvent.type(
      insuranceContainer.getByLabelText('CMS'),
      'cms_number'
    );
    await userEvent.click(
      insuranceContainer.getByRole('button', { name: 'Save' })
    );

    expect(insuranceContainer.getByText('cms_number')).toBeInTheDocument();
    expect(
      insuranceContainer.getByRole('button', { name: 'Edit' })
    ).toBeInTheDocument();
    expect(
      insuranceContainer.queryByRole('button', { name: 'Save' })
    ).not.toBeInTheDocument();
    expect(
      insuranceContainer.queryByRole('button', { name: 'Cancel' })
    ).not.toBeInTheDocument();
  });

  it('should cancel the CMS number update when clicking on the Cancel button', async () => {
    const { user: userEvent } = setup();

    const insurance = await waitFor(() =>
      screen.findByTestId(SERVICE_REQUEST_DETAILS_INSURANCE_TEST_ID)
    );
    const insuranceContainer = within(insurance);

    await userEvent.click(insuranceContainer.getByRole('checkbox'));
    await userEvent.click(insuranceContainer.getByText('Add'));
    await userEvent.type(
      insuranceContainer.getByLabelText('CMS'),
      'cms_number'
    );
    await userEvent.click(
      insuranceContainer.getByRole('button', { name: 'Cancel' })
    );

    expect(insuranceContainer.getByText('Not Available')).toBeInTheDocument();
    expect(
      insuranceContainer.getByRole('button', { name: 'Add' })
    ).toBeInTheDocument();
    expect(
      insuranceContainer.queryByRole('button', { name: 'Save' })
    ).not.toBeInTheDocument();
    expect(
      insuranceContainer.queryByRole('button', { name: 'Cancel' })
    ).not.toBeInTheDocument();
  });

  describe('getPreviousAdvCareLabel', () => {
    it.each([
      { input: true, expected: 'Yes' },
      { input: false, expected: 'No' },
      { input: undefined, expected: null },
    ])('should work for $input', ({ input, expected }) => {
      expect(getPreviousAdvCareLabel(input)).toBe(expected);
    });
  });

  it('should render the Requester information', async () => {
    setup();

    const requester = await waitFor(() =>
      screen.findByTestId(SERVICE_REQUEST_DETAILS_REQUESTER_TEST_ID)
    );
    const requesterContainer = within(requester);

    expect(
      await requesterContainer.findByText(
        labelAndValueQueryMatcher('Type', 'Partner')
      )
    ).toBeInTheDocument();
    expect(
      requesterContainer.getByText(
        labelAndValueQueryMatcher('Name', 'Larry David')
      )
    ).toBeInTheDocument();
    expect(
      requesterContainer.getByText(
        labelAndValueQueryMatcher('Organization', 'Inter Valley')
      )
    ).toBeInTheDocument();
    expect(
      requesterContainer.getByText(
        labelAndValueQueryMatcher('Phone Number', '111-111-1111')
      )
    ).toBeInTheDocument();
  });
});
