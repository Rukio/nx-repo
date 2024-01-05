import { rest } from 'msw';
import { fireEvent, render, screen } from '@testing-library/react';
import { createTestQueryClient } from '@*company-data-covered*/caremanager/utils-react';
import { QueryClientProvider } from 'react-query';
import { ServiceRequestCard } from '../ServiceRequestCard';
import { server } from '../../../test/mockServer';
import * as dataAccess from '@*company-data-covered*/caremanager/data-access';

const mutateSpy = vi.fn();
vi.mock('@*company-data-covered*/caremanager/data-access', async () => {
  const actual = await vi.importActual<typeof dataAccess>(
    '@*company-data-covered*/caremanager/data-access'
  );

  return {
    ...actual,
    useUpdateServiceRequest: () => ({
      isLoading: false,
      mutate: mutateSpy,
    }),
  };
});

const baseData = {
  serviceRequest: {
    marketId: '159',
    isInsuranceVerified: true,
    assignedUserId: '17',
    id: '9',
    createdAt: '',
    updatedAt: '',
    statusId: '',
  },
  stationCareRequest: {
    id: '1',
    chiefComplaint: 'Sore throat',
  },
  stationPatient: {
    id: '1',
    firstName: 'Juan Pablo',
    lastName: 'Ortiz',
    ehrId: '123455',
    dateOfBirth: '1955-12-27',
    sex: 'male',
    insuranceName: 'Humana',
  },
  notesCount: '314',
};

const setup = (data?: typeof baseData) => {
  const selectFn = vi.fn();

  const testQueryClient = createTestQueryClient();
  testQueryClient.setQueryData(
    [{ entity: 'users', scope: 'details', id: '17' }],
    {
      id: '17',
      firstName: 'The Notorious B.I.G.',
      lastName: '',
    }
  );

  render(
    <QueryClientProvider client={testQueryClient}>
      <ServiceRequestCard data={data || baseData} onSelect={selectFn} />
    </QueryClientProvider>
  );

  return {
    selectFn,
  };
};

describe('ServiceRequestCard', () => {
  beforeEach(() => {
    vi.setSystemTime(new Date('2024-08-01T00:00:00.000Z'));
  });

  afterEach(() => vi.resetAllMocks());

  it('should render the correct data', async () => {
    setup();
    expect(await screen.findByText('Juan Pablo Ortiz')).toBeInTheDocument();
    expect(
      await screen.findByText(
        (text) => text.includes('MRN') && text.includes('123455')
      )
    ).toBeInTheDocument();
    expect(await screen.findByText('12/27/1955')).toBeInTheDocument();
    expect(await screen.findByText('68yo M')).toBeInTheDocument();
    expect(await screen.findByText('DEN (MDT)')).toBeInTheDocument();
    expect(await screen.findByText('The Notorious B.I.G.')).toBeInTheDocument();
    expect(await screen.findByText('314')).toBeInTheDocument();
    expect(await screen.findByText('Sore throat')).toBeInTheDocument();
    expect(await screen.findByText('Humana')).toBeInTheDocument();
    expect(await screen.findByText('Verified')).toBeInTheDocument();
    expect(await screen.findByText('Accept')).toBeInTheDocument();
    expect(screen.queryByText('Secondary Screening')).not.toBeInTheDocument();
  });

  it('should display timezone abbreviation when available', async () => {
    server.use(
      rest.get('/v1/config', (_, res, ctx) =>
        res(
          ctx.status(200),
          ctx.json({
            markets: [
              {
                id: '159',
                short_name: 'DEN',
                tz_name: 'America/Denver',
                schedule_days: [],
              },
            ],
            service_lines: [],
            care_phases: [],
          })
        )
      )
    );
    setup();
    expect(await screen.findByText('DEN (MDT)')).toBeInTheDocument();
  });

  it('should show secondary button when applicable', async () => {
    setup({
      ...baseData,
      serviceRequest: {
        ...baseData.serviceRequest,
        statusId: '2',
      },
    });
    expect(await screen.findByText('Secondary Screening')).toBeInTheDocument();
  });

  it('should show the unverified chip', async () => {
    setup({
      ...baseData,
      serviceRequest: {
        ...baseData.serviceRequest,
        isInsuranceVerified: false,
      },
    });
    expect(await screen.findByText('Unverified')).toBeInTheDocument();
  });

  it('should execute select callback', async () => {
    const { selectFn } = setup();

    fireEvent.click(await screen.findByText('Juan Pablo Ortiz'));
    expect(selectFn).toBeCalledTimes(1);
  });

  it('should transition from requested to clinical screening status', async () => {
    setup({
      ...baseData,
      serviceRequest: {
        ...baseData.serviceRequest,
        statusId: '1',
      },
    });

    const primaryButton = await screen.findByText('Clinical Screening');
    fireEvent.click(primaryButton);

    expect(mutateSpy).toHaveBeenCalledWith({
      serviceRequestId: '9',
      body: {
        statusId: '2',
      },
    });
  });

  it('should transition from clinical screening to accepted status', async () => {
    setup({
      ...baseData,
      serviceRequest: {
        ...baseData.serviceRequest,
        statusId: '2',
      },
    });

    const primaryButton = await screen.findByText('Accept');
    fireEvent.click(primaryButton);

    expect(mutateSpy).toHaveBeenCalledWith({
      serviceRequestId: '9',
      body: {
        statusId: '4',
      },
    });
  });

  it('should transition from secondary screening to accepted status', async () => {
    setup({
      ...baseData,
      serviceRequest: {
        ...baseData.serviceRequest,
        statusId: '3',
      },
    });

    const primaryButton = await screen.findByText('Accept');
    fireEvent.click(primaryButton);

    expect(mutateSpy).toHaveBeenCalledWith({
      serviceRequestId: '9',
      body: {
        statusId: '4',
      },
    });
  });

  it('should transition from clinical screening to secondary screening status', async () => {
    setup({
      ...baseData,
      serviceRequest: {
        ...baseData.serviceRequest,
        statusId: '2',
      },
    });

    const secondaryButton = await screen.findByText('Secondary Screening');
    fireEvent.click(secondaryButton);

    expect(mutateSpy).toHaveBeenCalledWith({
      serviceRequestId: '9',
      body: {
        statusId: '3',
      },
    });
  });
});
