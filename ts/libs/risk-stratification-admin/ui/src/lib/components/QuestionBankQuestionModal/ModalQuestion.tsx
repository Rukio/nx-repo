import { FC, ReactNode } from 'react';
import {
  makeSxStyles,
  TextField,
  TextFieldProps,
  Typography,
} from '@*company-data-covered*/design-system';

interface Props {
  title: string;
  label: ReactNode;
  value: TextFieldProps['value'];
  placeholder: TextFieldProps['label'];
  helperText?: TextFieldProps['helperText'];
  onChange: (newValue: string) => void;
}

const makeStyles = () =>
  makeSxStyles({
    input: { marginTop: 2, marginBottom: 1, width: '100%' },
  });

const ModalQuestion: FC<Props> = ({
  value,
  onChange,
  title,
  label,
  placeholder,
  helperText,
}) => {
  const styles = makeStyles();

  const handleOnChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  return (
    <>
      <Typography variant="body1">{title}</Typography>
      <Typography variant="body2">{label}</Typography>

      <TextField
        value={value}
        sx={styles.input}
        label={placeholder}
        helperText={helperText}
        onChange={handleOnChange}
      />
    </>
  );
};

export default ModalQuestion;
