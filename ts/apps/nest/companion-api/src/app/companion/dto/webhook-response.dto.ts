import { ApiProperty } from '@nestjs/swagger';

export enum WebhookResponseType {
  'CompanionNoOp' = 'COMPANION_NO_OP',
  'CompanionCreateLink' = 'CompanionCreateLink',
  'CompanionOnScene' = 'CompanionOnScene',
  'CompanionOnRoute' = 'CompanionOnRoute',
  'CompanionUpdatedEta' = 'CompanionUpdatedEta',
}

function ApiWebhookTypeProperty(example?: WebhookResponseType) {
  return ApiProperty({
    description:
      'The type of the webhook response which tells the consumer how the webhook was handled.',
    enum: WebhookResponseType,
    example: example ?? WebhookResponseType.CompanionCreateLink,
  });
}

interface WebhookResponseBase {
  type: WebhookResponseType;
}

interface IWebhookNoOpResponseDto extends WebhookResponseBase {
  type: WebhookResponseType.CompanionNoOp;
}

interface IWebhookCreateLinkResponseDto extends WebhookResponseBase {
  type: WebhookResponseType.CompanionCreateLink;
  linkId: string;
}

interface IWebhookOnSceneResponseDto extends WebhookResponseBase {
  type: WebhookResponseType.CompanionOnScene;
}

interface IWebhookOnRouteResponseDto extends WebhookResponseBase {
  type: WebhookResponseType.CompanionOnRoute;
}

interface IWebhookUpdatedEtaResponseDto extends WebhookResponseBase {
  type: WebhookResponseType.CompanionUpdatedEta;
}
export class WebhookNoOpResponseDto implements IWebhookNoOpResponseDto {
  @ApiWebhookTypeProperty()
  type: WebhookResponseType.CompanionNoOp;
}

export class WebhookCreateLinkResponseDto
  implements IWebhookCreateLinkResponseDto
{
  @ApiWebhookTypeProperty()
  type: WebhookResponseType.CompanionCreateLink;

  @ApiProperty({
    description: 'The unique identifier of the created Companion link.',
    example: '8a88c7ec-f6e5-4cbd-9d7e-fc8d150d50f1',
  })
  linkId: string;
}
export class WebhookOnSceneResponseDto implements IWebhookOnSceneResponseDto {
  @ApiWebhookTypeProperty(WebhookResponseType.CompanionOnScene)
  type: WebhookResponseType.CompanionOnScene;
}

export class WebhookOnRouteResponseDto implements IWebhookOnRouteResponseDto {
  @ApiWebhookTypeProperty(WebhookResponseType.CompanionOnRoute)
  type: WebhookResponseType.CompanionOnRoute;
}

export class WebhookUpdatedEtaResponseDto
  implements IWebhookUpdatedEtaResponseDto
{
  @ApiWebhookTypeProperty(WebhookResponseType.CompanionUpdatedEta)
  type: WebhookResponseType.CompanionUpdatedEta;
}

export type WebhookResponseDto =
  | WebhookNoOpResponseDto
  | WebhookCreateLinkResponseDto
  | WebhookOnSceneResponseDto
  | WebhookOnRouteResponseDto
  | WebhookUpdatedEtaResponseDto;
