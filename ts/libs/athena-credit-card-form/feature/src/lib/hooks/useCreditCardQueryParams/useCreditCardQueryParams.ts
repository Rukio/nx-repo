import { useSearchParams } from 'react-router-dom';

export type CreditCardQueryParams = {
  departmentId: string | null;
  patientId: string | null;
  amount: string | null;
};

const useCreditCardQueryParams = (): CreditCardQueryParams => {
  const [searchParams] = useSearchParams();

  return {
    departmentId: searchParams.get('departmentId'),
    patientId: searchParams.get('patientId'),
    amount: searchParams.get('amount'),
  };
};

export default useCreditCardQueryParams;
