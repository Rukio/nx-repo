import { FC, PropsWithChildren } from 'react';
import { List, makeSxStyles } from '@*company-data-covered*/design-system';
import { FORMATTED_LIST_TEST_IDS } from './testIds';

type FormattedListMakeStylesProps = {
  excludeLastNthItemDividers: number;
};

const makeStyles = ({
  excludeLastNthItemDividers,
}: FormattedListMakeStylesProps) => {
  const listChildrenSelector = `&>*:not(:nth-last-of-type(-n + ${excludeLastNthItemDividers}))`;

  return makeSxStyles({
    list: {
      [listChildrenSelector]: {
        paddingBottom: (theme) => theme.spacing(4),
        '&:after': (theme) => ({
          content: '""',
          borderTop: `1px solid ${theme.palette.divider}`,
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: theme.spacing(2),
        }),
      },
    },
  });
};
type Props = PropsWithChildren<{
  excludeLastNthItemDividers?: number;
  testIdPrefix: string;
}>;

const FormattedList: FC<Props> = ({
  children,
  excludeLastNthItemDividers = 1,
  testIdPrefix,
}) => {
  const styles = makeStyles({ excludeLastNthItemDividers });

  return (
    <List
      data-testid={FORMATTED_LIST_TEST_IDS.getListRootTestId(testIdPrefix)}
      disablePadding
      sx={styles.list}
    >
      {children}
    </List>
  );
};

export default FormattedList;
