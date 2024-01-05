import { FC, memo } from 'react';
import {
  Skeleton,
  TableCell,
  TableRow,
  makeSxStyles,
} from '@*company-data-covered*/design-system';

const styles = makeSxStyles({
  cell1: { verticalAlign: 'top', width: '20%' },
  cell2: { verticalAlign: 'top', width: '15%' },
  cell3: { verticalAlign: 'top', width: '25%' },
  cell4: { verticalAlign: 'top', width: '25%' },
  cell5: { verticalAlign: 'top', width: '15%' },
  skeleton: { mb: 0.25 },
  skeletonVariant: { mb: 2 },
});

type SkeletonRowsProps = {
  rowsPerPage: number;
  isMobile: boolean;
};

const SkeletonBlock = () => (
  <>
    <Skeleton
      variant="rectangular"
      width="100%"
      height="18"
      sx={styles.skeleton}
    />
    <Skeleton
      variant="rectangular"
      width="100%"
      height="18"
      sx={styles.skeleton}
    />
    <Skeleton
      variant="rectangular"
      width="100%"
      height="18"
      sx={styles.skeleton}
    />
  </>
);

const MobileSkeletonBlock = () => (
  <>
    <Skeleton
      variant="rectangular"
      width="50%"
      height="18"
      sx={styles.skeleton}
    />
    <Skeleton
      variant="rectangular"
      width="70%"
      height="18"
      sx={styles.skeletonVariant}
    />
    <Skeleton
      variant="rectangular"
      width="100%"
      height="18"
      sx={styles.skeleton}
    />
    <Skeleton
      variant="rectangular"
      width="100%"
      height="18"
      sx={styles.skeleton}
    />
  </>
);

const SkeletonRow: FC<{ isMobile: boolean }> = ({ isMobile }) => (
  <TableRow hover data-testid="episodes-table-skeleton">
    {isMobile ? (
      <TableCell>
        <MobileSkeletonBlock />
      </TableCell>
    ) : (
      <>
        <TableCell sx={styles.cell1}>
          <SkeletonBlock />
        </TableCell>
        <TableCell sx={styles.cell2}>
          <SkeletonBlock />
        </TableCell>
        <TableCell sx={styles.cell3}>
          <SkeletonBlock />
        </TableCell>
        <TableCell sx={styles.cell4}>
          <SkeletonBlock />
        </TableCell>
        <TableCell sx={styles.cell5}>
          <SkeletonBlock />
        </TableCell>
      </>
    )}
  </TableRow>
);

const SkeletonRows: FC<SkeletonRowsProps> = memo(
  ({ rowsPerPage, isMobile }) => (
    <>
      {Array(rowsPerPage)
        .fill(0)
        .map((_, i) => {
          const key = `skeleton-key-${i}`;

          return <SkeletonRow key={key} isMobile={isMobile} />;
        })}
    </>
  )
);

export default SkeletonRows;
