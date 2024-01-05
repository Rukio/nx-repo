import { Injectable, NotFoundException } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { CaravanAdapter } from '../caravan/caravan.adapter';
import { CareRequestRepository } from '../care-request/care-request.repository';
import { DashboardService } from '../dashboard/dashboard.service';
import { Capture } from './domain/capture';
import { Definition } from './domain/definition';
import { SignedConsentDto, ConsentType } from './dto/consent.dto';
import { ConsentCapturesQuery } from '../caravan/types/consent-captures-query';
import { ConsentDefinitionsQuery } from '../caravan/types/consent-definition-query';
import { Options } from './domain/options';

@Injectable()
export class ConsentsRepository {
  constructor(
    private careRequestRepository: CareRequestRepository,
    private dashboard: DashboardService,
    private caravan: CaravanAdapter
  ) {}

  async applySignedConsent(careRequestId: number, consent: SignedConsentDto) {
    const careRequest = await this.careRequestRepository.getById(careRequestId);

    if (!careRequest) {
      throw new NotFoundException(
        `Care request not found. Unable to apply consent.`
      );
    }

    await this.dashboard.applyPatientMedicationHistoryConsent(
      careRequest.patientId,
      consent
    );
  }

  async getConsentStatusByType(careRequestId: number, type: ConsentType) {
    const careRequest = await this.careRequestRepository.getById(careRequestId);

    if (!careRequest) {
      throw new NotFoundException(
        `Care request not found. Unable to get patient consent for ${type}.`
      );
    }

    if (type === ConsentType.MEDICATION_HISTORY_AUTHORITY) {
      return this.dashboard.getPatientMedicationHistoryConsentStatus(
        careRequest.patientId
      );
    } else {
      throw new Error(`Unknown ConsentType: ${type}`);
    }
  }

  /** Returns an array of consent definitions. */
  async getDefinitions(query: ConsentDefinitionsQuery): Promise<Definition[]> {
    const caravanDefinitions = await this.caravan.consents.getDefinitions(
      query
    );

    return caravanDefinitions.map((d) => plainToClass(Definition, d));
  }

  /** Returns an array of consent captures. */
  async getCaptures(query: ConsentCapturesQuery): Promise<Capture[]> {
    const caravanCaptures = await this.caravan.consents.getCaptures(query);

    return caravanCaptures.map((d) => plainToClass(Capture, d));
  }

  /** Creates a consent capture. */
  async createCapture(
    captureInfo: Omit<Capture, 'id' | 'signatureImage'>,
    signatureImage: Express.Multer.File
  ): Promise<void> {
    const base64SignatureImage = `data:${
      signatureImage.mimetype
    };base64,${signatureImage.buffer.toString('base64')}`;

    await this.caravan.consents.createCapture({
      definition_id: captureInfo.definitionId,
      episode_id: captureInfo.episodeId,
      patient_id: captureInfo.patientId,
      service_line: captureInfo.serviceLine,
      signer: captureInfo.signer,
      visit_id: captureInfo.visitId,
      signature_image: base64SignatureImage,
      document_image: null, // TODO: does this need to be specified?
      verbal: false, // TODO: does this need to be specified?
    });
  }

  /** Returns the consent options. */
  async getOptions(): Promise<Options> {
    const caravanOptions = await this.caravan.consents.getOptions();

    return plainToClass(Options, caravanOptions);
  }
}
