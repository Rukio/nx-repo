import { FC } from 'react';
import { List } from '@*company-data-covered*/design-system';
import { UserItem } from '../UserItem';

interface Props {
  ids: string[];
}

export const UserList: FC<Props> = ({ ids }) => (
  <List disablePadding>
    {ids.map((id) => (
      <UserItem id={id} key={id} />
    ))}
  </List>
);
