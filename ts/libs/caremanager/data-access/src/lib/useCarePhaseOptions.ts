import { useMemo } from 'react';
import { useFormikContext } from 'formik';
import { useGetConfig } from './useGetConfig';
import { GetConfigResponse } from '@*company-data-covered*/caremanager/data-access-types';

interface UseCarePhaseOptions {
  includeClosed?: boolean;
  isRequired?: boolean;
}

interface FilterCarePhaseOptions extends UseCarePhaseOptions {
  config?: GetConfigResponse;
  setFieldValue: (field: string, value: string) => void;
  serviceLineId?: string | number;
  carePhaseId?: string | number;
}

type ValidValues = {
  serviceLineId?: string | number;
  carePhaseId?: string | number;
};

enum CarePhase {
  Pending = 'Pending',
  'High Acuity' = 'High Acuity',
  'Transition - High' = 'Transition - High',
  'Transition - Low' = 'Transition - Low',
  Active = 'Active',
  Discharged = 'Discharged',
  Closed = 'Closed',
  'Closed Without Admitting' = 'Closed Without Admitting',
}

const carePhaseValues = Object.values(CarePhase);

export const EMPTY_OPTION = {
  id: '',
  name: '',
  shortName: '',
};

const filterCarePhaseOptions = ({
  config,
  setFieldValue,
  carePhaseId,
  includeClosed = false,
  isRequired = true,
}: FilterCarePhaseOptions) => {
  const serviceLines = config?.serviceLines;
  const carePhases = config?.carePhases;

  if (!serviceLines?.length || !carePhases?.length) {
    return [EMPTY_OPTION];
  }

  // TODO: Remove hardcoded value once we have a way to find how service lines
  // and care phases are related via a request to the backend.
  const allCareOptions = [
    CarePhase.Pending,
    CarePhase['High Acuity'],
    CarePhase['Transition - High'],
    CarePhase['Transition - Low'],
    CarePhase.Discharged,
    CarePhase.Active,
  ];

  if (includeClosed) {
    allCareOptions.push(CarePhase.Closed);
    allCareOptions.push(CarePhase['Closed Without Admitting']);
  }

  const filteredCarePhases = carePhases
    .filter(
      ({ name }) =>
        name in CarePhase && allCareOptions.includes(name as CarePhase)
    )
    .sort(
      (a, b) =>
        carePhaseValues.indexOf(a.name as CarePhase) -
        carePhaseValues.indexOf(b.name as CarePhase)
    );

  if (
    carePhaseId !== '' &&
    !filteredCarePhases.find((val) => val.id === carePhaseId)
  ) {
    setFieldValue('carePhaseId', '');
  }

  if (!isRequired) {
    return [EMPTY_OPTION, ...filteredCarePhases];
  }

  return filteredCarePhases;
};

export const useCarePhaseOptions = <T extends ValidValues>(
  options?: UseCarePhaseOptions
) => {
  const { data: config } = useGetConfig();
  const { values, setFieldValue } = useFormikContext<T>();
  const { serviceLineId, carePhaseId } = values;

  const carePhaseOptions = useMemo(
    () =>
      filterCarePhaseOptions({
        config,
        setFieldValue,
        serviceLineId,
        carePhaseId,
        ...options,
      }),
    [config, setFieldValue, serviceLineId, carePhaseId, options]
  );

  return { carePhaseOptions };
};
