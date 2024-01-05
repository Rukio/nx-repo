import { PropsWithChildren } from 'react';
import { render } from '../../../testUtils/test-utils';
import { BasicLatestShiftTrendChart } from '../__storybook__/LatestShiftTrendChart.stories';

global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

jest.mock('recharts', () => {
  const OriginalModule = jest.requireActual('recharts');

  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }: PropsWithChildren) => (
      <OriginalModule.ResponsiveContainer width={800} height={300}>
        {children}
      </OriginalModule.ResponsiveContainer>
    ),
  };
});

describe('Snapshot tests', () => {
  test('should render', () => {
    const { asFragment } = render(<BasicLatestShiftTrendChart />);
    expect(asFragment()).toMatchSnapshot();
  });
});
