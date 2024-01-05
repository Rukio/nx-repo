import { render, screen } from '../../../testUtils';
import PatientMenuListItem, {
  PatientMenuListItemProps,
} from './PatientMenuListItem';
import {
  PATIENT_MENU_LIST_ITEM_SECTIONS_IDS,
  PATIENT_MENU_LIST_ITEM_SECTIONS_LABELS,
} from './constants';
import { FORMATTED_LIST_TEST_IDS } from '../FormattedList';

const defaultProps: PatientMenuListItemProps<true> = {
  testIdPrefix: 'test',
  sectionId: PATIENT_MENU_LIST_ITEM_SECTIONS_IDS.NAME,
};

const setup = (props?: Omit<PatientMenuListItemProps<true>, 'testIdPrefix'>) =>
  render(<PatientMenuListItem {...defaultProps} {...props} />);

describe('<PatientMenuListItem />', () => {
  it('should render correct', async () => {
    setup();

    expect(
      screen.getByTestId(
        FORMATTED_LIST_TEST_IDS.getListItemTestId(defaultProps.testIdPrefix)
      )
    ).toBeInTheDocument();
  });

  it.each([
    {
      testCase: PATIENT_MENU_LIST_ITEM_SECTIONS_IDS.NAME,
      sectionId: PATIENT_MENU_LIST_ITEM_SECTIONS_IDS.NAME,
      expectedResult:
        PATIENT_MENU_LIST_ITEM_SECTIONS_LABELS[
          PATIENT_MENU_LIST_ITEM_SECTIONS_IDS.NAME
        ],
    },
    {
      testCase: PATIENT_MENU_LIST_ITEM_SECTIONS_IDS.PHONE_NUMBER,
      sectionId: PATIENT_MENU_LIST_ITEM_SECTIONS_IDS.PHONE_NUMBER,
      expectedResult:
        PATIENT_MENU_LIST_ITEM_SECTIONS_LABELS[
          PATIENT_MENU_LIST_ITEM_SECTIONS_IDS.PHONE_NUMBER
        ],
    },
    {
      testCase: PATIENT_MENU_LIST_ITEM_SECTIONS_IDS.ASSIGNED_SEX_AT_BIRTH,
      sectionId: PATIENT_MENU_LIST_ITEM_SECTIONS_IDS.ASSIGNED_SEX_AT_BIRTH,
      expectedResult:
        PATIENT_MENU_LIST_ITEM_SECTIONS_LABELS[
          PATIENT_MENU_LIST_ITEM_SECTIONS_IDS.ASSIGNED_SEX_AT_BIRTH
        ],
    },
    {
      testCase: PATIENT_MENU_LIST_ITEM_SECTIONS_IDS.GENDER_IDENTITY,
      sectionId: PATIENT_MENU_LIST_ITEM_SECTIONS_IDS.GENDER_IDENTITY,
      expectedResult:
        PATIENT_MENU_LIST_ITEM_SECTIONS_LABELS[
          PATIENT_MENU_LIST_ITEM_SECTIONS_IDS.GENDER_IDENTITY
        ],
    },
    {
      testCase: PATIENT_MENU_LIST_ITEM_SECTIONS_IDS.BILLING_ADDRESS,
      sectionId: PATIENT_MENU_LIST_ITEM_SECTIONS_IDS.BILLING_ADDRESS,
      expectedResult:
        PATIENT_MENU_LIST_ITEM_SECTIONS_LABELS[
          PATIENT_MENU_LIST_ITEM_SECTIONS_IDS.BILLING_ADDRESS
        ],
    },
    {
      testCase: PATIENT_MENU_LIST_ITEM_SECTIONS_IDS.DOB,
      sectionId: PATIENT_MENU_LIST_ITEM_SECTIONS_IDS.DOB,
      expectedResult:
        PATIENT_MENU_LIST_ITEM_SECTIONS_LABELS[
          PATIENT_MENU_LIST_ITEM_SECTIONS_IDS.DOB
        ],
    },
    {
      testCase: PATIENT_MENU_LIST_ITEM_SECTIONS_IDS.EMAIL,
      sectionId: PATIENT_MENU_LIST_ITEM_SECTIONS_IDS.EMAIL,
      expectedResult:
        PATIENT_MENU_LIST_ITEM_SECTIONS_LABELS[
          PATIENT_MENU_LIST_ITEM_SECTIONS_IDS.EMAIL
        ],
    },
  ])(
    'should return correct title for section $testCase',
    async ({ sectionId, expectedResult }) => {
      setup({ sectionId });

      expect(
        screen.getByTestId(
          FORMATTED_LIST_TEST_IDS.getListItemTitleTestId(
            defaultProps.testIdPrefix
          )
        )
      ).toHaveTextContent(expectedResult);
    }
  );
});
