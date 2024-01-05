import { BadRequestException, Injectable } from '@nestjs/common';
import { CompanionConsentsTask } from '../tasks/models/companion-task';
import { CareRequestRepository } from '../care-request/care-request.repository';
import { CompanionLinkNotFoundException } from '../companion/common';
import { CompanionService } from '../companion/companion.service';
import { CompanionLinkWithTasks } from '../companion/interfaces/companion-link.interface';
import { DashboardService } from '../dashboard/dashboard.service';
import { ConsentsRepository } from './consents.repository';
import { ConsentDefinitionLanguage, Definition } from './domain/definition';
import { Logger } from 'winston';
import { InjectLogger } from '../logger/logger.decorator';

class MissingServiceLineError extends BadRequestException {
  constructor() {
    super('Care request must have a valid service line.');
  }
}

@Injectable()
export class ConsentsService {
  constructor(
    private careRequestsRepository: CareRequestRepository,
    private consentsRepository: ConsentsRepository,
    private companionService: CompanionService,
    private dashboard: DashboardService,
    @InjectLogger() private logger: Logger
  ) {}

  /**
   * Returns an array of consent definitions given a companion link.
   *
   * @param link The companion link for which to retrieve consent definitions.
   * @param incomplete If true, the definitions that will be filtered against existing, valid captures to only definitions that need to be completed
   */
  async getDefinitionsForCompanionLink(
    link: CompanionLinkWithTasks,
    signerId: string,
    incomplete = false
  ): Promise<Definition[]> {
    const { careRequestId } = link;
    const careRequest = await this.careRequestsRepository.getByIdWithError(
      careRequestId
    );

    const { serviceLine } = careRequest;

    if (!serviceLine) {
      throw new MissingServiceLineError();
    }

    let definitions = await this.consentsRepository.getDefinitions({
      active: true,
      serviceLine: serviceLine.id,
      state: careRequest.state,
      languageId: ConsentDefinitionLanguage.ENGLISH,
      signerIds: [signerId],
    });

    if (incomplete) {
      const captures = await this.consentsRepository.getCaptures({
        patientId: careRequest.patientId,
        visitId: careRequest.id,
        episodeId: careRequest.id,
        serviceLine: serviceLine.id,
      });
      const captureDefinitionIds = captures.map((c) => c.definitionId);

      definitions = definitions.filter(
        (d) => !captureDefinitionIds.includes(d.id)
      );
    }

    return definitions;
  }

  /**
   * Creates a consent capture for a given companion link.
   */
  async createCaptureForCompanionLink(
    link: CompanionLinkWithTasks,
    definitionId: number,
    signer: string,
    signatureImage: Express.Multer.File
  ): Promise<void> {
    const { careRequestId } = link;
    const careRequest = await this.careRequestsRepository.getByIdWithError(
      careRequestId
    );

    const { serviceLine } = careRequest;

    if (!serviceLine) {
      throw new MissingServiceLineError();
    }

    await this.consentsRepository.createCapture(
      {
        definitionId,
        episodeId: careRequest.id.toString(),
        visitId: careRequest.id.toString(),
        patientId: careRequest.patientId.toString(),
        serviceLine: serviceLine.id.toString(),
        signer: signer,
        verbal: false,
      },
      signatureImage
    );
  }

  async applySignedConsents(task: CompanionConsentsTask) {
    const link = await this.companionService.findLinkById(task.companionLinkId);

    if (!link) {
      throw new CompanionLinkNotFoundException();
    }

    const areRequiredConsentsSigned = await this.areRequiredConsentsSigned(
      task,
      link.careRequestId
    );

    if (areRequiredConsentsSigned) {
      this.dashboard.applySignedConsents(link.careRequestId);
      this.logger.debug(`Applied signed consents`, {
        linkId: task.companionLinkId,
      });
    }
  }

  private async areRequiredConsentsSigned(
    task: CompanionConsentsTask,
    careRequestId: number
  ) {
    const { completedDefinitionIds } = task.metadata;
    const requiredDefinitionIds = await this.requiredDefinitionIds(
      careRequestId
    );

    return requiredDefinitionIds.every((requiredDefinitionId) =>
      completedDefinitionIds.includes(requiredDefinitionId)
    );
  }

  private async requiredCategoryIds() {
    const { categories } = await this.consentsRepository.getOptions();

    return categories.reduce<number[]>((requiredCategoryIds, category) => {
      if (category.required) {
        requiredCategoryIds.push(category.id);
      }

      return requiredCategoryIds;
    }, []);
  }

  private async requiredDefinitionIds(careRequestId: number) {
    const careRequest = await this.careRequestsRepository.getByIdWithError(
      careRequestId
    );

    const { serviceLine } = careRequest;

    if (!serviceLine) {
      throw new MissingServiceLineError();
    }

    const consentDefinitions = await this.consentsRepository.getDefinitions({
      active: true,
      serviceLine: serviceLine.id,
      state: careRequest.state,
      languageId: ConsentDefinitionLanguage.ENGLISH,
    });

    const requiredCategoryIds = await this.requiredCategoryIds();

    return consentDefinitions.reduce<number[]>((definitionIds, definition) => {
      if (requiredCategoryIds.includes(definition.categoryId)) {
        definitionIds.push(definition.id);
      }

      return definitionIds;
    }, []);
  }
}
