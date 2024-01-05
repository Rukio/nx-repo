import { FC, lazy, useState } from 'react';
import {
  Box,
  Button,
  CreditCardIcon,
  makeSxStyles,
  Typography,
} from '@*company-data-covered*/design-system';
import { CREDIT_CARD_PREVIEW_TEST_IDS } from './testIds';

const AmericanExpressIcon = lazy(
  () => import('../../icons/AmericanExpressIcon')
);
const DinersClubIcon = lazy(() => import('../../icons/DinersClubIcon'));
const DiscoverIcon = lazy(() => import('../../icons/DiscoverIcon'));
const JCBIcon = lazy(() => import('../../icons/JCBIcon'));
const MastercardIcon = lazy(() => import('../../icons/MastercardIcon'));
const VisaIcon = lazy(() => import('../../icons/VisaIcon'));

export type CreditCardPreviewProps = {
  creditCardExpiration: string;
  creditCardNumberLastDigits: string;
  creditCardType: string;
  onDelete?: () => void;
};

export enum CardNameType {
  AmericanExpress = 'americanexpress',
  DinersClub = 'dinersclub',
  Discover = 'discover',
  JCB = 'jcb',
  Mastercard = 'mastercard',
  Visa = 'visa',
}

const normalizedCardTypeNames = {
  [CardNameType.AmericanExpress]: 'American Express',
  [CardNameType.DinersClub]: 'Diners Club',
  [CardNameType.Discover]: 'Discover',
  [CardNameType.JCB]: 'JCB',
  [CardNameType.Mastercard]: 'Mastercard',
  [CardNameType.Visa]: 'Visa',
};

export const transformCardType = (cardType: string) => {
  return cardType.replace(/(_|\s|-)/g, '').toLowerCase();
};

export const getNormalizedCardTypeName = (cardType: string) => {
  const transformedCardType = transformCardType(cardType);
  switch (transformedCardType) {
    case CardNameType.AmericanExpress:
      return normalizedCardTypeNames[transformedCardType];
    case CardNameType.DinersClub:
      return normalizedCardTypeNames[transformedCardType];
    case CardNameType.Discover:
      return normalizedCardTypeNames[transformedCardType];
    case CardNameType.JCB:
      return normalizedCardTypeNames[transformedCardType];
    case CardNameType.Mastercard:
      return normalizedCardTypeNames[transformedCardType];
    case CardNameType.Visa:
      return normalizedCardTypeNames[transformedCardType];
    default:
      return cardType;
  }
};

export const getCardTypeIconComponent = (cardType: string) => {
  const transformedCardType = transformCardType(cardType);
  const dataTestId =
    CREDIT_CARD_PREVIEW_TEST_IDS.getCardTypeIconTestId(transformedCardType);
  switch (transformedCardType) {
    case CardNameType.AmericanExpress:
      return <AmericanExpressIcon data-testid={dataTestId} />;
    case CardNameType.DinersClub:
      return <DinersClubIcon data-testid={dataTestId} />;
    case CardNameType.Discover:
      return <DiscoverIcon data-testid={dataTestId} />;
    case CardNameType.JCB:
      return <JCBIcon data-testid={dataTestId} />;
    case CardNameType.Mastercard:
      return <MastercardIcon data-testid={dataTestId} />;
    case CardNameType.Visa:
      return <VisaIcon data-testid={dataTestId} />;
    default:
      return <CreditCardIcon data-testid={dataTestId} />;
  }
};

const makeStyles = () =>
  makeSxStyles({
    container: {
      display: 'flex',
      justifyContent: 'space-between',
      p: 3,
      flexWrap: 'wrap',
      alignItems: 'center',
    },
    detailsWrapper: {
      display: 'flex',
      alignItems: 'center',
    },
    cardNumberWrapper: (theme) => ({
      ml: 1,
      color: theme.palette.text.primary,
    }),
  });

const CreditCardPreview: FC<CreditCardPreviewProps> = ({
  creditCardExpiration,
  creditCardNumberLastDigits,
  creditCardType,
  onDelete,
}) => {
  const styles = makeStyles();
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  const toggleDeleteConfirmation = () => {
    setShowDeleteConfirmation((prev) => !prev);
  };

  const normalizedCardTypeName = getNormalizedCardTypeName(creditCardType);
  const cardTypeIconComponent = getCardTypeIconComponent(creditCardType);

  return (
    <Box
      sx={styles.container}
      data-testid={CREDIT_CARD_PREVIEW_TEST_IDS.CONTAINER}
    >
      <Box sx={styles.detailsWrapper}>
        {cardTypeIconComponent}
        <Box sx={styles.cardNumberWrapper}>
          <Typography
            variant="h6"
            data-testid={CREDIT_CARD_PREVIEW_TEST_IDS.CARD_TYPE_AND_NUMBER}
          >
            {normalizedCardTypeName} ending in {creditCardNumberLastDigits}
          </Typography>
          <Typography
            variant="body2"
            data-testid={CREDIT_CARD_PREVIEW_TEST_IDS.EXPIRATION}
          >
            Exp. {creditCardExpiration}
          </Typography>
        </Box>
      </Box>
      {showDeleteConfirmation ? (
        <Box>
          <Button
            onClick={toggleDeleteConfirmation}
            data-testid={CREDIT_CARD_PREVIEW_TEST_IDS.CANCEL_BUTTON}
            size="large"
          >
            Cancel
          </Button>
          <Button
            onClick={onDelete}
            data-testid={CREDIT_CARD_PREVIEW_TEST_IDS.CONFIRM_DELETE_BUTTON}
            color="error"
            size="large"
          >
            Confirm Delete
          </Button>
        </Box>
      ) : (
        <Button
          onClick={toggleDeleteConfirmation}
          data-testid={CREDIT_CARD_PREVIEW_TEST_IDS.DELETE_BUTTON}
          size="large"
        >
          Delete
        </Button>
      )}
    </Box>
  );
};

export default CreditCardPreview;
