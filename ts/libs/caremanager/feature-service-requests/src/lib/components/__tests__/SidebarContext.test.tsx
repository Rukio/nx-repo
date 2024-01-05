import { fireEvent, render, screen } from '@testing-library/react';
import { SidebarProvider, useSidebarContext } from '../SidebarContext';

const TestingSidebarComponent = () => {
  const {
    selectedRequestId,
    sidebarIsOpen,
    openSidebar,
    closeSidebar,
    clearSelectedRequestId,
  } = useSidebarContext();

  return (
    <>
      <button
        data-testid="open-sidebar-button"
        onClick={() => openSidebar?.('6')}
      ></button>
      <button
        data-testid="close-sidebar-button"
        onClick={closeSidebar}
      ></button>
      <button
        data-testid="clear-selected-button"
        onClick={clearSelectedRequestId}
      ></button>
      <p data-testid="selected-request-id">{selectedRequestId}</p>
      <p data-testid="sidebar-is-open">{sidebarIsOpen?.toString()}</p>
    </>
  );
};

const setup = () => {
  render(
    <SidebarProvider>
      <TestingSidebarComponent />
    </SidebarProvider>
  );
};

describe('SidebarContext', () => {
  it('should show the selected request id', () => {
    setup();
    const selectedRequestId = screen.getByTestId('selected-request-id');
    expect(selectedRequestId.textContent).toBe('');

    fireEvent.click(screen.getByTestId('open-sidebar-button'));
    expect(selectedRequestId.textContent).toBe('6');
  });

  it('should show that the sidebar is open', () => {
    setup();
    const sidebarIsOpen = screen.getByTestId('sidebar-is-open');
    expect(sidebarIsOpen.textContent).toBe('false');

    fireEvent.click(screen.getByTestId('open-sidebar-button'));
    expect(sidebarIsOpen.textContent).toBe('true');
  });

  it('should show that the sidebar is closed', () => {
    setup();
    const sidebarIsOpen = screen.getByTestId('sidebar-is-open');

    fireEvent.click(screen.getByTestId('open-sidebar-button'));
    expect(sidebarIsOpen.textContent).toBe('true');

    fireEvent.click(screen.getByTestId('close-sidebar-button'));
    expect(sidebarIsOpen.textContent).toBe('false');
  });

  it('should clear the selected request id', () => {
    setup();
    const selectedRequestId = screen.getByTestId('selected-request-id');

    fireEvent.click(screen.getByTestId('open-sidebar-button'));
    expect(selectedRequestId.textContent).toBe('6');

    fireEvent.click(screen.getByTestId('clear-selected-button'));
    expect(selectedRequestId.textContent).toBe('');
  });
});
