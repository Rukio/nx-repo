import { render, screen } from '../../../testUtils';
import Section from './Section';
import { SECTION_TEST_IDS } from './testIds';

describe('<Section />', () => {
  it('should render correctly', () => {
    const content = 'CONTENT TEST';
    const sectionTestIdPrefix = 'TEST';

    render(<Section testIdPrefix={sectionTestIdPrefix}>{content}</Section>);

    expect(
      screen.getByTestId(SECTION_TEST_IDS.getSectionTestId(sectionTestIdPrefix))
    ).toBeVisible();

    expect(
      screen.getByTestId(SECTION_TEST_IDS.getSectionTestId(sectionTestIdPrefix))
    ).toHaveTextContent(content);
  });
});
