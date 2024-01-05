import { AddressPathParams } from '@*company-data-covered*/patient-portal/feature';
import { useParams } from 'react-router-dom';

export const AddressDetailsPage = () => {
  const { addressId } = useParams<AddressPathParams>();

  return <div>Editing address {addressId}</div>;
};

export default AddressDetailsPage;
