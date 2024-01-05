import { FC, useState } from 'react';
import statsig from 'statsig-js';
import {
  RequestCareWidget as RequestCareForm,
  CareFor,
} from '@*company-data-covered*/widgets/request-care/ui';

export type RequestCareWidgetProps = {
  webRequestURL: string;
  marketingSiteURL: string;
};

export const getLearnMoreLink = (
  rootURL: string,
  relationshipToPatient: CareFor
) => {
  try {
    let path: string;
    switch (relationshipToPatient) {
      case CareFor.Myself:
        path = 'how-it-works';
        break;
      case CareFor.FamilyFriend:
        path = 'people-we-serve/caregivers';
        break;
      case CareFor.ClinicianOrganization:
      default:
        path = 'dispatchexpress';
        break;
    }

    return new URL(path, rootURL).href;
  } catch (error) {
    console.warn(`[Widgets app] getting learn more link failed:`, error);

    return '';
  }
};

export const getWebRequestLink = (
  rootURL: string,
  relationshipToPatient: CareFor
) => {
  try {
    return new URL(`?relationship=${relationshipToPatient}`, rootURL).href;
  } catch (error) {
    console.warn(`[Widgets app] getting web request link failed:`, error);

    return '';
  }
};

const RequestCareWidget: FC<RequestCareWidgetProps> = ({
  webRequestURL,
  marketingSiteURL,
}) => {
  const [relationshipToPatient, setRelationshipToPatient] = useState(
    CareFor.Myself
  );

  const isRequestCareEventToggleEnabled = statsig.checkGate(
    'requesting_care_for_page_traffic'
  );

  const onRelationshipToPatientChange = (value: CareFor) => {
    setRelationshipToPatient(value);
    if (isRequestCareEventToggleEnabled) {
      statsig.logEvent('requesting_care_for_dropdown_selection', value);
    }
  };

  const onWebRequestBtnClick = () => {
    if (isRequestCareEventToggleEnabled) {
      statsig.logEvent('main_page_schedule_appointment_button');
    }
  };

  const onLearnMoreBtnClick = () => {
    if (isRequestCareEventToggleEnabled) {
      statsig.logEvent('main_page_learn_more_button');
    }
  };

  const webRequestLink = getWebRequestLink(
    webRequestURL,
    relationshipToPatient
  );

  const learnMoreLink = getLearnMoreLink(
    marketingSiteURL,
    relationshipToPatient
  );

  return (
    <RequestCareForm
      onRelationshipToPatientChange={onRelationshipToPatientChange}
      webRequestLink={webRequestLink}
      learnMoreLink={learnMoreLink}
      onWebRequestBtnClick={onWebRequestBtnClick}
      onLearnMoreBtnClick={onLearnMoreBtnClick}
    />
  );
};

export default RequestCareWidget;
