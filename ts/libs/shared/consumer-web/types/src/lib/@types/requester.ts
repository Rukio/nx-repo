export interface Requester {
  id?: number;
  relationToPatient: string;
  firstName: string;
  lastName: string;
  phone: string;
  dhPhone: string;
  conversationId: string;
  organizationName?: string;
}
