import { FC, useState } from 'react';
import {
  NavigateFunction,
  Link as RouterLink,
  useNavigate,
} from 'react-router-dom';
import {
  Box,
  IconButton,
  Link,
  MoreHorizIcon,
  TableCell,
  TableRow,
  Typography,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import { getParsedDate } from '@*company-data-covered*/caremanager/utils';
import {
  useDeleteTaskTemplate,
  useGetUsers,
} from '@*company-data-covered*/caremanager/data-access';
import { User } from '@*company-data-covered*/caremanager/data-access-types';
import { GenericMenu } from '@*company-data-covered*/caremanager/ui';
import DeleteTemplateModal from './DeleteTemplateModal';

const styles = makeSxStyles({
  mobileCell: { position: 'relative' },
  mobileTitle: { paddingRight: 5 },
  mobileEditButton: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  link: { textDecoration: 'none', fontWeight: 700 },
  textPrimary: { color: (theme) => theme.palette.text.primary },
  textSecondary: { color: (theme) => theme.palette.text.secondary },
  deleteOption: { color: (theme) => theme.palette.error.main },
});

interface EditButtonProps {
  templateId: string | undefined;
  handleOpenOptions: (event: React.MouseEvent<HTMLButtonElement>) => void;
  handleCloseOptions: () => void;
  handleSwitchDeleteModal: () => void;
  anchorEl: HTMLElement | null;
  navigate: NavigateFunction;
}

const EditButton: FC<EditButtonProps> = ({
  templateId,
  handleOpenOptions,
  handleCloseOptions,
  handleSwitchDeleteModal,
  navigate,
  anchorEl,
}) => (
  <>
    <IconButton
      data-testid={`task-template-more-button-${templateId}`}
      className="edit-icon"
      onClick={handleOpenOptions}
    >
      <MoreHorizIcon />
    </IconButton>
    <GenericMenu
      testIdPrefix="task-templates"
      anchorEl={anchorEl}
      menuPosition="left"
      onClose={handleCloseOptions}
      items={[
        {
          text: 'Edit',
          onClick: () =>
            navigate(`/settings/task-templates/${templateId}/edit`),
        },
        {
          text: 'Delete',
          styles: styles.deleteOption,
          onClick: handleSwitchDeleteModal,
        },
      ]}
    />
  </>
);

interface Props {
  isMobile: boolean;
  name?: string;
  templateId?: string;
  serviceLine?: string;
  carePhase?: string;
  summary?: string;
  /**
   * NOTE: This prop is only intended to exist while the user ids migration
   * takes place, should be deleted once it has been fully migrated
   */
  updatedByUserFallback?: User;
  updatedByUserId?: string;
  updatedAt?: Date | string;
}

const TemplateRow: FC<Props> = ({
  name,
  serviceLine,
  templateId,
  carePhase,
  summary,
  updatedByUserFallback,
  updatedByUserId,
  updatedAt,
  isMobile,
}) => {
  const { data: userData } = useGetUsers(
    updatedByUserId ? [updatedByUserId] : undefined
  );
  const updatedByUser = userData?.users[0] || updatedByUserFallback;
  const navigate = useNavigate();
  const linkProps = {
    to: `/settings/task-templates/${templateId}/edit`,
    component: RouterLink,
  };
  const { mutate: deleteTaskTemplate } = useDeleteTaskTemplate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const handleOpenOptions = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseOptions = () => {
    setAnchorEl(null);
  };

  const handleSwitchDeleteModal = () => {
    setIsOpen(!isOpen);
    setAnchorEl(null);
  };

  const handleDeleteTemplate = () => {
    if (templateId) {
      deleteTaskTemplate({ templateId });
      setIsOpen(false);
    }
  };

  return (
    <TableRow data-testid={`task-template-row-${templateId}`} key={name} hover>
      {isMobile ? (
        <TableCell sx={styles.mobileCell}>
          <Typography variant="subtitle2" sx={styles.mobileTitle}>
            <Link
              sx={styles.link}
              {...linkProps}
              data-testid={`task-template-link-${templateId}`}
            >
              {name}
            </Link>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {`${serviceLine}, ${carePhase}`}
          </Typography>
          <Box paddingTop={1}>{summary}</Box>
          <Box sx={styles.mobileEditButton}>
            <EditButton
              templateId={templateId}
              handleOpenOptions={handleOpenOptions}
              handleCloseOptions={handleCloseOptions}
              handleSwitchDeleteModal={handleSwitchDeleteModal}
              navigate={navigate}
              anchorEl={anchorEl}
            />
          </Box>
        </TableCell>
      ) : (
        <>
          <TableCell align="left">
            <Link
              sx={styles.link}
              {...linkProps}
              data-testid={`task-template-link-${templateId}`}
            >
              {name}
            </Link>
          </TableCell>
          <TableCell
            data-testid={`task-template-serviceline-${templateId}`}
            align="left"
            sx={styles.textPrimary}
          >
            {serviceLine}
          </TableCell>
          <TableCell
            data-testid={`task-template-carephase-${templateId}`}
            align="left"
            sx={styles.textPrimary}
          >
            {carePhase}
          </TableCell>
          <TableCell
            data-testid={`task-template-summary-${templateId}`}
            align="left"
            sx={styles.textSecondary}
          >
            {summary}
          </TableCell>
          <TableCell align="left">
            {updatedByUser && (
              <Typography variant="body2" sx={styles.textPrimary}>
                {updatedByUser.firstName}
              </Typography>
            )}
            <Typography variant="body2" sx={styles.textSecondary}>
              on {getParsedDate(updatedAt as string)}
            </Typography>
          </TableCell>
          <TableCell align="right">
            <EditButton
              templateId={templateId}
              handleOpenOptions={handleOpenOptions}
              handleCloseOptions={handleCloseOptions}
              handleSwitchDeleteModal={handleSwitchDeleteModal}
              navigate={navigate}
              anchorEl={anchorEl}
            />
          </TableCell>
        </>
      )}
      <DeleteTemplateModal
        isOpen={isOpen}
        onDeleteTemplate={handleDeleteTemplate}
        onClose={handleSwitchDeleteModal}
      />
    </TableRow>
  );
};

export default TemplateRow;
