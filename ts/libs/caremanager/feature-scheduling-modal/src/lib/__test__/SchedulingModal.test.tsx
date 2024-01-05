import { renderWithClient } from '@*company-data-covered*/caremanager/utils-react';
import { SchedulingModalButton } from '../..';
import {
  Patient,
  UnableToScheduleReason,
} from '@*company-data-covered*/caremanager/data-access-types';
import { SnackbarProvider } from 'notistack';
// TODO(CO-1684): Remove fireEvent usage in favor of userEvent
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import * as reactRouterDom from 'react-router-dom';
import { useCallback, useState } from 'react';
import { server } from '../../test/mockServer';
import { rest } from 'msw';
import { testIds } from '../SchedulingModal.testids';
import { zonedTimeToUtc } from 'date-fns-tz';

const SAMPLE_MARKET_SCHEDULE = [
  {
    day_of_week: 1,
    open_time: {
      hours: 8,
      minutes: 0,
    },
    close_time: {
      hours: 22,
      minutes: 30,
    },
  },
  {
    day_of_week: 2,
    open_time: {
      hours: 8,
      minutes: 0,
    },
    close_time: {
      hours: 22,
      minutes: 30,
    },
  },
  {
    day_of_week: 3,
    open_time: {
      hours: 8,
      minutes: 0,
    },
    close_time: {
      hours: 22,
      minutes: 30,
    },
  },
  {
    day_of_week: 4,
    open_time: {
      hours: 8,
      minutes: 0,
    },
    close_time: {
      hours: 22,
      minutes: 30,
    },
  },
  {
    day_of_week: 5,
    open_time: {
      hours: 8,
      minutes: 0,
    },
    close_time: {
      hours: 22,
      minutes: 30,
    },
  },
  {
    day_of_week: 6,
    open_time: {
      hours: 8,
      minutes: 0,
    },
    close_time: {
      hours: 22,
      minutes: 30,
    },
  },
  {
    day_of_week: 7,
    open_time: {
      hours: 8,
      minutes: 0,
    },
    close_time: {
      hours: 22,
      minutes: 30,
    },
  },
];

const SAMPLE_VISIT_AVAILABILITY = {
  availability: [
    {
      date: '07-10-2023',
      is_available: true,
      reasons: [],
    },
    {
      date: '07-11-2023',
      is_available: true,
      reasons: [],
    },
    {
      date: '07-12-2023',
      is_available: false,
      reasons: [],
    },
    {
      date: '07-13-2023',
      is_available: true,
      reasons: [],
    },
    {
      date: '07-14-2023',
      is_available: false,
      reasons: [],
    },
  ],
};

const getMockedUseSearchParams = (initialState: URLSearchParams) => {
  return (_: reactRouterDom.URLSearchParamsInit | undefined) => {
    const [params, setParams] = useState(new URLSearchParams(initialState));
    const setSearchParams = useCallback(
      (newParams: URLSearchParams | undefined): void => {
        setParams(newParams ?? new URLSearchParams());
      },
      []
    );

    return [params, setSearchParams] as ReturnType<
      typeof reactRouterDom.useSearchParams
    >;
  };
};

describe('<SchedulingModal />', () => {
  const setup = () => {
    const closeFn = vi.fn();

    const { user } = renderWithClient(
      <reactRouterDom.MemoryRouter initialEntries={['/episodes/1/visits']}>
        <SnackbarProvider>
          <SchedulingModalButton
            episodeId="1"
            marketId="162"
            serviceLineId="9"
            patient={
              {
                firstName: 'John',
                lastName: 'Doe',
                addressStreet: '3755 Spring Mountain Road',
              } as Patient
            }
          />
        </SnackbarProvider>
      </reactRouterDom.MemoryRouter>
    );

    return { closeFn, user };
  };

  beforeEach(() => {
    // Ensures deterministic behavior of the tests
    vi.setSystemTime(
      zonedTimeToUtc(new Date('2023-07-10 07:00:00'), 'America/Denver')
    );
  });

  afterAll(() => {
    vi.setSystemTime(vi.getRealSystemTime());
  });

  it("renders and duplicates the Episode's latest Visit", async () => {
    const careRequestId = '45784521365';

    server.use(
      rest.post(
        '/v1/episodes/:episode_id/duplicate-latest-visit',
        (_, res, ctx) =>
          res.once(
            ctx.status(200),
            ctx.json({
              care_request_id: careRequestId,
            })
          )
      )
    );

    const mockedUseSearchParams = getMockedUseSearchParams(
      new URLSearchParams()
    );
    const useSearchParamsSpy = vitest.spyOn(reactRouterDom, 'useSearchParams');
    useSearchParamsSpy.mockImplementation(mockedUseSearchParams);

    const { user } = setup();
    user.click(await screen.findByTestId(testIds.OPEN_MODAL_BUTTON));

    expect(await screen.findByTestId(testIds.DIALOG)).toBeInTheDocument();
    expect(await screen.findByText(careRequestId)).toBeInTheDocument();
    expect(await screen.findByText('John Doe')).toBeInTheDocument();
  });

  it('renders and does not duplicate the Visit since the URLParams already contain a CR ID', async () => {
    const careRequestId = '8956984897';
    const mockedUseSearchParams = getMockedUseSearchParams(
      new URLSearchParams({
        careRequestId,
      })
    );
    const useSearchParamsSpy = vitest.spyOn(reactRouterDom, 'useSearchParams');
    useSearchParamsSpy.mockImplementation(mockedUseSearchParams);

    const { user } = setup();
    user.click(await screen.findByTestId(testIds.OPEN_MODAL_BUTTON));

    expect(await screen.findByTestId(testIds.DIALOG)).toBeInTheDocument();
    expect(await screen.findByText(careRequestId)).toBeInTheDocument();
  });

  it('renders empty availability inputs if selected date has no availability', async () => {
    server.use(
      rest.post('/v1/visit-availability', (_, res, ctx) =>
        res.once(
          ctx.status(200),
          ctx.json({
            availability: SAMPLE_VISIT_AVAILABILITY.availability.map(
              (date) => ({
                ...date,
                is_available: false,
              })
            ),
          })
        )
      )
    );
    const careRequestId = '8956984897';
    const mockedUseSearchParams = getMockedUseSearchParams(
      new URLSearchParams({
        careRequestId,
      })
    );
    const useSearchParamsSpy = vitest.spyOn(reactRouterDom, 'useSearchParams');
    useSearchParamsSpy.mockImplementation(mockedUseSearchParams);

    const { user } = setup();
    user.click(await screen.findByTestId(testIds.OPEN_MODAL_BUTTON));

    const dateInput = await screen.findByTestId(testIds.DATE_DROPDOWN);

    let button = within(dateInput).getByRole('button');
    fireEvent.mouseDown(button);
    const listbox = screen.getByRole('listbox');
    const options = within(listbox).getAllByRole('option');
    fireEvent.click(options[0]);

    const availabilityStartInput = await screen.findByTestId(
      testIds.AVAILABILITY_START_TIME_DROPDOWN
    );
    const availabilityEndInput = await screen.findByTestId(
      testIds.AVAILABILITY_END_TIME_DROPDOWN
    );

    button = within(availabilityStartInput).getByRole('button');
    fireEvent.mouseDown(button);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

    button = within(availabilityEndInput).getByRole('button');
    fireEvent.mouseDown(button);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('renders error if availability window is less than 4 hours', async () => {
    server.use(
      rest.get('/v1/config', (_, res, ctx) =>
        res.once(
          ctx.status(200),
          ctx.json({
            care_phases: [],
            service_lines: [],
            markets: [
              {
                id: '162',
                name: 'Las Vegas',
                short_name: 'LAS',
                schedule_days: SAMPLE_MARKET_SCHEDULE,
              },
            ],
          })
        )
      ),
      rest.post('/v1/visit-availability', (_, res, ctx) =>
        res.once(ctx.status(200), ctx.json(SAMPLE_VISIT_AVAILABILITY))
      )
    );
    const careRequestId = '8956984897';
    const mockedUseSearchParams = getMockedUseSearchParams(
      new URLSearchParams({
        careRequestId,
      })
    );
    const useSearchParamsSpy = vitest.spyOn(reactRouterDom, 'useSearchParams');
    useSearchParamsSpy.mockImplementation(mockedUseSearchParams);

    const { user } = setup();
    user.click(await screen.findByTestId(testIds.OPEN_MODAL_BUTTON));

    expect(await screen.findByTestId(testIds.DIALOG)).toBeInTheDocument();
    expect(await screen.findByText(careRequestId)).toBeInTheDocument();

    const dateInput = await screen.findByTestId(testIds.DATE_DROPDOWN);

    let button = within(dateInput).getByRole('button');
    fireEvent.mouseDown(button);
    let listbox = screen.getByRole('listbox');
    let options = within(listbox).getAllByRole('option');
    fireEvent.click(options[0]);

    const availabilityStartInput = await screen.findByTestId(
      testIds.AVAILABILITY_START_TIME_DROPDOWN
    );
    const availabilityEndInput = await screen.findByTestId(
      testIds.AVAILABILITY_END_TIME_DROPDOWN
    );

    button = within(availabilityStartInput).getByRole('button');
    fireEvent.mouseDown(button);
    listbox = screen.getByRole('listbox');
    options = within(listbox).getAllByRole('option');
    fireEvent.click(options[0]);

    button = within(availabilityEndInput).getByRole('button');
    fireEvent.mouseDown(button);
    listbox = screen.getByRole('listbox');
    options = within(listbox).getAllByRole('option');
    fireEvent.click(options[0]);
    fireEvent.blur(button);

    expect(
      await screen.findByText((elem) => {
        return elem.includes('at least 4 hours');
      })
    ).toBeInTheDocument();
  });

  it('submits the form and closes', async () => {
    server.use(
      rest.get('/v1/config', (_, res, ctx) =>
        res.once(
          ctx.status(200),
          ctx.json({
            care_phases: [],
            service_lines: [],
            markets: [
              {
                id: '162',
                name: 'Las Vegas',
                short_name: 'LAS',
                schedule_days: SAMPLE_MARKET_SCHEDULE,
              },
            ],
          })
        )
      ),

      rest.post('/v1/visit-availability', (_, res, ctx) =>
        res.once(ctx.status(200), ctx.json(SAMPLE_VISIT_AVAILABILITY))
      )
    );

    const careRequestId = '89569846543';
    const mockedUseSearchParams = getMockedUseSearchParams(
      new URLSearchParams({
        careRequestId,
      })
    );
    const useSearchParamsSpy = vitest.spyOn(reactRouterDom, 'useSearchParams');
    useSearchParamsSpy.mockImplementation(mockedUseSearchParams);

    const { user } = setup();
    user.click(await screen.findByTestId(testIds.OPEN_MODAL_BUTTON));

    const modal = await screen.findByTestId(testIds.DIALOG);
    expect(modal).toBeInTheDocument();

    const dateInput = await screen.findByTestId(testIds.DATE_DROPDOWN);

    let button = within(dateInput).getByRole('button');
    fireEvent.mouseDown(button);
    let listbox = screen.getByRole('listbox');
    let options = within(listbox).getAllByRole('option');
    fireEvent.click(options[0]);

    const availabilityStartInput = await screen.findByTestId(
      testIds.AVAILABILITY_START_TIME_DROPDOWN
    );
    const availabilityEndInput = await screen.findByTestId(
      testIds.AVAILABILITY_END_TIME_DROPDOWN
    );

    button = within(availabilityStartInput).getByRole('button');
    fireEvent.mouseDown(button);
    listbox = screen.getByRole('listbox');
    options = within(listbox).getAllByRole('option');
    fireEvent.click(options[0]);

    button = within(availabilityEndInput).getByRole('button');
    fireEvent.mouseDown(button);
    listbox = screen.getByRole('listbox');
    options = within(listbox).getAllByRole('option');
    fireEvent.click(options[10]);
    fireEvent.blur(button);

    await waitFor(() =>
      expect(screen.getByTestId(testIds.SUBMIT_BUTTON)).not.toBeDisabled()
    );

    const submitButton = await screen.findByTestId(testIds.SUBMIT_BUTTON);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.queryByTestId(testIds.DIALOG)).not.toBeInTheDocument();
    });
  });

  it('does not render the modal if the button has not been clicked', () => {
    setup();

    expect(screen.queryByTestId(testIds.DIALOG)).not.toBeInTheDocument();
  });

  it('cancel visit and closes when cancel option is clicked', async () => {
    server.use(
      rest.patch('/v1/cancel-visit', (_, res, ctx) =>
        res.once(ctx.status(200), ctx.json({}))
      )
    );

    const careRequestId = '8956984897';
    const mockedUseSearchParams = getMockedUseSearchParams(
      new URLSearchParams({
        careRequestId,
      })
    );
    const useSearchParamsSpy = vitest.spyOn(reactRouterDom, 'useSearchParams');
    useSearchParamsSpy.mockImplementation(mockedUseSearchParams);

    const { user } = setup();
    user.click(await screen.findByTestId(testIds.OPEN_MODAL_BUTTON));

    expect(await screen.findByTestId(testIds.CANCEL_BUTTON)).not.toBeDisabled();

    const cancelButton = await screen.findByTestId(testIds.CANCEL_BUTTON);
    user.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByTestId(testIds.DIALOG)).not.toBeInTheDocument();
    });
  });

  it('renders the reasons why a visit cannot be scheduled', async () => {
    server.use(
      rest.get('/v1/config', (_, res, ctx) =>
        res.once(
          ctx.status(200),
          ctx.json({
            care_phases: [],
            service_lines: [],
            markets: [
              {
                id: '162',
                name: 'Las Vegas',
                short_name: 'LAS',
                schedule_days: SAMPLE_MARKET_SCHEDULE,
              },
            ],
          })
        )
      ),
      rest.post('/v1/visit-availability', (_, res, ctx) =>
        res.once(ctx.status(200), ctx.json(SAMPLE_VISIT_AVAILABILITY))
      ),
      rest.post('/v1/can-schedule-visit', (_, res, ctx) =>
        res.once(
          ctx.status(200),
          ctx.json({
            can_schedule_visit: false,
            reason: UnableToScheduleReason.AdvancedCareUnavailable,
          })
        )
      )
    );

    const careRequestId = '8956984897';
    const mockedUseSearchParams = getMockedUseSearchParams(
      new URLSearchParams({
        careRequestId,
      })
    );
    const useSearchParamsSpy = vitest.spyOn(reactRouterDom, 'useSearchParams');
    useSearchParamsSpy.mockImplementation(mockedUseSearchParams);

    const { user } = setup();
    user.click(await screen.findByTestId(testIds.OPEN_MODAL_BUTTON));

    expect(await screen.findByTestId(testIds.DIALOG)).toBeInTheDocument();
    expect(await screen.findByText(careRequestId)).toBeInTheDocument();

    const dateInput = await screen.findByTestId(testIds.DATE_DROPDOWN);

    let button = within(dateInput).getByRole('button');
    fireEvent.mouseDown(button);
    let listbox = screen.getByRole('listbox');
    let options = within(listbox).getAllByRole('option');
    fireEvent.click(options[0]);

    const availabilityStartInput = await screen.findByTestId(
      testIds.AVAILABILITY_START_TIME_DROPDOWN
    );
    const availabilityEndInput = await screen.findByTestId(
      testIds.AVAILABILITY_END_TIME_DROPDOWN
    );

    button = within(availabilityStartInput).getByRole('button');
    fireEvent.mouseDown(button);
    listbox = screen.getByRole('listbox');
    options = within(listbox).getAllByRole('option');
    fireEvent.click(options[0]);

    button = within(availabilityEndInput).getByRole('button');
    fireEvent.mouseDown(button);
    listbox = screen.getByRole('listbox');
    options = within(listbox).getAllByRole('option');
    fireEvent.click(options[10]);
    fireEvent.blur(button);

    expect(
      await screen.findByTestId(testIds.ERROR_REASONS)
    ).toBeInTheDocument();
  });
});
