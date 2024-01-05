import { Link as RouterLink } from 'react-router-dom';
import { all, isEmpty, isNil } from 'rambda';
import {
  Link,
  Stack,
  SxStylesValue,
  TableCell,
  Typography,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import {
  calculateAge,
  formattedDOB,
  getFullName,
  sexStringToChar,
} from '@*company-data-covered*/caremanager/utils';
import { Patient } from '@*company-data-covered*/caremanager/data-access-types';

const styles = makeSxStyles({
  link: { textDecoration: 'none' },
});

type Props = {
  episodeId: string;
  patient: Patient;
  containerStyles: SxStylesValue;
};

const PatientCell = ({
  episodeId,
  patient: {
    firstName,
    middleName,
    lastName,
    sex,
    dateOfBirth,
    addressStreet,
    addressCity,
    addressState,
    addressZipcode,
    phoneNumber,
    id,
  },
  containerStyles,
}: Props) => {
  const age = calculateAge(dateOfBirth);
  const linkProps = {
    to: `/episodes/${episodeId}/overview`,
    component: RouterLink,
  };
  const address = [addressStreet, addressCity, addressState, addressZipcode];
  const valueOrDash = (value?: string) =>
    isNil(value) || isEmpty(value) ? '-' : value;

  return (
    <TableCell data-testid={`patient-details-cell-${id}`} sx={containerStyles}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={{ xs: 0, md: 1 }}>
        <Typography variant="subtitle2" color="text.primary">
          <Link
            sx={styles.link}
            {...linkProps}
            data-testid={`patient-details-link-${id}`}
          >
            {getFullName({ firstName, middleName, lastName })}
          </Link>
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {`${age}yo ${sexStringToChar(sex)}`}
        </Typography>
      </Stack>
      <Typography variant="body2">{formattedDOB(dateOfBirth)}</Typography>
      <Typography variant="body2" color="text.secondary">
        {all(isEmpty, address) || all(isNil, address)
          ? '--'
          : `${valueOrDash(addressStreet)} ${valueOrDash(
              addressCity
            )}, ${valueOrDash(addressState)} ${valueOrDash(addressZipcode)}`}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {phoneNumber}
      </Typography>
    </TableCell>
  );
};

export default PatientCell;
