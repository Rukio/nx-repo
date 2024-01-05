import {
  ReactNode,
  PropsWithChildren,
  useState,
  useMemo,
  useEffect,
  FC,
} from 'react';
import {
  Link as ReactRouterLink,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';
import {
  Container,
  Paper,
  LinearProgress,
  ChevronLeftIcon,
  LoadingButton,
  Alert,
  FormHelperText,
  Typography,
  theme,
  Box,
  Link,
  SxProps,
  Theme,
  makeSxStyles,
  *company-data-covered*Logo,
} from '@*company-data-covered*/design-system';
import parsePhoneNumber from 'libphonenumber-js';
import { useSelector } from 'react-redux';
import dayjs from 'dayjs';
import statsig from 'statsig-js';
import cookie from 'js-cookie';
import {
  CareRequestType,
  StatsigEvents,
  StatsigPageCategory,
} from '@*company-data-covered*/consumer-web-types';
import { skipToken } from '@reduxjs/toolkit/dist/query';
import { isQueryErrorResponse } from '@*company-data-covered*/shared/util/rtk';
import {
  useGetServiceAreaAvailabilityQuery,
  selectCareRequestsConfigurationLoadingState,
  CreateCareRequestPayload,
  createCareRequest,
  selectRequest,
  selectCaller,
  setAddress,
  setCaller,
  resetRequestState,
  RelationshipToPatient,
  useAppDispatch,
  persistor,
  setLocalStorageItem,
  LocalStorageKeys,
  getErrorResponseMessages,
} from '@*company-data-covered*/consumer-web/web-request/data-access';
import { useRequestStepper } from '../../hooks';
import {
  ValidatorResponse,
  useValidation,
  getAddressInfo,
  ADDRESS_VALIDATION_RULE,
  CALLER_VALIDATION_RULE,
  COMPLAINT_VALIDATION_RULE,
  PATIENT_ELSE_VALIDATION_RULE,
  PATIENT_MYSELF_VALIDATION_RULE,
  PREFERRED_ETA_VALIDATION_RULE,
  StatsigLogEvent,
  getStatsigStableId,
} from '../../utils';
import { PAGE_LAYOUT_TEST_IDS } from './testIds';
import {
  SYMPTOMS_DIVIDER,
  SYMPTOMS_COMMA_DIVIDER_REGEX,
  WEB_REQUEST_ROUTES,
} from '../../constants';
import { logError } from '@*company-data-covered*/shared/datadog/util';
import { format } from 'date-fns';
import { environment } from '../../../environments/environment';

export enum Message911Variant {
  Top = 'Top',
  Bottom = 'Bottom',
}

export interface PageLayoutProps {
  layoutSize?: 'sm' | 'md' | 'lg';
  continueOptions?: {
    disabled: boolean;
    shouldReturnHome?: boolean;
    dataTestId: string;
    showBtn?: boolean;
    logEventData?: StatsigLogEvent;
    onClick?: () => void;
    shouldOverrideContinue?: boolean;
  };
  titleOptions?: {
    text: string;
    dataTestId: string;
  };
  message911Variant?: Message911Variant;
  showProgressBar?: boolean;
  show911Message?: boolean;
  disableLayoutGutters?: boolean;
  footer?: ReactNode;
  disableChildrenWrapper?: boolean;
}

type RequestValidationResponse = {
  patient: ValidatorResponse;
  caller: ValidatorResponse;
  complaint: ValidatorResponse;
  address: ValidatorResponse;
  patientPreferredEta: ValidatorResponse;
};

const makeStyles = () =>
  makeSxStyles({
    wrapper: {
      backgroundColor: theme.palette.grey[50],
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
    },
    header: {
      padding: theme.spacing(2),
      position: 'relative',
      zIndex: 1,
    },
    wrapperRoot: {
      margin: 'auto',
    },
    root: {
      borderRadius: '8px',
      border: `1px solid ${theme.palette.grey[200]}`,
      background: theme.palette.background.paper,
      padding: theme.spacing(3),
      [theme.breakpoints.down('sm')]: {
        padding: theme.spacing(3, 2),
        maxWidth: `calc(100vw - ${theme.spacing(4)})`,
        marginY: theme.spacing(3),
      },
    },
    bar: {
      height: 12,
      '& .MuiLinearProgress-bar': {
        borderRadius: '0 8px 8px 0',
      },
    },
    backLink: {
      color: theme.palette.primary.main,
      textDecoration: 'none',
      marginBottom: theme.spacing(3),
      marginLeft: theme.spacing(-1),
      display: 'inline-flex',
      alignItems: 'center',
      fontSize: theme.typography.pxToRem(14),
    },
    homeLink: {
      lineHeight: 0,
      display: 'block',
    },
    loadingButton: {
      mt: 3,
      '& .MuiLoadingButton-loadingIndicator': {
        position: 'initial',
        order: 1,
        marginLeft: theme.spacing(1.5),
      },
      '& .MuiLoadingButton-loading': {
        backgroundColor: `${theme.palette.primary.main} !important`,
        color: `${theme.palette.common.white} !important`,
      },
    },
    errorList: {
      color: theme.palette.error.main,
    },
    privacyText: {
      mt: 2,
      color: theme.palette.text.disabled,
      '& a': {
        color: theme.palette.text.disabled,
      },
    },
    grecaptchaText: {
      display: {
        sm: 'none',
      },
    },
  });

const getRequiredValuesMessages = (requiredValues: {
  [key: string]: ValidatorResponse;
}): string[] => {
  const missedValues: string[] = [];

  Object.entries(requiredValues).forEach(([key, value]) => {
    if (!value.isValidForm) {
      if (key === 'patient') {
        missedValues.push('patient info');
      }
      if (key === 'caller') {
        missedValues.push('caller info');
      }
      if (key === 'complaint') {
        missedValues.push('symptoms');
      }
      if (key === 'address') {
        missedValues.push('location');
      }
      if (key === 'patientPreferredEta') {
        missedValues.push('preferred time');
      }
    }
  });

  return missedValues;
};

const isRelationshipInPredefinedList = (relationship: string) =>
  Object.values(RelationshipToPatient).includes(
    relationship as RelationshipToPatient
  );

const PageLayout: FC<PropsWithChildren<PageLayoutProps>> = ({
  children,
  layoutSize = 'sm',
  continueOptions,
  titleOptions,
  message911Variant = Message911Variant.Top,
  showProgressBar = true,
  show911Message = true,
  disableLayoutGutters,
  footer,
  disableChildrenWrapper = false,
}) => {
  const dispatch = useAppDispatch();
  const newSymptomsDividerFeatureEnabled = statsig.checkGate(
    'new_symptoms_divider'
  );
  const symptomsDivider = newSymptomsDividerFeatureEnabled
    ? SYMPTOMS_DIVIDER
    : '|';

  const careRequest = useSelector(selectRequest);
  const { relationshipToPatient: relationship } = useSelector(selectCaller);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const styles = makeStyles();
  const stepData = useRequestStepper();

  const [requestErrors, setRequestErrors] = useState<string[]>([]);
  const [initialZipcode, setInitialZipcode] = useState('');

  const { isLoading } = useSelector(
    selectCareRequestsConfigurationLoadingState
  );

  const submitButtonText = useMemo(() => {
    if (continueOptions?.shouldReturnHome) {
      return 'Return Home';
    }
    if (!stepData.finalStep) {
      return 'Continue';
    }
    if (isLoading) {
      return 'Submitting';
    }

    return 'Submit Visit Request';
  }, [isLoading, stepData.finalStep, continueOptions?.shouldReturnHome]);

  const [showMissedRequiredValues, setShowMissedRequiredValues] =
    useState(false);
  const patientValidationRules =
    relationship === RelationshipToPatient.myself
      ? PATIENT_MYSELF_VALIDATION_RULE
      : PATIENT_ELSE_VALIDATION_RULE;
  const careRequestValidation: RequestValidationResponse = {
    patient: useValidation(careRequest.patient, patientValidationRules),
    caller: useValidation(careRequest.caller, CALLER_VALIDATION_RULE),
    complaint: useValidation(careRequest.complaint, COMPLAINT_VALIDATION_RULE),
    address: useValidation(careRequest.address, ADDRESS_VALIDATION_RULE),
    patientPreferredEta: useValidation(
      { ...(careRequest.patientPreferredEta || {}) },
      PREFERRED_ETA_VALIDATION_RULE
    ),
  };
  const isCareRequestDataInvalid = Object.values(careRequestValidation).some(
    (value) => !value.isValidForm
  );

  useGetServiceAreaAvailabilityQuery(
    initialZipcode
      ? {
          zipcode: initialZipcode,
          clientTime: format(new Date(), 'H:mm:ssXXXX'),
        }
      : skipToken,
    {
      refetchOnMountOrArgChange: true,
    }
  );

  const setPredefinedRequestData = () => {
    if (searchParams.has('address')) {
      getAddressInfo(searchParams.get('address') ?? '').then(
        ({ parsedAddress }) => {
          if (parsedAddress.streetNumber && parsedAddress.postalCode) {
            setInitialZipcode(parsedAddress.postalCode);
            dispatch(
              setAddress({
                streetAddress1: `${parsedAddress.streetNumber} ${parsedAddress.streetName}`,
                streetAddress2: parsedAddress.addressLine2 || '',
                city: parsedAddress.city || parsedAddress.township || '',
                state: parsedAddress.state || '',
                postalCode: parsedAddress.postalCode,
              })
            );
            setLocalStorageItem(LocalStorageKeys.isAddressSetByUrl, true);
          }
        }
      );
    }
    const relationshipSearchParam = searchParams.get('relationship');
    if (
      relationshipSearchParam &&
      isRelationshipInPredefinedList(relationshipSearchParam)
    ) {
      dispatch(
        setCaller({
          relationshipToPatient: relationshipSearchParam,
        })
      );
    }
  };

  useEffect(() => {
    setPredefinedRequestData();
    // Since we may accept the address and relationship data from query params, we need to set it to redux only once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logEventsOnCareRequestCreated = ({
    statsigCareRequestId,
    symptoms,
  }: {
    statsigCareRequestId: string;
    symptoms: string;
  }) => {
    statsig.logEvent(StatsigEvents.REQUEST_SYMPTOMS_SELECTION_EVENT, symptoms, {
      page: StatsigPageCategory.REQUEST_HELP,
      statsigCareRequestId,
    });
    statsig.logEvent(
      StatsigEvents.REQUEST_SUBMITTED_EVENT,
      statsigCareRequestId,
      {
        page: WEB_REQUEST_ROUTES.requestDetails,
        origin: window.location.host,
      }
    );
  };

  const postCreateCareRequest = (careRequestData: CreateCareRequestPayload) => {
    dispatch(createCareRequest(careRequestData)).then((res) => {
      if (isQueryErrorResponse(res)) {
        const errorMessages = getErrorResponseMessages(res);

        setRequestErrors(errorMessages);
        logError(`[Submit Care request] create care request failed`, {
          errors: errorMessages,
        });

        return;
      }

      logEventsOnCareRequestCreated({
        statsigCareRequestId: res.data.care_request_id,
        symptoms: careRequestData.complaint.symptoms,
      });
      persistor.purge().then(() => {
        dispatch(resetRequestState());
      });
      navigate(WEB_REQUEST_ROUTES.requestDetails);
    });
  };

  const onCreateCareRequest = () => {
    if (continueOptions?.shouldReturnHome) {
      return;
    }

    if (continueOptions?.shouldOverrideContinue && continueOptions?.onClick) {
      continueOptions.onClick();

      return;
    }

    if (continueOptions && continueOptions?.logEventData) {
      const { eventName, value, metadata } = continueOptions.logEventData;
      if (!stepData.previousStepExists) {
        statsig.logEvent(StatsigEvents.REQUEST_START_EVENT, value, metadata);
      } else {
        statsig.logEvent(eventName, value, metadata);
      }
    }

    continueOptions?.onClick?.();

    if (stepData.nextStepUrl && !stepData.finalStep) {
      navigate(stepData.nextStepUrl);

      return;
    }

    if (isCareRequestDataInvalid) {
      setShowMissedRequiredValues(true);

      return;
    }
    setShowMissedRequiredValues(false);

    setRequestErrors([]);
    grecaptcha.ready(() => {
      grecaptcha
        .execute(environment.grecaptchaKey, {
          action: 'request_care',
        })
        .then((token) => {
          const cookieSource = cookie.get('source');
          const ppcSource = cookieSource ? { source: cookieSource } : undefined;

          const internationalNumber = parsePhoneNumber(
            careRequest.caller.phone,
            'US'
          )?.number;
          const careRequestData = {
            ...careRequest,
            complaint: {
              ...careRequest.complaint,
              symptoms: careRequest.complaint.symptoms
                .trim()
                .replace(SYMPTOMS_COMMA_DIVIDER_REGEX, symptomsDivider),
            },
            caller: {
              ...careRequest.caller,
              phone: internationalNumber?.toString() || '',
            },
            patient: {
              ...careRequest.patient,
              ...(careRequest.caller.relationshipToPatient ===
              RelationshipToPatient.myself
                ? {
                    firstName: careRequest.caller.firstName,
                    lastName: careRequest.caller.lastName,
                    phone: internationalNumber,
                  }
                : {}),
              birthday: dayjs(careRequest.patient.birthday).utc(true).format(),
            },
            marketingMetaData: ppcSource,
            statsigStableId: getStatsigStableId(),
            type: CareRequestType.web,
            token,
          };

          postCreateCareRequest(careRequestData);
        });
    });
  };

  const renderMissedRequiredValues = (
    missedRequiredValues: RequestValidationResponse
  ) => {
    const missedValues = getRequiredValuesMessages(missedRequiredValues);

    return (
      <>
        <Typography
          color="error"
          sx={{ mt: 1 }}
          data-testid={PAGE_LAYOUT_TEST_IDS.MISSED_REQUIRED_FIELDS_TITLE}
        >
          Please go back and confirm the missing details about:
        </Typography>
        <Box
          component="ul"
          color="error.main"
          sx={{ my: 0 }}
          data-testid={PAGE_LAYOUT_TEST_IDS.MISSED_REQUIRED_FIELDS_LIST}
        >
          {missedValues.map((value) => (
            <li
              key={value}
              data-testid={
                PAGE_LAYOUT_TEST_IDS.MISSED_REQUIRED_FIELDS_LIST_ITEM
              }
            >
              {value}
            </li>
          ))}
        </Box>
      </>
    );
  };

  return (
    <Box sx={styles.wrapper}>
      <Paper sx={styles.header}>
        <Link
          href="https://www.*company-data-covered*.com/"
          sx={styles.homeLink}
          data-testid={PAGE_LAYOUT_TEST_IDS.DISPATCH_HEALTH_LOGO}
        >
          <*company-data-covered*Logo pixelHeight={20} />
        </Link>
      </Paper>
      {!!stepData.stepProgress && showProgressBar && (
        <LinearProgress
          sx={styles.bar}
          variant="determinate"
          value={stepData.stepProgress}
          data-testid={PAGE_LAYOUT_TEST_IDS.REQUEST_PROGRESS_BAR}
        />
      )}
      <Container
        sx={
          [
            styles.wrapperRoot,
            !disableChildrenWrapper && styles.root,
          ] as SxProps<Theme>
        }
        maxWidth={layoutSize}
        disableGutters={disableLayoutGutters}
      >
        {!!stepData.backBtnOptions && (
          <Link
            component={ReactRouterLink}
            sx={styles.backLink}
            data-testid={PAGE_LAYOUT_TEST_IDS.getBackLinkTestId(
              stepData.backBtnOptions.text
            )}
            to={stepData.backBtnOptions.url}
          >
            <ChevronLeftIcon />
            {stepData.backBtnOptions.text}
          </Link>
        )}
        {titleOptions && (
          <Typography variant="h4" data-testid={titleOptions.dataTestId}>
            {titleOptions.text}
          </Typography>
        )}
        {!stepData.previousStepExists &&
          message911Variant === Message911Variant.Top &&
          show911Message && (
            <Typography
              sx={{ mt: 1, color: 'error.main' }}
              variant="body2"
              data-testid={PAGE_LAYOUT_TEST_IDS.EMERGENCY_INFO_HEADER}
            >
              If this is an emergency, please call 911.
            </Typography>
          )}
        {children}
        {!continueOptions?.disabled && stepData.finalStep && (
          <Alert
            sx={{ mt: 2 }}
            data-testid={PAGE_LAYOUT_TEST_IDS.SUCCESS_MESSAGE_HEADER}
            message="That’s everything we need! Click submit and we’ll call to schedule your care visit."
            color="success"
          />
        )}
        {showMissedRequiredValues &&
          renderMissedRequiredValues(careRequestValidation)}
        {!!requestErrors?.length && (
          <Box component="ul" sx={styles.errorList}>
            {requestErrors.map((err) => (
              <li key={err}>{err}</li>
            ))}
          </Box>
        )}
        {continueOptions?.showBtn && (
          <LoadingButton
            variant={
              continueOptions?.shouldReturnHome ? 'outlined' : 'contained'
            }
            size="large"
            fullWidth
            loading={isLoading}
            loadingPosition="end"
            sx={styles.loadingButton}
            disabled={continueOptions?.disabled}
            onClick={onCreateCareRequest}
            data-testid={
              !stepData.finalStep
                ? continueOptions?.dataTestId
                : PAGE_LAYOUT_TEST_IDS.SUBMIT_VISIT_BUTTON
            }
            href={
              continueOptions?.shouldReturnHome
                ? 'https://www.*company-data-covered*.com/'
                : undefined
            }
          >
            {submitButtonText}
          </LoadingButton>
        )}
        {footer}
        {!stepData.previousStepExists &&
          message911Variant === Message911Variant.Bottom &&
          show911Message && (
            <Typography
              sx={{ mt: 2.5 }}
              variant="body2"
              data-testid={PAGE_LAYOUT_TEST_IDS.EMERGENCY_INFO_FOOTER}
              textAlign="center"
              color="text.secondary"
            >
              If this is an emergency, please call 911.
            </Typography>
          )}
        {stepData.finalStep && (
          <>
            <FormHelperText
              sx={styles.privacyText}
              data-testid={PAGE_LAYOUT_TEST_IDS.PP_TOC_HEADER}
            >
              By submitting your request, you agree to our{' '}
              <a
                href="https://www.*company-data-covered*.com/privacy-policy/"
                data-testid={PAGE_LAYOUT_TEST_IDS.PRIVATE_POLICY_LINK}
              >
                Privacy Policy
              </a>{' '}
              and{' '}
              <a
                href="https://www.*company-data-covered*.com/terms-of-service/"
                data-testid={PAGE_LAYOUT_TEST_IDS.TERMS_OF_SERVICE_LINK}
              >
                Terms and Conditions
              </a>{' '}
              and to receive SMS notifications about your appointment at the
              phone number provided.
            </FormHelperText>
            <FormHelperText
              disabled
              sx={[styles.privacyText, styles.grecaptchaText] as SxProps<Theme>}
              data-testid={PAGE_LAYOUT_TEST_IDS.GRECAPTCHA_TEXT}
            >
              This site is protected by reCAPTCHA and the Google{' '}
              <a href="https://policies.google.com/privacy">Privacy Policy</a>{' '}
              and{' '}
              <a href="https://policies.google.com/terms">Terms of Service</a>{' '}
              apply.
            </FormHelperText>
          </>
        )}
      </Container>
    </Box>
  );
};

export default PageLayout;
