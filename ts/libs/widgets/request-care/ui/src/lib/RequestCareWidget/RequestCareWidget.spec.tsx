import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { CareFor } from '../constants';
import RequestCareWidget from './RequestCareWidget';
import { REQUEST_CARE_WIDGET_TEST_IDS } from './testIds';

const mockRequestCareWidgetProps = {
  onRelationshipToPatientChange: jest.fn(),
  webRequestLink: 'webRequestLink',
  learnMoreLink: 'learnMoreLink',
  onWebRequestBtnClick: jest.fn(),
  onLearnMoreBtnClick: jest.fn(),
};

describe('RequestCareWidget', () => {
  it('should render correctly', () => {
    const { asFragment } = render(
      <RequestCareWidget {...mockRequestCareWidgetProps} />
    );
    expect(asFragment()).toMatchSnapshot();
  });

  it('should render correct relationship options', async () => {
    render(<RequestCareWidget {...mockRequestCareWidgetProps} />);

    const relationshipSelect = screen.getByTestId(
      REQUEST_CARE_WIDGET_TEST_IDS.RELATIONSHIP_SELECT
    );
    const relationshipSelectButton =
      within(relationshipSelect).getByRole('button');

    fireEvent.mouseDown(relationshipSelectButton);

    const relationshipMenu = await screen.findByRole('presentation');

    const relationshipOptions = within(
      relationshipMenu
    ).getAllByTestId<HTMLOptionElement>(
      REQUEST_CARE_WIDGET_TEST_IDS.RELATIONSHIP_SELECT_OPTION
    );

    expect(relationshipOptions.length).toBe(3);

    expect(relationshipOptions[0].selected).toBeTruthy();
    expect(relationshipOptions[0].textContent).toContain('Myself');

    expect(relationshipOptions[1].textContent).toContain(
      'A friend or family member'
    );

    expect(relationshipOptions[2].textContent).toContain(
      'As a clinician or organization'
    );
  });

  it('should change relationship correctly', async () => {
    render(<RequestCareWidget {...mockRequestCareWidgetProps} />);

    const relationshipSelect = screen.getByTestId(
      REQUEST_CARE_WIDGET_TEST_IDS.RELATIONSHIP_SELECT
    );
    const relationshipSelectButton =
      within(relationshipSelect).getByRole('button');

    fireEvent.mouseDown(relationshipSelectButton);

    const relationshipMenu = await screen.findByRole('presentation');

    const relationshipOptions = within(
      relationshipMenu
    ).getAllByTestId<HTMLOptionElement>(
      REQUEST_CARE_WIDGET_TEST_IDS.RELATIONSHIP_SELECT_OPTION
    );

    const newRelationshipOption = relationshipOptions[1];
    expect(newRelationshipOption.selected).toBeFalsy();

    fireEvent.click(newRelationshipOption);

    await waitFor(() =>
      expect(
        within(relationshipSelect).getByRole('button').textContent
      ).toContain('A friend or family member')
    );

    expect(
      mockRequestCareWidgetProps.onRelationshipToPatientChange
    ).toBeCalledWith(CareFor.FamilyFriend);
  });

  it('should call onWebRequestBtnClick if "Request a visit" button was clicked', async () => {
    render(<RequestCareWidget {...mockRequestCareWidgetProps} />);

    const requestAVisitButton = await screen.findByTestId(
      REQUEST_CARE_WIDGET_TEST_IDS.REQUEST_A_VISIT_BUTTON
    );

    fireEvent.click(requestAVisitButton);

    await waitFor(() => {
      expect(mockRequestCareWidgetProps.onWebRequestBtnClick).toBeCalled();
    });
  });

  it('should call onLearnMoreBtnClick if "Learn more" button was clicked', async () => {
    render(<RequestCareWidget {...mockRequestCareWidgetProps} />);

    const learnMoreButton = await screen.findByTestId(
      REQUEST_CARE_WIDGET_TEST_IDS.LEARN_MORE_BUTTON
    );

    fireEvent.click(learnMoreButton);

    await waitFor(() => {
      expect(mockRequestCareWidgetProps.onLearnMoreBtnClick).toBeCalled();
    });
  });
});
