import { FC } from 'react';
import {
  Avatar,
  ListItemAvatar,
  ListItemText,
  Typography,
  makeSxStyles,
} from '@*company-data-covered*/design-system';

const styles = makeSxStyles({
  avatarStyle: {
    backgroundColor: '#BDBDBD',
    color: 'white',
    width: 24,
    height: 24,
    fontSize: 12,
  },
  listItemStyle: {
    paddingRight: '40px',
  },
  listItemTextStyle: {
    flexGrow: 0,
    flexShrink: 1,
    flexBasis: 'auto',
    paddingRight: '8px',
  },
  dateStyle: {
    color: 'text.secondary',
  },
});

type CompletedItemProps = {
  formattedDate: string;
  avatarInitials: string;
  id: number | string;
};
const CompletedItem: FC<CompletedItemProps> = ({
  formattedDate,
  avatarInitials,
  id,
}) => (
  <>
    <ListItemText sx={styles.listItemTextStyle}>
      <Typography
        variant="body2"
        sx={styles.dateStyle}
        data-testid={`completed-date-${id}`}
      >
        {formattedDate}
      </Typography>
    </ListItemText>
    <ListItemAvatar sx={styles.listItemStyle}>
      <Avatar sx={styles.avatarStyle} data-testid={`completed-avatar-${id}`}>
        {avatarInitials}
      </Avatar>
    </ListItemAvatar>
  </>
);

export default CompletedItem;
