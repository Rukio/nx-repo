import {
  fireEvent,
  screen,
  waitForElementToBeRemoved,
  within,
} from '@testing-library/react';
import { renderWithClient } from '@*company-data-covered*/caremanager/utils-react';
import {
  formattedDateWithTime,
  getFullName,
} from '@*company-data-covered*/caremanager/utils';
import { Summary, SummaryData, summaryTestIds } from '../Summary';

const summaryTitle = 'This is a summary';
const defaultSummaryTitle = 'Summary';
const createdBy = {
  email: 'john@example.com',
  firstName: 'John',
  id: '1',
  jobTitle: 'CRN',
  lastName: 'Doe',
};
const updatedBy = {
  email: 'john@example.com',
  firstName: 'John',
  id: '1',
  jobTitle: 'CRN',
  lastName: 'Doe',
};

const testSummary = {
  visitId: '1',
  body: 'Admitted for hypokalemia 2.9, hypoglycemia 64, dehydration w/ orthostatic hypotension due to dehydration from watery diarrhea. EKG and lactate WNL. Stool studies & c.diff sent to labcorp. Pt given glucometer and family educated. Tolerating BRAT diet after zofran.',
  createdAt: '2022-11-22T14:26:08.365Z',
  updatedAt: '2022-11-22T14:26:08.365Z',
  createdByUserId: '1',
  updatedByUserId: '1',
};

const setup = ({
  readonly,
  summary,
  title,
}: {
  readonly?: boolean;
  summary?: SummaryData;
  title?: string;
}) => {
  const onSummaryAddedMock = vi.fn();
  const onSummaryEditedMock = vi.fn();

  renderWithClient(
    <Summary
      onSummaryAdded={onSummaryAddedMock}
      onSummaryEdited={onSummaryEditedMock}
      readonly={readonly}
      summary={summary}
      title={title}
    />
  );

  return { onSummaryAddedMock, onSummaryEditedMock };
};

describe('<Summary />', () => {
  it('renders summary', async () => {
    setup({
      title: summaryTitle,
      summary: testSummary,
    });
    expect(screen.getByTestId(summaryTestIds.CONTENT)).toBeInTheDocument();
    expect(screen.getByTestId(summaryTestIds.TITLE)).toHaveTextContent(
      summaryTitle
    );
    expect(screen.getByTestId(summaryTestIds.BODY)).toHaveTextContent(
      testSummary.body
    );
    expect(screen.getByTestId(summaryTestIds.EDIT_BUTTON)).toBeInTheDocument();
    expect(
      await screen.findByTestId(summaryTestIds.CREATION_INFO)
    ).toHaveTextContent('John Doe, CRN 11/22/2022 at 02:26 PM UTC');
    expect(screen.getByTestId(summaryTestIds.EDITION_INFO)).toHaveTextContent(
      'edited by John Doe'
    );
  });

  it('renders summary with default title', async () => {
    setup({
      summary: testSummary,
    });
    expect(screen.getByTestId(summaryTestIds.TITLE)).toHaveTextContent(
      defaultSummaryTitle
    );

    expect(screen.getByTestId(summaryTestIds.CONTENT)).toBeInTheDocument();
    expect(screen.getByTestId(summaryTestIds.TITLE)).toHaveTextContent(
      'Summary'
    );
    expect(screen.getByTestId(summaryTestIds.BODY)).toHaveTextContent(
      testSummary.body
    );
    expect(
      await screen.findByTestId(summaryTestIds.CREATION_INFO)
    ).toHaveTextContent('John Doe, CRN 11/22/2022 at 02:26 PM UTC');
    expect(screen.getByTestId(summaryTestIds.EDITION_INFO)).toHaveTextContent(
      'edited by John Doe'
    );
  });

  it('renders summary in readonly mode', () => {
    setup({
      readonly: true,
      summary: testSummary,
    });

    expect(screen.getByTestId(summaryTestIds.CONTENT)).toBeInTheDocument();
    expect(screen.getByTestId(summaryTestIds.BODY)).toHaveTextContent(
      testSummary.body
    );
    expect(screen.queryByTestId(summaryTestIds.EDIT_BUTTON)).toBeNull();
    expect(screen.queryByTestId(summaryTestIds.CREATE_BOX)).toBeNull();
  });

  it('renders empty summary', async () => {
    setup({
      summary: undefined,
    });
    expect(
      await screen.findByTestId(summaryTestIds.CREATE_BOX)
    ).toBeInTheDocument();

    fireEvent.click(await screen.findByTestId(summaryTestIds.CREATE_BUTTON));

    expect(
      await screen.findByTestId(summaryTestIds.EDIT_SAVE_BUTTON)
    ).toBeInTheDocument();
    expect(
      await screen.findByTestId(summaryTestIds.EDIT_CANCEL_BUTTON)
    ).toBeInTheDocument();
  });

  it('creates new summary', async () => {
    const { onSummaryAddedMock, onSummaryEditedMock } = setup({
      summary: undefined,
    });

    const editButton = await screen.findByTestId(summaryTestIds.CREATE_BUTTON);
    fireEvent.click(editButton);

    const textarea = await screen.findByTestId(summaryTestIds.EDIT_TEXT_AREA);

    const editSaveButton = await screen.findByTestId(
      summaryTestIds.EDIT_SAVE_BUTTON
    );
    expect(editSaveButton).toBeInTheDocument();
    expect(
      await screen.findByTestId(summaryTestIds.EDIT_CANCEL_BUTTON)
    ).toBeInTheDocument();

    fireEvent.change(within(textarea).getByRole('textbox'), {
      target: { value: 'new summary' },
    });
    fireEvent.click(editSaveButton);

    await waitForElementToBeRemoved(textarea);

    expect(onSummaryAddedMock).toHaveBeenCalledWith('new summary');
    expect(onSummaryEditedMock).not.toHaveBeenCalled();
  });

  it('edits summary', async () => {
    const { onSummaryAddedMock, onSummaryEditedMock } = setup({
      summary: testSummary,
    });

    const editButton = await screen.findByTestId(summaryTestIds.EDIT_BUTTON);
    fireEvent.click(editButton);

    const textarea = await screen.findByTestId(summaryTestIds.EDIT_TEXT_AREA);
    expect(textarea).toHaveTextContent(testSummary.body);

    const editSaveButton = await screen.findByTestId(
      summaryTestIds.EDIT_SAVE_BUTTON
    );
    expect(editSaveButton).toBeInTheDocument();
    expect(
      await screen.findByTestId(summaryTestIds.EDIT_CANCEL_BUTTON)
    ).toBeInTheDocument();

    fireEvent.change(within(textarea).getByRole('textbox'), {
      target: { value: 'edited summary' },
    });
    fireEvent.click(editSaveButton);

    await waitForElementToBeRemoved(textarea);

    expect(onSummaryEditedMock).toHaveBeenCalledWith('edited summary');
    expect(onSummaryAddedMock).not.toHaveBeenCalled();
  });

  it('renders summary footer', async () => {
    setup({
      summary: testSummary,
    });

    expect(screen.getByTestId(summaryTestIds.BODY)).toHaveTextContent(
      testSummary.body
    );

    const summaryFooterCreationText =
      getFullName(createdBy) +
      ', ' +
      createdBy.jobTitle +
      ' ' +
      formattedDateWithTime(
        new Date(testSummary.updatedAt || testSummary.createdAt)
      );
    const summaryFooterEditionText = getFullName(updatedBy);

    expect(
      await screen.findByTestId(summaryTestIds.CREATION_INFO)
    ).toHaveTextContent(summaryFooterCreationText);
    expect(
      await screen.findByTestId(summaryTestIds.EDITION_INFO)
    ).toHaveTextContent(summaryFooterEditionText);
  });

  it('hides footer if data related to creation/update is missing', () => {
    setup({
      summary: {
        body: testSummary.body,
      },
    });

    expect(screen.getByTestId(summaryTestIds.BODY)).toHaveTextContent(
      testSummary.body
    );

    expect(screen.queryByTestId(summaryTestIds.CREATION_INFO)).toBeNull();
    expect(screen.queryByTestId(summaryTestIds.EDITION_INFO)).toBeNull();
  });
});
