import {
  InsuranceClassificationFormValues,
  InsuranceNetworkPayer,
  InsuranceType,
  NetworkOption,
  QuestionYesNoAnswer,
  SearchNetworkFormFieldValues,
} from '@*company-data-covered*/consumer-web/online-self-scheduling/ui';
import {
  DomainPatientInsurance,
  InsuranceEligibilityStatus,
  InsurancePriority,
} from '@*company-data-covered*/consumer-web/online-self-scheduling/data-access';
import { mixed, object, ObjectSchema, string } from 'yup';
import { AlertProps } from '@*company-data-covered*/design-system';
import { InsuranceNetwork } from '@*company-data-covered*/consumer-web-types';
import {
  FormMenuItem,
  convertToFormSelectMenuItems,
} from '@*company-data-covered*/shared/ui/forms';

const EMPTY_STRING_REGEXP = /^\s*$/;
const PAYER_VALIDATING_ATTRIBUTES = [
  'insuranceType',
  'isPublicInsuranceThroughCompany',
];

export const insuranceClassificationSchema: ObjectSchema<InsuranceClassificationFormValues> =
  object()
    .shape({
      insuranceType: mixed<InsuranceType>()
        .oneOf(Object.values(InsuranceType))
        .required(),
      insurancePayerId: string().when(PAYER_VALIDATING_ATTRIBUTES, {
        is: (type: InsuranceType, isThroughCompany: QuestionYesNoAnswer) =>
          type === InsuranceType.EmployerProvidedOrPrivate ||
          ((type === InsuranceType.Medicare ||
            type === InsuranceType.Medicaid) &&
            isThroughCompany === QuestionYesNoAnswer.Yes),
        then: (schema) => schema.required(),
        otherwise: (schema) => schema.optional(),
      }),
      insurancePayerName: string().when(PAYER_VALIDATING_ATTRIBUTES, {
        is: (type: InsuranceType, isThroughCompany: QuestionYesNoAnswer) =>
          type === InsuranceType.EmployerProvidedOrPrivate ||
          ((type === InsuranceType.Medicare ||
            type === InsuranceType.Medicaid) &&
            isThroughCompany === QuestionYesNoAnswer.Yes),
        then: (schema) => schema.required(''),
        otherwise: (schema) => schema.optional(),
      }),
      isPublicInsuranceThroughCompany: mixed<QuestionYesNoAnswer>()
        .oneOf(Object.values(QuestionYesNoAnswer))
        .when('insuranceType', {
          is: (type: InsuranceType) =>
            type === InsuranceType.Medicaid || type === InsuranceType.Medicare,
          then: (schema) => schema.required(),
          otherwise: () => string().matches(EMPTY_STRING_REGEXP),
        }),
      stateAbbr: string().when(PAYER_VALIDATING_ATTRIBUTES, {
        is: (type: InsuranceType, isThroughCompany: QuestionYesNoAnswer) =>
          (type === InsuranceType.Medicaid ||
            type === InsuranceType.Medicare) &&
          isThroughCompany === QuestionYesNoAnswer.No,
        then: (schema) => schema.required(),
        otherwise: (schema) => schema.optional(),
      }),
    })
    .required();

const NUMERIC_STRING_REGEX = /^\d+$/;
const getRequiredErrorMessage = (name: string) => `${name} is required`;

export const searchNetworkFormSchema: ObjectSchema<SearchNetworkFormFieldValues> =
  object()
    .shape({
      payer: object({
        label: string().required(getRequiredErrorMessage('Insurance Payer')),
        id: string().required(),
      }).required(),
      networkId: string().required(getRequiredErrorMessage('Network')),
      memberId: string()
        .required(getRequiredErrorMessage('Member ID'))
        .matches(NUMERIC_STRING_REGEX, 'Invalid member ID'),
    })
    .required();

export const findMatchingPayer = (
  payers: InsuranceNetworkPayer[],
  publicInsurance: InsuranceType,
  stateAbbr: string
): InsuranceNetworkPayer | null => {
  return (
    payers.find(
      (payer) =>
        payer.name.toLowerCase().includes(publicInsurance.toLowerCase()) &&
        payer.stateAbbrs?.includes(stateAbbr)
    ) || null
  );
};

export const getInsuranceEligibilityAlert = (
  insuranceEligibilityStatus = '',
  isRequesterRelationshipSelf: boolean
): AlertProps | undefined => {
  if (!insuranceEligibilityStatus) {
    return undefined;
  }

  if (
    insuranceEligibilityStatus === InsuranceEligibilityStatus.Eligible ||
    insuranceEligibilityStatus === InsuranceEligibilityStatus.Unverified
  ) {
    return {
      severity: 'success',
      title: 'In Network',
      message: isRequesterRelationshipSelf
        ? 'We’re in network with your insurance.'
        : 'We’re in network with their insurance.',
    };
  }

  return {
    severity: 'warning',
    title: 'Out of Network',
    message: isRequesterRelationshipSelf
      ? 'It looks like your insurance is out of network.'
      : 'It looks like the patient may be out of network. Please double check the information you provided is correct or that their insurance card is not expired.',
  };
};

const getSelectedPayer = (
  insurancePayers: InsuranceNetworkPayer[],
  payerId?: string
): SearchNetworkFormFieldValues['payer'] => {
  const selectedPayer = insurancePayers.find(
    (payer) => payer.id.toString() === payerId
  );

  return {
    id: selectedPayer?.id.toString() ?? '',
    label: selectedPayer?.name ?? '',
  };
};

export const getNetworkOptions = ({
  insuranceNetworks,
  insurancePayerId,
  hasInsuranceChanged,
  insurancePriority,
  primaryInsurance,
  secondaryInsurance,
}: {
  insuranceNetworks: InsuranceNetwork[];
  insurancePayerId: string;
  hasInsuranceChanged: boolean;
  insurancePriority: InsurancePriority;
  primaryInsurance: DomainPatientInsurance | null;
  secondaryInsurance: DomainPatientInsurance | null;
}): FormMenuItem[] => {
  if (hasInsuranceChanged && !insurancePayerId) {
    if (insurancePriority === InsurancePriority.PRIMARY) {
      const primaryInsurancePayerId =
        primaryInsurance?.insuranceNetwork?.insurancePayerId;

      return convertToFormSelectMenuItems(
        insuranceNetworks.filter(
          (network) =>
            network.insurancePayerId === primaryInsurancePayerId?.toString()
        ),
        'id',
        'name'
      );
    }

    const secondaryInsurancePayerId =
      secondaryInsurance?.insuranceNetwork?.insurancePayerId;

    return convertToFormSelectMenuItems(
      insuranceNetworks.filter(
        (network) =>
          network.insurancePayerId === secondaryInsurancePayerId?.toString()
      ),
      'id',
      'name'
    );
  }

  return convertToFormSelectMenuItems(
    insuranceNetworks.filter(
      (network) => network.insurancePayerId === insurancePayerId?.toString()
    ),
    'id',
    'name'
  );
};

export const getSearchNetworkFormFieldsValues = ({
  payers,
  insurancePayerId,
  networkOptions,
  hasInsuranceChanged,
  insurancePriority,
  primaryInsurance,
  secondaryInsurance,
}: {
  payers: InsuranceNetworkPayer[];
  insurancePayerId: string;
  networkOptions: NetworkOption[];
  hasInsuranceChanged: boolean;
  insurancePriority: InsurancePriority;
  primaryInsurance: DomainPatientInsurance | null;
  secondaryInsurance: DomainPatientInsurance | null;
}): SearchNetworkFormFieldValues => {
  if (hasInsuranceChanged && !insurancePayerId) {
    if (insurancePriority === InsurancePriority.PRIMARY) {
      const primaryInsurancePlanNetwork = primaryInsurance?.insuranceNetwork;

      return {
        payer: getSelectedPayer(
          payers,
          primaryInsurancePlanNetwork?.insurancePayerId.toString()
        ),
        networkId: primaryInsurancePlanNetwork?.id.toString() ?? '',
        memberId: primaryInsurance?.memberId.toString() ?? '',
      };
    }

    const secondaryInsurancePlanNetwork = secondaryInsurance?.insuranceNetwork;

    return {
      payer: getSelectedPayer(
        payers,
        secondaryInsurancePlanNetwork?.insurancePayerId.toString()
      ),
      networkId: secondaryInsurancePlanNetwork?.id.toString() ?? '',
      memberId: secondaryInsurance?.memberId.toString() ?? '',
    };
  }

  return {
    payer: getSelectedPayer(payers, insurancePayerId),
    networkId: networkOptions.length === 1 ? networkOptions[0].value : '',
    memberId: '',
  };
};
