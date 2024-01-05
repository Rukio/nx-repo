import { Props, Coords } from 'google-map-react';
import { render, screen } from '../../../testUtils';
import Map from './Map';
import { MAP_TEST_IDS } from './testIds';

const mockMapProps: Props = {
  defaultCenter: { lat: 0, lng: 0 },
};

const mockMarker = jest.fn().mockReturnValue({});

jest.mock('google-map-react', () => ({
  ...jest.requireActual('google-map-react'),
  __esModule: true,
  default: (props: Props) => {
    props.onGoogleApiLoaded?.({
      map: jest.fn(),
      maps: { Marker: mockMarker },
      ref: null,
    });

    return <div />;
  },
}));

describe('Map', () => {
  it('should render correctly', async () => {
    render(<Map {...mockMapProps} />);

    const container = screen.getByTestId(MAP_TEST_IDS.ROOT);
    expect(container).toBeVisible();
  });

  it('should call Marker fn if center is provided', async () => {
    const mockCenter: Coords = { lat: 51.1231, lng: 52.1231 };
    render(<Map {...mockMapProps} center={mockCenter} />);

    const container = screen.getByTestId(MAP_TEST_IDS.ROOT);
    expect(container).toBeVisible();

    expect(mockMarker).toBeCalledWith(
      expect.objectContaining({ position: mockCenter })
    );
  });
});
