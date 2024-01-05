import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { renderWithClient } from '@*company-data-covered*/caremanager/utils-react';
import {
  CallVisitFormModal,
  callVisitModalTestIds,
} from '../CallVisitFormModal';
import { JSONMocks } from '@*company-data-covered*/caremanager/utils-mocks';

const closeFn = vi.fn();

const setup = (params?: {
  visitId: string;
  summary?: string;
  visitTypeId?: string;
}) => {
  const props = {
    isOpen: true,
    onClose: closeFn,
    episodeId: '1',
    ...params,
  };

  renderWithClient(<CallVisitFormModal {...props} />);
};

describe('<CallModal />', () => {
  it('renders', async () => {
    setup();
    expect(
      await screen.findByTestId(callVisitModalTestIds.NEW_CALL_MODAL)
    ).toBeInTheDocument();
    expect(
      await screen.findByTestId(callVisitModalTestIds.CALL_TYPE_DROPDOWN)
    ).toBeInTheDocument();
    expect(
      await screen.findByTestId(callVisitModalTestIds.CALL_SUMMARY_INPUT)
    ).toBeInTheDocument();
    expect(
      await screen.findByTestId(callVisitModalTestIds.SAVE_BUTTON)
    ).toBeInTheDocument();
    expect(
      await screen.findByTestId(callVisitModalTestIds.CANCEL_BUTTON)
    ).toBeInTheDocument();
  });

  it('submits the form when it is a create workflow', async () => {
    setup();
    expect(await screen.findByText('New Call')).toBeInTheDocument();
    const dropdown = await screen.findByTestId(
      callVisitModalTestIds.CALL_TYPE_DROPDOWN
    );
    const button = within(dropdown).getByRole('button');
    fireEvent.mouseDown(button);

    const listbox = screen.getByRole('listbox');
    const option = within(listbox).getByText(
      JSONMocks.visitTypes.visit_types[7].name
    );
    fireEvent.click(option);

    const input = await screen.findByRole('textbox');
    fireEvent.change(input, { target: { value: 'summary' } });

    const submitButton = await screen.findByTestId(
      callVisitModalTestIds.SAVE_BUTTON
    );
    submitButton.click();

    await waitFor(() => {
      expect(closeFn).toHaveBeenCalled();
    });
  });

  it('submits the form when it is a edit workflow', async () => {
    setup({ visitId: '1', summary: 'old summary', visitTypeId: '10' });
    expect(await screen.findByText('Update Call')).toBeInTheDocument();

    const dropdown = await screen.findByTestId(
      callVisitModalTestIds.CALL_TYPE_DROPDOWN
    );
    const button = within(dropdown).getByRole('button');
    fireEvent.mouseDown(button);

    expect(await screen.findByText('Remote Evaluation')).toBeInTheDocument();
    expect(await screen.findByText('old summary')).toBeInTheDocument();

    const listbox = screen.getByRole('listbox');
    const option = within(listbox).getByText(
      JSONMocks.visitTypes.visit_types[7].name
    );
    fireEvent.click(option);

    const input = await screen.findByRole('textbox');
    fireEvent.change(input, { target: { value: 'new summary' } });

    const submitButton = await screen.findByTestId(
      callVisitModalTestIds.SAVE_BUTTON
    );
    submitButton.click();

    await waitFor(() => {
      expect(closeFn).toHaveBeenCalled();
    });
  });
});
