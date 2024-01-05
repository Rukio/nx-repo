import { fireEvent, screen, waitFor } from '@testing-library/react';
import { JSONMocks } from '@*company-data-covered*/caremanager/utils-mocks';
import {
  EpisodeFromJSON,
  MarketFromJSON,
} from '@*company-data-covered*/caremanager/data-access-types';
import { renderWithClient } from '@*company-data-covered*/caremanager/utils-react';
import EditEpisodeModal from '../EditEpisodeModal';

const closeFn = vi.fn();

const setup = () => {
  const episode = EpisodeFromJSON(JSONMocks.episode.episode);
  const props = {
    isOpen: true,
    onClose: closeFn,
    episode,
  };

  return renderWithClient(<EditEpisodeModal {...props} />);
};

describe('Edit Episode Modal tests', () => {
  it('Renders Edit Episode Modal', async () => {
    setup();

    expect(
      await screen.findByTestId('edit-episode-modal-form')
    ).toBeInTheDocument();
  });

  it('Renders Edit Episode Modal Body', async () => {
    setup();

    expect(
      await screen.findByTestId('edit-episode-modal-body')
    ).toBeInTheDocument();
  });

  it('Submit button in document', async () => {
    const market = MarketFromJSON(JSONMocks.config.markets[1]);
    setup();

    const marketSelect = await screen.findByTestId('marketid-select');
    fireEvent.change(marketSelect, {
      target: { value: market.id },
    });

    const submitButton = screen.getByTestId('edit-episode-modal-save-button');
    submitButton.click();
    await waitFor(() => {
      expect(closeFn).toHaveBeenCalled();
    });
  });
});
