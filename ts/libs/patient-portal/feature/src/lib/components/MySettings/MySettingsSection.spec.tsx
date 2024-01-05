import { generatePath } from 'react-router-dom';
import { render, screen } from '../../../testUtils';
import {
  PATIENT_MENU_LIST_ITEM_SECTIONS_IDS,
  TEST_IDS,
} from '@*company-data-covered*/patient-portal/ui';
import { MY_SETTINGS_SECTION_TEST_IDS } from './testIds';
import MySettingsSection from './MySettingsSection';
import { PATIENT_PORTAL_ROUTES } from '../../constants';

const setup = () => render(<MySettingsSection />);

const consoleSpy = vi.spyOn(console, 'info');

const mockedNavigator = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>(
    'react-router-dom'
  );

  return {
    ...actual,
    useNavigate: () => mockedNavigator,
  };
});

describe('<MySettingsSection />', () => {
  it('should render correctly', () => {
    setup();

    const sectionTitle = screen.getByTestId(
      TEST_IDS.PAGE_SECTION.getPageSectionTitleTestId(
        MY_SETTINGS_SECTION_TEST_IDS.mySettingsTestIdPrefix
      )
    );

    expect(sectionTitle).toBeVisible();
    expect(sectionTitle).toHaveTextContent('My Settings');
  });

  it("should call onInfo when clicking any section's info button", async () => {
    const { user } = setup();

    const infoButton = screen.getByTestId(
      TEST_IDS.FORMATTED_LIST.getListItemIconButtonTestId(
        TEST_IDS.MY_SETTINGS.getNameListItemTestIdPrefix(
          MY_SETTINGS_SECTION_TEST_IDS.mySettingsTestIdPrefix
        )
      )
    );

    await user.click(infoButton);

    //TODO(PT-1619): this is temporary, will be removed after data-access is implemented
    expect(consoleSpy).toBeCalledWith(
      `${PATIENT_MENU_LIST_ITEM_SECTIONS_IDS.NAME}-info`
    );
  });

  it("should call onEdit when clicking any section's edit button", async () => {
    const { user } = setup();

    const editButton = screen.getByTestId(
      TEST_IDS.FORMATTED_LIST.getListItemButtonTestId(
        TEST_IDS.MY_SETTINGS.getEmailListItemTestIdPrefix(
          MY_SETTINGS_SECTION_TEST_IDS.mySettingsTestIdPrefix
        )
      )
    );

    await user.click(editButton);

    //TODO(PT-1619): this is temporary, will be removed after data-access is implemented
    expect(consoleSpy).toBeCalledWith(
      `${PATIENT_MENU_LIST_ITEM_SECTIONS_IDS.EMAIL}-edit`
    );
  });

  it('should redirect to Edit Patient when clicking Add Patient Details button', async () => {
    const { user } = setup();

    const addPatientDetailsButton = screen.getByTestId(
      TEST_IDS.SETTINGS_LIST.getButtonListItemButtonTestId(
        MY_SETTINGS_SECTION_TEST_IDS.mySettingsTestIdPrefix
      )
    );

    await user.click(addPatientDetailsButton);

    expect(mockedNavigator).toBeCalledWith(
      generatePath(PATIENT_PORTAL_ROUTES.PATIENT_DETAILS, {
        patientId: 'MOCK_PATIENT_ID',
      })
    );
  });
});
