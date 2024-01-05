import { FC } from 'react';
import { Control } from 'react-hook-form';
import {
  Box,
  makeSxStyles,
  Typography,
  useTheme,
} from '@*company-data-covered*/design-system';
import {
  FormSelect,
  getFormSelectMenuItems,
} from '@*company-data-covered*/shared/ui/forms';
import { FormFooter } from '../FormFooter';
import { FormHeader } from '../FormHeader';
import requestCareDesktopImage from '../../assets/request-care-desktop-image.png';
import requestCareMobileImage from '../../assets/request-care-mobile-image.png';
import { REQUEST_CARE_FORM_TEST_IDS } from './testIds';

type RelationshipToPatientOption = { value: string; label: string };

export type WhoNeedsCareFormFieldValues = { relationToPatient: string };

export type WhoNeedsCareFormProps = {
  relationshipToPatientOptions: RelationshipToPatientOption[];
  isSubmitButtonDisabled?: boolean;
  formControl: Control<WhoNeedsCareFormFieldValues>;
  onSubmit: () => void;
};

export const DESKTOP_IMAGE_WIDTH_PX = 552;
export const MOBILE_IMAGE_WIDTH_PX = 311;

export const getImageSizes = (breakpointPx: number) => {
  const { devicePixelRatio } = window;

  const desktopImageSize = DESKTOP_IMAGE_WIDTH_PX / devicePixelRatio;
  const mobileImageSize = MOBILE_IMAGE_WIDTH_PX / devicePixelRatio;

  return `(min-width: ${breakpointPx}px) ${desktopImageSize}px, ${mobileImageSize}px`;
};

const makeStyles = () =>
  makeSxStyles({
    selectTitle: {
      mt: 3,
    },
    select: {
      mt: 2,
    },
    formFooter: {
      mt: 3,
    },
  });

export const WhoNeedsCareForm: FC<WhoNeedsCareFormProps> = ({
  relationshipToPatientOptions,
  isSubmitButtonDisabled = false,
  formControl,
  onSubmit,
}) => {
  const styles = makeStyles();
  const theme = useTheme();

  const imageSrcSet = `${requestCareDesktopImage} ${DESKTOP_IMAGE_WIDTH_PX}w, ${requestCareMobileImage} ${MOBILE_IMAGE_WIDTH_PX}w`;
  const imageSizes = getImageSizes(theme.breakpoints.values.sm);

  return (
    <>
      <FormHeader
        title="Get an appointment in just a few steps"
        subtitle="Schedule an appointment and our fully-equipped medical team will come right to your door. It’s fast, easy, and secure."
        imageSrc={requestCareMobileImage}
        imageSrcSet={imageSrcSet}
        imageSizes={imageSizes}
      />
      <Typography
        sx={styles.selectTitle}
        variant="h6"
        data-testid={REQUEST_CARE_FORM_TEST_IDS.RELATIONSHIP_SELECT_TITLE}
      >
        Who are you requesting care for?
      </Typography>
      <FormSelect
        name="relationToPatient"
        control={formControl}
        selectProps={{
          fullWidth: true,
          sx: styles.select,
          'data-testid': REQUEST_CARE_FORM_TEST_IDS.RELATIONSHIP_SELECT,
          inputProps: {
            'data-testid': REQUEST_CARE_FORM_TEST_IDS.RELATIONSHIP_SELECT_INPUT,
          },
        }}
      >
        {getFormSelectMenuItems(
          relationshipToPatientOptions,
          REQUEST_CARE_FORM_TEST_IDS.RELATIONSHIP_SELECT_ITEM_PREFIX
        )}
      </FormSelect>
      <Box sx={styles.formFooter}>
        <FormFooter
          onSubmit={onSubmit}
          helperText="*company-data-covered* can’t replace calling 911 during an emergency."
          isSubmitButtonDisabled={isSubmitButtonDisabled}
        />
      </Box>
    </>
  );
};
