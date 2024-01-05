import {
  AddIcon,
  Button,
  EditIcon,
  FormControl,
  Stack,
  TextField,
  Typography,
} from '@*company-data-covered*/design-system';
import { useCallback, useEffect, useState } from 'react';

type CMSFormProps = {
  cms?: string;
  isVerified: boolean;
  isUpdating: boolean;
  onSubmit: (cms: string) => Promise<unknown>;
};

export const CMSForm: React.FC<CMSFormProps> = ({
  cms,
  isVerified,
  isUpdating,
  onSubmit,
}) => {
  const [cmsInputValue, setCMSInputValue] = useState(cms ?? '');
  const [isEditingCMS, setIsEditingCMS] = useState(false);

  const resetCMSInput = useCallback(() => {
    setCMSInputValue(cms ?? '');
  }, [cms]);

  const startEditing = () => setIsEditingCMS(true);

  const handleCMSInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCMSInputValue(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    await onSubmit(cmsInputValue);

    setIsEditingCMS(false);
  };

  const handleCancel = () => {
    setIsEditingCMS(false);
    resetCMSInput();
  };

  useEffect(() => {
    resetCMSInput();
  }, [resetCMSInput]);

  if (isEditingCMS) {
    return (
      <Stack direction="row" component="form" onSubmit={handleSubmit}>
        <FormControl sx={{ marginRight: '16px' }}>
          <TextField
            variant="outlined"
            size="small"
            label="CMS"
            value={cmsInputValue}
            onChange={handleCMSInputChange}
            disabled={isUpdating || !isVerified}
            autoFocus
          />
        </FormControl>
        <Button
          type="submit"
          variant="text"
          color="primary"
          disabled={isUpdating || !isVerified}
        >
          Save
        </Button>
        <Button
          type="button"
          onClick={handleCancel}
          variant="text"
          color="error"
          disabled={isUpdating || !isVerified}
        >
          Cancel
        </Button>
      </Stack>
    );
  }

  return (
    <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
      {cms ? (
        <>
          <Typography variant="body2">{cms}</Typography>
          <Button
            variant="text"
            color="primary"
            startIcon={<EditIcon />}
            onClick={startEditing}
          >
            Edit
          </Button>
        </>
      ) : (
        <>
          <Typography variant="body2">Not Available</Typography>
          <Button
            variant="text"
            color="primary"
            startIcon={<AddIcon />}
            onClick={startEditing}
          >
            Add
          </Button>
        </>
      )}
    </Stack>
  );
};
