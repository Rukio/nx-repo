import { object, ObjectSchema, mixed } from 'yup';
import { RelationToPatient } from '@*company-data-covered*/consumer-web/online-self-scheduling/data-access';
import { WhoNeedsCareFormFieldValues } from '@*company-data-covered*/consumer-web/online-self-scheduling/ui';

export const whoNeedsCareFormSchema: ObjectSchema<WhoNeedsCareFormFieldValues> =
  object()
    .shape({
      relationToPatient: mixed<RelationToPatient>()
        .required()
        .oneOf(Object.values(RelationToPatient)),
    })
    .required();
