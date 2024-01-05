import { useState } from 'react';
import { useGetServiceRequestStatus } from '@*company-data-covered*/caremanager/data-access';
import {
  Chip,
  FormControl,
  FormControlLabel,
  FormLabel,
  Menu,
  Radio,
  RadioGroup,
  makeSxStyles,
} from '@*company-data-covered*/design-system';

const styles = makeSxStyles({
  container: {
    color: (theme) => theme.palette.primary.main,
  },
  menu: {
    paddingX: 2,
    paddingTop: 1,
  },
});

type Props = {
  statusId: string | null;
  setStatusId: (id: string) => void;
};

export const StatusIdFilter = ({ statusId, setStatusId }: Props) => {
  const { data } = useGetServiceRequestStatus();
  const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>();
  const [menuIsOpen, setMenuIsOpen] = useState(false);

  return data ? (
    <>
      <Chip
        variant="outlined"
        label={data.list.find((s) => s.id === statusId)?.name}
        sx={styles.container}
        ref={(el) => el !== anchorEl && setAnchorEl(el)}
        onClick={() => setMenuIsOpen(true)}
        data-testid="service-request-status-filter"
      />
      {anchorEl && (
        <Menu
          open={menuIsOpen}
          onClose={() => setMenuIsOpen(false)}
          anchorEl={anchorEl}
        >
          <FormControl sx={styles.menu}>
            <FormLabel>Select a status</FormLabel>
            <RadioGroup
              value={statusId || undefined}
              onChange={(e) => {
                setStatusId(e.target.value);
                setMenuIsOpen(false);
              }}
            >
              {data.list
                .filter((status) => status.isActive)
                .map((status) => (
                  <FormControlLabel
                    key={status.id}
                    value={status.id}
                    control={
                      <Radio
                        data-testid={`service-request-status-filter-${status.id}`}
                      />
                    }
                    label={status.name}
                  />
                ))}
            </RadioGroup>
          </FormControl>
        </Menu>
      )}
    </>
  ) : null;
};
