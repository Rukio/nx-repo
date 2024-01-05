import { FC } from 'react';
import { Box, Drawer, makeSxStyles } from '@*company-data-covered*/design-system';
import { VirtualAPPVisit } from '@*company-data-covered*/caremanager/data-access-types';
import {
  PatientInfoHeader,
  SIDE_PANEL_HEADER_MOCKED_DATA,
} from './PatientInfoHeader';
import { VisitTracker, MOCKED_VISITS } from './VisitTracker';
import { ClinicalSummary, MOCKED_CLINICAL_SUMMARY } from './ClinicalSummary';
import { EHR_APPOINTMENT_MOCK, EhrAppointment } from './EhrAppointment';
import { usePanelContext } from './SidePanelContext';
import { CareTeam } from '../CareTeam';
import { SIDE_PANEL_TEST_IDS } from './testIds';
import { VisitNotes } from './VisitNotes';

const styles = makeSxStyles({
  boxCareTeam: {
    borderBottomColor: (theme) => theme.palette.divider,
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    paddingY: 3,
  },
  sidePanel: {
    width: 480,
    mt: 8,
    pb: 8,
    boxShadow: '-2px 1px 4px 0px rgba(0, 0, 0, 0.08)',
  },
});

export interface SidePanelProps {
  virtualVisit: VirtualAPPVisit;
  isOpen: boolean;
  onClose?: () => void;
}

export const SidePanel: FC<SidePanelProps> = ({
  virtualVisit,
  isOpen,
  onClose,
}) => {
  const { selectedVisitId } = usePanelContext();

  return (
    <Drawer
      data-testid={SIDE_PANEL_TEST_IDS.CONTAINER}
      anchor="right"
      open={isOpen}
      variant="persistent"
      PaperProps={{ sx: styles.sidePanel }}
    >
      <PatientInfoHeader onClose={onClose} {...SIDE_PANEL_HEADER_MOCKED_DATA} />
      <Box padding={2}>
        {selectedVisitId}
        <VisitTracker visits={MOCKED_VISITS} />
        <ClinicalSummary {...MOCKED_CLINICAL_SUMMARY} />
        <EhrAppointment {...EHR_APPOINTMENT_MOCK} />
        <Box sx={styles.boxCareTeam}>
          <CareTeam
            carName={virtualVisit.visit?.carName || ''}
            firstName={virtualVisit.visit?.careRequestId || ''} // TODO: fetch shift team by care request id
            lastName={virtualVisit.visit?.careRequestId || ''} // TODO: fetch shift team by care request id
            phoneNumber={virtualVisit.visit?.careRequestId || ''} // TODO: fetch shift team by care request id
          />
        </Box>
        <VisitNotes />
      </Box>
    </Drawer>
  );
};
