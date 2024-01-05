import { fireEvent, screen } from '@testing-library/react';
import {
  labelAndValueQueryMatcher,
  renderWithClient,
} from '@*company-data-covered*/caremanager/utils-react';
import { JSONMocks } from '@*company-data-covered*/caremanager/utils-mocks';
import {
  MedicalDecisionMaker,
  MedicalDecisionMakerFromJSON,
} from '@*company-data-covered*/caremanager/data-access-types';
import PatientMedicalDecisionMakerCard, {
  PATIENT_CREATE_MDM_BUTTON_TEST_ID,
} from '../PatientMedicalDecisionMakerCard';

const mockedMDM = MedicalDecisionMakerFromJSON(JSONMocks.medicalDecisionMaker);

const setup = (
  patientId: string,
  medicalDecisionMaker?: MedicalDecisionMaker
) => {
  return renderWithClient(
    <PatientMedicalDecisionMakerCard
      patientId={patientId}
      medicalDecisionMaker={medicalDecisionMaker}
    />
  );
};

describe('PatientMedicalDecisionMakerCard', () => {
  it('renders medical decision maker data', () => {
    setup('1', mockedMDM);

    expect(
      screen.getByText(
        labelAndValueQueryMatcher('First Name', mockedMDM.firstName)
      )
    ).toBeDefined();
    expect(
      screen.getByText(
        labelAndValueQueryMatcher('Last Name', mockedMDM.lastName)
      )
    ).toBeDefined();
    expect(
      screen.getByText(labelAndValueQueryMatcher('Address', mockedMDM.address))
    ).toBeDefined();
    expect(
      screen.getByText(
        labelAndValueQueryMatcher('Phone Number', mockedMDM.phoneNumber)
      )
    ).toBeDefined();
    expect(
      screen.getByText(
        labelAndValueQueryMatcher('Relationship', mockedMDM.relationship)
      )
    ).toBeDefined();
  });

  it('renders empty state when there is no medical decision maker', async () => {
    setup('1');

    expect(
      await screen.findByText('There is no medical decision maker yet')
    ).toBeInTheDocument();

    expect(
      await screen.findByText('Add Medical Decision Maker')
    ).toBeInTheDocument();
  });

  it('opens modal when the card is in empty state and click on the button', async () => {
    setup('1');

    expect(
      await screen.findByText('There is no medical decision maker yet')
    ).toBeInTheDocument();

    expect(
      await screen.findByText('Add Medical Decision Maker')
    ).toBeInTheDocument();

    const button = await screen.findByTestId(PATIENT_CREATE_MDM_BUTTON_TEST_ID);
    fireEvent.click(button);

    expect(await screen.findByTestId('firstname-input')).toBeInTheDocument();
    expect(await screen.findByTestId('lastname-input')).toBeInTheDocument();
    expect(await screen.findByTestId('phonenumber-input')).toBeInTheDocument();
    expect(await screen.findByTestId('relationship-input')).toBeInTheDocument();
  });

  it('opens modal when there is data and the edit button is pressed', async () => {
    setup('1', mockedMDM);

    expect(
      screen.getByText(
        labelAndValueQueryMatcher('First Name', mockedMDM.firstName)
      )
    ).toBeDefined();
    expect(
      screen.getByText(
        labelAndValueQueryMatcher('Last Name', mockedMDM.lastName)
      )
    ).toBeDefined();
    expect(
      screen.getByText(labelAndValueQueryMatcher('Address', mockedMDM.address))
    ).toBeDefined();
    expect(
      screen.getByText(
        labelAndValueQueryMatcher('Phone Number', mockedMDM.phoneNumber)
      )
    ).toBeDefined();
    expect(
      screen.getByText(
        labelAndValueQueryMatcher('Relationship', mockedMDM.relationship)
      )
    ).toBeDefined();

    const threeDotMenu = await screen.findByTestId('MoreHorizIcon');

    fireEvent.click(threeDotMenu);

    const editButton = await screen.findByText('Edit');
    fireEvent.click(editButton);

    expect(await screen.findByTestId('firstname-input')).toBeInTheDocument();
    expect(await screen.findByTestId('firstname-input')).toHaveValue(
      mockedMDM.firstName
    );
    expect(await screen.findByTestId('lastname-input')).toBeInTheDocument();
    expect(await screen.findByTestId('lastname-input')).toHaveValue(
      mockedMDM.lastName
    );
    expect(await screen.findByTestId('phonenumber-input')).toBeInTheDocument();
    expect(await screen.findByTestId('phonenumber-input')).toHaveValue(
      mockedMDM.phoneNumber
    );
    expect(await screen.findByTestId('relationship-input')).toBeInTheDocument();
    expect(await screen.findByTestId('relationship-input')).toHaveValue(
      mockedMDM.relationship
    );
  });
});
