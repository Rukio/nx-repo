import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button, TodayIcon } from '@*company-data-covered*/design-system';
import { PatientLike, useSnackbar } from '@*company-data-covered*/caremanager/utils';
import { useDuplicateEpisodeLatestVisit } from '@*company-data-covered*/caremanager/data-access';
import { SchedulingModal } from './SchedulingModal';
import { testIds } from './SchedulingModal.testids';

interface Props {
  buttonText?: string;
  episodeId: string;
  marketId: string;
  patient: PatientLike & { addressStreet?: string };
  serviceLineId: string;
}

export const SchedulingModalButton: React.FC<Props> = ({
  buttonText = 'Schedule Visit',
  episodeId,
  marketId,
  patient,
  serviceLineId,
}) => {
  const [isModalOpen, setModalOpen] = useState(false);
  // TODO: Verify interactions with already set params
  const [searchParams, setSearchParams] = useSearchParams();
  const { showError } = useSnackbar();

  const { mutateAsync: duplicateEpisodeLatestVisit } =
    useDuplicateEpisodeLatestVisit();

  const handleButtonClick = async () => {
    setModalOpen(true);

    if (!searchParams.get('careRequestId')) {
      try {
        const response = await duplicateEpisodeLatestVisit({
          episodeId: episodeId,
          body: {},
        });

        if (response.careRequestId) {
          setSearchParams(
            new URLSearchParams({
              careRequestId: `${response.careRequestId}`,
            })
          );
        }
      } catch (e) {
        showError(e as Response);
        setModalOpen(false);
      }
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
  };

  return (
    <>
      <Button
        color="primary"
        data-testid={testIds.OPEN_MODAL_BUTTON}
        onClick={handleButtonClick}
        startIcon={<TodayIcon />}
        variant="contained"
      >
        {buttonText}
      </Button>
      <SchedulingModal
        careRequestId={searchParams.get('careRequestId') ?? undefined}
        episodeId={episodeId}
        isOpen={isModalOpen}
        marketId={marketId}
        onClose={handleModalClose}
        patient={patient}
        serviceLineId={serviceLineId}
      />
    </>
  );
};
