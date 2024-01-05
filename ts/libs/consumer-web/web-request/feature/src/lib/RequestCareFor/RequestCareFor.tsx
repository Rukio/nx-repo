import { FC } from 'react';
import { useSelector } from 'react-redux';
import {
  Button,
  ButtonGroup,
  colorManipulator,
  theme,
} from '@*company-data-covered*/design-system';
import {
  StatsigEvents,
  StatsigActions,
  StatsigPageCategory,
} from '@*company-data-covered*/consumer-web-types';
import {
  RelationshipToPatient,
  selectCaller,
  setCaller,
  useAppDispatch,
} from '@*company-data-covered*/consumer-web/web-request/data-access';
import { StatsigLogEvent } from '../utils';
import { REQUEST_CARE_FOR_TEST_IDS } from './testIds';
import { PageLayout } from '../components/PageLayout';

export const careOptions = [
  { value: RelationshipToPatient.myself, title: 'Myself' },
  { value: RelationshipToPatient.else, title: 'Someone Else' },
];

const LOG_EVENT: StatsigLogEvent = {
  eventName: StatsigEvents.REQUEST_REQUESTOR_TYPE_EVENT,
  value: StatsigActions.ADDED_REQUESTOR_TYPE,
  metadata: {
    page: StatsigPageCategory.REQUEST_CARE_FOR,
    origin: window.location.host,
  },
};

const RequestCareFor: FC = () => {
  const dispatch = useAppDispatch();

  const requestCaller = useSelector(selectCaller);

  const onChangeRequestFor = (value: RelationshipToPatient) => {
    dispatch(setCaller({ relationshipToPatient: value }));
  };

  return (
    <PageLayout
      continueOptions={{
        disabled: !requestCaller.relationshipToPatient,
        dataTestId: REQUEST_CARE_FOR_TEST_IDS.CONTINUE_BUTTON,
        logEventData: LOG_EVENT,
        showBtn: true,
      }}
      titleOptions={{
        dataTestId: REQUEST_CARE_FOR_TEST_IDS.REQUESTING_CARE_HEADER,
        text: 'Who are you requesting care for?',
      }}
    >
      <ButtonGroup
        sx={{ mt: 3 }}
        orientation="vertical"
        fullWidth
        variant="outlined"
        color="primary"
      >
        {careOptions.map((option) => {
          const isSelected =
            option.value === requestCaller.relationshipToPatient ||
            (option.value === RelationshipToPatient.else &&
              requestCaller.relationshipToPatient &&
              requestCaller.relationshipToPatient !==
                RelationshipToPatient.myself);

          return (
            <Button
              key={`care-option-${option.value}`}
              fullWidth
              size="large"
              sx={{
                mt: 1.5,
                ...(isSelected && {
                  backgroundColor: `${colorManipulator.alpha(
                    theme.palette.primary.main,
                    0.04
                  )}`,
                  borderColor: theme.palette.primary.main,
                }),
              }}
              onClick={() => onChangeRequestFor(option.value)}
              data-testid={REQUEST_CARE_FOR_TEST_IDS.getCareForButtonTestId(
                option.title
              )}
              data-selected={isSelected}
            >
              {option.title}
            </Button>
          );
        })}
      </ButtonGroup>
    </PageLayout>
  );
};

export default RequestCareFor;
