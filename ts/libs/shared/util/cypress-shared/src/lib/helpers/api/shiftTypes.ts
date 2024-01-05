import { SHIFT_TYPE } from '../../types/api/shiftType';

const SHIFT_TYPES: Record<SHIFT_TYPE, SHIFT_TYPE> = {
  acute_care: 'acute_care',
  telepresentation_virtual_app: 'telepresentation_virtual_app',
  telepresentation_solo_dhmt: 'telepresentation_solo_dhmt',
  asymptomatic_covid_testing: 'asymptomatic_covid_testing',
  covid_vaccination: 'covid_vaccination',
};

export default SHIFT_TYPES;
