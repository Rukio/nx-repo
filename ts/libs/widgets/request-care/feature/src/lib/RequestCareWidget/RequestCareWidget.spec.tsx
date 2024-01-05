import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mocked } from 'jest-mock';
import statsig from 'statsig-js';
import {
  CareFor,
  REQUEST_CARE_WIDGET_TEST_IDS,
} from '@*company-data-covered*/widgets/request-care/ui';
import RequestCareWidget, {
  getLearnMoreLink,
  getWebRequestLink,
  RequestCareWidgetProps,
} from './RequestCareWidget';

jest.mock('statsig-js', () => ({
  initialize: jest.fn().mockResolvedValue({}),
  logEvent: jest.fn(),
  checkGate: jest.fn().mockReturnValue(true),
}));

const mockStatsigLogEvent = mocked(statsig.logEvent);
const mockStatsigCheckGate = mocked(statsig.checkGate);

const mockDefaultProps: RequestCareWidgetProps = {
  webRequestURL: 'request.test.com',
  marketingSiteURL: '*company-data-covered*.test.com',
};

const setup = () => {
  return {
    user: userEvent.setup(),
    ...render(<RequestCareWidget {...mockDefaultProps} />),
  };
};

const getRelationshipOptionByText = async (optionLabel: string) => {
  const relationshipSelect = screen.getByTestId(
    REQUEST_CARE_WIDGET_TEST_IDS.RELATIONSHIP_SELECT
  );
  const relationshipSelectButton =
    within(relationshipSelect).getByRole('button');
  await userEvent.click(relationshipSelectButton);

  const relationshipMenu = await screen.findByRole('presentation');

  return within(relationshipMenu).getByText<HTMLOptionElement>(optionLabel);
};

describe('RequestCareWidgetEntry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should log event on relationship dropdown selection with correct value', async () => {
    const { user } = setup();

    const friendOrFamilyRelationshipOption = await getRelationshipOptionByText(
      'A friend or family member'
    );
    expect(friendOrFamilyRelationshipOption.selected).toBeFalsy();

    await user.click(friendOrFamilyRelationshipOption);

    await waitFor(() => {
      expect(mockStatsigLogEvent).toBeCalledWith(
        'requesting_care_for_dropdown_selection',
        CareFor.FamilyFriend
      );
    });
  });

  it('should log event on learn more btn click if feature gate is enabled', async () => {
    const { user } = setup();

    const learnMoreBtn = screen.getByTestId(
      REQUEST_CARE_WIDGET_TEST_IDS.LEARN_MORE_BUTTON
    );
    expect(learnMoreBtn).toBeVisible();
    expect(learnMoreBtn).toBeEnabled();

    await user.click(learnMoreBtn);

    await waitFor(() => {
      expect(mockStatsigLogEvent).toBeCalledWith('main_page_learn_more_button');
    });
  });

  it('should log event on web request btn click if feature gate is enabled', async () => {
    const { user } = setup();

    const requestAVisitBtn = screen.getByTestId(
      REQUEST_CARE_WIDGET_TEST_IDS.REQUEST_A_VISIT_BUTTON
    );
    expect(requestAVisitBtn).toBeVisible();
    expect(requestAVisitBtn).toBeEnabled();

    await user.click(requestAVisitBtn);

    await waitFor(() => {
      expect(mockStatsigLogEvent).toBeCalledWith(
        'main_page_schedule_appointment_button'
      );
    });
  });

  it('should not log event on relationship dropdown selection with correct value', async () => {
    mockStatsigCheckGate.mockReturnValue(false);

    const { user } = setup();

    const clinicianOrOrganizationRelationshipOption =
      await getRelationshipOptionByText('As a clinician or organization');
    expect(clinicianOrOrganizationRelationshipOption.selected).toBeFalsy();

    await user.click(clinicianOrOrganizationRelationshipOption);

    await waitFor(() => {
      expect(mockStatsigLogEvent).not.toBeCalled();
    });
  });

  it('should not log event on web request btn click if feature gate is disabled', async () => {
    mockStatsigCheckGate.mockReturnValue(false);

    const { user } = setup();

    const requestAVisitBtn = screen.getByTestId(
      REQUEST_CARE_WIDGET_TEST_IDS.REQUEST_A_VISIT_BUTTON
    );
    expect(requestAVisitBtn).toBeVisible();
    expect(requestAVisitBtn).toBeEnabled();

    await user.click(requestAVisitBtn);

    await waitFor(() => {
      expect(mockStatsigLogEvent).not.toBeCalled();
    });
  });

  it('should not log event on learn more btn click if feature gate is disabled', async () => {
    mockStatsigCheckGate.mockReturnValue(false);

    const { user } = setup();

    const learnMoreBtn = screen.getByTestId(
      REQUEST_CARE_WIDGET_TEST_IDS.LEARN_MORE_BUTTON
    );
    expect(learnMoreBtn).toBeVisible();
    expect(learnMoreBtn).toBeEnabled();

    await user.click(learnMoreBtn);

    await waitFor(() => {
      expect(mockStatsigLogEvent).not.toBeCalled();
    });
  });

  describe('getLearnMoreLink', () => {
    const marketingSiteURL = 'https://*company-data-covered*.com/';

    it('should return correct link if relation is myself', () => {
      const result = getLearnMoreLink(marketingSiteURL, CareFor.Myself);
      expect(result).toBe(`${marketingSiteURL}how-it-works`);
    });

    it('should return correct link if relation is friend', () => {
      const result = getLearnMoreLink(marketingSiteURL, CareFor.FamilyFriend);
      expect(result).toBe(`${marketingSiteURL}people-we-serve/caregivers`);
    });

    it('should return correct link if relation is clinician', () => {
      const result = getLearnMoreLink(
        marketingSiteURL,
        CareFor.ClinicianOrganization
      );
      expect(result).toBe(`${marketingSiteURL}dispatchexpress`);
    });

    it('should return empty string if URL is not valid', () => {
      const result = getLearnMoreLink('', CareFor.ClinicianOrganization);
      expect(result).toBe('');
    });
  });

  describe('getWebRequestLink', () => {
    const webRequestURL = 'https://request.*company-data-covered*.com/';

    it('should return correct link if relation is myself', () => {
      const result = getWebRequestLink(webRequestURL, CareFor.Myself);
      expect(result).toBe(`${webRequestURL}?relationship=patient`);
    });

    it('should return correct link if relation is friend', () => {
      const result = getWebRequestLink(webRequestURL, CareFor.FamilyFriend);
      expect(result).toBe(`${webRequestURL}?relationship=family:friend`);
    });

    it('should return correct link if relation is clinician', () => {
      const result = getWebRequestLink(
        webRequestURL,
        CareFor.ClinicianOrganization
      );
      expect(result).toBe(`${webRequestURL}?relationship=clinician`);
    });

    it('should return empty string if URL is not valid', () => {
      const result = getWebRequestLink('', CareFor.Myself);
      expect(result).toBe('');
    });
  });
});
