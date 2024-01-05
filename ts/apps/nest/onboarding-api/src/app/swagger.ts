import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/** Tag names for Swagger API documentation. */
export enum ApiTagsText {
  RiskAssessments = 'Risk Assessments',
  ServiceLines = 'Service Lines',
  SecondaryScreening = 'Secondary Screenings',
  Note = 'Notes',
  Patient = 'Patient',
  EdRefusalQuestionnaires = 'ED Refusal Questionnaires',
  MarketAvailability = 'Market Availability',
  CareRequest = 'Care Request',
  RiskStratificationProtocols = 'Risk Stratification Protocols',
  Insurances = 'Insurances',
  InsurancePlans = 'Insurance Plans',
  ChannelItems = 'Channel Items',
  CreditCard = 'Credit Card',
  Symptoms = 'Symptoms',
  MPOAConsents = 'MPOA Consents',
  Providers = 'Providers',
  AssignTeam = 'Assign Team',
  PlacesOfServiceBillingCity = 'Places Of Service',
  User = 'User',
  PartnerLines = 'Partner Lines',
  Markets = 'Markets',
  InformedRequestors = 'Informed Requestors',
  ClientConfig = 'Client Config',
  ShiftTeams = 'Shift Teams',
  HealthCheck = 'Health Check',
  CareManager = 'Care Manager',
  RiskStratification = 'Risk Stratification',
  States = 'States',
  InsuranceNetworks = 'Insurance Networks',
  SelfSchedule = 'Self Schedule',
  PatientAccounts = 'Patient Accounts',
}

/**
 * Initializes Swagger for creating and hosting API documentation.
 *
 * @param app The Nest application object.
 */
export function setupApiDocumentation(app: INestApplication) {
  // build API document config
  const config = new DocumentBuilder()
    .setTitle('Onboarding API')
    .setDescription(
      'The Onboarding API is a RESTful API that is used by assisted onboarding and web request(in future) applications.'
    )
    .setVersion('0.0.1')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: `JWT Authorization header using the bearer scheme. Do not add "bearer" in front of token - that is already handled.`,
    })
    .addTag(
      ApiTagsText.RiskAssessments,
      'Handles requests relating to risk assessment of care requests for patients.'
    )
    .build();

  // create swagger document
  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api', app, document, {
    customSiteTitle: 'Onboarding API',
    customCss: `
      div.topbar {
        display: none;
      }
    `,
  });
}
