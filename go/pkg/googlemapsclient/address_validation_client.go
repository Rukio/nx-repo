package googlemapsclient

import (
	"context"
	"crypto/tls"
	"errors"
	"fmt"
	"strings"

	"cloud.google.com/go/maps/addressvalidation/apiv1/addressvalidationpb"
	commonpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
	"go.uber.org/zap"
	"google.golang.org/genproto/googleapis/type/postaladdress"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials"
	"google.golang.org/grpc/metadata"
	"google.golang.org/protobuf/proto"
)

const (
	googleAPIKeyHeader                 = "X-Goog-Api-Key"
	addressValidationGRPCAddr          = "addressvalidation.googleapis.com:443"
	unconfirmedGeocodeComponentsReason = "We weren't able to find the location of your address."
)

var (
	errValidateAddressError = errors.New("error validating address from upstream")
	errValidateAddressNil   = errors.New("ValidateAddressRequest must not be nil")
	errNoVerdict            = errors.New("no verdict given")
)

type AddressValidationClient interface {
	ValidateAddress(ctx context.Context, in *addressvalidationpb.ValidateAddressRequest, opts ...grpc.CallOption) (*addressvalidationpb.ValidateAddressResponse, error)
}

type AddressValidationGRPCClient struct {
	client AddressValidationClient
	apiKey string
	logger *zap.SugaredLogger
}

func NewAddressValidationGRPCClient(ctx context.Context, apiKey string, logger *zap.SugaredLogger) (*AddressValidationGRPCClient, error) {
	config := tls.Config{}
	dialOptions := []grpc.DialOption{grpc.WithTransportCredentials(credentials.NewTLS(&config))}
	conn, err := grpc.Dial(addressValidationGRPCAddr, dialOptions...)
	if err != nil {
		return nil, err
	}
	c := addressvalidationpb.NewAddressValidationClient(conn)

	return &AddressValidationGRPCClient{
		client: c,
		apiKey: apiKey,
		logger: logger,
	}, nil
}

type ValidateAddressRequest struct {
	Address                            *commonpb.Address
	PreviousGoogleValidationResponseID *string
}

type ValidateAddressResponse struct {
	Address                    *commonpb.Address
	Geocodeable                bool
	IsComplete                 bool
	GoogleValidationResponseID string
	Location                   *commonpb.Location
	Reasons                    []string
}

type ParsedVerdict struct {
	Geocodeable bool
	IsComplete  bool
	Reasons     []string
}

func (avc AddressValidationGRPCClient) ValidateAddress(ctx context.Context, req *ValidateAddressRequest) (*ValidateAddressResponse, error) {
	if req == nil {
		return nil, errValidateAddressNil
	}
	ctx = metadata.AppendToOutgoingContext(ctx, googleAPIKeyHeader, avc.apiKey)
	addressLines := []string{req.Address.GetAddressLineOne()}
	if req.Address.AddressLineTwo != nil {
		addressLines = append(addressLines, req.Address.GetAddressLineTwo())
	}

	previousResponseID := ""
	if req.PreviousGoogleValidationResponseID != nil {
		previousResponseID = *req.PreviousGoogleValidationResponseID
	}

	validateAddressRequest := addressvalidationpb.ValidateAddressRequest{
		Address: &postaladdress.PostalAddress{
			RegionCode:         "US",
			LanguageCode:       "en",
			AddressLines:       addressLines,
			PostalCode:         req.Address.GetZipCode(),
			AdministrativeArea: req.Address.GetState(),
			Locality:           req.Address.GetCity(),
		},
		PreviousResponseId: previousResponseID,
	}
	validateAddressResponse, err := avc.client.ValidateAddress(ctx, &validateAddressRequest)
	if err != nil {
		avc.logger.Errorw("failed to validate address", "upstream_error", err)
		return nil, errValidateAddressError
	}

	// TODO(PT-1667): Add blacklist to block people abusing the API endpoint.
	// See https://developers.google.com/maps/documentation/address-validation/understand-response#artificially_created_address_detected_by_usps

	location := validateAddressResponse.GetResult().GetGeocode().GetLocation()

	parsedVerdict, err := parseVerdict(validateAddressResponse.GetResult().GetVerdict())
	if err != nil {
		return nil, err
	}

	return &ValidateAddressResponse{
		Address:                    avc.validationResultToAddress(validateAddressResponse.GetResult()),
		GoogleValidationResponseID: validateAddressResponse.GetResponseId(),
		Location: &commonpb.Location{
			LatitudeE6:  int32(location.GetLatitude() * 1e6),
			LongitudeE6: int32(location.GetLongitude() * 1e6),
		},
		Geocodeable: parsedVerdict.Geocodeable,
		IsComplete:  parsedVerdict.IsComplete,
		Reasons:     parsedVerdict.Reasons,
	}, nil
}

func (avc AddressValidationGRPCClient) validationResultToAddress(result *addressvalidationpb.ValidationResult) *commonpb.Address {
	if result == nil {
		return nil
	}
	// Default to setting data based on Google Postal Address
	// If it exists, prefer USPS Data Standardized Address over Google Postal Address
	addressProto := avc.parseGoogleAddress(result.GetAddress().GetPostalAddress())
	uspsAddress := parseUSPSAddress(result.GetUspsData().GetStandardizedAddress())
	if addressProto == nil {
		return uspsAddress
	}
	// Overwrite Google address fields with non-nil USPS address fields
	proto.Merge(addressProto, uspsAddress)
	return addressProto
}

func (avc AddressValidationGRPCClient) parseGoogleAddress(postalAddress *postaladdress.PostalAddress) *commonpb.Address {
	if postalAddress == nil {
		return nil
	}
	var addressLineOne, addressLineTwo *string
	switch {
	case len(postalAddress.GetAddressLines()) == 1:
		addressLineOne = &postalAddress.GetAddressLines()[0]
	case len(postalAddress.GetAddressLines()) >= 2:
		addressLineOne = &postalAddress.GetAddressLines()[0]
		addressLineTwo = proto.String(strings.Join(postalAddress.GetAddressLines()[1:], " "))
	default:
		avc.logger.Errorf("Validated address lines are empty for address %s", postalAddress)
	}
	return &commonpb.Address{
		AddressLineOne: addressLineOne,
		AddressLineTwo: addressLineTwo,
		City:           &postalAddress.Locality,
		State:          &postalAddress.AdministrativeArea,
		ZipCode:        &postalAddress.PostalCode,
	}
}

func parseUSPSAddress(uspsAddress *addressvalidationpb.UspsAddress) *commonpb.Address {
	if uspsAddress == nil {
		return nil
	}
	addressProto := &commonpb.Address{}

	if uspsAddress.GetFirstAddressLine() != "" {
		addressProto.AddressLineOne = proto.String(uspsAddress.GetFirstAddressLine())
	}
	if uspsAddress.GetSecondAddressLine() != "" {
		addressProto.AddressLineTwo = proto.String(uspsAddress.GetSecondAddressLine())
	}
	if uspsAddress.GetCity() != "" {
		addressProto.City = proto.String(uspsAddress.GetCity())
	}
	if uspsAddress.GetState() != "" {
		addressProto.State = proto.String(uspsAddress.GetState())
	}

	zip := uspsAddress.ZipCode
	if zip != "" && uspsAddress.ZipCodeExtension != "" {
		zip = fmt.Sprintf("%s-%s", uspsAddress.ZipCode, uspsAddress.ZipCodeExtension)
	}
	if zip != "" {
		addressProto.ZipCode = proto.String(zip)
	}

	return addressProto
}

func parseVerdict(verdict *addressvalidationpb.Verdict) (ParsedVerdict, error) {
	if verdict == nil {
		return ParsedVerdict{}, errNoVerdict
	}
	var reasons []string
	if isGranularityTooLarge(verdict.GeocodeGranularity) {
		reasons = append(reasons, unconfirmedGeocodeComponentsReason)
	}

	return ParsedVerdict{
		Geocodeable: !isGranularityTooLarge(verdict.GeocodeGranularity),
		IsComplete:  verdict.AddressComplete,
		Reasons:     reasons,
	}, nil
}

func isGranularityTooLarge(granularity addressvalidationpb.Verdict_Granularity) bool {
	return granularity == addressvalidationpb.Verdict_BLOCK ||
		granularity == addressvalidationpb.Verdict_ROUTE ||
		granularity == addressvalidationpb.Verdict_OTHER ||
		granularity == addressvalidationpb.Verdict_GRANULARITY_UNSPECIFIED
}
