import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/** Tag names for Swagger API documentation. */
export enum ApiTagsText {
  Companion = 'Companion',
  Consents = 'Consents',
  ClinicalProviders = 'Clinical Providers',
  Identification = 'Identification',
  Health = 'Health Check',
  Insurances = 'Insurances',
  PCP = 'PCP',
  Pharmacies = 'Pharmacies',
  SocialHistory = 'Social History',
  Tasks = 'Tasks',
  Twilio = 'Twilio',
}

/**
 * Initializes Swagger for creating and hosting API documentation.
 *
 * @param app The Nest application object.
 */
export function setupApiDocumentation(app: INestApplication) {
  // build API document config
  const config = new DocumentBuilder()
    .setTitle('Companion API')
    .setDescription(
      'The Companion API is a RESTful API that is used by the Companion experience front-end application.'
    )
    .setVersion('1.0.0')
    // ! keep tags in alphabetical order so documentation groups appear alphabetically
    .addTag(
      ApiTagsText.Companion,
      'Handles requests relating to the companion experience.'
    )
    .addTag(ApiTagsText.Consents, 'Handles requests relating to the consents.')
    .addTag(
      ApiTagsText.ClinicalProviders,
      'Handles requests relating to clinical providers information.'
    )
    .addTag(
      ApiTagsText.Identification,
      `Handles requests relating to patient identification.`
    )
    .addTag(ApiTagsText.Health, 'Handles dependency health checks.')
    .addTag(
      ApiTagsText.Identification,
      `Handles requests relating to patient identification.`
    )
    .addTag(
      ApiTagsText.Insurances,
      'Handles requests relating to patient insurances.'
    )
    .addTag(
      ApiTagsText.PCP,
      'Handles requests relating to primary care providers information.'
    )
    .addTag(
      ApiTagsText.Pharmacies,
      'Handles requests relating to Pharmacies information.'
    )
    .addTag(
      ApiTagsText.SocialHistory,
      'Handles requests relating to patient social history.'
    )
    .addTag(ApiTagsText.Tasks, 'Handles requests relating to Companion tasks.')
    .build();

  // create swagger document
  const document = SwaggerModule.createDocument(app, config);

  // host swagger documentation
  const apiDocumentationPath = 'documentation';

  SwaggerModule.setup(apiDocumentationPath, app, document, {
    customSiteTitle: 'Companion API',
    customCss: `
      div.topbar {
        display: none;
      }
    `,
  });
}
