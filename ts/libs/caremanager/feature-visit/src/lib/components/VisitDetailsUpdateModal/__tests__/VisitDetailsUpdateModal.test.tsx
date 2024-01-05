import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { renderWithClient } from '@*company-data-covered*/caremanager/utils-react';
import { formatDataTestId } from '@*company-data-covered*/caremanager/utils';
import { JSONMocks } from '@*company-data-covered*/caremanager/utils-mocks';
import { Visit } from '@*company-data-covered*/caremanager/data-access-types';
import { VisitDetailsUpdateModal, testIds } from '../VisitDetailsUpdateModal';

describe('<VisitDetailsUpdateModal />', () => {
  const setup = () => {
    const closeFn = vi.fn();

    renderWithClient(
      <VisitDetailsUpdateModal
        isOpen
        onClose={closeFn}
        visit={
          {
            id: '1',
            episodeId: '1',
            // We assume this is "Daily Update"
            typeId: JSONMocks.visitTypes.visit_types[2].id,
          } as Visit
        }
      />
    );

    return { closeFn };
  };

  it('renders', async () => {
    setup();

    expect(await screen.findByTestId(testIds.DIALOG)).toBeInTheDocument();
    expect(await screen.findByTestId(testIds.FORM)).toBeInTheDocument();
    expect(await screen.findByText('Daily Update')).toBeInTheDocument();
  });

  it('submits the form', async () => {
    const { closeFn } = setup();

    // Select new Visit Type
    const dropdown = await screen.findByTestId(testIds.VISIT_TYPE_BOX);
    const button = within(dropdown).getByRole('button');
    fireEvent.mouseDown(button);
    const listbox = screen.getByRole('listbox');
    const option = within(listbox).getByText('Evaluation');
    fireEvent.click(option);

    const submitButton = await screen.findByTestId(testIds.SAVE_BUTTON);
    submitButton.click();

    await waitFor(() => {
      expect(closeFn).toHaveBeenCalled();
    });
  });

  it('should show only false isCall VisitTypes', async () => {
    setup();
    const notValidTypes = JSONMocks.visitTypes.visit_types.filter(
      (type) => type.is_call_type
    );
    const validTypes = JSONMocks.visitTypes.visit_types.filter(
      (type) => !type.is_call_type
    );

    const dropdown = await screen.findByTestId(testIds.VISIT_TYPE_BOX);
    const button = within(dropdown).getByRole('button');
    fireEvent.mouseDown(button);

    notValidTypes.forEach(({ name }) => {
      expect(
        screen.queryByTestId(`visittypeid-${formatDataTestId(name)}-option`)
      ).not.toBeInTheDocument();
    });
    validTypes.forEach(({ name }) => {
      expect(
        screen.getByTestId(`visittypeid-${formatDataTestId(name)}-option`)
      ).toBeInTheDocument();
    });
  });
});
