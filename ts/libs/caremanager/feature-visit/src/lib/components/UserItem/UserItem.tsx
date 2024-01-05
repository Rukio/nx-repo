import { FC } from 'react';
import {
  Avatar,
  Box,
  ListItem,
  Skeleton,
  Typography,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import { useGetUser } from '@*company-data-covered*/caremanager/data-access';
import {
  getAvatarInitials,
  getFullName,
} from '@*company-data-covered*/caremanager/utils';

const styles = makeSxStyles({
  container: { paddingY: 0.725 },
  avatar: { width: 40 },
  skeleton1: { marginBottom: 0.5 },
});

const LoadingSkeleton = () => (
  <Box display="flex" gap={1.5} paddingBottom={0.5}>
    <Skeleton variant="circular" width={40} height={40} />
    <Box paddingTop={0.25}>
      <Skeleton
        variant="rectangular"
        width={120}
        height={16}
        sx={styles.skeleton1}
      />
      <Skeleton variant="rectangular" width={40} height={14} />
    </Box>
  </Box>
);

interface Props {
  id: string;
}

export const UserItem: FC<Props> = ({ id }) => {
  const { data: user } = useGetUser(id);

  return (
    <ListItem disableGutters sx={styles.container}>
      {user ? (
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar sx={styles.avatar} src={user.avatarUrl}>
            {getAvatarInitials(user.firstName, user.lastName)}
          </Avatar>
          <Box>
            <Typography variant="h7" mb={0} paragraph>
              {getFullName({
                firstName: user.firstName,
                lastName: user.lastName,
              })}
            </Typography>
            <Typography variant="label" color="text.secondary">
              {user.jobTitle}
            </Typography>
          </Box>
        </Box>
      ) : (
        <LoadingSkeleton />
      )}
    </ListItem>
  );
};
