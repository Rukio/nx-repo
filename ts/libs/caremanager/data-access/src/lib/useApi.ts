import {
  CareManagerServiceApi,
  Configuration,
} from '@*company-data-covered*/caremanager/data-access-types';
import { useAuth0Token } from '@*company-data-covered*/caremanager/utils-react';
import { environment } from './environments/environment';

const APIMemo: Record<string, CareManagerServiceApi> = {};

const getAPI = (token: string) => {
  if (APIMemo[token]) {
    return APIMemo[token];
  }

  APIMemo[token] = new CareManagerServiceApi(
    new Configuration({
      basePath: environment.apiUrl,
      headers: {
        Authorization: `Bearer ${token}`,
        Origin: window.location.origin,
      },
      accessToken: token,
    })
  );

  return APIMemo[token];
};

function useApi() {
  const token = useAuth0Token();
  const API = getAPI(token ?? '');

  return { API };
}

export default useApi;
