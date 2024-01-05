export interface CareRequestAPIResponse<Data> {
  error?: { message: string };
  data?: Data;
  success: boolean;
  statusCode?: number;
}
