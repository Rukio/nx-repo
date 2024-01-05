import {
  useGetUser,
  useSearchUsers,
  useUnassignOwnerFromServiceRequest,
  useUpdateServiceRequest,
} from '@*company-data-covered*/caremanager/data-access';
import { User } from '@*company-data-covered*/caremanager/data-access-types';
import {
  getAvatarInitials,
  getFullName,
} from '@*company-data-covered*/caremanager/utils';
import {
  Autocomplete,
  AutocompleteChangeReason,
  AutocompleteRenderInputParams,
  Avatar,
  Box,
  FormControl,
  Stack,
  TextField,
  Typography,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import { format } from 'date-fns';
import { useState } from 'react';
import { AccentSection } from './AccentSection';
import { DataRow } from './DataRow';

const styles = makeSxStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    padding: '16px',
  },
  avatar: {
    width: '40px',
    height: '40px',
    marginRight: '16px',
  },
});

const UserAvatar = ({ user }: { user: User }) => (
  <Avatar src={user.avatarUrl} sx={styles.avatar}>
    {getAvatarInitials(user.firstName, user.lastName)}
  </Avatar>
);

const UserOption = ({ user }: { user: User }) => {
  return (
    <>
      <UserAvatar user={user} />
      <Stack spacing={0}>
        <Typography variant="body2">{getFullName(user)}</Typography>
        <Typography
          variant="body2"
          color={(theme) => theme.palette.text.secondary}
        >
          {user.email}
        </Typography>
      </Stack>
    </>
  );
};

type Props = {
  serviceRequestId: string;
  ownerId?: string;
  updatedByUserId?: string;
  updatedAt?: string;
  rejectedAt?: string;
};

export const OwnershipDetails: React.FC<Props> = ({
  serviceRequestId,
  ownerId,
  updatedByUserId,
  updatedAt,
  rejectedAt,
}) => {
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const { data: owner } = useGetUser(ownerId ?? '');
  const { data: updatedByUser } = useGetUser(updatedByUserId ?? '');
  const { mutateAsync: updateServiceRequest } = useUpdateServiceRequest();
  const { mutateAsync: unassignOwner } =
    useUnassignOwnerFromServiceRequest(serviceRequestId);
  const { data } = useSearchUsers(userSearchTerm);

  const handleOwnerChange = (
    value: User | null,
    reason: AutocompleteChangeReason
  ) => {
    if (reason === 'clear') {
      return unassignOwner();
    }

    return (
      value &&
      updateServiceRequest({
        serviceRequestId,
        body: { assignedUserId: value.id },
      })
    );
  };

  const renderOption = (
    props: React.HTMLAttributes<HTMLLIElement>,
    option: User
  ) => (
    <Box component="li" {...props}>
      <UserOption user={option} />
    </Box>
  );

  const renderInput = (params: AutocompleteRenderInputParams) => {
    return (
      <TextField
        {...params}
        label={!owner ? 'Select an owner' : undefined}
        variant="outlined"
        InputProps={{
          ...params.InputProps,
          startAdornment: owner && userSearchTerm === getFullName(owner) && (
            <UserAvatar user={owner} />
          ),
        }}
        data-testid="owner-autocomplete"
      />
    );
  };

  const getLastUpdatedByText = () => {
    const userName = updatedByUser ? getFullName(updatedByUser) : 'Unknown';

    return updatedAt
      ? `${userName} - ${format(new Date(updatedAt), 'MM/dd/yyyy')}`
      : userName;
  };

  return (
    <AccentSection sx={styles.container}>
      <DataRow label="Assigned To">
        <FormControl fullWidth>
          <Autocomplete
            options={data?.users ?? []}
            getOptionLabel={(option) => getFullName(option)}
            isOptionEqualToValue={(option, value) => option.id === value?.id}
            value={owner ?? null}
            onChange={(_, option, reason) => handleOwnerChange(option, reason)}
            onInputChange={(_, value) => setUserSearchTerm(value)}
            renderOption={renderOption}
            renderInput={renderInput}
          />
        </FormControl>
      </DataRow>
      <DataRow label="Last Updated By">{getLastUpdatedByText()}</DataRow>
      {rejectedAt && (
        <DataRow label="Rejection Date">
          {format(new Date(rejectedAt), 'MM/dd/yyyy')}
        </DataRow>
      )}
    </AccentSection>
  );
};
