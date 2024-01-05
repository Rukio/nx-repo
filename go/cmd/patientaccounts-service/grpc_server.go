package main

import (
	"bytes"
	"context"
	"errors"
	"strconv"

	"github.com/*company-data-covered*/services/go/pkg/auth"
	patientspb "github.com/*company-data-covered*/services/go/pkg/generated/proto/patients"
	patientaccountspb "github.com/*company-data-covered*/services/go/pkg/generated/proto/patients/accounts"
	patientaccountssql "github.com/*company-data-covered*/services/go/pkg/generated/sql/patientaccounts"
	"github.com/*company-data-covered*/services/go/pkg/googlemapsclient"
	"github.com/*company-data-covered*/services/go/pkg/sqltypes"
	"go.uber.org/zap"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

var (
	errNoAccountID                      = status.Error(codes.InvalidArgument, "account id cannot be empty")
	errNoAccountAddressID               = status.Error(codes.InvalidArgument, "account address id cannot be empty")
	errNoAccountPatientID               = status.Error(codes.InvalidArgument, "account patient id cannot be empty")
	errNoAddress                        = status.Error(codes.InvalidArgument, "address cannot be empty")
	errNoUpdateFields                   = status.Error(codes.InvalidArgument, "must provide at least one field to update")
	errNoConsistencyToken               = status.Error(codes.InvalidArgument, "must provide a consistency token")
	errInvalidConsistencyToken          = status.Error(codes.FailedPrecondition, "consistency token does not match expected")
	errFailedToConvertAccount           = status.Error(codes.Internal, "failed to convert account")
	errFailedToConvertAccountPatient    = status.Error(codes.Internal, "failed to convert account patient")
	errFailedToConvertAddress           = status.Error(codes.Internal, "failed to convert address")
	errNoAddressID                      = status.Error(codes.InvalidArgument, "address id cannot be empty")
	errListPatients                     = status.Error(codes.Internal, "failed to list patients")
	errInvalidTokenClaims               = status.Error(codes.Unauthenticated, "token does not have valid claims")
	errInvalidUnverifiedPatientID       = status.Error(codes.InvalidArgument, "invalid unverified patient id")
	errNoAccessLevel                    = status.Error(codes.InvalidArgument, "access level cannot be empty")
	errFailedGetAccount                 = status.Error(codes.Internal, "failed to get account")
	errFailedGetAddress                 = status.Error(codes.Internal, "failed to get address")
	errFailedGetAccountPatient          = status.Error(codes.Internal, "failed to get account patient")
	errFailedToGetUnverifiedPatient     = status.Error(codes.Internal, "failed to get unverified patient")
	errValidatingAddress                = status.Error(codes.Internal, "error validating address")
	errNoConsentingRelationship         = status.Error(codes.InvalidArgument, "consenting relationship cannot be empty")
	errNoConsentingRelationshipCategory = status.Error(codes.InvalidArgument, "consenting relationship category cannot be empty")
	errFacilityTypeEmpty                = status.Error(codes.InvalidArgument, "facility type id cannot be empty")
	errFacilityTypeNotFound             = status.Error(codes.InvalidArgument, "could not find facility type id")
)

const (
	claimPropertyAccountIDKey              = "account_id"
	claimPropertyEmailKey                  = "email"
	claimPropertyIdentityProviderUserIDKey = "identity_provider_user_id"
)

// DBService demands what the grpc server needs from a DB implementation. Primarily for mocking purposes.
type DBService interface {
	CreateAccount(ctx context.Context, params patientaccountssql.CreateAccountParams) (*patientaccountssql.Account, error)
	GetAccount(ctx context.Context, accountID int64) (*patientaccountssql.Account, error)
	UpdateAccount(ctx context.Context, params patientaccountssql.UpdateAccountParams) (*patientaccountssql.Account, error)
	GetAccountByAuth0ID(ctx context.Context, auth0ID string) (*patientaccountssql.Account, error)
	DeleteAccountAddress(ctx context.Context, addressID int64) error
	DeleteAccountPatientLink(ctx context.Context, accountPatientID int64) error
	CreateAddress(ctx context.Context, params patientaccountssql.CreateAccountAddressParams) (*patientaccountssql.Address, error)
	ListAddresses(ctx context.Context, accountID int64) ([]*patientaccountssql.Address, error)
	GetAddress(ctx context.Context, addressID int64) (*patientaccountssql.Address, error)
	ListAccountPatientLinks(ctx context.Context, accountID int64) ([]*patientaccountssql.AccountPatientLink, error)
	UpdateAddress(ctx context.Context, params patientaccountssql.UpdateAddressParams) (*patientaccountssql.Address, error)
	GetAccountPatientLink(ctx context.Context, patientID int64) (*patientaccountssql.AccountPatientLink, error)
	AddAccountPatientLink(ctx context.Context, params *patientaccountssql.AddAccountPatientLinkParams) (*patientaccountssql.AccountPatientLink, error)
	GetAccountPatientLinkByUnverifiedPatientID(ctx context.Context, id int64) (*patientaccountssql.AccountPatientLink, error)
	UpdateAccountPatientLink(ctx context.Context, params *patientaccountssql.UpdateAccountPatientLinkParams) (*patientaccountssql.AccountPatientLink, error)
}

// a compile-time assertion that our assumed implementation satisfies the above interface.
var _ DBService = (*PatientAccountsDB)(nil)

type GRPCServer struct {
	patientaccountspb.UnimplementedPatientAccountsServiceServer
	DB                      DBService
	PatientsServiceClient   patientspb.PatientsServiceClient
	AddressValidationClient AddressValidationGRPCClient
	Logger                  *zap.SugaredLogger
}

type AddressValidationGRPCClient interface {
	ValidateAddress(context.Context, *googlemapsclient.ValidateAddressRequest) (*googlemapsclient.ValidateAddressResponse, error)
}

func (s *GRPCServer) FindOrCreateAccountByToken(ctx context.Context, _ *patientaccountspb.FindOrCreateAccountByTokenRequest) (*patientaccountspb.FindOrCreateAccountByTokenResponse, error) {
	claims, ok := auth.CustomClaimsFromContext(ctx)
	if !ok {
		return nil, errInvalidTokenClaims
	}

	email, emailOK := claims.Properties[claimPropertyEmailKey].(string)
	auth0ID, auth0IDOK := claims.Properties[claimPropertyIdentityProviderUserIDKey].(string)
	if !emailOK || !auth0IDOK || auth0ID == "" || email == "" {
		return nil, errInvalidTokenClaims
	}

	account, err := s.DB.GetAccountByAuth0ID(ctx, auth0ID)
	if err != nil && !errors.Is(err, errAccountNotFound) {
		s.Logger.Errorw(errFailedGetAccount.Error(), zap.Error(err))
		return nil, errFailedGetAccount
	}
	if account == nil {
		s.Logger.Debug("account does not yet exist, creating")
		account, err = s.DB.CreateAccount(ctx, patientaccountssql.CreateAccountParams{
			Auth0ID: auth0ID,
			Email:   email,
		})
		if err != nil {
			s.Logger.Errorw("failed to create account", zap.Error(err))
			return nil, status.Error(codes.Internal, "error creating account")
		}
	}

	protoAccount, consistencyToken, err := accountProtoFromSQL(account)
	if err != nil {
		s.Logger.Errorw(errFailedToConvertAccount.Error(), zap.Error(err))
		return nil, errFailedToConvertAccount
	}

	return &patientaccountspb.FindOrCreateAccountByTokenResponse{
		Account:          protoAccount,
		ConsistencyToken: consistencyToken,
	}, nil
}

func (s *GRPCServer) GetAccount(ctx context.Context, r *patientaccountspb.GetAccountRequest) (*patientaccountspb.GetAccountResponse, error) {
	accountID := r.GetAccountId()
	if accountID == 0 {
		return nil, errNoAccountID
	}

	account, err := s.DB.GetAccount(ctx, accountID)
	if err != nil {
		if errors.Is(err, errAccountNotFound) {
			return nil, status.Error(codes.NotFound, err.Error())
		}

		s.Logger.Errorw(errFailedGetAccount.Error(), zap.Error(err))
		return nil, errFailedGetAccount
	}

	protoAccount, consistencyToken, err := accountProtoFromSQL(account)
	if err != nil {
		s.Logger.Errorw(errFailedToConvertAccount.Error(), zap.Error(err))
		return nil, errFailedToConvertAccount
	}

	return &patientaccountspb.GetAccountResponse{
		Account:          protoAccount,
		ConsistencyToken: consistencyToken,
	}, nil
}

func (s *GRPCServer) UpdateAccount(ctx context.Context, r *patientaccountspb.UpdateAccountRequest) (*patientaccountspb.UpdateAccountResponse, error) {
	accountID := r.GetAccountId()
	if accountID == 0 {
		return nil, errNoAccountID
	}
	if len(r.ConsistencyToken) == 0 {
		return nil, errNoConsistencyToken
	}
	if r.GivenName == nil && r.FamilyName == nil && r.Number == nil {
		return nil, errNoUpdateFields
	}

	getAccountResponse, err := s.GetAccount(ctx, &patientaccountspb.GetAccountRequest{AccountId: accountID})
	if err != nil {
		return nil, err
	}
	if !bytes.Equal(getAccountResponse.ConsistencyToken, r.ConsistencyToken) {
		return nil, errInvalidConsistencyToken
	}

	var phoneNumber *string
	if r.Number != nil {
		phoneNumber = r.Number.PhoneNumber
	}

	account, err := s.DB.UpdateAccount(ctx, patientaccountssql.UpdateAccountParams{
		ID:          accountID,
		GivenName:   sqltypes.ToNullString(r.GivenName),
		FamilyName:  sqltypes.ToNullString(r.FamilyName),
		PhoneNumber: sqltypes.ToNullString(phoneNumber),
	})
	if err != nil {
		if errors.Is(err, errAccountNotFound) {
			return nil, status.Error(codes.NotFound, err.Error())
		}
		s.Logger.Errorw("failed to update account", zap.Error(err))
		return nil, status.Error(codes.Internal, "error updating account")
	}

	protoAccount, consistencyToken, err := accountProtoFromSQL(account)
	if err != nil {
		s.Logger.Errorw(errFailedToConvertAccount.Error(), zap.Error(err))
		return nil, errFailedToConvertAccount
	}

	return &patientaccountspb.UpdateAccountResponse{
		Account:          protoAccount,
		ConsistencyToken: consistencyToken,
	}, nil
}

func (s *GRPCServer) CreateAddress(ctx context.Context, req *patientaccountspb.CreateAddressRequest) (*patientaccountspb.CreateAddressResponse, error) {
	if req.GetAccountId() == 0 {
		return nil, errNoAccountID
	}

	if req.GetAddress() == nil {
		return nil, errNoAddress
	}

	if req.FacilityType == nil {
		return nil, errFacilityTypeEmpty
	}

	facilityTypeID, ok := FacilityTypeProtoToID[req.GetFacilityType()]
	if !ok {
		s.Logger.Errorw("Could not find facility type id when creating address", "facility_type", req.FacilityType.String())
		return nil, errFacilityTypeNotFound
	}

	suggestedResult, err := s.validateAddress(ctx, &googlemapsclient.ValidateAddressRequest{
		Address:                            req.Address,
		PreviousGoogleValidationResponseID: req.PreviousGoogleValidationResponseId,
	})
	if err != nil {
		s.Logger.Errorw("failed to validate address when creating address", zap.Error(err))
		return nil, errValidatingAddress
	}
	if !suggestedResult.GetGeocodeable() {
		return &patientaccountspb.CreateAddressResponse{
			SuggestedAddress:        suggestedResult,
			AddressValidationStatus: patientaccountspb.AddressValidationStatus_ADDRESS_VALIDATION_STATUS_INVALID,
		}, nil
	}

	address, err := s.DB.CreateAddress(ctx, patientaccountssql.CreateAccountAddressParams{
		AccountID:       req.GetAccountId(),
		AddressLineOne:  sqltypes.ToNullString(suggestedResult.Address.AddressLineOne),
		AddressLineTwo:  sqltypes.ToNullString(suggestedResult.Address.AddressLineTwo),
		City:            sqltypes.ToNullString(suggestedResult.Address.City),
		Zipcode:         sqltypes.ToNullString(suggestedResult.Address.ZipCode),
		StateCode:       sqltypes.ToNullString(suggestedResult.Address.State),
		LocationDetails: sqltypes.ToNullString(req.LocationDetails),
		LongitudeE6:     sqltypes.ToNullInt32(&suggestedResult.Location.LongitudeE6),
		LatitudeE6:      sqltypes.ToNullInt32(&suggestedResult.Location.LatitudeE6),
		FacilityTypeID:  facilityTypeID,
	})
	if err != nil {
		s.Logger.Errorw("failed to create address", zap.Error(err))
		return nil, status.Error(codes.Internal, "error creating address")
	}

	protoAddress, consistencyToken, err := accountAddressProtoFromSQL(address)
	if err != nil {
		s.Logger.Errorw(errFailedToConvertAddress.Error(), zap.Error(err))
		return nil, errFailedToConvertAddress
	}

	status := patientaccountspb.AddressValidationStatus_ADDRESS_VALIDATION_STATUS_VALID
	if !suggestedResult.IsComplete {
		status = patientaccountspb.AddressValidationStatus_ADDRESS_VALIDATION_STATUS_NEEDS_CONFIRMATION
	}
	return &patientaccountspb.CreateAddressResponse{
		Address:                 protoAddress,
		ConsistencyToken:        consistencyToken,
		SuggestedAddress:        suggestedResult,
		AddressValidationStatus: status,
	}, nil
}

func (s *GRPCServer) DeleteAccountPatientLink(ctx context.Context, r *patientaccountspb.DeleteAccountPatientLinkRequest) (*patientaccountspb.DeleteAccountPatientLinkResponse, error) {
	accountPatientLinkID := r.GetAccountPatientLinkId()
	if accountPatientLinkID == 0 {
		return nil, errNoAccountPatientID
	}

	err := s.DB.DeleteAccountPatientLink(ctx, accountPatientLinkID)
	if err != nil {
		if errors.Is(err, errAccountPatientNotFound) {
			return nil, status.Error(codes.NotFound, err.Error())
		}

		s.Logger.Errorw("failed to delete account patient link", zap.Error(err))
		return nil, status.Error(codes.Internal, "error deleting account patient link")
	}

	return &patientaccountspb.DeleteAccountPatientLinkResponse{}, nil
}

func (s *GRPCServer) DeleteAddress(ctx context.Context, r *patientaccountspb.DeleteAddressRequest) (*patientaccountspb.DeleteAddressResponse, error) {
	addressID := r.GetAddressId()
	if addressID == 0 {
		return nil, errNoAccountAddressID
	}

	err := s.DB.DeleteAccountAddress(ctx, addressID)
	if err != nil {
		if errors.Is(err, errAccountAddressNotFound) {
			return nil, status.Error(codes.NotFound, err.Error())
		}

		s.Logger.Errorw("failed to delete account address", zap.Error(err))
		return nil, status.Error(codes.Internal, "error deleting account address")
	}

	return &patientaccountspb.DeleteAddressResponse{}, nil
}

func (s *GRPCServer) ListAddresses(ctx context.Context, req *patientaccountspb.ListAddressesRequest) (*patientaccountspb.ListAddressesResponse, error) {
	accountID := req.GetAccountId()
	if accountID <= 0 {
		return nil, errNoAccountID
	}

	addresses, err := s.DB.ListAddresses(ctx, accountID)
	if err != nil {
		s.Logger.Errorw("failed to get addresses", zap.Error(err))
		return nil, status.Error(codes.Internal, "error getting account addresses")
	}

	addressResults := make([]*patientaccountspb.ListAddressesResult, len(addresses))
	for i, address := range addresses {
		convertedAddress, consistencyToken, err := accountAddressProtoFromSQL(address)
		if err != nil {
			s.Logger.Errorw(errFailedToConvertAddress.Error(), zap.Error(err))
			return nil, errFailedToConvertAddress
		}

		addressResults[i] = &patientaccountspb.ListAddressesResult{
			Address:          convertedAddress,
			ConsistencyToken: consistencyToken,
		}
	}
	return &patientaccountspb.ListAddressesResponse{
		Results: addressResults,
	}, nil
}

func (s *GRPCServer) GetAddress(ctx context.Context, req *patientaccountspb.GetAddressRequest) (*patientaccountspb.GetAddressResponse, error) {
	addressID := req.GetAddressId()
	if addressID <= 0 {
		return nil, errNoAddressID
	}

	address, err := s.DB.GetAddress(ctx, addressID)
	if err != nil {
		if errors.Is(err, errAccountAddressNotFound) {
			return nil, status.Error(codes.NotFound, err.Error())
		}

		s.Logger.Errorw(errFailedGetAddress.Error(), zap.Error(err))
		return nil, errFailedGetAddress
	}

	convertedAddress, consistencyToken, err := accountAddressProtoFromSQL(address)
	if err != nil {
		s.Logger.Errorw(errFailedToConvertAddress.Error(), zap.Error(err))
		return nil, errFailedToConvertAddress
	}

	return &patientaccountspb.GetAddressResponse{
		Address:          convertedAddress,
		ConsistencyToken: consistencyToken,
	}, nil
}

func (s *GRPCServer) getMapForPatientIDs(ctx context.Context, ids []int64) (map[int64]*patientspb.ListPatientsByIDResult, error) {
	patientMap := map[int64]*patientspb.ListPatientsByIDResult{}
	if len(ids) == 0 {
		return patientMap, nil
	}

	// Retrieve verified patients using patient IDs
	listPatientsByIDResp, err := s.PatientsServiceClient.ListPatientsByID(ctx, &patientspb.ListPatientsByIDRequest{PatientIds: ids})
	if err != nil {
		return nil, errListPatients
	}

	// Create a map to store patient information using patient ID as the key
	for _, patientResult := range listPatientsByIDResp.Results {
		if patientResult.Patient != nil {
			patientID, err := strconv.ParseInt(*patientResult.Patient.Id, 10, 64)
			if err != nil {
				return nil, status.Error(codes.Internal, "failed to parse patient ID")
			}
			patientMap[patientID] = patientResult
		}
	}

	return patientMap, nil
}

func (s *GRPCServer) getMapForUnverifiedPatientIDs(ctx context.Context, ids []int64) (map[int64]*patientspb.ListUnverifiedPatientResult, error) {
	unverifiedPatientMap := map[int64]*patientspb.ListUnverifiedPatientResult{}
	if len(ids) == 0 {
		return unverifiedPatientMap, nil
	}

	// Retrieve unverified patients using unverified patient IDs
	listUnverifiedPatientsResp, err := s.PatientsServiceClient.ListUnverifiedPatients(ctx, &patientspb.ListUnverifiedPatientsRequest{Ids: ids})
	if err != nil {
		return nil, errListPatients
	}

	// Create a map to store unverified patient information using patient ID as the key
	for _, patientResult := range listUnverifiedPatientsResp.Results {
		if patientResult.Patient != nil {
			unverifiedPatientMap[patientResult.Patient.Id] = patientResult
		}
	}

	return unverifiedPatientMap, nil
}

func (s *GRPCServer) ListAccountPatientLinks(ctx context.Context, r *patientaccountspb.ListAccountPatientLinksRequest) (*patientaccountspb.ListAccountPatientLinksResponse, error) {
	logger := s.Logger.With("method", "ListAccountPatientLinks", "account_id", r.GetAccountId())
	accountPatientLinks, err := s.DB.ListAccountPatientLinks(ctx, r.GetAccountId())
	if err != nil {
		logger.Errorw("failed to list account patient links", zap.Error(err))
		return nil, status.Error(codes.Internal, "error listing patients")
	}

	if len(accountPatientLinks) == 0 {
		return &patientaccountspb.ListAccountPatientLinksResponse{}, nil
	}

	var patientIDs []int64
	var unverifiedPatientIDs []int64
	for _, patient := range accountPatientLinks {
		if patient.PatientID.Valid {
			patientIDs = append(patientIDs, patient.PatientID.Int64)
		}

		if patient.UnverifiedPatientID.Valid {
			unverifiedPatientIDs = append(unverifiedPatientIDs, patient.UnverifiedPatientID.Int64)
		}
	}

	patientMap, err := s.getMapForPatientIDs(ctx, patientIDs)
	if err != nil {
		logger.Errorw("error creating map for patient IDs", zap.Error(err))
		return nil, status.Error(codes.Internal, "error creating map for patient IDs")
	}

	unverifiedPatientMap, err := s.getMapForUnverifiedPatientIDs(ctx, unverifiedPatientIDs)
	if err != nil {
		logger.Errorw("error creating map for unverified patient IDs", zap.Error(err))
		return nil, status.Error(codes.Internal, "error creating map for unverified patient IDs")
	}

	var results []*patientaccountspb.ListAccountPatientLinksResult
	for _, accountPatientLink := range accountPatientLinks {
		composedPatient, consistencyToken, err := accountPatientProtoFromSQL(accountPatientLink)
		if err != nil {
			logger.Errorw(errFailedToConvertAccountPatient.Error(), zap.Error(err))
			return nil, errFailedToConvertAccountPatient
		}

		result := &patientaccountspb.ListAccountPatientLinksResult{
			AccountPatientLink: composedPatient,
			ConsistencyToken:   consistencyToken,
		}

		if verifiedPatientResult, ok := patientMap[accountPatientLink.PatientID.Int64]; ok {
			result.AccountPatientLink.Patient = &patientaccountspb.AccountPatientLink_VerifiedPatient{VerifiedPatient: verifiedPatientResult.Patient}
			result.AccountPatientLink.ConsistencyToken = verifiedPatientResult.ConsistencyToken
		}

		if unverifiedPatientResult, ok := unverifiedPatientMap[accountPatientLink.UnverifiedPatientID.Int64]; ok {
			result.AccountPatientLink.Patient = &patientaccountspb.AccountPatientLink_UnverifiedPatient{UnverifiedPatient: unverifiedPatientResult.Patient}
			result.AccountPatientLink.ConsistencyToken = unverifiedPatientResult.ConsistencyToken
		}

		results = append(results, result)
	}

	return &patientaccountspb.ListAccountPatientLinksResponse{Result: results}, nil
}

func (s *GRPCServer) UpdateAddress(ctx context.Context, req *patientaccountspb.UpdateAddressRequest) (*patientaccountspb.UpdateAddressResponse, error) {
	addressID := req.GetAddressId()
	if addressID <= 0 {
		return nil, errNoAddressID
	}

	if len(req.ConsistencyToken) == 0 {
		return nil, errNoConsistencyToken
	}

	addressParams := req.Address
	if addressParams.AddressLineOne == nil && addressParams.AddressLineTwo == nil && addressParams.City == nil && addressParams.State == nil && addressParams.ZipCode == nil && req.LocationDetails == nil {
		return nil, errNoUpdateFields
	}

	if req.FacilityType == nil {
		return nil, errFacilityTypeEmpty
	}

	facilityTypeID, ok := FacilityTypeProtoToID[req.GetFacilityType()]
	if !ok {
		s.Logger.Errorw("Could not find facility type id when updating address", "facility_type", req.FacilityType.String())
		return nil, errFacilityTypeNotFound
	}

	suggestedResult, err := s.validateAddress(ctx, &googlemapsclient.ValidateAddressRequest{
		Address:                            req.Address,
		PreviousGoogleValidationResponseID: req.PreviousGoogleValidationResponseId,
	})
	if err != nil {
		s.Logger.Errorw("failed to validate address when updating address", zap.Error(err))
		return nil, errValidatingAddress
	}
	if !suggestedResult.GetGeocodeable() {
		return &patientaccountspb.UpdateAddressResponse{
			SuggestedAddress:        suggestedResult,
			AddressValidationStatus: patientaccountspb.AddressValidationStatus_ADDRESS_VALIDATION_STATUS_INVALID,
		}, nil
	}

	getAddressResponse, err := s.GetAddress(ctx, &patientaccountspb.GetAddressRequest{AddressId: addressID})
	if err != nil {
		return nil, err
	}
	if !bytes.Equal(getAddressResponse.ConsistencyToken, req.ConsistencyToken) {
		return nil, errInvalidConsistencyToken
	}

	address, err := s.DB.UpdateAddress(ctx, patientaccountssql.UpdateAddressParams{
		ID:              addressID,
		AddressLineOne:  sqltypes.ToNullString(suggestedResult.Address.AddressLineOne),
		AddressLineTwo:  sqltypes.ToNullString(suggestedResult.Address.AddressLineTwo),
		City:            sqltypes.ToNullString(suggestedResult.Address.City),
		StateCode:       sqltypes.ToNullString(suggestedResult.Address.State),
		Zipcode:         sqltypes.ToNullString(suggestedResult.Address.ZipCode),
		LocationDetails: sqltypes.ToNullString(req.LocationDetails),
		LongitudeE6:     sqltypes.ToNullInt32(&suggestedResult.Location.LongitudeE6),
		LatitudeE6:      sqltypes.ToNullInt32(&suggestedResult.Location.LatitudeE6),
		FacilityTypeID:  facilityTypeID,
	})
	if err != nil {
		s.Logger.Errorw("failed to update address", zap.Error(err))
		return nil, status.Error(codes.Internal, "error updating address")
	}

	protoAddress, consistencyToken, err := accountAddressProtoFromSQL(address)
	if err != nil {
		s.Logger.Errorw(errFailedToConvertAddress.Error(), zap.Error(err))
		return nil, errFailedToConvertAddress
	}

	status := patientaccountspb.AddressValidationStatus_ADDRESS_VALIDATION_STATUS_VALID
	if !suggestedResult.IsComplete {
		status = patientaccountspb.AddressValidationStatus_ADDRESS_VALIDATION_STATUS_NEEDS_CONFIRMATION
	}
	return &patientaccountspb.UpdateAddressResponse{
		Address:                 protoAddress,
		ConsistencyToken:        consistencyToken,
		SuggestedAddress:        suggestedResult,
		AddressValidationStatus: status,
	}, nil
}

func (s *GRPCServer) GetAccountPatientLink(ctx context.Context, r *patientaccountspb.GetAccountPatientLinkRequest) (*patientaccountspb.GetAccountPatientLinkResponse, error) {
	accountPatientLinkID := r.GetAccountPatientLinkId()
	if accountPatientLinkID <= 0 {
		return nil, errNoAccountPatientID
	}

	getAccountPatientResp, err := s.DB.GetAccountPatientLink(ctx, accountPatientLinkID)
	if err != nil {
		s.Logger.Errorw(errFailedGetAccountPatient.Error(), zap.Error(err))
		return nil, errFailedGetAccountPatient
	}

	patient, consistencyToken, err := accountPatientProtoFromSQL(getAccountPatientResp)
	if err != nil {
		s.Logger.Errorw(errFailedToConvertAccountPatient.Error(), zap.Error(err))
		return nil, errFailedToConvertAccountPatient
	}

	response := &patientaccountspb.GetAccountPatientLinkResponse{
		AccountPatientLink: patient,
		ConsistencyToken:   consistencyToken,
	}

	if getAccountPatientResp.PatientID.Valid {
		verifiedPatientID := strconv.FormatInt(getAccountPatientResp.PatientID.Int64, 10)
		getPatientResp, err := s.PatientsServiceClient.GetPatient(ctx, &patientspb.GetPatientRequest{PatientId: &verifiedPatientID})
		if err != nil {
			s.Logger.Errorw("GetAccountPatient: failed to get verified patient", zap.Error(err))
			return nil, status.Error(codes.Internal, "failed to get verified patient")
		}
		response.AccountPatientLink.Patient = &patientaccountspb.AccountPatientLink_VerifiedPatient{VerifiedPatient: getPatientResp.Patient}
		response.AccountPatientLink.ConsistencyToken = getPatientResp.GetConsistencyToken()
	} else {
		getUnverifiedPatientResp, err := s.PatientsServiceClient.GetUnverifiedPatient(ctx, &patientspb.GetUnverifiedPatientRequest{Id: &getAccountPatientResp.UnverifiedPatientID.Int64})
		if err != nil {
			s.Logger.Errorw("GetAccountPatient: failed to get unverified patient", zap.Error(err))
			return nil, errFailedToGetUnverifiedPatient
		}
		response.AccountPatientLink.Patient = &patientaccountspb.AccountPatientLink_UnverifiedPatient{UnverifiedPatient: getUnverifiedPatientResp.Patient}
		response.AccountPatientLink.ConsistencyToken = getUnverifiedPatientResp.GetConsistencyToken()
	}

	return response, nil
}

func (s *GRPCServer) AddUnverifiedAccountPatientLink(ctx context.Context, r *patientaccountspb.AddUnverifiedAccountPatientLinkRequest) (*patientaccountspb.AddUnverifiedAccountPatientLinkResponse, error) {
	accountID := r.GetAccountId()
	if accountID == 0 {
		return nil, errNoAccountID
	}

	unverifiedPatientID := r.GetUnverifiedPatientId()
	if unverifiedPatientID <= 0 {
		return nil, errInvalidUnverifiedPatientID
	}

	if r.ConsentingRelationship == nil {
		return nil, errNoConsentingRelationship
	}
	consentingRelationshipID, ok := ConsentingRelationshipCategoryProtoToID[r.GetConsentingRelationship().GetCategory()]
	if !ok {
		return nil, errNoConsentingRelationshipCategory
	}

	logger := s.Logger.With("method", "AddUnverifiedAccountPatientLink", "accountID", accountID, "unverifiedPatientID", unverifiedPatientID)

	getUnverifiedPatientResponse, err := s.PatientsServiceClient.GetUnverifiedPatient(ctx, &patientspb.GetUnverifiedPatientRequest{Id: &unverifiedPatientID})
	if err != nil {
		if statusErr, ok := status.FromError(err); ok {
			if statusErr.Code() == codes.NotFound {
				logger.Errorw("unverified patient not found", zap.Error(err))
				return nil, err
			}
		}
		logger.Errorw(errFailedToGetUnverifiedPatient.Error(), zap.Error(err))
		return nil, errFailedToGetUnverifiedPatient
	}

	createAccountPatientResp, err := s.DB.AddAccountPatientLink(ctx, &patientaccountssql.AddAccountPatientLinkParams{
		AccountID:                r.AccountId,
		UnverifiedPatientID:      sqltypes.ToValidNullInt64(unverifiedPatientID),
		AccessLevelID:            AccessLevelIDUnverified.Int64(),
		ConsentingRelationshipID: consentingRelationshipID,
	})
	if err != nil {
		logger.Errorw("failed to create account patient", zap.Error(err))
		return nil, status.Error(codes.Internal, "failed to create account patient")
	}

	accountPatientLink, consistencyToken, err := accountPatientProtoFromSQL(createAccountPatientResp)
	if err != nil {
		logger.Errorw("failed to convert account patient", zap.Error(err))
		return nil, status.Error(codes.Internal, "failed to convert patient")
	}

	accountPatientLink.Patient = &patientaccountspb.AccountPatientLink_UnverifiedPatient{UnverifiedPatient: getUnverifiedPatientResponse.Patient}

	return &patientaccountspb.AddUnverifiedAccountPatientLinkResponse{
		AccountPatientLink: accountPatientLink,
		ConsistencyToken:   consistencyToken,
	}, nil
}

func (s *GRPCServer) UpdateAccountPatientLink(ctx context.Context, r *patientaccountspb.UpdateAccountPatientLinkRequest) (*patientaccountspb.UpdateAccountPatientLinkResponse, error) {
	// TODO: [PT-1673]: Authorize UpdateAccountPatientLink
	accountPatientLinkID := r.GetAccountPatientLinkId()
	if accountPatientLinkID == 0 {
		return nil, errNoAccountID
	}

	accessLevelID, ok := AccessLevelProtoToID[r.GetAccessLevel()]
	if !ok {
		return nil, errNoAccessLevel
	}

	if r.ConsentingRelationship == nil {
		return nil, errNoConsentingRelationship
	}
	consentingRelationshipID, ok := ConsentingRelationshipCategoryProtoToID[r.GetConsentingRelationship().GetCategory()]
	if !ok {
		return nil, errNoConsentingRelationshipCategory
	}

	if r.ConsistencyToken == nil {
		return nil, errNoConsistencyToken
	}

	logger := s.Logger.With("method", "UpdateAccountPatientLink", "accountPatientID", accountPatientLinkID)

	getAccountPatientLinkResponse, err := s.GetAccountPatientLink(ctx, &patientaccountspb.GetAccountPatientLinkRequest{AccountPatientLinkId: accountPatientLinkID})
	if err != nil {
		logger.Errorw("failed to get account patient", zap.Error(err))
		return nil, errFailedGetAccountPatient
	}

	if !bytes.Equal(r.ConsistencyToken, getAccountPatientLinkResponse.ConsistencyToken) {
		logger.Errorw("consistency tokens do not match", zap.Error(err))
		return nil, errInvalidConsistencyToken
	}

	updateAccountPatientLinkResult, err := s.DB.UpdateAccountPatientLink(ctx, &patientaccountssql.UpdateAccountPatientLinkParams{
		ID:                       accountPatientLinkID,
		AccessLevelID:            accessLevelID,
		ConsentingRelationshipID: consentingRelationshipID,
	})
	if err != nil {
		logger.Errorw("failed to update account patient", zap.Error(err))
		return nil, status.Error(codes.Internal, "failed to update account patient")
	}

	accountPatientLink, consistencyToken, err := accountPatientProtoFromSQL(updateAccountPatientLinkResult)
	if err != nil {
		logger.Errorw("failed to convert account patient to proto", zap.Error(err))
		return nil, status.Error(codes.Internal, "failed to convert account patient to proto")
	}

	return &patientaccountspb.UpdateAccountPatientLinkResponse{
		AccountPatientLink: accountPatientLink,
		ConsistencyToken:   consistencyToken,
	}, nil
}

func (s *GRPCServer) validateAddress(ctx context.Context, req *googlemapsclient.ValidateAddressRequest) (*patientaccountspb.SuggestedAddress, error) {
	suggestedAddress, err := s.AddressValidationClient.ValidateAddress(ctx, req)
	if err != nil || suggestedAddress == nil {
		s.Logger.Errorw("failed to validate address", zap.Error(err))
		return nil, errValidatingAddress
	}

	suggestedResult := &patientaccountspb.SuggestedAddress{
		Address:                    suggestedAddress.Address,
		GoogleValidationResponseId: suggestedAddress.GoogleValidationResponseID,
		Location:                   suggestedAddress.Location,
		Reasons:                    suggestedAddress.Reasons,
		Geocodeable:                suggestedAddress.Geocodeable,
		IsComplete:                 suggestedAddress.IsComplete,
	}
	return suggestedResult, nil
}
