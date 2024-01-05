import {
  RelationToPatient,
  selectPreLoginPreferredEtaRange,
  selectPreLoginRequester,
  updatePrefferedEtaRangeFormField,
  useAppDispatch,
} from '@*company-data-covered*/consumer-web/online-self-scheduling/data-access';
import {
  AvailabilityDayToggleValue,
  PageLayout,
  SelectTimeWindow,
  SelectTimeWindowFieldValues,
} from '@*company-data-covered*/consumer-web/online-self-scheduling/ui';
import { useSegment } from '@*company-data-covered*/segment/feature';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  formatISO,
  setHours,
  getHours,
  startOfTomorrow,
  startOfToday,
  isToday,
  isValid,
} from 'date-fns';
import { FC, useEffect } from 'react';
import { SubmitHandler, useForm, useWatch } from 'react-hook-form';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  ONLINE_SELF_SCHEDULING_ROUTES,
  RequestProgressStep,
  SEGMENT_EVENTS,
} from '../constants';
import { getHoursSelectList } from '../utils/date';
import { preferredTimeFormSchema } from './utils';

export const MIN_PRE_LOGIN_AVAILABILITY_HOUR = 8;
export const MAX_PRE_LOGIN__AVAILABILITY_HOUR = 22;

export const getFormMessagesByRelationToPatient = (
  relationToPatient: RelationToPatient
) => {
  const isRelationToPatientSelf =
    relationToPatient === RelationToPatient.Patient;

  if (isRelationToPatientSelf) {
    return {
      title: 'When are you available for an appointment?',
      subtitle:
        'The more availability you have, the more likely we can see you today.',
      timeWindowSectionTitle: 'I’m available',
    };
  }

  return {
    title: 'When is the patient available for an appointment?',
    subtitle:
      'The more availability they have, the more likely we can see them today.',
    timeWindowSectionTitle: 'Patient is available',
  };
};

export const getDefaultHour = (dateString = '', fallbackValue = '') => {
  const date = new Date(dateString);

  if (isValid(date)) {
    return getHours(date).toString();
  }

  return fallbackValue;
};

const getDefaultAvailabilityDay = (dateString = '') => {
  const date = new Date(dateString);

  if (isValid(date)) {
    return isToday(date)
      ? AvailabilityDayToggleValue.Today
      : AvailabilityDayToggleValue.Tomorrow;
  }

  return AvailabilityDayToggleValue.Today;
};

export const PreferredTime: FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const segment = useSegment();

  useEffect(() => {
    segment.pageView(SEGMENT_EVENTS.PAGE_VIEW_PREFERRED_TIME);
  }, [segment]);

  const { relationToPatient } = useSelector(selectPreLoginRequester);
  const { startsAt, endsAt } = useSelector(selectPreLoginPreferredEtaRange);

  const timeSelectList = getHoursSelectList(
    MIN_PRE_LOGIN_AVAILABILITY_HOUR,
    MAX_PRE_LOGIN__AVAILABILITY_HOUR
  );

  const defaultStartTime = getDefaultHour(startsAt, timeSelectList[0].value);

  const defaultEndTime = getDefaultHour(endsAt, timeSelectList.at(-1)?.value);

  const defaultSelectedAvailabilityDay = getDefaultAvailabilityDay(startsAt);

  const { control, handleSubmit, formState } =
    useForm<SelectTimeWindowFieldValues>({
      defaultValues: {
        startTime: defaultStartTime,
        endTime: defaultEndTime,
        selectedAvailabilityDay: defaultSelectedAvailabilityDay,
      },
      resolver: yupResolver(preferredTimeFormSchema),
    });

  const startTime = useWatch({ control, name: 'startTime' });
  const endTime = useWatch({ control, name: 'endTime' });

  const formMessages = getFormMessagesByRelationToPatient(relationToPatient);

  const onSubmit: SubmitHandler<SelectTimeWindowFieldValues> = (data) => {
    const selectedDate =
      data.selectedAvailabilityDay === AvailabilityDayToggleValue.Tomorrow
        ? startOfTomorrow()
        : startOfToday();

    const formatPreferredEtaDate = (hours: number) =>
      formatISO(setHours(selectedDate, hours));

    dispatch(
      updatePrefferedEtaRangeFormField({
        startsAt: formatPreferredEtaDate(+data.startTime),
        endsAt: formatPreferredEtaDate(+data.endTime),
      })
    );
    navigate(ONLINE_SELF_SCHEDULING_ROUTES.PATIENT_DEMOGRAPHICS);
  };

  const isTimeRangeError = +endTime - +startTime < 4;

  return (
    <PageLayout
      stepProgress={RequestProgressStep.PreferredTime}
      backButtonOptions={{
        text: 'Symptoms',
        link: ONLINE_SELF_SCHEDULING_ROUTES.SYMPTOMS,
      }}
    >
      <SelectTimeWindow
        startTimeOptions={timeSelectList}
        endTimeOptions={timeSelectList}
        title={formMessages.title}
        subtitle={formMessages.subtitle}
        timeWindowSectionTitle={formMessages.timeWindowSectionTitle}
        formControl={control}
        isSubmitButtonDisabled={!formState.isValid || isTimeRangeError}
        isTimeRangeErrorShown={isTimeRangeError}
        onSubmit={handleSubmit(onSubmit)}
      />
    </PageLayout>
  );
};
