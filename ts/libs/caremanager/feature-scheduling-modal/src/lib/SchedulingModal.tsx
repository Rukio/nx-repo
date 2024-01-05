import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Form, Formik } from 'formik';
import * as Yup from 'yup';
import { getUnixTime } from 'date-fns';
import {
  Dialog,
  DialogTitle,
  theme,
  useMediaQuery,
} from '@*company-data-covered*/design-system';
import {
  useCancelVisit,
  useGetConfig,
  useScheduleVisit,
} from '@*company-data-covered*/caremanager/data-access';
import {
  PatientLike,
  SNACKBAR_MESSAGES,
  useSnackbar,
} from '@*company-data-covered*/caremanager/utils';
import SchedulingFormContent from './components/SchedulingFormContent';
import { testIds } from './SchedulingModal.testids';
import { isPatientAvailabilitayWindowValid } from './date-utils';

export interface PatientAvailabilityFormSchema {
  date: string;
  startTime: string;
  endTime: string;
}

const validationSchema = Yup.object({
  date: Yup.string().required('Required'),
  startTime: Yup.string().required('Required'),
  endTime: Yup.string()
    .required('Required')
    .test(
      'availability-time-window',
      'Patient availability time window should be at least 4 hours',
      (endTime, testContext) => {
        const startTime = testContext.parent.startTime as string;

        return isPatientAvailabilitayWindowValid(startTime, endTime);
      }
    ),
});

interface Props {
  careRequestId?: string;
  episodeId: string;
  isOpen: boolean;
  marketId: string;
  onClose: () => void;
  patient: PatientLike & { addressStreet?: string };
  serviceLineId: string;
}

export const SchedulingModal: React.FC<Props> = ({
  careRequestId,
  episodeId,
  isOpen,
  marketId,
  onClose,
  patient,
  serviceLineId,
}) => {
  const isSM = useMediaQuery(theme.breakpoints.down('sm'));
  const [, setSearchParams] = useSearchParams();
  const { showSuccess, showError } = useSnackbar();
  const [formSubmitted, setFormSubmitted] = useState(false);

  const { data: configData } = useGetConfig();
  const { mutateAsync: scheduleVisit, isLoading: isSchedulingVisit } =
    useScheduleVisit(episodeId);
  const { mutateAsync: cancelVisit, isLoading: isCancelingVisit } =
    useCancelVisit();

  const visitMarket = configData?.markets.find(
    (market) => market.id === marketId
  );

  const handleSubmit = async (formValues: PatientAvailabilityFormSchema) => {
    try {
      await scheduleVisit({
        body: {
          careRequestId,
          patientAvailabilityStartTime: `${getUnixTime(
            new Date(formValues.startTime)
          )}`,
          patientAvailabilityEndTime: `${getUnixTime(
            new Date(formValues.endTime)
          )}`,
          episodeId: episodeId,
        },
      });

      setFormSubmitted(true);
      onClose();
      setSearchParams();
      showSuccess(SNACKBAR_MESSAGES.SCHEDULED_VISIT);
    } catch (e) {
      await showError(e as Response);
    }
  };

  const handleCancel = async () => {
    try {
      await cancelVisit({
        body: {
          careRequestId: careRequestId ?? '',
        },
      });

      onClose();
      setSearchParams();
      showSuccess(SNACKBAR_MESSAGES.CANCELED_VISIT);
    } catch (e) {
      await showError(e as Response);
    }
  };

  return (
    <Dialog
      data-testid={testIds.DIALOG}
      open={isOpen}
      fullScreen={isSM}
      fullWidth={!isSM}
      maxWidth="md"
    >
      <DialogTitle>Schedule New Visit</DialogTitle>
      <Formik
        initialValues={{
          date: '',
          startTime: '',
          endTime: '',
        }}
        onSubmit={handleSubmit}
        validationSchema={validationSchema}
      >
        <Form>
          {visitMarket && (
            <SchedulingFormContent
              careRequestId={careRequestId}
              formSubmitted={formSubmitted}
              market={visitMarket}
              isCancelingVisit={isCancelingVisit}
              isSchedulingVisit={isSchedulingVisit}
              onClose={handleCancel}
              patient={patient}
              serviceLineId={serviceLineId}
            />
          )}
        </Form>
      </Formik>
    </Dialog>
  );
};
