import { RouteMatcher } from 'cypress/types/net-stubbing';
import { Intercept } from '../../types/utils/intercept';

/**
 * Helper that spies and stubs network requests and response
 *  @param {Intercept.InterceptData} params - Function params
 *  @param {RouteMatcher} params.reqData - Param to change the behavior of how cy.intercept matches the incoming HTTP requests.
 *  @param {RespData} params.respData - Param to change the behavior of how cy.intercept stubs the incoming HTTP response.
 */
const intercept = ({ reqData, respData }: Intercept.InterceptData) => {
  if (respData?.fixture || typeof respData?.body !== 'undefined') {
    return cy.intercept(reqData, respData);
  }
  if (respData?.respOverride) {
    return cy.intercept(reqData, (req) => {
      req.reply((res) =>
        res.send(Cypress._.merge(res.body, respData?.respOverride))
      );
    });
  }

  return cy.intercept(reqData);
};

let BASE_PATH = '/api/';
/**
 * Helper that sets the base url path for all intercepts.
 *  @param {string} path - Base url path for the given project
 */
const setBasePath = (path: string) => {
  BASE_PATH = path;
};

/**
 * Helper that determines the behavior of how cy.intercept matches the incoming HTTP requests.
 *  @param {Intercept.ReqData} params - Function params
 *  @param {string} params.basePath - Base url path for the given project, usually pre-set by "setBasePath"
 *  @param {string} params.pathname - HTTP request path
 *  @param {string} params.options - Additional param to change the default behavior of cy.intercept route matching
 *  @returns {RouteMatcher} Request object used by the "intercept" method to match incoming HTTP requests.
 */
const getRequestObject = ({
  basePath = BASE_PATH,
  pathname,
  ...options
}: Intercept.ReqData): RouteMatcher => ({
  ...(pathname && { pathname: `${basePath}${pathname}` }),
  ...options,
});

function getGETRequestObject(
  options: Partial<Omit<Intercept.ReqData, 'method'>>
) {
  return getRequestObject({
    method: 'GET',
    ...options,
  });
}

function getPOSTRequestObject(
  options: Partial<Omit<Intercept.ReqData, 'method'>>
) {
  return getRequestObject({
    method: 'POST',
    ...options,
  });
}

function getPATCHRequestObject(
  options: Partial<Omit<Intercept.ReqData, 'method'>>
) {
  return getRequestObject({
    method: 'PATCH',
    ...options,
  });
}

function getPUTRequestObject(
  options: Partial<Omit<Intercept.ReqData, 'method'>>
) {
  return getRequestObject({
    method: 'PUT',
    ...options,
  });
}

function getDELETERequestObject(
  options: Partial<Omit<Intercept.ReqData, 'method'>>
) {
  return getRequestObject({
    method: 'DELETE',
    ...options,
  });
}

/**
 * Helper that determines the behavior of how cy.intercept stubs the incoming HTTP requests.
 *  @param {Intercept.RespData} params - Function params
 *  @param {StaticResponse} params.resp - Object that statically defines (stubs) a response.
 *  @param {Record<string, unknown>} params.respOverride - Object that statically stubs part of a response
 *  @returns {Intercept.RespData} Response object used by the "intercept" method to stub incoming HTTP requests.
 */
const getResponseObject = (
  response: Intercept.RespData
): Intercept.RespData => {
  const { respOverride, fixture, ...rest } = response;

  return {
    respOverride,
    ...(!!fixture && { fixture: `apiResp/${fixture}` }),
    ...rest,
  };
};

export {
  intercept,
  setBasePath,
  getRequestObject,
  getGETRequestObject,
  getPOSTRequestObject,
  getPATCHRequestObject,
  getPUTRequestObject,
  getDELETERequestObject,
  getResponseObject,
};
