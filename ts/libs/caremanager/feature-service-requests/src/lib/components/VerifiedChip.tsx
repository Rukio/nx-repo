import { Chip } from '@*company-data-covered*/design-system';

export const VerifiedChip: React.FC<{ isVerified?: boolean }> = ({
  isVerified,
}) => {
  return (
    <Chip
      label={isVerified ? 'Verified' : 'Unverified'}
      color={isVerified ? 'success' : 'warning'}
      size="small"
    />
  );
};
