import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
  PolicyServiceResult,
  QueryInput,
  QueryRequest,
  extractPolicyResult,
} from './policy.types';
import { PolicyActor } from '@*company-data-covered*/nest/auth';
import {
  PolicyModuleOptions,
  InjectPolicyOptions,
} from './policy.module-definition';

@Injectable()
export class PolicyService {
  private options: PolicyModuleOptions;
  private policyServiceURL: string | undefined;

  constructor(
    @InjectPolicyOptions() options: PolicyModuleOptions,
    private httpService: HttpService
  ) {
    this.options = options;
  }

  private get serviceURL() {
    if (!this.policyServiceURL) {
      this.policyServiceURL = `${this.options.policyServiceBaseUrl}/v1/query`;
    }

    return this.policyServiceURL;
  }

  // Allowed gives a single boolean result for a given policy, resource and actor.
  async allowed<R>(
    policy: string,
    actor: PolicyActor,
    resource?: R
  ): Promise<boolean> {
    const result = await this.checkPolicy<boolean, R>(policy, actor, resource);

    return !!result;
  }

  // CheckPolicy gives a single result for a given policy, resource and actor.
  async checkPolicy<T, R = undefined>(
    policy: string,
    actor: PolicyActor,
    resource?: R
  ): Promise<T | null> {
    const query = `result = data.policies.${policy}`;
    const input: QueryInput<R> = { actor: actor, resource: resource };
    const results = await this.queryPolicy<T, R>(query, input);

    return extractPolicyResult<T>(results);
  }

  async queryPolicy<T, R>(
    query: string,
    input: QueryInput<R>
  ): Promise<PolicyServiceResult<T>> {
    try {
      if (query.length == 0) {
        throw Error('no policy query specified');
      }

      const queryRequest: QueryRequest<R> = {
        query: query,
        input: input,
      };

      const response = await firstValueFrom(
        this.httpService.post(this.serviceURL, queryRequest, {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json;charset=UTF-8',
          },
        })
      );

      return response.data;
    } catch (error) {
      console.log(`Policy Service Error: ${error}`);

      return {};
    }
  }
}
