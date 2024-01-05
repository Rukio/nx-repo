import { FC } from 'react';
import {
  Box,
  Button,
  ExpandMoreIcon,
  Grid,
  makeSxStyles,
  MenuItem,
  Select,
  Typography,
} from '@*company-data-covered*/design-system';
import { SelectChangeEvent } from '@mui/material';
import { CareFor } from '../constants';
import { REQUEST_CARE_WIDGET_TEST_IDS } from './testIds';

const makeStyles = () =>
  makeSxStyles({
    root: (theme) => ({
      position: 'relative',
      zIndex: 2,
      height: '100%',
      pt: '300px',
      [theme.breakpoints.up('md')]: {
        pt: '400px',
      },
      [theme.breakpoints.up('lg')]: {
        background: theme.palette.background.default,
        pt: 0,
        borderTopLeftRadius: theme.shape.borderRadius,
        borderBottomLeftRadius: theme.shape.borderRadius,
        maxWidth: '641px',
        position: 'absolute',
        top: 'calc(50% - 340px)',
        left: 'auto',
        right: 0,
        height: 'auto',
      },
    }),
    wrapper: (theme) => ({
      paddingBottom: 4,
      width: '100%',
      background: theme.palette.background.default,
      [theme.breakpoints.up('sm')]: {
        paddingY: 4,
      },
      [theme.breakpoints.up('md')]: {
        paddingY: 5,
      },
      [theme.breakpoints.up('lg')]: {
        background: 'none',
        padding: theme.spacing(10, 0, 12.5),
      },
    }),
    title: (theme) => ({
      position: 'relative',
      mx: 'auto',
      textAlign: 'center',
      top: '-210px',
      marginBottom: '-40px',
      fontSize: '38px',
      color: theme.palette.common.white,
      lineHeight: '40px',
      paddingX: 2.5,
      [theme.breakpoints.up('sm')]: {
        paddingX: 5,
      },
      [theme.breakpoints.up('md')]: {
        paddingX: 2.5,
        fontSize: '60px',
        lineHeight: '64px',
        top: '-310px',
        maxWidth: '600px',
        marginBottom: '-120px',
      },
      [theme.breakpoints.up('lg')]: {
        padding: 0,
        color: theme.palette.primary.main,
        textAlign: 'start',
        paddingRight: '97px',
        paddingLeft: '120px',
        top: 0,
        marginBottom: 0,
        mx: 0,
        maxWidth: 'initial',
      },
    }),
    description: (theme) => ({
      color: theme.palette.text.primary,
      textAlign: 'center',
      lineHeight: '33px',
      [theme.breakpoints.up('lg')]: {
        textAlign: 'start',
        mt: 2,
        fontSize: 20,
        lineHeight: '33px',
      },
    }),
    relationWrapper: (theme) => ({
      color: theme.palette.text.primary,
      paddingX: 2,
      maxWidth: '600px',
      marginX: 'auto',
      [theme.breakpoints.up('md')]: {
        paddingX: 2.5,
      },
      [theme.breakpoints.up('lg')]: {
        paddingX: '120px',
        maxWidth: '100%',
      },
    }),
    requestCareForLabel: (theme) => ({
      mt: 3,
      [theme.breakpoints.up('lg')]: {
        mt: 5,
      },
    }),
    relationshipSelect: {
      mt: 1,
    },
  });

type RequestCareWidgetProps = {
  onRelationshipToPatientChange: (value: CareFor) => void;
  webRequestLink: string;
  learnMoreLink: string;
  onWebRequestBtnClick: () => void;
  onLearnMoreBtnClick: () => void;
};

const RequestCareWidget: FC<RequestCareWidgetProps> = ({
  onRelationshipToPatientChange,
  webRequestLink,
  learnMoreLink,
  onWebRequestBtnClick,
  onLearnMoreBtnClick,
}) => {
  const styles = makeStyles();

  const onRelationshipChange = (event: SelectChangeEvent<unknown>) => {
    onRelationshipToPatientChange(event.target.value as CareFor);
  };

  return (
    <Box sx={styles.root} data-testid={REQUEST_CARE_WIDGET_TEST_IDS.CONTAINER}>
      <Grid item sx={styles.wrapper}>
        <Typography color="primary" variant="h1" sx={styles.title}>
          We see patients differently
        </Typography>
        <Box sx={styles.relationWrapper}>
          <Typography variant="body1" sx={styles.description}>
            In your home. On your terms. We bring the power of the hospital to
            you.
          </Typography>
          <Typography
            variant="h6"
            sx={styles.requestCareForLabel}
            data-testid={REQUEST_CARE_WIDGET_TEST_IDS.RELATIONSHIP_SELECT_LABEL}
          >
            Request care for
          </Typography>
          <Select
            fullWidth
            IconComponent={ExpandMoreIcon}
            defaultValue={CareFor.Myself}
            onChange={onRelationshipChange}
            sx={styles.relationshipSelect}
            MenuProps={{ disableScrollLock: true }}
            data-testid={REQUEST_CARE_WIDGET_TEST_IDS.RELATIONSHIP_SELECT}
          >
            <MenuItem
              value={CareFor.Myself}
              data-testid={
                REQUEST_CARE_WIDGET_TEST_IDS.RELATIONSHIP_SELECT_OPTION
              }
            >
              Myself
            </MenuItem>
            <MenuItem
              value={CareFor.FamilyFriend}
              data-testid={
                REQUEST_CARE_WIDGET_TEST_IDS.RELATIONSHIP_SELECT_OPTION
              }
            >
              A friend or family member
            </MenuItem>
            <MenuItem
              value={CareFor.ClinicianOrganization}
              data-testid={
                REQUEST_CARE_WIDGET_TEST_IDS.RELATIONSHIP_SELECT_OPTION
              }
            >
              As a clinician or organization
            </MenuItem>
          </Select>
          <Grid container pt={2} spacing={2}>
            <Grid item xs={6.7} md={7.4}>
              <Button
                variant="contained"
                href={webRequestLink}
                onClick={onWebRequestBtnClick}
                fullWidth
                data-testid={
                  REQUEST_CARE_WIDGET_TEST_IDS.REQUEST_A_VISIT_BUTTON
                }
              >
                Request a visit
              </Button>
            </Grid>
            <Grid item xs={5.3} md={4.6}>
              <Button
                variant="outlined"
                href={learnMoreLink}
                onClick={onLearnMoreBtnClick}
                fullWidth
                data-testid={REQUEST_CARE_WIDGET_TEST_IDS.LEARN_MORE_BUTTON}
              >
                Learn More
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Grid>
    </Box>
  );
};

export default RequestCareWidget;
