import { FC, useMemo, useEffect } from 'react';
import { SubmitHandler, useForm, useWatch } from 'react-hook-form';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  PageLayout,
  SymptomsForm,
  SymptomsFormFieldValues,
} from '@*company-data-covered*/consumer-web/online-self-scheduling/ui';
import {
  selectPreLoginIsRequesterRelationshipSelf,
  selectPreLoginRequester,
  updateRequesterFormField,
  useAppDispatch,
} from '@*company-data-covered*/consumer-web/online-self-scheduling/data-access';
import { useSegment } from '@*company-data-covered*/segment/feature';
import {
  ONLINE_SELF_SCHEDULING_ROUTES,
  RequestProgressStep,
  SEGMENT_EVENTS,
} from '../constants';
import { UNSUPPORTED_SYMPTOMS_LIST } from './constants';
import { getStructuredSymptoms } from '../utils/statsig';
import { symptomsFormSchema } from './utils';

export const Symptoms: FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const segment = useSegment();

  useEffect(() => {
    segment.pageView(SEGMENT_EVENTS.PAGE_VIEW_SYMPTOM);
  }, [segment]);

  const { symptoms, isSymptomsConfirmChecked } = useSelector(
    selectPreLoginRequester
  );
  const isRelationshipSelf = useSelector(
    selectPreLoginIsRequesterRelationshipSelf
  );

  const { control, handleSubmit, formState, resetField } =
    useForm<SymptomsFormFieldValues>({
      defaultValues: { symptoms, isSymptomsConfirmChecked },
      resolver: yupResolver(symptomsFormSchema),
    });

  const symptomsFormValue = useWatch<SymptomsFormFieldValues, 'symptoms'>({
    control,
    name: 'symptoms',
    defaultValue: symptoms,
  });

  const structuredSymptoms = getStructuredSymptoms();

  const {
    symptomsOptions,
    isCustomSymptomsSelected,
    isSymptomsFormValueCustom,
  } = useMemo(() => {
    const structuredSymptomNames = structuredSymptoms.map(
      (structuredSymptom) => structuredSymptom.friendly_name
    );

    return {
      symptomsOptions: structuredSymptomNames,
      isCustomSymptomsSelected:
        !!symptoms && !structuredSymptomNames.includes(symptoms),
      isSymptomsFormValueCustom:
        !structuredSymptomNames.includes(symptomsFormValue),
    };
  }, [structuredSymptoms, symptoms, symptomsFormValue]);

  const isAdditionalSymptomsConfirmDisplayed = !!symptomsFormValue;

  const onSubmit: SubmitHandler<SymptomsFormFieldValues> = (data) => {
    dispatch(updateRequesterFormField(data));
    const segmentEventToSend = isSymptomsFormValueCustom
      ? SEGMENT_EVENTS.SUBMIT_SYMPTOM_INPUT_TEXT
      : SEGMENT_EVENTS.SUBMIT_SYMPTOM_DROPDOWN_SELECT;
    segment.track(segmentEventToSend, {
      [segmentEventToSend]: data.symptoms,
    });
    segment.track(SEGMENT_EVENTS.MEDICAL_ATTESTATION_CHECK, {
      [SEGMENT_EVENTS.MEDICAL_ATTESTATION_CHECK]: data.isSymptomsConfirmChecked,
    });
    navigate(ONLINE_SELF_SCHEDULING_ROUTES.PREFERRED_TIME);
  };

  const onResetSymptoms = () => resetField('symptoms', { defaultValue: '' });

  return (
    <PageLayout
      stepProgress={RequestProgressStep.Symptoms}
      backButtonOptions={{
        link: ONLINE_SELF_SCHEDULING_ROUTES.HOME,
        text: 'Who needs care?',
      }}
    >
      <SymptomsForm
        formControl={control}
        onSubmit={handleSubmit(onSubmit)}
        isRelationshipMyself={isRelationshipSelf}
        symptomsOptions={symptomsOptions}
        isCustomSymptomsSelected={isCustomSymptomsSelected}
        onResetSymptoms={onResetSymptoms}
        unsupportedSymptomsList={UNSUPPORTED_SYMPTOMS_LIST}
        isAdditionalSymptomsConfirmDisplayed={
          isAdditionalSymptomsConfirmDisplayed
        }
        isSubmitButtonDisabled={!formState.isValid}
      />
    </PageLayout>
  );
};
