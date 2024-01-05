import { screen } from '@testing-library/react';
import { rest } from 'msw';
import { MemoryRouter } from 'react-router-dom';
import { renderWithClient } from '@*company-data-covered*/caremanager/utils-react';
import { JSONMocks } from '@*company-data-covered*/caremanager/utils-mocks';
import {
  EpisodeFromJSON,
  VisitStatusGroup,
} from '@*company-data-covered*/caremanager/data-access-types';
import EpisodeVisits from '../EpisodeVisits';
import testIds from '../EpisodeVisits.testIds';
import { server } from '../../../../test/mockServer';

const setup = () => {
  return renderWithClient(
    <MemoryRouter>
      <EpisodeVisits episode={EpisodeFromJSON(JSONMocks.episode.episode)} />
    </MemoryRouter>
  );
};

describe('EpisodeVisits', () => {
  it('renders', async () => {
    setup();

    expect(
      await screen.findByTestId(testIds.EPISODE_VISITS_BOX)
    ).toBeInTheDocument();

    expect(
      screen.getByTestId(testIds.ACTIVE_VISITS_SECTION)
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(testIds.UPCOMING_VISITS_SECTION)
    ).toBeInTheDocument();
    expect(screen.getByTestId(testIds.PAST_VISITS_SECTION)).toBeInTheDocument();
  });

  it('groups visits by visitStatusGroup', async () => {
    setup();

    expect(
      await screen.findByTestId(testIds.EPISODE_VISITS_BOX)
    ).toBeInTheDocument();

    for (const visit of JSONMocks.episodeVisits.visits) {
      const visitTestId = (() => {
        switch (visit.status_group) {
          case VisitStatusGroup.Active:
            return `${testIds.ACTIVE_VISITS_SECTION}-${visit.id}`;
          case VisitStatusGroup.Upcoming:
            return `${testIds.UPCOMING_VISITS_SECTION}-${visit.id}`;
          case VisitStatusGroup.Past:
            return `${testIds.PAST_VISITS_SECTION}-${visit.id}`;
          default:
            return `${testIds.UNSPECIFIED_VISITS_SECTION}-${visit.id}`;
        }
      })();

      expect(
        screen.getByTestId(`${testIds.VISIT_LIST_ITEM_PREFIX}${visitTestId}`)
      ).toBeInTheDocument();
      expect(screen.getByText(visit.summary)).toBeInTheDocument();
    }
  });

  it('expands and contracts visits accordion', async () => {
    const { user } = setup();

    expect(
      await screen.findByTestId(testIds.EPISODE_VISITS_BOX)
    ).toBeInTheDocument();

    const activeVisitsGroupExpandableControlAreaTestId = `${testIds.EPISODE_VISITS_SECTION_ACCORDION_SUMMARY_PREFIX}${testIds.ACTIVE_VISITS_SECTION}`;

    await user.click(
      screen.getByTestId(activeVisitsGroupExpandableControlAreaTestId)
    );
    expect(
      screen.getByTestId(testIds.ACTIVE_VISITS_SECTION).className
    ).not.toContain('expanded');

    await user.click(
      screen.getByTestId(activeVisitsGroupExpandableControlAreaTestId)
    );
    expect(
      screen.getByTestId(testIds.ACTIVE_VISITS_SECTION).className
    ).toContain('expanded');
    expect(
      screen.getByTestId(
        `service-line-${JSONMocks.episodeVisits.visits[0].id}-${JSONMocks.config.service_lines[0].name}`
      )
    ).toHaveTextContent(JSONMocks.config.service_lines[0].name);
  });

  it('renders empty states', async () => {
    server.use(
      rest.get('/v1/episodes/:id/visits', (_, res, ctx) =>
        res.once(ctx.status(200), ctx.json({ visits: [] }))
      )
    );

    setup();

    expect(
      await screen.findByTestId(testIds.EPISODE_VISITS_BOX)
    ).toBeInTheDocument();

    expect(
      screen.getByTestId(
        `${testIds.ACTIVE_VISITS_SECTION}-${testIds.EPISODE_VISITS_EMPTY_SECTION}`
      )
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(
        `${testIds.UPCOMING_VISITS_SECTION}-${testIds.EPISODE_VISITS_EMPTY_SECTION}`
      )
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(
        `${testIds.PAST_VISITS_SECTION}-${testIds.EPISODE_VISITS_EMPTY_SECTION}`
      )
    ).toBeInTheDocument();
  });
});
