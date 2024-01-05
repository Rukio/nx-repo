import { PersonIcon } from '@*company-data-covered*/design-system';
import { render, screen } from '@testing-library/react';

import MetricsSection from './MetricsSection';
import { METRICS_SECTION_TEST_IDS } from './TestIds';

const metricsSectionProps = {
  title: 'My performance',
  testIdPrefix: 'test',
  icon: <PersonIcon />,
};

const fakeChildProps = {
  dataTestId: 'fakeChild',
  textContent: 'fakeChild',
};

describe('MetricsSection', () => {
  it('should render correctly', () => {
    const { asFragment } = render(
      <MetricsSection {...metricsSectionProps}>
        <div data-testid={fakeChildProps.dataTestId}>
          {fakeChildProps.textContent}
        </div>
      </MetricsSection>
    );

    expect(asFragment()).toMatchSnapshot();
    expect(
      screen.getByTestId(`test-${METRICS_SECTION_TEST_IDS.TITLE}`).textContent
    ).toContain(metricsSectionProps.title);

    expect(screen.getByTestId(fakeChildProps.dataTestId).textContent).toContain(
      fakeChildProps.textContent
    );
  });
});
