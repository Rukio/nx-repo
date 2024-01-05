import { HttpStatus, Injectable } from '@nestjs/common';
import { isAxiosError } from '@nestjs/terminus/dist/utils';
import { ConsentCapturesQuery } from './types/consent-captures-query';
import { ConsentDefinitionsQuery } from './types/consent-definition-query';
import { CaravanRequester } from './caravan.requester';
import {
  CreateCaravanCapture,
  CaravanConsentCapture,
} from './types/caravan.capture';
import { CaravanConsentDefinition } from './types/caravan.definition';
import { CaravanConsentOptions } from './types/caravan.consent-options';

@Injectable()
export class CaravanConsentsAdapter {
  private readonly BASE_PATH = '/consents';

  constructor(private requester: CaravanRequester) {}

  async getDefinitions({
    active = true,
    signerIds,
    state,
    serviceLine,
    languageId,
  }: ConsentDefinitionsQuery): Promise<CaravanConsentDefinition[]> {
    {
      let path = `${this.BASE_PATH}/api/definitions?active=${active}&state=${state}&service_line=${serviceLine}&language_id=${languageId}`;

      if (signerIds) {
        const formattedSignerIds = signerIds.join(',');

        path += `&signer_ids=${formattedSignerIds}`;
      }

      try {
        const response = await this.requester.executeCaravanRequest<
          CaravanConsentDefinition[]
        >(path, {
          method: 'GET',
        });

        return response.data;
      } catch (error) {
        if (error && isAxiosError(error) && error.response) {
          if (error.response.status === HttpStatus.NOT_FOUND) {
            return [];
          }
        }

        throw error;
      }
    }
  }

  async getCaptures({
    patientId,
    visitId,
    episodeId,
    serviceLine,
  }: ConsentCapturesQuery): Promise<CaravanConsentCapture[]> {
    const path = `${this.BASE_PATH}/api/captures?patient_id=${patientId}&visit_id=${visitId}&episode_id=${episodeId}&service_line=${serviceLine}`;

    try {
      const response = await this.requester.executeCaravanRequest<
        CaravanConsentCapture[]
      >(path, {
        method: 'GET',
      });

      return response.data;
    } catch (error) {
      if (error && isAxiosError(error) && error.response) {
        if (error.response.status === HttpStatus.NOT_FOUND) {
          return [];
        }
      }

      throw error;
    }
  }

  async createCapture(capture: CreateCaravanCapture) {
    const data = { capture };

    const path = `${this.BASE_PATH}/api/captures`;

    const response =
      await this.requester.executeCaravanRequest<CaravanConsentCapture>(path, {
        method: 'POST',
        data,
      });

    return response.data;
  }

  /** Retrieves options relating to consents. */
  async getOptions(): Promise<CaravanConsentOptions> {
    const path = `${this.BASE_PATH}/api/options`;

    const response =
      await this.requester.executeCaravanRequest<CaravanConsentOptions>(path, {
        method: 'GET',
      });

    return response.data;
  }
}
