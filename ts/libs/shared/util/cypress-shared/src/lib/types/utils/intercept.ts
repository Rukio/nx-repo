import {
  RouteMatcher,
  RouteMatcherOptions,
  StaticResponse,
} from 'cypress/types/net-stubbing';
import { HttpMethod } from './httpMethod';

export declare namespace Intercept {
  type InterceptData = {
    reqData: RouteMatcher;
    respData?: RespData;
  };

  type ReqData = RouteMatcherOptions & {
    basePath?: string;
    method: HttpMethod;
  };

  type RespData = {
    respOverride?: Record<string, unknown>;
    fixture?: string;
  } & StaticResponse;
}
