import { useCallback } from 'react';
import { Box, Button, Card, Typography } from '../..';
import { makeSxStyles } from '../../utils/makeSxStyles';
import { formatPhoneNumber } from '../../utils/formatters';
import CLINICAL_PROVIDER_CARD_TEST_IDS from './testIds';

export enum ClinicalProviderCardLayoutDirection {
  horizontal = 'HORIZONTAL',
  vertical = 'VERTICAL',
}
export interface ClinicalProviderDetails {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  fax?: string;
  phone: string;
}

export interface ClinicalProviderCardProps {
  clinicalProviderDetails: ClinicalProviderDetails;
  isFaxVisible: boolean;
  onSelect?: (selectedId: number) => void;
  testIdPrefix: string;
  layoutDirection?: ClinicalProviderCardLayoutDirection;
}

const makeStyles = (layoutDirection: ClinicalProviderCardLayoutDirection) =>
  makeSxStyles({
    capitalize: {
      textTransform: 'capitalize',
    },
    card: {
      width: '100%',
      minHeight: '132px',
    },
    cardContent: {
      padding: 2,
      paddingBottom: 2,
      display: 'flex',
      flexDirection:
        layoutDirection === ClinicalProviderCardLayoutDirection.horizontal
          ? 'row'
          : 'column',
      alignItems:
        layoutDirection === ClinicalProviderCardLayoutDirection.horizontal
          ? 'center'
          : 'flex-start',
      justifyContent: 'space-between',
    },
    addressContainer: {
      marginBottom: 1,
    },
    label: (theme) => ({
      color: theme.palette.text.secondary,
      marginRight: 1,
    }),
    selectButton: {
      width: '100%',
      marginTop: 1,
    },
  });

const ClinicalProviderCard: React.FC<ClinicalProviderCardProps> = ({
  clinicalProviderDetails,
  isFaxVisible,
  onSelect,
  testIdPrefix,
  layoutDirection = ClinicalProviderCardLayoutDirection.horizontal,
}) => {
  const { id, name, address, city, state, zipCode, phone, fax } =
    clinicalProviderDetails;
  const styles = makeStyles(layoutDirection);

  const handleSelect = useCallback(() => onSelect?.(id), [onSelect, id]);

  const formatPhone = (telephoneNumber: string) =>
    telephoneNumber ? formatPhoneNumber(telephoneNumber) : 'None';

  const getTestIdFor = (testId: string): string => `${testIdPrefix}-${testId}`;

  return (
    <Card
      variant="outlined"
      sx={styles.card}
      data-testid={`${getTestIdFor(
        CLINICAL_PROVIDER_CARD_TEST_IDS.CLINICAL_PROVIDER_CARD
      )}-${clinicalProviderDetails.id}`}
    >
      <Box sx={styles.cardContent}>
        <Box>
          <Typography
            data-testid={getTestIdFor(
              CLINICAL_PROVIDER_CARD_TEST_IDS.PROVIDER_NAME
            )}
            variant="h6"
          >
            {name.toUpperCase()}
          </Typography>
          <Box sx={styles.addressContainer}>
            <Typography
              variant="body2"
              data-testid={getTestIdFor(
                CLINICAL_PROVIDER_CARD_TEST_IDS.PROVIDER_ADDRESS_LINE_1
              )}
              sx={styles.capitalize}
            >
              {address.toLowerCase()}
            </Typography>
            <Typography
              variant="body2"
              data-testid={getTestIdFor(
                CLINICAL_PROVIDER_CARD_TEST_IDS.PROVIDER_CITY_STATE
              )}
              sx={styles.capitalize}
            >
              {city.toLowerCase()}, {state.toUpperCase()} {zipCode}
            </Typography>
          </Box>
          <Box
            data-testid={getTestIdFor(
              CLINICAL_PROVIDER_CARD_TEST_IDS.PROVIDER_PHONE_CONTAINER
            )}
          >
            <Typography variant="body2" display="inline" sx={styles.label}>
              Phone
            </Typography>
            <Typography
              variant="body2"
              display="inline"
              data-testid={getTestIdFor(
                CLINICAL_PROVIDER_CARD_TEST_IDS.PROVIDER_PHONE
              )}
            >
              {formatPhone(phone)}
            </Typography>
          </Box>
          {isFaxVisible && (
            <Box
              data-testid={getTestIdFor(
                CLINICAL_PROVIDER_CARD_TEST_IDS.PROVIDER_FAX_CONTAINER
              )}
            >
              <>
                <Typography variant="body2" display="inline" sx={styles.label}>
                  Fax
                </Typography>
                <Typography
                  variant="body2"
                  display="inline"
                  data-testid={getTestIdFor(
                    CLINICAL_PROVIDER_CARD_TEST_IDS.PROVIDER_FAX
                  )}
                >
                  {formatPhone(fax || '')}
                </Typography>
              </>
            </Box>
          )}
        </Box>
        {onSelect && (
          <Button
            size="large"
            variant="outlined"
            color="primary"
            data-testid={getTestIdFor(
              CLINICAL_PROVIDER_CARD_TEST_IDS.PROVIDER_SELECT_BUTTON
            )}
            onClick={handleSelect}
            sx={
              layoutDirection === ClinicalProviderCardLayoutDirection.vertical
                ? styles.selectButton
                : null
            }
          >
            Select
          </Button>
        )}
      </Box>
    </Card>
  );
};
export default ClinicalProviderCard;
