import { CreateAddressForm } from '@*company-data-covered*/patient-portal/feature';
import { Page } from '@*company-data-covered*/patient-portal/ui';

export const CREATE_ADDRESS_TEST_ID_PREFIX = 'create-address';

export const AddressCreatePage = () => (
  <Page testIdPrefix={CREATE_ADDRESS_TEST_ID_PREFIX}>
    <CreateAddressForm />
  </Page>
);

export default AddressCreatePage;
