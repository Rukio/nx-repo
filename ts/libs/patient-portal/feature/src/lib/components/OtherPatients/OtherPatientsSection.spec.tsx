import { render, screen } from '../../../testUtils';
import { TEST_IDS } from '@*company-data-covered*/patient-portal/ui';
import { OTHER_PATIENTS_SECTION_TEST_IDS } from './testIds';
import OtherPatientsSection from './OtherPatientsSection';

const setup = () => render(<OtherPatientsSection />);

describe('<MySettingsSection />', () => {
  it('should render correctly', () => {
    setup();

    const sectionTitle = screen.getByTestId(
      TEST_IDS.PAGE_SECTION.getPageSectionTitleTestId(
        OTHER_PATIENTS_SECTION_TEST_IDS.otherPatientsTestIdPrefix
      )
    );

    expect(sectionTitle).toBeVisible();
    expect(sectionTitle).toHaveTextContent('Other Patients');
  });
});
