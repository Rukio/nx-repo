import { render, screen } from '../../../../test/testUtils';
import { SidePanelProvider, usePanelContext } from '../SidePanelContext';
import { CONTEXT_TESTING_TEST_IDS } from '../testIds';

const { OPEN_BUTTON, CLOSE_BUTTON, SIDE_PANEL_IS_OPEN, SELECTED_VISIT_ID } =
  CONTEXT_TESTING_TEST_IDS;

const TestingSidePanelComponent = () => {
  const { isSidePanelOpen, selectedVisitId, setSidePanelOpen, closeSidePanel } =
    usePanelContext();

  return (
    <>
      <button
        data-testid={OPEN_BUTTON}
        onClick={() => setSidePanelOpen('6', true)}
      />
      <button data-testid={CLOSE_BUTTON} onClick={closeSidePanel} />
      <p data-testid={SELECTED_VISIT_ID}>{selectedVisitId}</p>
      <p data-testid={SIDE_PANEL_IS_OPEN}>{isSidePanelOpen?.toString()}</p>
    </>
  );
};

const setup = () =>
  render(
    <SidePanelProvider>
      <TestingSidePanelComponent />
    </SidePanelProvider>
  );

describe('usePanelContext', () => {
  it('should show the selected request id', async () => {
    const { user } = setup();
    const selectedVirtualAppId = screen.getByTestId(SELECTED_VISIT_ID);
    const sidePanelIsOpen = screen.getByTestId(SIDE_PANEL_IS_OPEN);

    expect(selectedVirtualAppId.textContent).toBe('');
    expect(sidePanelIsOpen.textContent).toBe('false');

    await user.click(screen.getByTestId(OPEN_BUTTON));

    expect(selectedVirtualAppId.textContent).toBe('6');
    expect(sidePanelIsOpen.textContent).toBe('true');
  });

  it('should close the side-panel when close button is clicked', async () => {
    const { user } = setup();
    const sidePanelIsOpen = screen.getByTestId(SIDE_PANEL_IS_OPEN);

    await user.click(screen.getByTestId(OPEN_BUTTON));

    await user.click(screen.getByTestId(CLOSE_BUTTON));
    expect(sidePanelIsOpen.textContent).toBe('false');
  });
});
