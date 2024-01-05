import { FC, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  EditIcon,
  Typography,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import { calculateDays, getFullName } from '@*company-data-covered*/caremanager/utils';
import { useGetServiceLines } from '@*company-data-covered*/caremanager/data-access';
import {
  Episode,
  Insurance,
  Patient,
  Visit,
} from '@*company-data-covered*/caremanager/data-access-types';
import { VisitDetailsUpdateModal } from './VisitDetailsUpdateModal';

const styles = makeSxStyles({
  item: {
    display: { xs: 'flex', md: 'block' },
    alignItems: 'center',
    mb: { xs: 0.5, md: 0 },
  },
  itemLabel: {
    ':after': {
      xs: {
        content: '":"',
      },
      md: {
        content: 'none',
      },
    },
    mr: {
      xs: 1,
      md: 0,
    },
  },
  titleContainer: {
    display: { xs: 'block', sm: 'flex' },
    gap: 2,
    mb: { xs: 2, md: 1 },
    alignItems: 'center',
  },
  titleSeparator: {
    display: { xs: 'none', sm: 'block' },
    borderRight: (theme) => `1px solid ${theme.palette.text.primary}`,
    mx: 1,
    height: 15,
  },
  itemsAndActionContainer: {
    display: { xs: 'block', sm: 'flex' },
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 2,
    mb: 2,
  },
  itemsContainer: {
    display: { xs: 'block', md: 'flex' },
    gap: 4,
    flexWrap: 'wrap',
    mb: { xs: 2, md: 0 },
  },
});

export const testIds = {
  VISIT_DETAILS_HEADER: 'visit-details-header',
  VISIT_DETAILS_HEADER_BUTTON: 'visit-details-header-button',
};

const Item: FC<{
  label: string;
  body: string;
}> = ({ label, body }) => (
  <Box sx={styles.item}>
    <Typography variant="overline" color="text.secondary" sx={styles.itemLabel}>
      {label}
    </Typography>
    <Typography variant="body2" lineHeight={1.1} textTransform="capitalize">
      {body}
    </Typography>
  </Box>
);

interface Props {
  episode: Episode;
  visit: Visit;
  patient: Patient;
  insurances?: Insurance[];
  visitTypeName?: string;
  isCall?: boolean;
}

const getPrimaryInsurance = (insurances?: Insurance[]) => {
  let primaryInsurance: Insurance | undefined;
  insurances?.forEach((insurance) => {
    if (!primaryInsurance || insurance.priority < primaryInsurance.priority) {
      primaryInsurance = insurance;
    }
  });

  return primaryInsurance;
};

export const Header: FC<Props> = ({
  episode,
  visit,
  patient,
  visitTypeName,
  insurances,
  isCall,
}) => {
  const [isVisitDetailsUpdateModalOpen, setVisitDetailsUpdateModalOpen] =
    useState(false);
  const { carePhase, admittedAt, dischargedAt, serviceLineId } = episode;
  const [getServiceLine] = useGetServiceLines();
  const serviceLine = getServiceLine(serviceLineId);

  const lengthOfStayText = `${calculateDays(
    new Date(admittedAt),
    dischargedAt ? new Date(dischargedAt) : undefined
  )}d`;

  const primaryInsurance = getPrimaryInsurance(insurances);

  return (
    <Box data-testid={testIds.VISIT_DETAILS_HEADER}>
      <Box sx={styles.titleContainer}>
        <Typography variant="h5">
          {patient ? getFullName(patient) : 'No patient found'}
        </Typography>
        <Box sx={styles.titleSeparator} />
        <Typography variant="h5" mb={{ xs: 1, sm: 0 }}>
          Visit ID {visit.id}
        </Typography>
        {episode.isWaiver && <Chip label="Waiver" size="small" color="info" />}
      </Box>
      <Box sx={styles.itemsAndActionContainer}>
        <Box sx={styles.itemsContainer}>
          <Item label="LOS" body={lengthOfStayText} />
          {primaryInsurance && (
            <Item label="Payer" body={primaryInsurance.name} />
          )}
          {serviceLine && !isCall && (
            <Item label="Service line" body={serviceLine.name} />
          )}
          {carePhase && <Item label="Care phase" body={carePhase.name} />}
          {visitTypeName && <Item label="Visit type" body={visitTypeName} />}
        </Box>
        <Button
          onClick={() => setVisitDetailsUpdateModalOpen(true)}
          startIcon={<EditIcon />}
          data-testid={testIds.VISIT_DETAILS_HEADER_BUTTON}
          variant="outlined"
        >
          Edit Visit Details
        </Button>
        <VisitDetailsUpdateModal
          isOpen={isVisitDetailsUpdateModalOpen}
          onClose={() => setVisitDetailsUpdateModalOpen(false)}
          visit={visit}
        />
      </Box>
    </Box>
  );
};
