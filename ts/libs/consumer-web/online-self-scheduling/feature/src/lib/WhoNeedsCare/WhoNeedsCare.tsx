import { FC, useEffect } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  PageLayout,
  WhoNeedsCareForm,
  WhoNeedsCareFormFieldValues,
  WhoNeedsCareFormProps,
} from '@*company-data-covered*/consumer-web/online-self-scheduling/ui';
import {
  RelationToPatient,
  selectPreLoginRequester,
  updateChannelItemId,
  updateRequesterFormField,
  useAppDispatch,
} from '@*company-data-covered*/consumer-web/online-self-scheduling/data-access';
import { useSegment } from '@*company-data-covered*/segment/feature';
import {
  ONLINE_SELF_SCHEDULING_ROUTES,
  RequestProgressStep,
  SEGMENT_EVENTS,
} from '../constants';
import { whoNeedsCareFormSchema } from './utils';
import { useChannelItemId } from '../hooks';

const RELATIONSHIP_TO_PATIENT_OPTIONS: WhoNeedsCareFormProps['relationshipToPatientOptions'] =
  [
    { label: 'Myself', value: RelationToPatient.Patient },
    {
      label: 'A friend or family member',
      value: RelationToPatient.FamilyFriend,
    },
    {
      label: 'As a clinician or organization',
      value: RelationToPatient.Clinician,
    },
  ];

export const WhoNeedsCare: FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const segment = useSegment();
  const channelItemId = useChannelItemId();

  useEffect(() => {
    segment.pageView(SEGMENT_EVENTS.PAGE_VIEW_REQUEST_CARE_FOR);
  }, [segment]);

  const requesterData = useSelector(selectPreLoginRequester);

  const { control, handleSubmit, formState } =
    useForm<WhoNeedsCareFormFieldValues>({
      mode: 'onTouched',
      defaultValues: requesterData,
      resolver: yupResolver(whoNeedsCareFormSchema),
    });

  const onSubmit: SubmitHandler<WhoNeedsCareFormFieldValues> = ({
    relationToPatient,
  }) => {
    dispatch(
      updateRequesterFormField({
        relationToPatient: relationToPatient as RelationToPatient,
      })
    );
    dispatch(updateChannelItemId(channelItemId));
    segment.track(SEGMENT_EVENTS.SUBMIT_REQUEST_CARE_FOR_SELECT, {
      [SEGMENT_EVENTS.SUBMIT_REQUEST_CARE_FOR_SELECT]: relationToPatient,
    });
    navigate(ONLINE_SELF_SCHEDULING_ROUTES.SYMPTOMS);
  };

  return (
    <PageLayout stepProgress={RequestProgressStep.WhoNeedsCare}>
      <WhoNeedsCareForm
        relationshipToPatientOptions={RELATIONSHIP_TO_PATIENT_OPTIONS}
        formControl={control}
        onSubmit={handleSubmit(onSubmit)}
        isSubmitButtonDisabled={!formState.isValid}
      />
    </PageLayout>
  );
};
