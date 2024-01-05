import {
  useGetServiceRequest,
  useGetUsers,
} from '@*company-data-covered*/caremanager/data-access';
import {
  ServiceRequest,
  StationCareRequest,
  User,
} from '@*company-data-covered*/caremanager/data-access-types';
import {
  Box,
  CircularProgress,
  Divider,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import { ClinicalSummary } from './ClinicalSummary';
import { Header } from './Header';
import { Insurance } from './Insurance';
import { OwnershipDetails } from './OwnershipDetails';
import { Requester } from './Requester';

export const SERVICE_REQUEST_DETAILS_TEST_ID = 'service-request-details';
export const SERVICE_REQUEST_DETAILS_HEADER_TEST_ID =
  'service-request-details-header';
export const SERVICE_REQUEST_DETAILS_CLINICAL_SUMMARY_TEST_ID =
  'service-request-details-clinical-summary';
export const SERVICE_REQUEST_DETAILS_INSURANCE_TEST_ID =
  'service-request-details-insurance';
export const SERVICE_REQUEST_DETAILS_REQUESTER_TEST_ID =
  'service-request-details-requester';

const styles = makeSxStyles({
  container: {
    backgroundColor: (theme) => theme.palette.background.paper,
  },
});

const usePrefetchAllServiceRequestUsers = (
  serviceRequest?: ServiceRequest,
  careRequest?: StationCareRequest
) => {
  const userIds = [];
  if (serviceRequest?.assignedUserId) {
    userIds.push(serviceRequest.assignedUserId);
  }
  if (serviceRequest?.updatedByUserId) {
    userIds.push(serviceRequest.updatedByUserId);
  }
  if (careRequest?.secondaryScreeningProviderId) {
    userIds.push(careRequest.secondaryScreeningProviderId);
  }
  if (careRequest?.providerUserIds) {
    userIds.push(...careRequest.providerUserIds);
  }

  const { data } = useGetUsers(userIds);

  return data?.users.reduce<Record<string, User>>((acc, user) => {
    acc[user.id] = user;

    return acc;
  }, {});
};

type Props = {
  serviceRequestId: string;
  onClose?: () => void;
};

export const ServiceRequestDetails: React.FC<Props> = ({
  serviceRequestId,
  onClose,
}) => {
  const { data } = useGetServiceRequest(serviceRequestId);

  usePrefetchAllServiceRequestUsers(
    data?.serviceRequest,
    data?.stationCareRequest
  );

  if (!data) {
    return <CircularProgress />;
  }

  return (
    <Box sx={styles.container} data-testid={SERVICE_REQUEST_DETAILS_TEST_ID}>
      <Header
        patient={data.stationPatient}
        serviceRequestId={serviceRequestId}
        marketId={data.serviceRequest?.marketId}
        onClose={onClose}
        data-testid={SERVICE_REQUEST_DETAILS_HEADER_TEST_ID}
      />
      <OwnershipDetails
        serviceRequestId={serviceRequestId}
        ownerId={data.serviceRequest?.assignedUserId}
        updatedByUserId={data.serviceRequest?.updatedByUserId}
        updatedAt={data.serviceRequest?.updatedAt}
        rejectedAt={data.serviceRequest?.rejectedAt}
      />
      <ClinicalSummary
        careRequest={data.stationCareRequest}
        patient={data.stationPatient}
        data-testid={SERVICE_REQUEST_DETAILS_CLINICAL_SUMMARY_TEST_ID}
      />
      <Divider />
      <Insurance
        serviceRequestId={serviceRequestId}
        payer={data.stationPatient?.insurancePlanName}
        network={data.stationPatient?.insuranceNetworkName}
        memberID={data.stationPatient?.insuranceMemberId}
        cms={data.serviceRequest?.cmsNumber}
        isVerified={data.serviceRequest?.isInsuranceVerified}
        data-testid={SERVICE_REQUEST_DETAILS_INSURANCE_TEST_ID}
      />
      <Divider />
      <Requester
        type={data.stationCareRequest?.requesterType}
        name={data.stationCareRequest?.requesterName}
        organization={data.stationCareRequest?.requesterOrganizationName}
        phoneNumber={data.stationCareRequest?.requesterPhoneNumber}
        data-testid={SERVICE_REQUEST_DETAILS_REQUESTER_TEST_ID}
      />
    </Box>
  );
};
