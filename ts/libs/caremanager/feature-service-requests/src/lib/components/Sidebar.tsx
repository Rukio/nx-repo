import { Drawer, makeSxStyles } from '@*company-data-covered*/design-system';
import { useSidebarContext } from './SidebarContext';
import { ServiceRequestDetails } from './ServiceRequestDetails';

const styles = makeSxStyles({
  sidebarPaper: {
    marginTop: 8,
    width: 480,
    boxShadow: '-2px 1px 4px 0px rgba(0, 0, 0, 0.08)',
  },
});

export const Sidebar = () => {
  const {
    sidebarIsOpen,
    selectedRequestId,
    closeSidebar,
    clearSelectedRequestId,
  } = useSidebarContext();

  return (
    <Drawer
      anchor="right"
      open={sidebarIsOpen}
      variant="persistent"
      onClose={closeSidebar}
      onAnimationEnd={() => !sidebarIsOpen && clearSelectedRequestId?.()}
      PaperProps={{ sx: styles.sidebarPaper }}
    >
      {selectedRequestId && (
        <ServiceRequestDetails
          serviceRequestId={selectedRequestId}
          onClose={closeSidebar}
        />
      )}
    </Drawer>
  );
};
