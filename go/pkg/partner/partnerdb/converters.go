package partnerdb

import (
	"database/sql"
	"errors"
	"regexp"
	"strconv"

	commonpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
	insurancepb "github.com/*company-data-covered*/services/go/pkg/generated/proto/insurance"
	partnerpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/partner"
	patientspb "github.com/*company-data-covered*/services/go/pkg/generated/proto/patients"
	partnersql "github.com/*company-data-covered*/services/go/pkg/generated/sql/partner"
	"github.com/*company-data-covered*/services/go/pkg/protoconv"
	"github.com/*company-data-covered*/services/go/pkg/sqltypes"
	"google.golang.org/protobuf/proto"
)

const (
	TimestampLayout  = "2006-01-02T15:04:05.999Z"
	PhoneNumberRegex = `^\d{10}$`
)

var (
	PartnerCategoryEnumToShortName = map[partnerpb.PartnerCategory]string{
		partnerpb.PartnerCategory_PARTNER_CATEGORY_UNSPECIFIED:                 "unspecified",
		partnerpb.PartnerCategory_PARTNER_CATEGORY_EMPLOYER:                    "employer",
		partnerpb.PartnerCategory_PARTNER_CATEGORY_HEALTH_SYSTEM:               "health_system",
		partnerpb.PartnerCategory_PARTNER_CATEGORY_HOME_HEALTH:                 "home_health",
		partnerpb.PartnerCategory_PARTNER_CATEGORY_HOSPICE_AND_PALLIATIVE_CARE: "hospice_and_palliative_care",
		partnerpb.PartnerCategory_PARTNER_CATEGORY_INJURY_FINANCE:              "injury_finance",
		partnerpb.PartnerCategory_PARTNER_CATEGORY_PAYER:                       "payer",
		partnerpb.PartnerCategory_PARTNER_CATEGORY_PROVIDER_GROUP:              "provider_group",
		partnerpb.PartnerCategory_PARTNER_CATEGORY_SENIOR_CARE:                 "senior_care",
		partnerpb.PartnerCategory_PARTNER_CATEGORY_SKILLED_NURSING_FACILITY:    "snf",
	}
	ShortNameToPartnerCategoryEnum = map[string]partnerpb.PartnerCategory{
		"unspecified":                 partnerpb.PartnerCategory_PARTNER_CATEGORY_UNSPECIFIED,
		"employer":                    partnerpb.PartnerCategory_PARTNER_CATEGORY_EMPLOYER,
		"health_system":               partnerpb.PartnerCategory_PARTNER_CATEGORY_HEALTH_SYSTEM,
		"home_health":                 partnerpb.PartnerCategory_PARTNER_CATEGORY_HOME_HEALTH,
		"hospice_and_palliative_care": partnerpb.PartnerCategory_PARTNER_CATEGORY_HOSPICE_AND_PALLIATIVE_CARE,
		"injury_finance":              partnerpb.PartnerCategory_PARTNER_CATEGORY_INJURY_FINANCE,
		"payer":                       partnerpb.PartnerCategory_PARTNER_CATEGORY_PAYER,
		"provider_group":              partnerpb.PartnerCategory_PARTNER_CATEGORY_PROVIDER_GROUP,
		"senior_care":                 partnerpb.PartnerCategory_PARTNER_CATEGORY_SENIOR_CARE,
		"snf":                         partnerpb.PartnerCategory_PARTNER_CATEGORY_SKILLED_NURSING_FACILITY,
	}
	OriginSlugToCareRequestPartnerOrigin = map[string]partnerpb.CareRequestPartnerOrigin{
		"source":           partnerpb.CareRequestPartnerOrigin_CARE_REQUEST_PARTNER_ORIGIN_SOURCE,
		"location":         partnerpb.CareRequestPartnerOrigin_CARE_REQUEST_PARTNER_ORIGIN_LOCATION,
		"insurance":        partnerpb.CareRequestPartnerOrigin_CARE_REQUEST_PARTNER_ORIGIN_INSURANCE,
		"pop_health":       partnerpb.CareRequestPartnerOrigin_CARE_REQUEST_PARTNER_ORIGIN_POP_HEALTH,
		"provider_network": partnerpb.CareRequestPartnerOrigin_CARE_REQUEST_PARTNER_ORIGIN_PROVIDER_NETWORK,
	}
	BackfillTypeEnumToBackfillTypeSlug = map[partnerpb.BackfillType]string{
		partnerpb.BackfillType_BACKFILL_TYPE_UNSPECIFIED:      "unspecified",
		partnerpb.BackfillType_BACKFILL_TYPE_POPHEALTH:        "pophealth",
		partnerpb.BackfillType_BACKFILL_TYPE_PROVIDER_NETWORK: "provider_network",
	}
	BackfillTypeIDToBackfillTypeSlug = map[int64]string{
		1: "pophealth",
		2: "provider_network",
	}
	CallbackOptionSlugToCallbackOptionEnum = map[string]partnerpb.CallbackOption{
		"unspecified": partnerpb.CallbackOption_CALLBACK_OPTION_UNSPECIFIED,
		"source":      partnerpb.CallbackOption_CALLBACK_OPTION_SOURCE,
		"requester":   partnerpb.CallbackOption_CALLBACK_OPTION_REQUESTER,
		"patient":     partnerpb.CallbackOption_CALLBACK_OPTION_PATIENT,
	}
	CallbackOptionEnumToCallbackOptionSlug = map[partnerpb.CallbackOption]string{
		partnerpb.CallbackOption_CALLBACK_OPTION_UNSPECIFIED: "unspecified",
		partnerpb.CallbackOption_CALLBACK_OPTION_SOURCE:      "source",
		partnerpb.CallbackOption_CALLBACK_OPTION_REQUESTER:   "requester",
		partnerpb.CallbackOption_CALLBACK_OPTION_PATIENT:     "patient",
	}
)

type ssoConfigurationParams struct {
	connectionName      sql.NullString
	logoutURL           sql.NullString
	enforceRolePresence sql.NullBool
}

type redoxConfigurationParams struct {
	sourceID                     sql.NullString
	destinationID                sql.NullString
	clinicalSummaryDestinationID sql.NullString
	cancellationID               sql.NullString
	isClinicalSummaryEnabled     sql.NullBool
}

func ProtoPartnerFromGetPartnerByIDRow(p *partnersql.GetPartnerByIDRow) *partnerpb.Partner {
	partnerID := p.ID
	partnerCategory := PartnerCategoryEnumToShortName[partnerpb.PartnerCategory_PARTNER_CATEGORY_UNSPECIFIED]
	if p.PartnerCategoryShortName.Valid {
		partnerCategory = p.PartnerCategoryShortName.String
	}
	var partnerLatitude int32
	if p.LatitudeE6.Valid {
		partnerLatitude = p.LatitudeE6.Int32
	}
	var partnerLongitude int32
	if p.LongitudeE6.Valid {
		partnerLongitude = p.LongitudeE6.Int32
	}
	return &partnerpb.Partner{
		Id:              &partnerID,
		Name:            p.DisplayName,
		PartnerCategory: ShortNameToPartnerCategoryEnum[partnerCategory],
		PhoneNumber: &commonpb.PhoneNumber{
			CountryCode: sqltypes.ToProtoInt32(p.PhoneCountryCode),
			PhoneNumber: sqltypes.ToProtoString(p.PhoneNumber),
			Extension:   sqltypes.ToProtoString(p.PhoneExtension),
		},
		Email: sqltypes.ToProtoString(p.Email),
		Location: &partnerpb.Location{
			Address: &commonpb.Address{
				AddressLineOne: sqltypes.ToProtoString(p.AddressLineOne),
				AddressLineTwo: sqltypes.ToProtoString(p.AddressLineTwo),
				City:           sqltypes.ToProtoString(p.City),
				State:          sqltypes.ToProtoString(p.StateCode),
				ZipCode:        sqltypes.ToProtoString(p.ZipCode),
			},
			GeoLocation: &commonpb.Location{
				LatitudeE6:  partnerLatitude,
				LongitudeE6: partnerLongitude,
			},
		},
		StationIdentifiers: &partnerpb.StationIdentifiers{
			ChannelItemId: p.StationChannelItemID,
			ChannelId:     sqltypes.ToProtoInt64(p.StationChannelID),
		},
		// TODO: add InsurancePackages and EmrProviders fields
		DeactivatedAt: sqltypes.ToProtoTimestamp(p.DeactivatedAt),
		CreatedAt:     sqltypes.ToProtoTimestamp(sqltypes.ToValidNullTime(p.CreatedAt)),
		UpdatedAt:     sqltypes.ToProtoTimestamp(sqltypes.ToValidNullTime(p.UpdatedAt)),
	}
}

func ProtoPartnerFromSearchPartnersByNameRow(p *partnersql.SearchPartnersByNameRow) *partnerpb.Partner {
	partner := partnersql.GetPartnerByIDRow(*p)
	return ProtoPartnerFromGetPartnerByIDRow(&partner)
}

func ProtoPhoneNumberToPartnerConfigurationPhoneNumber(phone *commonpb.PhoneNumber) (sql.NullString, error) {
	if phone == nil || phone.PhoneNumber == nil {
		return sql.NullString{}, nil
	}

	regex := regexp.MustCompile(PhoneNumberRegex)
	if !regex.MatchString(*phone.PhoneNumber) {
		return sql.NullString{}, errors.New("phone number must be 10 digits")
	}

	return sqltypes.ToValidNullString(*phone.PhoneNumber), nil
}

func ssoConfigurationsToProtoSsoProperties(ssoParams ssoConfigurationParams) *partnerpb.SSOProperties {
	var ssoProperties *partnerpb.SSOProperties
	if ssoParams.connectionName.Valid {
		ssoProperties = &partnerpb.SSOProperties{
			ConnectionName:      ssoParams.connectionName.String,
			LogoutUrl:           sqltypes.ToProtoString(ssoParams.logoutURL),
			EnforceRolePresence: sqltypes.ToProtoBool(ssoParams.enforceRolePresence),
		}
	}
	return ssoProperties
}

func redoxConfigurationToProtoRedoxProperties(redoxParams redoxConfigurationParams) *partnerpb.RedoxProperties {
	var redoxProperties *partnerpb.RedoxProperties
	if redoxParams.sourceID.Valid {
		redoxProperties = &partnerpb.RedoxProperties{
			SourceId:                     redoxParams.sourceID.String,
			DestinationId:                redoxParams.destinationID.String,
			ClinicalSummaryDestinationId: sqltypes.ToProtoString(redoxParams.clinicalSummaryDestinationID),
			CancellationId:               sqltypes.ToProtoString(redoxParams.cancellationID),
			ClinicalNotesEnabled:         redoxParams.isClinicalSummaryEnabled.Bool,
		}
	}
	return redoxProperties
}

func partnerConfigurationPhoneNumberToProtoPhoneNumber(phone sql.NullString) *commonpb.PhoneNumber {
	var protoPhone *commonpb.PhoneNumber
	if phone.Valid {
		protoPhone = &commonpb.PhoneNumber{
			PhoneNumber: sqltypes.ToProtoString(phone),
		}
	}
	return protoPhone
}

func ProtoPartnerConfigurationFromSearchPartnerConfigurationsRow(searchPartnerConfigurationRow *partnersql.SearchPartnerConfigurationsRow) *partnerpb.PartnerConfiguration {
	return &partnerpb.PartnerConfiguration{
		Id:                         proto.Int64(searchPartnerConfigurationRow.ID),
		ExpressId:                  sqltypes.ToProtoString(searchPartnerConfigurationRow.ExpressID),
		DisplayName:                searchPartnerConfigurationRow.DisplayName,
		PhoneNumber:                partnerConfigurationPhoneNumberToProtoPhoneNumber(searchPartnerConfigurationRow.PhoneNumber),
		SsoEnabled:                 proto.Bool(searchPartnerConfigurationRow.IsSsoEnabled),
		RedoxEnabled:               proto.Bool(searchPartnerConfigurationRow.IsRedoxEnabled),
		RiskStratBypassEnabled:     proto.Bool(searchPartnerConfigurationRow.IsRiskStratBypassEnabled),
		ViewAllCareRequestsEnabled: proto.Bool(searchPartnerConfigurationRow.IsViewAllCareRequestsEnabled),
		SsoProperties: ssoConfigurationsToProtoSsoProperties(ssoConfigurationParams{
			connectionName:      searchPartnerConfigurationRow.ConnectionName,
			logoutURL:           searchPartnerConfigurationRow.LogoutUrl,
			enforceRolePresence: searchPartnerConfigurationRow.EnforceRolePresence,
		}),
		RedoxProperties: redoxConfigurationToProtoRedoxProperties(redoxConfigurationParams{
			sourceID:                     searchPartnerConfigurationRow.SourceID,
			destinationID:                searchPartnerConfigurationRow.DestinationID,
			clinicalSummaryDestinationID: searchPartnerConfigurationRow.ClinicalSummaryDestinationID,
			cancellationID:               searchPartnerConfigurationRow.CancellationID,
			isClinicalSummaryEnabled:     searchPartnerConfigurationRow.IsClinicalSummaryEnabled,
		}),
		DeletedAt: sqltypes.ToProtoTimestamp(searchPartnerConfigurationRow.DeletedAt),
		CreatedAt: protoconv.TimeToProtoTimestamp(&searchPartnerConfigurationRow.CreatedAt),
		UpdatedAt: protoconv.TimeToProtoTimestamp(&searchPartnerConfigurationRow.UpdatedAt),
	}
}

func ProtoPartnerConfigurationFromGetPartnerConfigurationByIDRow(
	p *partnersql.GetPartnerConfigurationByIDRow,
	relations PartnerConfigurationRelations,
) *partnerpb.PartnerConfiguration {
	if p == nil {
		return nil
	}

	return &partnerpb.PartnerConfiguration{
		Id:                         proto.Int64(p.ID),
		ExpressId:                  sqltypes.ToProtoString(p.ExpressID),
		DisplayName:                p.DisplayName,
		PhoneNumber:                partnerConfigurationPhoneNumberToProtoPhoneNumber(p.PhoneNumber),
		SsoEnabled:                 proto.Bool(p.IsSsoEnabled),
		RedoxEnabled:               proto.Bool(p.IsRedoxEnabled),
		RiskStratBypassEnabled:     proto.Bool(p.IsRiskStratBypassEnabled),
		ViewAllCareRequestsEnabled: proto.Bool(p.IsViewAllCareRequestsEnabled),
		AcceptedDomains:            emailDomainsToProtoAcceptedDomains(relations.EmailDomains),
		SsoProperties: ssoConfigurationsToProtoSsoProperties(ssoConfigurationParams{
			connectionName:      p.ConnectionName,
			logoutURL:           p.LogoutUrl,
			enforceRolePresence: p.EnforceRolePresence,
		}),
		RedoxProperties: redoxConfigurationToProtoRedoxProperties(redoxConfigurationParams{
			sourceID:                     p.SourceID,
			destinationID:                p.DestinationID,
			clinicalSummaryDestinationID: p.ClinicalSummaryDestinationID,
			cancellationID:               p.CancellationID,
			isClinicalSummaryEnabled:     p.IsClinicalSummaryEnabled,
		}),
		PophealthChannelItemIds: relations.PopHealthChannelItemIDs,
		DeletedAt:               sqltypes.ToProtoTimestamp(p.DeletedAt),
		CreatedAt:               protoconv.TimeToProtoTimestamp(&p.CreatedAt),
		UpdatedAt:               protoconv.TimeToProtoTimestamp(&p.UpdatedAt),
		Markets:                 ProtoMarketsFromMarketsAndServiceLines(relations.Markets),
		Sources:                 partnerConfigSourcesToProtoSources(relations.Sources),
	}
}

func ProtoServiceLinesFromServiceLinesMap(serviceLinesMap map[int64]*partnersql.ServiceLine) []*partnerpb.ServiceLine {
	protoServiceLines := make([]*partnerpb.ServiceLine, len(serviceLinesMap))
	i := 0
	for _, serviceLine := range serviceLinesMap {
		protoServiceLines[i] = ProtoServiceLineFromServiceLine(serviceLine)
		i++
	}
	return protoServiceLines
}

func ProtoServiceLineFromServiceLine(serviceLine *partnersql.ServiceLine) *partnerpb.ServiceLine {
	return &partnerpb.ServiceLine{
		Id:                            serviceLine.ID,
		ShortName:                     proto.String(serviceLine.ShortName),
		DisplayName:                   proto.String(serviceLine.DisplayName),
		GenesysEmail:                  proto.String(serviceLine.GenesysEmail),
		AllowBypassRiskStratification: proto.Bool(serviceLine.AllowBypassRiskStratification),
	}
}

func ProtoInsuranceRecordFromInsuranceNetwork(network *insurancepb.InsuranceNetwork) *patientspb.InsuranceRecord {
	return &patientspb.InsuranceRecord{
		Priority: patientspb.InsurancePriority_INSURANCE_PRIORITY_PRIMARY,
		GroupId:  proto.String(strconv.FormatInt(network.InsurancePayerGroupId, 10)),
		PrimaryInsuranceHolder: &patientspb.PrimaryInsuranceHolder{
			PatientRelationToSubscriber: patientspb.PatientRelationToSubscriber_PATIENT_RELATION_TO_SUBSCRIBER_PATIENT.Enum(),
		},
		CompanyName:     proto.String(network.InsurancePayerName),
		PackageId:       proto.String(strconv.FormatInt(network.PackageId, 10)),
		InsurancePlanId: proto.Int64(network.InsurancePlanId),
	}
}

func AddLocationParamsFromProtoLocation(protoLocation *partnerpb.Location) partnersql.AddLocationParams {
	addLocationParams := partnersql.AddLocationParams{}
	if protoLocation != nil {
		if protoLocation.Address != nil {
			addLocationParams.AddressLineOne = sqltypes.ToNullString(protoLocation.Address.AddressLineOne)
			addLocationParams.AddressLineTwo = sqltypes.ToNullString(protoLocation.Address.AddressLineTwo)
			addLocationParams.City = sqltypes.ToNullString(protoLocation.Address.City)
			addLocationParams.StateCode = sqltypes.ToNullString(protoLocation.Address.State)
			addLocationParams.ZipCode = sqltypes.ToNullString(protoLocation.Address.ZipCode)
		}

		if protoLocation.GeoLocation != nil {
			addLocationParams.LatitudeE6 = sqltypes.ToNullInt32(&protoLocation.GeoLocation.LatitudeE6)
			addLocationParams.LongitudeE6 = sqltypes.ToNullInt32(&protoLocation.GeoLocation.LongitudeE6)
		}
	}
	return addLocationParams
}

func ProtoMarketsFromMarketsAndServiceLines(marketsAndServiceLines []*partnersql.GetMarketsAndServiceLinesByIDOrPartnerConfigIDRow) []*partnerpb.Market {
	protoMarketsMap := make(map[int64]*partnerpb.Market)
	for _, marketsAndServiceLinesRow := range marketsAndServiceLines {
		if _, exists := protoMarketsMap[marketsAndServiceLinesRow.MarketID]; !exists {
			protoMarketsMap[marketsAndServiceLinesRow.MarketID] = &partnerpb.Market{
				Id:                     proto.Int64(marketsAndServiceLinesRow.MarketID),
				PartnerConfigurationId: marketsAndServiceLinesRow.PartnerConfigurationID,
				StationMarketId:        marketsAndServiceLinesRow.StationMarketID,
				DisplayName:            marketsAndServiceLinesRow.MarketDisplayName,
				ServiceLines:           []*partnerpb.ServiceLine{},
			}
		}
		protoMarketsMap[marketsAndServiceLinesRow.MarketID].ServiceLines = append(
			protoMarketsMap[marketsAndServiceLinesRow.MarketID].ServiceLines,
			ProtoServiceLineFromServiceLine(&partnersql.ServiceLine{
				ID:                            marketsAndServiceLinesRow.ServiceLineID,
				DisplayName:                   marketsAndServiceLinesRow.ServiceLineDisplayName,
				ShortName:                     marketsAndServiceLinesRow.ServiceLineShortName,
				GenesysEmail:                  marketsAndServiceLinesRow.GenesysEmail,
				AllowBypassRiskStratification: marketsAndServiceLinesRow.AllowBypassRiskStratification,
			}),
		)
	}
	protoMarkets := make([]*partnerpb.Market, len(protoMarketsMap))
	i := 0
	for _, protoMarket := range protoMarketsMap {
		protoMarkets[i] = protoMarket
		i++
	}

	return protoMarkets
}

func ProtoPartnerConfigurationFromPartnerConfiguration(partnerConfig *partnersql.PartnerConfiguration) *partnerpb.PartnerConfiguration {
	return &partnerpb.PartnerConfiguration{
		Id:                         proto.Int64(partnerConfig.ID),
		ExpressId:                  sqltypes.ToProtoString(partnerConfig.ExpressID),
		DisplayName:                partnerConfig.DisplayName,
		PhoneNumber:                partnerConfigurationPhoneNumberToProtoPhoneNumber(partnerConfig.PhoneNumber),
		SsoEnabled:                 proto.Bool(partnerConfig.IsSsoEnabled),
		RedoxEnabled:               proto.Bool(partnerConfig.IsRedoxEnabled),
		RiskStratBypassEnabled:     proto.Bool(partnerConfig.IsRiskStratBypassEnabled),
		ViewAllCareRequestsEnabled: proto.Bool(partnerConfig.IsViewAllCareRequestsEnabled),
		DeletedAt:                  sqltypes.ToProtoTimestamp(partnerConfig.DeletedAt),
		CreatedAt:                  protoconv.TimeToProtoTimestamp(&partnerConfig.CreatedAt),
		UpdatedAt:                  protoconv.TimeToProtoTimestamp(&partnerConfig.UpdatedAt),
	}
}

func ProtoMarketFromPartnerDBPartnerConfigurationMarket(partnerConfigMarket *PartnerConfigurationMarket) *partnerpb.Market {
	return &partnerpb.Market{
		Id:                     proto.Int64(partnerConfigMarket.PartnerConfigurationMarket.ID),
		PartnerConfigurationId: partnerConfigMarket.PartnerConfigurationMarket.PartnerConfigurationID,
		StationMarketId:        partnerConfigMarket.Market.StationMarketID,
		DisplayName:            partnerConfigMarket.Market.DisplayName,
	}
}

func ProtoSourceFromGetPartnerConfigSource(source *partnersql.GetPartnerConfigurationSourcesByPartnerConfigurationIDRow) *partnerpb.Source {
	if source == nil {
		return nil
	}

	callbackNumber := commonpb.PhoneNumber{
		CountryCode: sqltypes.ToProtoInt32(source.CallbackNumberCountryCode),
		PhoneNumber: proto.String(source.CallbackNumber),
		Extension:   sqltypes.ToProtoString(source.CallbackNumberExtension),
	}
	defaultVisitAddress := commonpb.Address{
		AddressLineOne: sqltypes.ToProtoString(source.AddressLineOne),
		AddressLineTwo: sqltypes.ToProtoString(source.AddressLineTwo),
		City:           sqltypes.ToProtoString(source.City),
		State:          sqltypes.ToProtoString(source.StateCode),
		ZipCode:        sqltypes.ToProtoString(source.ZipCode),
	}
	return &partnerpb.Source{
		Id:                     proto.Int64(source.ID),
		PartnerId:              source.PartnerID,
		PartnerConfigurationId: source.PartnerConfigurationID,
		CallbackNumber:         &callbackNumber,
		DefaultVisitAddress:    &defaultVisitAddress,
		DefaultCallbackOption:  CallbackOptionSlugToCallbackOptionEnum[source.DefaultCallbackOptionSlug],
		DeletedAt:              sqltypes.ToProtoTimestamp(source.DeletedAt),
		CreatedAt:              protoconv.TimeToProtoTimestamp(&source.CreatedAt),
		UpdatedAt:              protoconv.TimeToProtoTimestamp(&source.UpdatedAt),
	}
}

func emailDomainsToProtoAcceptedDomains(emailDomains []*partnersql.EmailDomain) []string {
	acceptedDomains := make([]string, len(emailDomains))
	for i, emailDomain := range emailDomains {
		acceptedDomains[i] = emailDomain.DomainDescription
	}
	return acceptedDomains
}

func partnerConfigSourcesToProtoSources(
	partnerConfigSources []*partnersql.GetPartnerConfigurationSourcesByPartnerConfigurationIDRow,
) []*partnerpb.Source {
	protoSources := make([]*partnerpb.Source, len(partnerConfigSources))
	for i, partnerConfigSource := range partnerConfigSources {
		protoSources[i] = ProtoSourceFromGetPartnerConfigSource(partnerConfigSource)
	}
	return protoSources
}
