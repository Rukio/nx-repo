import { SettingsListItem, type SettingsListItemProps } from '../SettingsList';
import { PATIENT_MENU_LIST_ITEM_SECTIONS_LABELS } from './constants';

export type PatientMenuListItemProps<Editable extends boolean> = Omit<
  SettingsListItemProps<Editable>,
  'onEdit' | 'onInfo'
> & {
  onEdit?: (sectionId: string) => void;
  onInfo?: (sectionId: string) => void;
  sectionId: string;
};

const PatientMenuListItem = <Editable extends boolean>({
  onEdit,
  onInfo,
  sectionId,
  ...props
}: PatientMenuListItemProps<Editable>) => (
  <SettingsListItem
    onEdit={() => onEdit?.(sectionId)}
    onInfo={() => onInfo?.(sectionId)}
    title={PATIENT_MENU_LIST_ITEM_SECTIONS_LABELS[sectionId]}
    {...props}
  />
);

export default PatientMenuListItem;
