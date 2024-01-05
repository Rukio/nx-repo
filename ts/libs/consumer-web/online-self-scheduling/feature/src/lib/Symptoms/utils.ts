import { object, ObjectSchema, string, boolean } from 'yup';

import { SymptomsFormFieldValues } from '@*company-data-covered*/consumer-web/online-self-scheduling/ui';

export const symptomsFormSchema: ObjectSchema<SymptomsFormFieldValues> =
  object()
    .shape({
      symptoms: string().required(),
      isSymptomsConfirmChecked: boolean().when('symptoms', {
        is: (value: string) => !!value,
        then: (schema) => schema.required().isTrue(''),
        otherwise: (schema) => schema.notRequired(),
      }),
    })
    .required();
