import { render, screen } from '@testing-library/react';

import PeerRankingsSection, {
  PeerRankingsSectionProps,
} from './PeerRankingsSection';
import { PEER_RANKINGS_SECTION_TEST_IDS } from './TestIds';

const peerRankingsSectionProps: PeerRankingsSectionProps = {
  title: 'Title',
};

const fakeChildProps = {
  dataTestId: 'fakeChild',
  textContent: 'fakeChild',
};

describe('PeerRankingsSection', () => {
  it('should render correctly', () => {
    const { asFragment } = render(
      <PeerRankingsSection {...peerRankingsSectionProps}>
        <div data-testid={fakeChildProps.dataTestId}>
          {fakeChildProps.textContent}
        </div>
      </PeerRankingsSection>
    );

    expect(asFragment()).toMatchSnapshot();
    expect(
      screen.getByTestId(PEER_RANKINGS_SECTION_TEST_IDS.TITLE)
    ).toHaveTextContent(peerRankingsSectionProps.title);
    expect(screen.getByTestId(fakeChildProps.dataTestId)).toHaveTextContent(
      fakeChildProps.textContent
    );
  });
});
