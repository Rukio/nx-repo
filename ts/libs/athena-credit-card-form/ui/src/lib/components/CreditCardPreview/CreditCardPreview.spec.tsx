import { Suspense } from 'react';
import { render, screen, waitFor } from '../../../testUtils';
import CreditCardPreview, {
  CardNameType,
  CreditCardPreviewProps,
  getCardTypeIconComponent,
  getNormalizedCardTypeName,
  transformCardType,
} from './CreditCardPreview';
import { CREDIT_CARD_PREVIEW_TEST_IDS } from './testIds';

const defaultProps: CreditCardPreviewProps = {
  creditCardExpiration: '02/2024',
  creditCardNumberLastDigits: '1234',
  creditCardType: 'visa',
  onDelete: vi.fn(),
};

const setup = (props: Partial<CreditCardPreviewProps> = {}) => {
  const { user, ...wrapper } = render(
    <Suspense>
      <CreditCardPreview {...defaultProps} {...props} />
    </Suspense>
  );

  const findDeleteButton = () =>
    screen.findByTestId(CREDIT_CARD_PREVIEW_TEST_IDS.DELETE_BUTTON);

  const queryDeleteButton = () =>
    screen.queryByTestId(CREDIT_CARD_PREVIEW_TEST_IDS.DELETE_BUTTON);

  const getDeleteButton = () =>
    screen.getByTestId(CREDIT_CARD_PREVIEW_TEST_IDS.DELETE_BUTTON);

  const findConfirmDeleteButton = () =>
    screen.findByTestId(CREDIT_CARD_PREVIEW_TEST_IDS.CONFIRM_DELETE_BUTTON);

  const findCancelButton = () =>
    screen.findByTestId(CREDIT_CARD_PREVIEW_TEST_IDS.CANCEL_BUTTON);

  return {
    ...wrapper,
    user,
    findDeleteButton,
    queryDeleteButton,
    getDeleteButton,
    findConfirmDeleteButton,
    findCancelButton,
  };
};

describe('CreditCardPreview', () => {
  it('should render correctly', async () => {
    const { getDeleteButton } = setup();

    const container = await screen.findByTestId(
      CREDIT_CARD_PREVIEW_TEST_IDS.CONTAINER
    );
    expect(container).toBeVisible();

    const cardTypeAndNumber = screen.getByTestId(
      CREDIT_CARD_PREVIEW_TEST_IDS.CARD_TYPE_AND_NUMBER
    );
    expect(cardTypeAndNumber).toBeVisible();
    expect(cardTypeAndNumber).toHaveTextContent(
      `Visa ending in ${defaultProps.creditCardNumberLastDigits}`
    );

    const expiration = screen.getByTestId(
      CREDIT_CARD_PREVIEW_TEST_IDS.EXPIRATION
    );
    expect(expiration).toBeVisible();
    expect(expiration).toHaveTextContent(
      `Exp. ${defaultProps.creditCardExpiration}`
    );

    const deleteButton = getDeleteButton();
    expect(deleteButton).toBeVisible();
  });

  it('should call onDelete on confirm delete button click', async () => {
    const { user, findDeleteButton, findConfirmDeleteButton } = setup();

    const deleteButton = await findDeleteButton();
    expect(deleteButton).toBeVisible();
    expect(deleteButton).toBeEnabled();

    await user.click(deleteButton);

    const confirmDeleteButton = await findConfirmDeleteButton();
    expect(confirmDeleteButton).toBeVisible();
    expect(confirmDeleteButton).toBeEnabled();

    await user.click(confirmDeleteButton);

    await waitFor(() => {
      expect(defaultProps.onDelete).toBeCalledTimes(1);
    });
  });

  it('should toggle delete confirmation on delete and cancel button click', async () => {
    const { user, findDeleteButton, queryDeleteButton, findCancelButton } =
      setup();

    let deleteButton = await findDeleteButton();
    expect(deleteButton).toBeVisible();
    expect(deleteButton).toBeEnabled();

    await user.click(deleteButton);

    const queriedDeleteButton = queryDeleteButton();
    expect(queriedDeleteButton).not.toBeInTheDocument();

    const cancelButton = await findCancelButton();
    expect(cancelButton).toBeVisible();
    expect(cancelButton).toBeEnabled();

    await user.click(cancelButton);

    deleteButton = await findDeleteButton();
    expect(deleteButton).toBeVisible();
    expect(deleteButton).toBeEnabled();
  });
});

describe('getCardTypeIconComponent', () => {
  it.each([
    {
      name: 'American Express',
      type: CardNameType.AmericanExpress,
      dataTestId: CREDIT_CARD_PREVIEW_TEST_IDS.getCardTypeIconTestId(
        CardNameType.AmericanExpress
      ),
    },
    {
      name: 'Diners Club',
      type: CardNameType.DinersClub,
      dataTestId: CREDIT_CARD_PREVIEW_TEST_IDS.getCardTypeIconTestId(
        CardNameType.DinersClub
      ),
    },
    {
      name: 'Discover',
      type: CardNameType.Discover,
      dataTestId: CREDIT_CARD_PREVIEW_TEST_IDS.getCardTypeIconTestId(
        CardNameType.Discover
      ),
    },
    {
      name: 'JCB',
      type: CardNameType.JCB,
      dataTestId: CREDIT_CARD_PREVIEW_TEST_IDS.getCardTypeIconTestId(
        CardNameType.JCB
      ),
    },
    {
      name: 'Mastercard',
      type: CardNameType.Mastercard,
      dataTestId: CREDIT_CARD_PREVIEW_TEST_IDS.getCardTypeIconTestId(
        CardNameType.Mastercard
      ),
    },
    {
      name: 'Visa',
      type: CardNameType.Visa,
      dataTestId: CREDIT_CARD_PREVIEW_TEST_IDS.getCardTypeIconTestId(
        CardNameType.Visa
      ),
    },
    {
      name: 'other',
      type: 'other',
      dataTestId: CREDIT_CARD_PREVIEW_TEST_IDS.getCardTypeIconTestId('other'),
    },
  ])(
    'should return and render correct icon component for $name',
    async ({ type, dataTestId }) => {
      const cardTypeIconComponent = getCardTypeIconComponent(type);
      render(<Suspense>{cardTypeIconComponent}</Suspense>);

      const icon = await screen.findByTestId(dataTestId);
      expect(icon).toBeVisible();
    }
  );
});

describe('getNormalizedCardTypeName', () => {
  it.each([
    {
      name: 'American Express',
      type: CardNameType.AmericanExpress,
      expected: 'American Express',
    },
    {
      name: 'Diners Club',
      type: CardNameType.DinersClub,
      expected: 'Diners Club',
    },
    { name: 'Discover', type: CardNameType.Discover, expected: 'Discover' },
    { name: 'JCB', type: CardNameType.JCB, expected: 'JCB' },
    {
      name: 'Mastercard',
      type: CardNameType.Mastercard,
      expected: 'Mastercard',
    },
    { name: 'Visa', type: CardNameType.Visa, expected: 'Visa' },
    { name: 'other', type: 'other', expected: 'other' },
  ])('should render correct icon for $name', async ({ type, expected }) => {
    const cardTypeName = getNormalizedCardTypeName(type);
    expect(cardTypeName).toBe(expected);
  });
});

describe('transformCardType', () => {
  it('should return transformed card type correctly', () => {
    const result = transformCardType('-American express_');
    expect(result).toBe('americanexpress');
  });
});
