import { fireEvent, render, screen } from '@testing-library/react';
import { QueryClientProvider } from 'react-query';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { SnackbarProvider } from 'notistack';
import { createTestQueryClient } from '@*company-data-covered*/caremanager/utils-react';
import { userKeys } from '@*company-data-covered*/caremanager/data-access';
import {
  VisitListElement,
  VisitStatusGroup,
} from '@*company-data-covered*/caremanager/data-access-types';
import {
  CALL_VISIT_ICON_TEST_ID,
  DISPLAY_DATE_TEST_ID,
  VISIT_ICON_TEST_ID,
  VisitCard,
} from '../VisitCard';

const props = {
  visit: {
    id: '123456',
    createdAt: '2058-03-02T18:51:22.726Z',
    updatedAt: '2058-03-02T18:51:22.726Z',
    episodeId: '7890',
    patientAvailabilityStart: '2058-03-02T18:51:22.726Z',
    carName: 'COL001',
    status: 'on_scene',
    statusGroup: VisitStatusGroup.Active,
    type: 'High Acuity',
    summary: 'The patient is on their way to recovery, praise the lord.',
    providerUserIds: ['9'],
  },
  serviceLineName: 'Advanced Care',
};

const setup = (params?: Partial<VisitListElement>, isEditable?: boolean) => {
  const testQueryClient = createTestQueryClient();
  testQueryClient.setQueryData(userKeys.detail('9'), {
    id: '9',
    firstName: 'A guy named Joe',
    lastName: '',
    jobTitle: 'AAA',
  });
  testQueryClient.setQueryData(userKeys.detail('8'), {
    id: '8',
    firstName: 'A lady named Joline',
    lastName: '',
    jobTitle: 'BBB',
  });

  const newProps = {
    ...props,
    visit: {
      ...props.visit,
      ...params,
    },
    isEditable,
  };

  const router = createMemoryRouter([
    {
      path: '/',
      element: (
        <SnackbarProvider>
          <VisitCard {...newProps} />
        </SnackbarProvider>
      ),
    },
  ]);

  render(
    <QueryClientProvider client={testQueryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );

  return router;
};

describe('VisitCard', () => {
  it('should render correctly', () => {
    setup({ careRequestId: '1', statusUpdatedAt: '2058-03-02T18:51:22.726Z' });
    expect(screen.getByText('Visit Id')).toBeInTheDocument();
    expect(screen.getByText('Service Line')).toBeInTheDocument();
    expect(screen.getByText('Visit Type')).toBeInTheDocument();

    expect(screen.getByText('Advanced Care')).toBeInTheDocument();
    expect(screen.getByText('123456')).toBeInTheDocument();
    expect(screen.getByText('High Acuity')).toBeInTheDocument();
    expect(screen.getByText('March 2nd 6:51PM')).toBeInTheDocument();
    expect(screen.getByText('on scene')).toBeInTheDocument();
    expect(screen.getByText(props.visit.summary)).toBeInTheDocument();
    expect(screen.getByText('A guy named Joe')).toBeInTheDocument();
    expect(screen.getByText('AAA')).toBeInTheDocument();
    expect(screen.getByText('Care Team: COL001')).toBeInTheDocument();
  });

  it('should render a car icon and service line when it is a regular visit', () => {
    setup({ careRequestId: '1' });
    expect(screen.getByTestId(VISIT_ICON_TEST_ID)).toBeInTheDocument();
    expect(screen.getByText('Service Line')).toBeInTheDocument();
  });

  it('should render a phone icon and not render service line when it is a call visit', () => {
    setup();
    expect(screen.getByTestId(CALL_VISIT_ICON_TEST_ID)).toBeInTheDocument();
    expect(screen.queryByText('Service Line')).not.toBeInTheDocument();
  });

  it('should not render Visit Type when type is undefined', () => {
    setup({ type: undefined });
    expect(screen.queryByText('Visit Type')).not.toBeInTheDocument();
  });

  it('should redirect the user to the visit details view when clicking on a card that is not a call', async () => {
    const router = setup({ careRequestId: 'somecarerequestid' });
    const visitCardTestId = `visit-card-${props.visit.id}`;
    expect(await screen.findByTestId(visitCardTestId)).toBeInTheDocument();
    fireEvent.click(screen.getByTestId(visitCardTestId));

    expect(router.state.location.pathname).toBe(
      `/episodes/${props.visit.episodeId}/visits/${props.visit.id}`
    );
  });

  it('should not redirect when clicking on a card that is a call', async () => {
    const router = setup();
    const visitCardTestId = `visit-card-${props.visit.id}`;
    expect(await screen.findByTestId(visitCardTestId)).toBeInTheDocument();
    fireEvent.click(screen.getByTestId(visitCardTestId));

    expect(router.state.location.pathname).toBe('/');
  });

  it('should show empty created by user id', () => {
    setup({
      providerUserIds: [],
      createdByUserId: '8',
    });

    expect(screen.getByText('A lady named Joline')).toBeInTheDocument();
  });

  it('should show empty state messages', async () => {
    setup({
      carName: undefined,
      providerUserIds: [],
    });

    const visitCardTestId = `visit-card-${props.visit.id}`;
    expect(await screen.findByTestId(visitCardTestId)).toBeInTheDocument();
    expect(screen.getByText('Care Team')).toBeInTheDocument();
    expect(screen.getByText('No care team assigned.')).toBeInTheDocument();
  });

  it('should render edit button when the visit is a call', () => {
    setup(undefined, true);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('should show a shadow visit when scheduling is in process', () => {
    setup({ isSchedulingInProcess: true }, false);

    expect(screen.getByText('Scheduling in Process')).toBeInTheDocument();
  });

  it('should not redirect when clicking on a card that needs scheduling', async () => {
    const router = setup({ isSchedulingInProcess: true }, false);

    const visitCardTestId = `visit-card-${props.visit.id}`;
    expect(await screen.findByTestId(visitCardTestId)).toBeInTheDocument();
    fireEvent.click(screen.getByTestId(visitCardTestId));

    expect(router.state.location.pathname).toBe('/');
  });

  it('should show dismiss button when more than 30 minutes have passed without proper scheduling', () => {
    const previous = new Date(Date.now());
    previous.setDate(previous.getDate() - 1);
    setup(
      { isSchedulingInProcess: true, createdAt: previous.toDateString() },
      false
    );

    expect(screen.getByText('Scheduling in Process')).toBeInTheDocument();
    expect(screen.getByText('Remove from Visits')).toBeInTheDocument();
  });

  it('should NOT show dismiss button when more than 30 minutes have passed without proper scheduling', () => {
    const date = new Date(Date.now());
    setup({ isSchedulingInProcess: true, createdAt: date.toString() }, false);

    expect(screen.getByText('Scheduling in Process')).toBeInTheDocument();
    expect(screen.queryByText('Remove from Visits')).not.toBeInTheDocument();
  });

  it('should show statusUpdatedAt in display date when status is on_scene', async () => {
    setup(
      { statusUpdatedAt: '15 Jan 2022 17:30:00 GMT', status: 'on_scene' },
      false
    );

    expect(await screen.findByTestId(DISPLAY_DATE_TEST_ID)).toHaveTextContent(
      'January 15th 5:30PM'
    );
  });

  it('should show statusUpdatedAt in display date when status is completed', async () => {
    setup(
      { statusUpdatedAt: '15 Jan 2022 18:30:00 GMT', status: 'completed' },
      false
    );

    expect(await screen.findByTestId(DISPLAY_DATE_TEST_ID)).toHaveTextContent(
      'January 15th 6:30PM'
    );
  });

  it('should show statusUpdatedAt in display date when status is billing', async () => {
    setup(
      { statusUpdatedAt: '15 Jan 2022 20:30:00 GMT', status: 'billing' },
      false
    );
    expect(await screen.findByTestId(DISPLAY_DATE_TEST_ID)).toHaveTextContent(
      'January 15th 8:30PM'
    );
  });

  it('should show statusUpdatedAt in display date when status is archived', async () => {
    setup(
      { statusUpdatedAt: '15 Jan 2022 21:30:00 GMT', status: 'archived' },
      false
    );
    expect(await screen.findByTestId(DISPLAY_DATE_TEST_ID)).toHaveTextContent(
      'January 15th 9:30PM'
    );
  });

  it('should show createdAt in display date when status is resolved', async () => {
    setup(
      { statusUpdatedAt: '20 Jan 2022 13:01 GMT', status: 'resolved' },
      false
    );
    expect(await screen.findByTestId(DISPLAY_DATE_TEST_ID)).toHaveTextContent(
      'January 20th 1:01PM'
    );
  });

  it('should show statusUpdatedAt in display date when status is requested', async () => {
    setup(
      { statusUpdatedAt: '15 Jan 2022 22:30:00 GMT', status: 'requested' },
      false
    );
    expect(await screen.findByTestId(DISPLAY_DATE_TEST_ID)).toHaveTextContent(
      'January 15th'
    );
  });

  it('should show eta in display date when status is accepted', async () => {
    setup({ eta: '15 Jan 2022 23:30:00 GMT', status: 'accepted' }, false);
    expect(await screen.findByTestId(DISPLAY_DATE_TEST_ID)).toHaveTextContent(
      'January 15th'
    );
  });

  it('should show eta in display date when status is committed', async () => {
    setup({ eta: '17 Jan 2022 10:30:00 GMT', status: 'committed' }, false);
    expect(await screen.findByTestId(DISPLAY_DATE_TEST_ID)).toHaveTextContent(
      'January 17th 10:30AM'
    );
  });

  it('should show eta in display date when status is on_route', async () => {
    setup({ eta: '16 Jan 2022 08:30:00 GMT', status: 'on_route' }, false);
    expect(await screen.findByTestId(DISPLAY_DATE_TEST_ID)).toHaveTextContent(
      'January 16th 8:30AM'
    );
  });

  it('should show createdAt in display date when visit has no status (e.g. call visit)', async () => {
    setup({ createdAt: '29 Jan 2022 16:30:00 GMT', status: '' }, false);
    expect(screen.getByText('January 29th 4:30PM')).toBeInTheDocument();
    expect(await screen.findByTestId(DISPLAY_DATE_TEST_ID)).toHaveTextContent(
      'January 29th 4:30PM'
    );
  });

  it('should show N/A in display date when visit should show statusUpdatedAt but there is no statusUpdatedAt data', async () => {
    setup({ status: 'on_scene' }, false);
    expect(await screen.findByTestId(DISPLAY_DATE_TEST_ID)).toHaveTextContent(
      'N/A'
    );
  });

  it('should show N/A in display date when visit should show ETA but there is no available ETA data', async () => {
    setup({ status: 'accepted' }, false);
    expect(await screen.findByTestId(DISPLAY_DATE_TEST_ID)).toHaveTextContent(
      'N/A'
    );
  });
});
