package main

import (
	"context"
	"errors"
	"fmt"
	"strconv"
	"testing"
	"time"

	"github.com/*company-data-covered*/services/go/pkg/auth"
	"github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
	"github.com/*company-data-covered*/services/go/pkg/generated/proto/patients"
	patientaccountspb "github.com/*company-data-covered*/services/go/pkg/generated/proto/patients/accounts"
	patientaccountssql "github.com/*company-data-covered*/services/go/pkg/generated/sql/patientaccounts"
	"github.com/*company-data-covered*/services/go/pkg/googlemapsclient"
	"github.com/*company-data-covered*/services/go/pkg/protoconv"
	"github.com/*company-data-covered*/services/go/pkg/sqltypes"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"go.uber.org/zap"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/types/known/timestamppb"
)

var (
	mustMatchAccount          = testutils.MustMatchFn(".CreatedAt", ".UpdatedAt")
	mustMatchAccountWithoutID = testutils.MustMatchFn(".ID", ".CreatedAt", ".UpdatedAt")
	mustMatchAddressWithoutID = testutils.MustMatchFn(".ID", ".CreatedAt", ".UpdatedAt", ".DeletedAt")
	mustMatchAddress          = testutils.MustMatchProtoFn()
	invalidDate               = time.Date(100000, time.January, 1, 0, 0, 0, 0, time.UTC)
)

func testEmail(id int64) string {
	return fmt.Sprintf("test%d@example.com", id)
}

func getExampleAddress(id int64, accountID int64, updatedAt time.Time) *patientaccountssql.Address {
	return &patientaccountssql.Address{
		ID:              id,
		AccountID:       accountID,
		AddressLineOne:  sqltypes.ToValidNullString(fmt.Sprintf("%d main st", id)),
		AddressLineTwo:  sqltypes.ToValidNullString("#2"),
		City:            sqltypes.ToValidNullString("springfield"),
		Zipcode:         sqltypes.ToValidNullString("90210"),
		StateCode:       sqltypes.ToValidNullString("CA"),
		LocationDetails: sqltypes.ToValidNullString("brick house"),
		UpdatedAt:       updatedAt,
		LatitudeE6:      sqltypes.ToNullInt32(proto.Int32(37422410)),
		LongitudeE6:     sqltypes.ToNullInt32(proto.Int32(-122084168)),
		FacilityTypeID:  FacilityTypeProtoToID[patientaccountspb.FacilityType_FACILITY_TYPE_HOME],
	}
}

func getExampleAccountPatient(id int64, accountID int64, updatedAt time.Time) *patientaccountssql.AccountPatientLink {
	return &patientaccountssql.AccountPatientLink{
		ID:                       id,
		AccountID:                accountID,
		PatientID:                sqltypes.ToValidNullInt64(1),
		AccessLevelID:            AccessLevelIDPrimary.Int64(),
		ConsentingRelationshipID: ConsentingRelationshipIDSelf.Int64(),
		UpdatedAt:                updatedAt,
	}
}

func getAddressConsistencyToken(t *testing.T, address *patientaccountspb.AccountAddress) []byte {
	consistencyToken, err := protoconv.TimestampToBytes(address.UpdatedAt)
	if err != nil {
		t.Fatalf("error generating consistency token: %s", err.Error())
	}
	return consistencyToken
}

func contextWithAuth() context.Context {
	return metadata.NewIncomingContext(
		context.Background(),
		metadata.Pairs("authorization", "Bearer faketoken"),
	)
}

func TestFindOrCreateAccountByToken(t *testing.T) {
	errUnexpectedCreate := errors.New("account should not be created")
	now := time.Now()
	baseID := now.UnixNano()
	id1 := baseID + 1
	email := testEmail(id1)
	auth0ID := strconv.FormatInt(id1, 10)
	accountSQL := &patientaccountssql.Account{
		ID:          id1,
		Auth0ID:     auth0ID,
		Email:       email,
		GivenName:   sqltypes.ToNullString(nil),
		FamilyName:  sqltypes.ToNullString(nil),
		PhoneNumber: sqltypes.ToNullString(nil),
		UpdatedAt:   now,
	}
	accountProto, accountConsistencyToken, _ := accountProtoFromSQL(accountSQL)

	invalidPhoneAccountSQL := &patientaccountssql.Account{
		ID:          id1,
		Auth0ID:     auth0ID,
		Email:       email,
		GivenName:   sqltypes.ToNullString(nil),
		FamilyName:  sqltypes.ToNullString(nil),
		PhoneNumber: sqltypes.ToValidNullString("1"),
		UpdatedAt:   now,
	}

	invalidUpdatedAtAccountSQL := &patientaccountssql.Account{
		ID:          id1,
		Auth0ID:     auth0ID,
		Email:       email,
		GivenName:   sqltypes.ToNullString(nil),
		FamilyName:  sqltypes.ToNullString(nil),
		PhoneNumber: sqltypes.ToNullString(nil),
		UpdatedAt:   invalidDate,
	}

	ctxWithAuth := contextWithAuth()
	ctxWithClaims := auth.ContextWithClaims(ctxWithAuth, &auth.CustomClaims{
		Properties: map[string]any{
			claimPropertyIdentityProviderUserIDKey: auth0ID,
			claimPropertyEmailKey:                  email,
		},
	})
	ctxWithBadEmail := auth.ContextWithClaims(ctxWithAuth, &auth.CustomClaims{
		Properties: map[string]any{
			claimPropertyIdentityProviderUserIDKey: auth0ID,
			claimPropertyEmailKey:                  "",
		},
	})
	ctxWithNilEmail := auth.ContextWithClaims(ctxWithAuth, &auth.CustomClaims{
		Properties: map[string]any{
			claimPropertyIdentityProviderUserIDKey: auth0ID,
			claimPropertyEmailKey:                  nil,
		},
	})
	ctxWithNilAuth0ID := auth.ContextWithClaims(ctxWithAuth, &auth.CustomClaims{
		Properties: map[string]any{
			claimPropertyIdentityProviderUserIDKey: nil,
			claimPropertyEmailKey:                  email,
		},
	})
	ctxWithBadAuth0ID := auth.ContextWithClaims(ctxWithAuth, &auth.CustomClaims{
		Properties: map[string]any{
			claimPropertyEmailKey: email,
		},
	})

	tcs := []struct {
		name          string
		ctx           context.Context
		mockDBService *mockPatientAccountsDB

		want         *patientaccountspb.FindOrCreateAccountByTokenResponse
		wantGRPCCode codes.Code
	}{
		{
			name: "success - account exists",
			ctx:  ctxWithClaims,
			mockDBService: &mockPatientAccountsDB{
				getAccountByAuth0IDResult: accountSQL,
				createAccountErr:          errUnexpectedCreate,
			},

			wantGRPCCode: codes.OK,
			want: &patientaccountspb.FindOrCreateAccountByTokenResponse{
				Account:          accountProto,
				ConsistencyToken: accountConsistencyToken,
			},
		},
		{
			name: "success - account does not exist - with not found error",
			ctx:  ctxWithClaims,
			mockDBService: &mockPatientAccountsDB{
				getAccountByAuth0IDErr: errAccountNotFound,
				createAccountResult:    accountSQL,
			},

			wantGRPCCode: codes.OK,
			want: &patientaccountspb.FindOrCreateAccountByTokenResponse{
				Account:          accountProto,
				ConsistencyToken: accountConsistencyToken,
			},
		},
		{
			name: "success - account does not exist - without not found error",
			ctx:  ctxWithClaims,
			mockDBService: &mockPatientAccountsDB{
				getAccountByAuth0IDResult: nil,
				createAccountResult:       accountSQL,
			},

			wantGRPCCode: codes.OK,
			want: &patientaccountspb.FindOrCreateAccountByTokenResponse{
				Account:          accountProto,
				ConsistencyToken: accountConsistencyToken,
			},
		},
		{
			name: "error - claims not ok",
			ctx:  ctxWithAuth,
			mockDBService: &mockPatientAccountsDB{
				getAccountByAuth0IDResult: nil,
				createAccountResult:       accountSQL,
			},

			wantGRPCCode: codes.Unauthenticated,
		},
		{
			name: "error - no email claim",
			ctx:  ctxWithBadEmail,
			mockDBService: &mockPatientAccountsDB{
				getAccountByAuth0IDResult: nil,
				createAccountResult:       accountSQL,
			},

			wantGRPCCode: codes.Unauthenticated,
		},
		{
			name: "error - nil email claim",
			ctx:  ctxWithNilEmail,
			mockDBService: &mockPatientAccountsDB{
				getAccountByAuth0IDResult: nil,
				createAccountResult:       accountSQL,
			},

			wantGRPCCode: codes.Unauthenticated,
		},
		{
			name: "error - no auth0ID claim",
			ctx:  ctxWithBadAuth0ID,
			mockDBService: &mockPatientAccountsDB{
				getAccountByAuth0IDResult: nil,
				createAccountResult:       accountSQL,
			},

			wantGRPCCode: codes.Unauthenticated,
		},
		{
			name: "error - nil auth0ID claim",
			ctx:  ctxWithNilAuth0ID,
			mockDBService: &mockPatientAccountsDB{
				getAccountByAuth0IDResult: nil,
				createAccountResult:       accountSQL,
			},

			wantGRPCCode: codes.Unauthenticated,
		},
		{
			name: "error - failed to get account",
			ctx:  ctxWithClaims,
			mockDBService: &mockPatientAccountsDB{
				getAccountByAuth0IDErr: errors.New("a weird error"),
			},

			wantGRPCCode: codes.Internal,
		},
		{
			name: "error - failed to create account",
			ctx:  ctxWithClaims,
			mockDBService: &mockPatientAccountsDB{
				getAccountByAuth0IDErr: errAccountNotFound,
				createAccountErr:       errors.New("oh no, a creation error"),
			},

			wantGRPCCode: codes.Internal,
		},
		{
			name: "error - failed to convert account to proto",
			ctx:  ctxWithClaims,
			mockDBService: &mockPatientAccountsDB{
				getAccountByAuth0IDResult: nil,
				createAccountResult:       invalidPhoneAccountSQL,
			},

			wantGRPCCode: codes.Internal,
		},
		{
			name: "error - failed to generate consistency token",
			ctx:  ctxWithClaims,
			mockDBService: &mockPatientAccountsDB{
				getAccountByAuth0IDResult: invalidUpdatedAtAccountSQL,
				createAccountErr:          errUnexpectedCreate,
			},

			wantGRPCCode: codes.Internal,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.name, func(t *testing.T) {
			grpcServer := GRPCServer{
				DB:     tc.mockDBService,
				Logger: zap.NewNop().Sugar(),
			}
			resp, err := grpcServer.FindOrCreateAccountByToken(tc.ctx, &patientaccountspb.FindOrCreateAccountByTokenRequest{})
			reqStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}
			testutils.MustMatch(t, tc.wantGRPCCode, reqStatus.Code())
			testutils.MustMatchProto(t, tc.want, resp)
		})
	}
}

func TestGRPCServerGetAccount(t *testing.T) {
	now := time.Now()
	baseID := now.UnixNano()
	id1 := baseID + 1
	auth0ID := strconv.FormatInt(id1, 10)
	email := testEmail(id1)
	givenName := "given"
	familyName := "family"
	phoneNumber := "+13035551234"

	accountSQL := patientaccountssql.Account{
		ID:          id1,
		Auth0ID:     auth0ID,
		Email:       email,
		GivenName:   sqltypes.ToValidNullString(givenName),
		FamilyName:  sqltypes.ToValidNullString(familyName),
		PhoneNumber: sqltypes.ToValidNullString(phoneNumber),
		UpdatedAt:   now,
	}
	accountProto, accountConsistencyToken, _ := accountProtoFromSQL(&accountSQL)

	invalidAccountSQL := patientaccountssql.Account{
		ID:          id1,
		Auth0ID:     auth0ID,
		Email:       email,
		GivenName:   sqltypes.ToValidNullString(givenName),
		FamilyName:  sqltypes.ToValidNullString(familyName),
		PhoneNumber: sqltypes.ToValidNullString("1"),
		UpdatedAt:   now,
	}

	tcs := []struct {
		name          string
		mockDBService *mockPatientAccountsDB
		request       *patientaccountspb.GetAccountRequest

		want         *patientaccountspb.GetAccountResponse
		wantGRPCCode codes.Code
	}{
		{
			name: "success - base case",
			mockDBService: &mockPatientAccountsDB{
				getAccountResult: &accountSQL,
			},
			request: &patientaccountspb.GetAccountRequest{
				AccountId: id1,
			},

			wantGRPCCode: codes.OK,
			want: &patientaccountspb.GetAccountResponse{
				Account:          accountProto,
				ConsistencyToken: accountConsistencyToken,
			},
		},
		{
			name: "error - not found",
			mockDBService: &mockPatientAccountsDB{
				getAccountErr: errAccountNotFound,
			},
			request: &patientaccountspb.GetAccountRequest{
				AccountId: id1,
			},

			wantGRPCCode: codes.NotFound,
		},
		{
			name: "error - invalid account id",
			mockDBService: &mockPatientAccountsDB{
				getAccountResult: &accountSQL,
			},
			request: &patientaccountspb.GetAccountRequest{},

			wantGRPCCode: codes.InvalidArgument,
		},
		{
			name: "error - get account failed",
			mockDBService: &mockPatientAccountsDB{
				getAccountErr: errors.New("get account failed"),
			},
			request: &patientaccountspb.GetAccountRequest{
				AccountId: id1,
			},

			wantGRPCCode: codes.Internal,
		},
		{
			name: "error - failed to convert account to proto",
			mockDBService: &mockPatientAccountsDB{
				getAccountResult: &invalidAccountSQL,
			},
			request: &patientaccountspb.GetAccountRequest{
				AccountId: id1,
			},

			wantGRPCCode: codes.Internal,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.name, func(t *testing.T) {
			grpcServer := GRPCServer{
				DB:     tc.mockDBService,
				Logger: zap.NewNop().Sugar(),
			}
			resp, err := grpcServer.GetAccount(context.Background(), tc.request)
			reqStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}
			testutils.MustMatch(t, tc.wantGRPCCode, reqStatus.Code())
			testutils.MustMatchProto(t, tc.want, resp)
		})
	}
}

func TestGRPCServerUpdateAccount(t *testing.T) {
	now := time.Now()
	later := time.Now().Add(10 * time.Minute)
	baseID := now.UnixNano()
	id1 := baseID + 1
	auth0ID := strconv.FormatInt(id1, 10)
	email := testEmail(id1)
	givenName := "given"
	newGivenName := "new given"
	familyName := "family"
	newFamilyName := "new family"
	phoneNumber := "+13035551234"
	newPhoneNumber := "+13035556789"

	originalAccountSQL := patientaccountssql.Account{
		ID:          id1,
		Auth0ID:     auth0ID,
		Email:       email,
		GivenName:   sqltypes.ToValidNullString(givenName),
		FamilyName:  sqltypes.ToValidNullString(familyName),
		PhoneNumber: sqltypes.ToValidNullString(phoneNumber),
		UpdatedAt:   now,
	}
	_, originalConsistencyToken, _ := accountProtoFromSQL(&originalAccountSQL)

	nameUpdateOnlyAccountSQL := patientaccountssql.Account{
		ID:          id1,
		Auth0ID:     auth0ID,
		Email:       email,
		GivenName:   sqltypes.ToValidNullString(newGivenName),
		FamilyName:  sqltypes.ToValidNullString(newFamilyName),
		PhoneNumber: sqltypes.ToValidNullString(phoneNumber),
		UpdatedAt:   later,
	}
	nameOnlyAccountProto, nameOnlyConsistencyToken, _ := accountProtoFromSQL(&nameUpdateOnlyAccountSQL)

	phoneUpdateOnlyAccountSQL := patientaccountssql.Account{
		ID:          id1,
		Auth0ID:     auth0ID,
		Email:       email,
		GivenName:   sqltypes.ToValidNullString(givenName),
		FamilyName:  sqltypes.ToValidNullString(familyName),
		PhoneNumber: sqltypes.ToValidNullString(newPhoneNumber),
		UpdatedAt:   later,
	}
	phoneOnlyAccountProto, phoneOnlyConsistencyToken, _ := accountProtoFromSQL(&phoneUpdateOnlyAccountSQL)

	invalidAccountSQL := patientaccountssql.Account{
		ID:          id1,
		Auth0ID:     auth0ID,
		Email:       email,
		GivenName:   sqltypes.ToValidNullString(givenName),
		FamilyName:  sqltypes.ToValidNullString(familyName),
		PhoneNumber: sqltypes.ToValidNullString("1"),
		UpdatedAt:   now,
	}

	tcs := []struct {
		name          string
		mockDBService *mockPatientAccountsDB
		request       *patientaccountspb.UpdateAccountRequest

		want         *patientaccountspb.UpdateAccountResponse
		wantGRPCCode codes.Code
	}{
		{
			name: "success - base case",
			mockDBService: &mockPatientAccountsDB{
				getAccountResult:    &originalAccountSQL,
				updateAccountResult: &nameUpdateOnlyAccountSQL,
			},
			request: &patientaccountspb.UpdateAccountRequest{
				AccountId:        id1,
				GivenName:        nameOnlyAccountProto.GivenName,
				FamilyName:       nameOnlyAccountProto.FamilyName,
				ConsistencyToken: originalConsistencyToken,
			},

			wantGRPCCode: codes.OK,
			want: &patientaccountspb.UpdateAccountResponse{
				Account:          nameOnlyAccountProto,
				ConsistencyToken: nameOnlyConsistencyToken,
			},
		},
		{
			name: "success - only phone update",
			mockDBService: &mockPatientAccountsDB{
				getAccountResult:    &originalAccountSQL,
				updateAccountResult: &phoneUpdateOnlyAccountSQL,
			},
			request: &patientaccountspb.UpdateAccountRequest{
				AccountId:        id1,
				Number:           phoneOnlyAccountProto.Number,
				ConsistencyToken: originalConsistencyToken,
			},

			wantGRPCCode: codes.OK,
			want: &patientaccountspb.UpdateAccountResponse{
				Account:          phoneOnlyAccountProto,
				ConsistencyToken: phoneOnlyConsistencyToken,
			},
		},
		{
			name: "error - invalid account id",
			mockDBService: &mockPatientAccountsDB{
				getAccountResult:    &originalAccountSQL,
				updateAccountResult: &nameUpdateOnlyAccountSQL,
			},
			request: &patientaccountspb.UpdateAccountRequest{
				ConsistencyToken: originalConsistencyToken,
			},

			wantGRPCCode: codes.InvalidArgument,
		},
		{
			name: "error - no consistency token",
			mockDBService: &mockPatientAccountsDB{
				getAccountResult:    &originalAccountSQL,
				updateAccountResult: &nameUpdateOnlyAccountSQL,
			},
			request: &patientaccountspb.UpdateAccountRequest{
				AccountId:  id1,
				GivenName:  nameOnlyAccountProto.GivenName,
				FamilyName: nameOnlyAccountProto.FamilyName,
			},

			wantGRPCCode: codes.InvalidArgument,
		},
		{
			name: "error - no fields to update",
			mockDBService: &mockPatientAccountsDB{
				getAccountResult:    &originalAccountSQL,
				updateAccountResult: &nameUpdateOnlyAccountSQL,
			},
			request: &patientaccountspb.UpdateAccountRequest{
				AccountId:        id1,
				ConsistencyToken: originalConsistencyToken,
			},

			wantGRPCCode: codes.InvalidArgument,
		},
		{
			name: "error - get account failed",
			mockDBService: &mockPatientAccountsDB{
				getAccountErr:       errors.New("oh no, an error"),
				updateAccountResult: &nameUpdateOnlyAccountSQL,
			},
			request: &patientaccountspb.UpdateAccountRequest{
				AccountId:        id1,
				GivenName:        nameOnlyAccountProto.GivenName,
				FamilyName:       nameOnlyAccountProto.FamilyName,
				ConsistencyToken: originalConsistencyToken,
			},

			wantGRPCCode: codes.Internal,
		},
		{
			name: "error - consistency token is wrong",
			mockDBService: &mockPatientAccountsDB{
				getAccountResult:    &originalAccountSQL,
				updateAccountResult: &nameUpdateOnlyAccountSQL,
			},
			request: &patientaccountspb.UpdateAccountRequest{
				AccountId:        id1,
				GivenName:        nameOnlyAccountProto.GivenName,
				FamilyName:       nameOnlyAccountProto.FamilyName,
				ConsistencyToken: nameOnlyConsistencyToken,
			},

			wantGRPCCode: codes.FailedPrecondition,
		},
		{
			name: "error - not found during update",
			mockDBService: &mockPatientAccountsDB{
				getAccountResult: &originalAccountSQL,
				updateAccountErr: errAccountNotFound,
			},
			request: &patientaccountspb.UpdateAccountRequest{
				AccountId:        id1,
				GivenName:        nameOnlyAccountProto.GivenName,
				FamilyName:       nameOnlyAccountProto.FamilyName,
				ConsistencyToken: originalConsistencyToken,
			},

			wantGRPCCode: codes.NotFound,
		},
		{
			name: "error - failed to update",
			mockDBService: &mockPatientAccountsDB{
				getAccountResult: &originalAccountSQL,
				updateAccountErr: errors.New("ahhhh, errors everywhere"),
			},
			request: &patientaccountspb.UpdateAccountRequest{
				AccountId:        id1,
				GivenName:        nameOnlyAccountProto.GivenName,
				FamilyName:       nameOnlyAccountProto.FamilyName,
				ConsistencyToken: originalConsistencyToken,
			},

			wantGRPCCode: codes.Internal,
		},
		{
			name: "error - failed to convert account to proto",
			mockDBService: &mockPatientAccountsDB{
				getAccountResult:    &originalAccountSQL,
				updateAccountResult: &invalidAccountSQL,
			},
			request: &patientaccountspb.UpdateAccountRequest{
				AccountId:        id1,
				GivenName:        nameOnlyAccountProto.GivenName,
				FamilyName:       nameOnlyAccountProto.FamilyName,
				ConsistencyToken: originalConsistencyToken,
			},

			wantGRPCCode: codes.Internal,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.name, func(t *testing.T) {
			grpcServer := GRPCServer{
				DB:     tc.mockDBService,
				Logger: zap.NewNop().Sugar(),
			}
			resp, err := grpcServer.UpdateAccount(context.Background(), tc.request)
			reqStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}
			testutils.MustMatch(t, tc.wantGRPCCode, reqStatus.Code())
			testutils.MustMatchProto(t, tc.want, resp)
		})
	}
}

func TestCreateAccountAddress(t *testing.T) {
	now := time.Now()
	baseID := now.UnixNano()
	id1 := baseID + 1
	id2 := baseID + 2
	id3 := baseID + 3
	id4 := baseID + 4

	addressSQL := getExampleAddress(id1, id2, now)
	addressProto, _, _ := accountAddressProtoFromSQL(addressSQL)

	responseID := "asff-ffsa-asff-ffsa"
	validCommonAddress := &common.Address{
		AddressLineOne: addressProto.Address.AddressLineOne,
		AddressLineTwo: addressProto.Address.AddressLineTwo,
		City:           addressProto.Address.City,
		State:          addressProto.Address.State,
		ZipCode:        addressProto.Address.ZipCode,
	}
	validLoc := &common.Location{
		LatitudeE6:  37422410,
		LongitudeE6: -122084168,
	}
	validSuggestedAddress := &patientaccountspb.SuggestedAddress{
		Address:                    validCommonAddress,
		Geocodeable:                true,
		IsComplete:                 true,
		GoogleValidationResponseId: responseID,
		Location:                   validLoc,
	}

	validateAddressResult := &googlemapsclient.ValidateAddressResponse{
		Address:                    validCommonAddress,
		Geocodeable:                true,
		IsComplete:                 true,
		GoogleValidationResponseID: responseID,
		Location:                   validLoc,
	}
	incompleteValidateAddressResult := &googlemapsclient.ValidateAddressResponse{
		Address:                    validCommonAddress,
		Geocodeable:                true,
		IsComplete:                 false,
		GoogleValidationResponseID: responseID,
		Location:                   validLoc,
	}
	invalidValidateAddressResult := &googlemapsclient.ValidateAddressResponse{
		Address:                    validCommonAddress,
		Geocodeable:                false,
		IsComplete:                 false,
		Reasons:                    []string{"We weren't able to find the location of your address."},
		GoogleValidationResponseID: responseID,
		Location:                   validLoc,
	}

	addressInvalidUpdatedAtSQL := getExampleAddress(id3, id4, invalidDate)

	tcs := []struct {
		name                  string
		mockDBService         *mockPatientAccountsDB
		request               *patientaccountspb.CreateAddressRequest
		validateAddressResult *googlemapsclient.ValidateAddressResponse
		validateAddressErr    error

		want         *patientaccountspb.CreateAddressResponse
		wantGRPCCode codes.Code
	}{
		{
			name: "success - base case",
			mockDBService: &mockPatientAccountsDB{
				createAccountAddressResult: addressSQL,
			},
			request: &patientaccountspb.CreateAddressRequest{
				AccountId:       addressProto.AccountId,
				Address:         validCommonAddress,
				LocationDetails: addressProto.LocationDetails,
				FacilityType:    patientaccountspb.FacilityType_FACILITY_TYPE_HOME.Enum(),
			},
			validateAddressResult: validateAddressResult,

			wantGRPCCode: codes.OK,
			want: &patientaccountspb.CreateAddressResponse{
				AddressValidationStatus: patientaccountspb.AddressValidationStatus_ADDRESS_VALIDATION_STATUS_VALID,
				Address:                 addressProto,
				ConsistencyToken:        getAddressConsistencyToken(t, addressProto),
				SuggestedAddress:        validSuggestedAddress,
			},
		},
		{
			name: "error - invalid account id",
			mockDBService: &mockPatientAccountsDB{
				createAccountAddressErr: errors.New("create error"),
			},
			request: &patientaccountspb.CreateAddressRequest{
				AccountId:       0,
				Address:         validCommonAddress,
				LocationDetails: addressProto.LocationDetails,
				FacilityType:    patientaccountspb.FacilityType_FACILITY_TYPE_HOME.Enum(),
			},
			validateAddressResult: validateAddressResult,

			wantGRPCCode: codes.InvalidArgument,
		},
		{
			name: "error - invalid address",
			mockDBService: &mockPatientAccountsDB{
				createAccountAddressErr: errors.New("create error"),
			},
			request: &patientaccountspb.CreateAddressRequest{
				AccountId:    id2,
				Address:      nil,
				FacilityType: patientaccountspb.FacilityType_FACILITY_TYPE_HOME.Enum(),
			},
			validateAddressResult: validateAddressResult,

			wantGRPCCode: codes.InvalidArgument,
		},
		{
			name: "error - database error",
			mockDBService: &mockPatientAccountsDB{
				createAccountAddressErr: errors.New("create error"),
			},
			request: &patientaccountspb.CreateAddressRequest{
				AccountId:       addressProto.AccountId,
				Address:         validCommonAddress,
				LocationDetails: addressProto.LocationDetails,
				FacilityType:    patientaccountspb.FacilityType_FACILITY_TYPE_HOME.Enum(),
			},
			validateAddressResult: validateAddressResult,

			wantGRPCCode: codes.Internal,
		},
		{
			name: "error - failed to convert address to proto",
			mockDBService: &mockPatientAccountsDB{
				createAccountAddressResult: addressInvalidUpdatedAtSQL,
			},
			validateAddressResult: validateAddressResult,

			request: &patientaccountspb.CreateAddressRequest{
				AccountId: id2,
				Address: &common.Address{
					AddressLineOne: &addressInvalidUpdatedAtSQL.AddressLineOne.String,
					AddressLineTwo: &addressInvalidUpdatedAtSQL.AddressLineTwo.String,
					City:           &addressInvalidUpdatedAtSQL.City.String,
					State:          &addressInvalidUpdatedAtSQL.StateCode.String,
					ZipCode:        &addressInvalidUpdatedAtSQL.Zipcode.String,
				},
				LocationDetails: &addressInvalidUpdatedAtSQL.LocationDetails.String,
				FacilityType:    patientaccountspb.FacilityType_FACILITY_TYPE_HOME.Enum(),
			},

			wantGRPCCode: codes.Internal,
		},
		{
			name: "invalid - validateAddress short circuits with suggested result",
			request: &patientaccountspb.CreateAddressRequest{
				AccountId:       addressProto.AccountId,
				Address:         validCommonAddress,
				LocationDetails: addressProto.LocationDetails,
				FacilityType:    patientaccountspb.FacilityType_FACILITY_TYPE_HOME.Enum(),
			},
			validateAddressResult: invalidValidateAddressResult,

			wantGRPCCode: codes.OK,
			want: &patientaccountspb.CreateAddressResponse{
				AddressValidationStatus: patientaccountspb.AddressValidationStatus_ADDRESS_VALIDATION_STATUS_INVALID,
				SuggestedAddress: &patientaccountspb.SuggestedAddress{
					Address:                    validCommonAddress,
					Geocodeable:                false,
					GoogleValidationResponseId: responseID,
					Reasons:                    []string{"We weren't able to find the location of your address."},
					Location:                   validLoc,
				},
			},
		},
		{
			name: "needs confirmation - validateAddress returns success but with NEEDS_CONFIRMATION status",
			mockDBService: &mockPatientAccountsDB{
				createAccountAddressResult: addressSQL,
			},
			request: &patientaccountspb.CreateAddressRequest{
				AccountId:       addressProto.AccountId,
				Address:         validCommonAddress,
				LocationDetails: addressProto.LocationDetails,
				FacilityType:    patientaccountspb.FacilityType_FACILITY_TYPE_HOME.Enum(),
			},
			validateAddressResult: incompleteValidateAddressResult,

			wantGRPCCode: codes.OK,
			want: &patientaccountspb.CreateAddressResponse{
				AddressValidationStatus: patientaccountspb.AddressValidationStatus_ADDRESS_VALIDATION_STATUS_NEEDS_CONFIRMATION,
				Address:                 addressProto,
				ConsistencyToken:        getAddressConsistencyToken(t, addressProto),
				SuggestedAddress: &patientaccountspb.SuggestedAddress{
					Address:                    validCommonAddress,
					Geocodeable:                true,
					IsComplete:                 false,
					GoogleValidationResponseId: responseID,
					Location:                   validLoc,
				},
			},
		},
		{
			name: "error - validateAddress throws error",
			request: &patientaccountspb.CreateAddressRequest{
				AccountId:       addressProto.AccountId,
				Address:         validCommonAddress,
				LocationDetails: addressProto.LocationDetails,
				FacilityType:    patientaccountspb.FacilityType_FACILITY_TYPE_HOME.Enum(),
			},
			validateAddressErr: errors.New("waaaa cry waaa"),

			wantGRPCCode: codes.Internal,
		},
		{
			name: "error - empty facility type",
			request: &patientaccountspb.CreateAddressRequest{
				AccountId:       addressProto.AccountId,
				Address:         validCommonAddress,
				LocationDetails: addressProto.LocationDetails,
			},

			wantGRPCCode: codes.InvalidArgument,
		},
		{
			name: "error - invalid facility type",
			request: &patientaccountspb.CreateAddressRequest{
				AccountId:       addressProto.AccountId,
				Address:         validCommonAddress,
				LocationDetails: addressProto.LocationDetails,
				FacilityType:    patientaccountspb.FacilityType_FACILITY_TYPE_UNSPECIFIED.Enum(),
			},

			wantGRPCCode: codes.InvalidArgument,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.name, func(t *testing.T) {
			grpcServer := GRPCServer{
				DB: tc.mockDBService,
				AddressValidationClient: &MockGMapsAddressValidationClient{
					ValidateAddressResult: tc.validateAddressResult,
					ValidateAddressErr:    tc.validateAddressErr,
				},
				Logger: zap.NewNop().Sugar(),
			}
			resp, err := grpcServer.CreateAddress(context.Background(), tc.request)
			reqStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}
			testutils.MustMatch(t, tc.wantGRPCCode, reqStatus.Code())
			testutils.MustMatchProto(t, tc.want, resp)
		})
	}
}

func TestDeleteAccountPatientLink(t *testing.T) {
	baseID := time.Now().UnixNano()
	id1 := baseID + 2

	tcs := []struct {
		name          string
		mockDBService *mockPatientAccountsDB
		request       *patientaccountspb.DeleteAccountPatientLinkRequest

		want         *patientaccountspb.DeleteAccountPatientLinkResponse
		wantGRPCCode codes.Code
	}{
		{
			name: "success - base case",
			mockDBService: &mockPatientAccountsDB{
				deleteAccountPatientErr: nil,
			},
			request: &patientaccountspb.DeleteAccountPatientLinkRequest{
				AccountPatientLinkId: id1,
			},

			wantGRPCCode: codes.OK,
			want:         &patientaccountspb.DeleteAccountPatientLinkResponse{},
		},
		{
			name: "error - invalid account patient id",
			mockDBService: &mockPatientAccountsDB{
				deleteAccountPatientErr: nil,
			},
			request: &patientaccountspb.DeleteAccountPatientLinkRequest{},

			wantGRPCCode: codes.InvalidArgument,
		},
		{
			name: "error - not found",
			mockDBService: &mockPatientAccountsDB{
				deleteAccountPatientErr: errAccountPatientNotFound,
			},
			request: &patientaccountspb.DeleteAccountPatientLinkRequest{
				AccountPatientLinkId: id1,
			},

			wantGRPCCode: codes.NotFound,
		},
		{
			name: "error - delete account patient failed",
			mockDBService: &mockPatientAccountsDB{
				deleteAccountPatientErr: errors.New("uh oh"),
			},
			request: &patientaccountspb.DeleteAccountPatientLinkRequest{
				AccountPatientLinkId: id1,
			},

			wantGRPCCode: codes.Internal,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.name, func(t *testing.T) {
			grpcServer := GRPCServer{
				DB:     tc.mockDBService,
				Logger: zap.NewNop().Sugar(),
			}
			resp, err := grpcServer.DeleteAccountPatientLink(context.Background(), tc.request)
			reqStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}
			testutils.MustMatch(t, tc.wantGRPCCode, reqStatus.Code())
			testutils.MustMatchProto(t, tc.want, resp)
		})
	}
}

func TestDeleteAddress(t *testing.T) {
	baseID := time.Now().UnixNano()
	id1 := baseID + 2

	tcs := []struct {
		name          string
		mockDBService *mockPatientAccountsDB
		request       *patientaccountspb.DeleteAddressRequest

		want         *patientaccountspb.DeleteAddressResponse
		wantGRPCCode codes.Code
	}{
		{
			name: "success - base case",
			mockDBService: &mockPatientAccountsDB{
				deleteAccountAddressErr: nil,
			},
			request: &patientaccountspb.DeleteAddressRequest{
				AddressId: id1,
			},

			wantGRPCCode: codes.OK,
			want:         &patientaccountspb.DeleteAddressResponse{},
		},
		{
			name: "error - invalid account address id",
			mockDBService: &mockPatientAccountsDB{
				deleteAccountAddressErr: nil,
			},
			request: &patientaccountspb.DeleteAddressRequest{},

			wantGRPCCode: codes.InvalidArgument,
		},
		{
			name: "error - not found",
			mockDBService: &mockPatientAccountsDB{
				deleteAccountAddressErr: errAccountAddressNotFound,
			},
			request: &patientaccountspb.DeleteAddressRequest{
				AddressId: id1,
			},

			wantGRPCCode: codes.NotFound,
		},
		{
			name: "error - delete account address failed",
			mockDBService: &mockPatientAccountsDB{
				deleteAccountAddressErr: errors.New("uh oh"),
			},
			request: &patientaccountspb.DeleteAddressRequest{
				AddressId: id1,
			},

			wantGRPCCode: codes.Internal,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.name, func(t *testing.T) {
			grpcServer := GRPCServer{
				DB:     tc.mockDBService,
				Logger: zap.NewNop().Sugar(),
			}
			resp, err := grpcServer.DeleteAddress(context.Background(), tc.request)
			reqStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}
			testutils.MustMatch(t, tc.wantGRPCCode, reqStatus.Code())
			testutils.MustMatchProto(t, tc.want, resp)
		})
	}
}

func TestGRPCServerListAddresses(t *testing.T) {
	baseID := time.Now().UnixNano()
	id1 := baseID + 1
	id2 := baseID + 2
	updatedAt1 := time.Now().In(time.UTC).AddDate(0, 0, -11)
	updatedAt2 := time.Now().In(time.UTC).AddDate(0, 0, -12)
	originalAddressSQL1 := getExampleAddress(id1, id2, updatedAt1)
	originalAddressSQL2 := getExampleAddress(id2, id2, updatedAt2)
	originalAddressProto1, _, _ := accountAddressProtoFromSQL(originalAddressSQL1)
	originalAddressProto2, _, _ := accountAddressProtoFromSQL(originalAddressSQL2)
	invalidUpdatedAtSQL := getExampleAddress(id1, id2, invalidDate)

	tcs := []struct {
		name          string
		mockDBService *mockPatientAccountsDB
		request       *patientaccountspb.ListAddressesRequest

		want         *patientaccountspb.ListAddressesResponse
		wantGRPCCode codes.Code
	}{
		{
			name: "success - base case",
			mockDBService: &mockPatientAccountsDB{
				listAddressesResult: []*patientaccountssql.Address{
					originalAddressSQL1,
					originalAddressSQL2,
				},
			},
			request: &patientaccountspb.ListAddressesRequest{
				AccountId: id2,
			},

			wantGRPCCode: codes.OK,
			want: &patientaccountspb.ListAddressesResponse{
				Results: []*patientaccountspb.ListAddressesResult{
					{
						Address:          originalAddressProto1,
						ConsistencyToken: getAddressConsistencyToken(t, originalAddressProto1),
					},
					{
						Address:          originalAddressProto2,
						ConsistencyToken: getAddressConsistencyToken(t, originalAddressProto2),
					},
				},
			},
		},
		{
			name: "success - returns empty array",
			mockDBService: &mockPatientAccountsDB{
				listAddressesResult: []*patientaccountssql.Address{},
			},
			request: &patientaccountspb.ListAddressesRequest{
				AccountId: id2,
			},

			wantGRPCCode: codes.OK,
			want: &patientaccountspb.ListAddressesResponse{
				Results: []*patientaccountspb.ListAddressesResult{},
			},
		},
		{
			name: "error - database error",
			mockDBService: &mockPatientAccountsDB{
				listAddressesErr: errors.New("create error"),
			},
			request: &patientaccountspb.ListAddressesRequest{
				AccountId: id2,
			},

			wantGRPCCode: codes.Internal,
		},
		{
			name: "error - invalid account id",
			mockDBService: &mockPatientAccountsDB{
				listAddressesResult: []*patientaccountssql.Address{},
			},
			request: &patientaccountspb.ListAddressesRequest{
				AccountId: 0,
			},

			wantGRPCCode: codes.InvalidArgument,
		},
		{
			name: "error - failed to convert address to proto",
			mockDBService: &mockPatientAccountsDB{
				listAddressesResult: []*patientaccountssql.Address{
					originalAddressSQL1,
					invalidUpdatedAtSQL,
				},
			},
			request: &patientaccountspb.ListAddressesRequest{
				AccountId: id2,
			},

			wantGRPCCode: codes.Internal,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.name, func(t *testing.T) {
			grpcServer := GRPCServer{
				DB:     tc.mockDBService,
				Logger: zap.NewNop().Sugar(),
			}
			resp, err := grpcServer.ListAddresses(context.Background(), tc.request)
			respStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, tc.wantGRPCCode, respStatus.Code())
			mustMatchAddress(t, tc.want, resp)
		})
	}
}

func TestGRPCServerGetAddress(t *testing.T) {
	baseID := time.Now().UnixNano()
	id1 := baseID + 1
	id2 := baseID + 2
	updatedAt := time.Now().In(time.UTC).AddDate(0, 0, -11)
	originalAddressSQL := getExampleAddress(id1, id2, updatedAt)
	originalAddressProto, _, _ := accountAddressProtoFromSQL(originalAddressSQL)
	addressWithoutLocation := &patientaccountssql.Address{
		ID:              id1,
		AccountID:       id2,
		AddressLineOne:  sqltypes.ToValidNullString(fmt.Sprintf("%d main st", id1)),
		AddressLineTwo:  sqltypes.ToValidNullString("#2"),
		City:            sqltypes.ToValidNullString("springfield"),
		Zipcode:         sqltypes.ToValidNullString("90210"),
		StateCode:       sqltypes.ToValidNullString("CA"),
		LocationDetails: sqltypes.ToValidNullString("brick house"),
		UpdatedAt:       updatedAt,
	}
	originalAddressWithoutLocationProto, _, _ := accountAddressProtoFromSQL(addressWithoutLocation)

	tcs := []struct {
		name          string
		mockDBService *mockPatientAccountsDB
		request       *patientaccountspb.GetAddressRequest

		want         *patientaccountspb.GetAddressResponse
		wantGRPCCode codes.Code
	}{
		{
			name: "success - base case",
			mockDBService: &mockPatientAccountsDB{
				getAddressResult: getExampleAddress(id1, id2, updatedAt),
			},
			request: &patientaccountspb.GetAddressRequest{
				AddressId: id1,
			},

			wantGRPCCode: codes.OK,
			want: &patientaccountspb.GetAddressResponse{
				Address:          originalAddressProto,
				ConsistencyToken: getAddressConsistencyToken(t, originalAddressProto),
			},
		},
		{
			name: "success - nil location",
			mockDBService: &mockPatientAccountsDB{
				getAddressResult: addressWithoutLocation,
			},
			request: &patientaccountspb.GetAddressRequest{
				AddressId: id1,
			},

			wantGRPCCode: codes.OK,
			want: &patientaccountspb.GetAddressResponse{
				Address:          originalAddressWithoutLocationProto,
				ConsistencyToken: getAddressConsistencyToken(t, originalAddressProto),
			},
		},
		{
			name: "success - nil location",
			mockDBService: &mockPatientAccountsDB{
				getAddressResult: addressWithoutLocation,
			},
			request: &patientaccountspb.GetAddressRequest{
				AddressId: id1,
			},

			wantGRPCCode: codes.OK,
			want: &patientaccountspb.GetAddressResponse{
				Address:          originalAddressWithoutLocationProto,
				ConsistencyToken: getAddressConsistencyToken(t, originalAddressProto),
			},
		},
		{
			name: "error - not found",
			mockDBService: &mockPatientAccountsDB{
				getAddressErr: errAccountAddressNotFound,
			},
			request: &patientaccountspb.GetAddressRequest{
				AddressId: id2,
			},

			wantGRPCCode: codes.NotFound,
		},
		{
			name: "error - database error",
			mockDBService: &mockPatientAccountsDB{
				getAddressErr: errors.New("create error"),
			},
			request: &patientaccountspb.GetAddressRequest{
				AddressId: id2,
			},

			wantGRPCCode: codes.Internal,
		},
		{
			name: "error - invalid account id",
			mockDBService: &mockPatientAccountsDB{
				getAddressResult: &patientaccountssql.Address{},
			},
			request: &patientaccountspb.GetAddressRequest{
				AddressId: 0,
			},

			wantGRPCCode: codes.InvalidArgument,
		},
		{
			name: "error - failed to convert address to proto",
			mockDBService: &mockPatientAccountsDB{
				getAddressResult: getExampleAddress(id1, id2, invalidDate),
			},
			request: &patientaccountspb.GetAddressRequest{
				AddressId: id2,
			},

			wantGRPCCode: codes.Internal,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.name, func(t *testing.T) {
			grpcServer := GRPCServer{
				DB:     tc.mockDBService,
				Logger: zap.NewNop().Sugar(),
			}
			resp, err := grpcServer.GetAddress(context.Background(), tc.request)
			respStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, tc.wantGRPCCode, respStatus.Code())
			mustMatchAddress(t, tc.want, resp)
		})
	}
}

func TestListAccountPatientLinks(t *testing.T) {
	exampleConsistencyToken, _ := protoconv.TimestampToBytes(timestamppb.New(time.Time{}))
	exampleListPatientByIDResult := &patients.ListPatientsByIDResult{
		Patient: &common.Patient{
			Id: proto.String("1"),
			Name: &common.Name{
				GivenName:  proto.String("John"),
				FamilyName: proto.String("Doe"),
			},
			ContactInfo: &common.ContactInfo{
				HomeNumber: nil,
				MobileNumber: &common.PhoneNumber{
					CountryCode: proto.Int32(1),
					PhoneNumber: proto.String("(555) 666-6888"),
				},
			},
			DateOfBirth: &common.Date{
				Year:  2023,
				Month: 6,
				Day:   9,
			},
		},
		ConsistencyToken: exampleConsistencyToken,
	}

	exampleListPatientsByIDResponse := &patients.ListPatientsByIDResponse{Results: []*patients.ListPatientsByIDResult{exampleListPatientByIDResult}}

	exampleListAccountPatientLinksResponse := []*patientaccountssql.AccountPatientLink{
		{
			ID:                       1,
			AccountID:                2,
			PatientID:                sqltypes.ToValidNullInt64(1),
			AccessLevelID:            AccessLevelIDPrimary.Int64(),
			ConsentingRelationshipID: ConsentingRelationshipIDSelf.Int64(),
		},
		{
			ID:                       2,
			AccountID:                2,
			UnverifiedPatientID:      sqltypes.ToValidNullInt64(2),
			AccessLevelID:            AccessLevelIDPrimary.Int64(),
			ConsentingRelationshipID: ConsentingRelationshipIDSelf.Int64(),
		},
	}

	exampleAccessLevel := AccessLevelIDToProto[exampleListAccountPatientLinksResponse[0].AccessLevelID]

	exampleListUnverifiedAccountPatientsResult := &patients.ListUnverifiedPatientResult{
		Patient: &patients.UnverifiedPatient{
			Id:       2,
			AthenaId: proto.Int64(2),
			DateOfBirth: &common.Date{
				Year:  2023,
				Month: 6,
				Day:   9,
			},
			GivenName:  proto.String("John"),
			FamilyName: proto.String("Doe"),
			PhoneNumber: &common.PhoneNumber{
				CountryCode: proto.Int32(1),
				PhoneNumber: proto.String("(555) 666-6888"),
			},
			LegalSex: 1,
			BirthSex: 1,
		},
		ConsistencyToken: exampleConsistencyToken,
	}

	exampleListUnverifiedPatientsResponse := &patients.ListUnverifiedPatientsResponse{Results: []*patients.ListUnverifiedPatientResult{exampleListUnverifiedAccountPatientsResult}}

	tcs := []struct {
		desc                            string
		request                         *patientaccountspb.ListAccountPatientLinksRequest
		listAccountPatientLinksResponse []*patientaccountssql.AccountPatientLink
		listAccountPatientsErr          error
		listPatientsResponse            *patients.ListPatientsByIDResponse
		listPatientsErr                 error
		listUnverifiedPatientsResponse  *patients.ListUnverifiedPatientsResponse
		listUnverifiedPatientsErr       error

		want         *patientaccountspb.ListAccountPatientLinksResponse
		wantGRPCCode codes.Code
	}{
		{
			desc: "base case",
			request: &patientaccountspb.ListAccountPatientLinksRequest{
				AccountId: 1,
			},
			listPatientsResponse:            exampleListPatientsByIDResponse,
			listUnverifiedPatientsResponse:  exampleListUnverifiedPatientsResponse,
			listAccountPatientLinksResponse: exampleListAccountPatientLinksResponse,

			want: &patientaccountspb.ListAccountPatientLinksResponse{Result: []*patientaccountspb.ListAccountPatientLinksResult{
				{
					AccountPatientLink: &patientaccountspb.AccountPatientLink{
						Id:               *proto.Int64(exampleListAccountPatientLinksResponse[0].ID),
						AccountId:        *proto.Int64(exampleListAccountPatientLinksResponse[0].AccountID),
						Patient:          &patientaccountspb.AccountPatientLink_VerifiedPatient{VerifiedPatient: exampleListPatientByIDResult.Patient},
						ConsistencyToken: exampleConsistencyToken,
						AccessLevel:      exampleAccessLevel,
						ConsentingRelationship: &patientaccountspb.ConsentingRelationship{
							Category: patientaccountspb.ConsentingRelationship_CATEGORY_SELF,
						},
						UpdatedAt: timestamppb.New(exampleListAccountPatientLinksResponse[0].UpdatedAt),
					},
					ConsistencyToken: exampleConsistencyToken,
				},
				{
					AccountPatientLink: &patientaccountspb.AccountPatientLink{
						Id:               *proto.Int64(exampleListAccountPatientLinksResponse[1].ID),
						AccountId:        *proto.Int64(exampleListAccountPatientLinksResponse[1].AccountID),
						Patient:          &patientaccountspb.AccountPatientLink_UnverifiedPatient{UnverifiedPatient: exampleListUnverifiedAccountPatientsResult.Patient},
						ConsistencyToken: exampleConsistencyToken,
						AccessLevel:      exampleAccessLevel,
						ConsentingRelationship: &patientaccountspb.ConsentingRelationship{
							Category: patientaccountspb.ConsentingRelationship_CATEGORY_SELF,
						},
						UpdatedAt: timestamppb.New(exampleListAccountPatientLinksResponse[1].UpdatedAt),
					},
					ConsistencyToken: exampleConsistencyToken,
				},
			}},
			wantGRPCCode: codes.OK,
		},
		{
			desc: "empty ListAccountPatientLinks resp",
			request: &patientaccountspb.ListAccountPatientLinksRequest{
				AccountId: 1,
			},

			want:         &patientaccountspb.ListAccountPatientLinksResponse{},
			wantGRPCCode: codes.OK,
		},
		{
			desc: "empty ListPatientsByIds response",
			request: &patientaccountspb.ListAccountPatientLinksRequest{
				AccountId: 1,
			},
			listAccountPatientLinksResponse: []*patientaccountssql.AccountPatientLink{
				{
					ID:                       2,
					AccountID:                2,
					UnverifiedPatientID:      sqltypes.ToValidNullInt64(2),
					AccessLevelID:            AccessLevelIDPrimary.Int64(),
					ConsentingRelationshipID: ConsentingRelationshipIDSelf.Int64(),
				},
			},
			listPatientsResponse:           &patients.ListPatientsByIDResponse{},
			listUnverifiedPatientsResponse: exampleListUnverifiedPatientsResponse,

			want: &patientaccountspb.ListAccountPatientLinksResponse{Result: []*patientaccountspb.ListAccountPatientLinksResult{
				{
					AccountPatientLink: &patientaccountspb.AccountPatientLink{
						Id:               *proto.Int64(exampleListAccountPatientLinksResponse[1].ID),
						AccountId:        *proto.Int64(exampleListAccountPatientLinksResponse[1].AccountID),
						Patient:          &patientaccountspb.AccountPatientLink_UnverifiedPatient{UnverifiedPatient: exampleListUnverifiedAccountPatientsResult.GetPatient()},
						ConsistencyToken: exampleConsistencyToken,
						AccessLevel:      exampleAccessLevel,
						ConsentingRelationship: &patientaccountspb.ConsentingRelationship{
							Category: patientaccountspb.ConsentingRelationship_CATEGORY_SELF,
						},
						UpdatedAt: timestamppb.New(exampleListAccountPatientLinksResponse[1].UpdatedAt),
					},
					ConsistencyToken: exampleConsistencyToken,
				},
			}},
			wantGRPCCode: codes.OK,
		},
		{
			desc: "empty ListUnverifiedPatients response",
			request: &patientaccountspb.ListAccountPatientLinksRequest{
				AccountId: 1,
			},
			listPatientsResponse:           exampleListPatientsByIDResponse,
			listUnverifiedPatientsResponse: &patients.ListUnverifiedPatientsResponse{},
			listAccountPatientLinksResponse: []*patientaccountssql.AccountPatientLink{
				{
					ID:                       1,
					AccountID:                2,
					PatientID:                sqltypes.ToValidNullInt64(1),
					AccessLevelID:            AccessLevelIDPrimary.Int64(),
					ConsentingRelationshipID: ConsentingRelationshipIDSelf.Int64(),
				},
			},

			want: &patientaccountspb.ListAccountPatientLinksResponse{Result: []*patientaccountspb.ListAccountPatientLinksResult{
				{
					AccountPatientLink: &patientaccountspb.AccountPatientLink{
						Id:               *proto.Int64(exampleListAccountPatientLinksResponse[0].ID),
						AccountId:        *proto.Int64(exampleListAccountPatientLinksResponse[0].AccountID),
						Patient:          &patientaccountspb.AccountPatientLink_VerifiedPatient{VerifiedPatient: exampleListPatientByIDResult.GetPatient()},
						ConsistencyToken: exampleConsistencyToken,
						AccessLevel:      exampleAccessLevel,
						ConsentingRelationship: &patientaccountspb.ConsentingRelationship{
							Category: patientaccountspb.ConsentingRelationship_CATEGORY_SELF,
						},
						UpdatedAt: timestamppb.New(exampleListAccountPatientLinksResponse[0].UpdatedAt),
					},
					ConsistencyToken: exampleConsistencyToken,
				},
			}},
			wantGRPCCode: codes.OK,
		},
		{
			desc: "empty ListUnverifiedPatients response",
			request: &patientaccountspb.ListAccountPatientLinksRequest{
				AccountId: 1,
			},
			listUnverifiedPatientsResponse: &patients.ListUnverifiedPatientsResponse{},
			listPatientsResponse: &patients.ListPatientsByIDResponse{Results: []*patients.ListPatientsByIDResult{
				{
					Patient: &common.Patient{
						Id: proto.String("invalid"),
						Name: &common.Name{
							GivenName:  proto.String("John"),
							FamilyName: proto.String("Doe"),
						},
						ContactInfo: &common.ContactInfo{
							HomeNumber: nil,
							MobileNumber: &common.PhoneNumber{
								CountryCode: proto.Int32(1),
								PhoneNumber: proto.String("(555) 666-6888"),
							},
						},
						DateOfBirth: &common.Date{
							Year:  2023,
							Month: 6,
							Day:   9,
						},
					},
				},
			}},
			listAccountPatientLinksResponse: exampleListAccountPatientLinksResponse,

			wantGRPCCode: codes.Internal,
		},
		{
			desc: "failed to convert account patient link to proto",
			request: &patientaccountspb.ListAccountPatientLinksRequest{
				AccountId: 1,
			},
			listPatientsResponse:           exampleListPatientsByIDResponse,
			listUnverifiedPatientsResponse: &patients.ListUnverifiedPatientsResponse{},
			listAccountPatientLinksResponse: []*patientaccountssql.AccountPatientLink{{
				ID:                       1,
				AccountID:                2,
				PatientID:                sqltypes.ToValidNullInt64(1),
				AccessLevelID:            AccessLevelIDPrimary.Int64(),
				ConsentingRelationshipID: ConsentingRelationshipIDSelf.Int64(),
				UpdatedAt:                invalidDate,
			},
			},

			wantGRPCCode: codes.Internal,
		},
		{
			desc: "ListAccountPatientsLinks error",
			request: &patientaccountspb.ListAccountPatientLinksRequest{
				AccountId: 1,
			},
			listAccountPatientsErr: errors.New("ListAccountPatients failed"),

			wantGRPCCode: codes.Internal,
		},
		{
			desc: "ListUnverifiedPatients error",
			request: &patientaccountspb.ListAccountPatientLinksRequest{
				AccountId: 1,
			},
			listAccountPatientLinksResponse: exampleListAccountPatientLinksResponse,
			listPatientsResponse:            exampleListPatientsByIDResponse,
			listUnverifiedPatientsErr:       errors.New("ListUnverifiedPatients failed"),

			wantGRPCCode: codes.Internal,
		},
		{
			desc: "ListPatientsByIds error",
			request: &patientaccountspb.ListAccountPatientLinksRequest{
				AccountId: 1,
			},
			listAccountPatientLinksResponse: exampleListAccountPatientLinksResponse,
			listPatientsErr:                 errors.New("GetPatient failed"),

			wantGRPCCode: codes.Internal,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			grpcServer := GRPCServer{
				DB: &mockPatientAccountsDB{
					listAccountPatientLinksResult: tc.listAccountPatientLinksResponse,
					listAccountPatientLinksErr:    tc.listAccountPatientsErr,
				},
				PatientsServiceClient: &PatientServiceClientMock{
					ListPatientsByIDHandler: func(ctx context.Context, in *patients.ListPatientsByIDRequest, opts ...grpc.CallOption) (*patients.ListPatientsByIDResponse, error) {
						return tc.listPatientsResponse, tc.listPatientsErr
					},
					ListUnverifiedPatientsHandler: func(ctx context.Context, in *patients.ListUnverifiedPatientsRequest, opts ...grpc.CallOption) (*patients.ListUnverifiedPatientsResponse, error) {
						return tc.listUnverifiedPatientsResponse, tc.listUnverifiedPatientsErr
					},
				},
				Logger: zap.NewNop().Sugar(),
			}

			resp, err := grpcServer.ListAccountPatientLinks(context.Background(), tc.request)
			reqStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, tc.wantGRPCCode, reqStatus.Code())
			testutils.MustMatchProto(t, tc.want, resp)
		})
	}
}

func TestGRPCGetAccountPatientLink(t *testing.T) {
	exampleGetAccountPatientResponse := &patientaccountssql.AccountPatientLink{
		ID:                       1,
		AccountID:                2,
		PatientID:                sqltypes.ToValidNullInt64(3),
		AccessLevelID:            AccessLevelIDPrimary.Int64(),
		ConsentingRelationshipID: ConsentingRelationshipIDSelf.Int64(),
		UpdatedAt:                time.Time{},
	}
	exampleAccessLevelToProto := AccessLevelIDToProto[exampleGetAccountPatientResponse.AccessLevelID]
	exampleConsistencyToken, _ := protoconv.TimestampToBytes(timestamppb.New(exampleGetAccountPatientResponse.UpdatedAt))
	exampleGetPatientResponse := &patients.GetPatientResponse{Patient: &common.Patient{
		Id: proto.String("1"),
		Name: &common.Name{
			GivenName:  proto.String("John"),
			FamilyName: proto.String("Doe"),
		},
		ContactInfo: &common.ContactInfo{
			HomeNumber: nil,
			MobileNumber: &common.PhoneNumber{
				CountryCode: proto.Int32(1),
				PhoneNumber: proto.String("(555) 666-6888"),
			},
		},
		DateOfBirth: &common.Date{
			Year:  2023,
			Month: 6,
			Day:   9,
		},
	},
		ConsistencyToken: exampleConsistencyToken,
	}

	exampleGetUnverifiedPatientResponse := &patients.GetUnverifiedPatientResponse{Patient: &patients.UnverifiedPatient{
		Id:       1,
		AthenaId: proto.Int64(2),
		DateOfBirth: &common.Date{
			Year:  2023,
			Month: 6,
			Day:   9,
		},
		GivenName:  proto.String("John"),
		FamilyName: proto.String("Doe"),
		PhoneNumber: &common.PhoneNumber{
			CountryCode: proto.Int32(1),
			PhoneNumber: proto.String("(555) 666-6888"),
		},
		LegalSex: common.Sex_SEX_MALE,
		BirthSex: common.BirthSex_BIRTH_SEX_MALE,
	},
		ConsistencyToken: exampleConsistencyToken,
	}

	tcs := []struct {
		desc                         string
		request                      *patientaccountspb.GetAccountPatientLinkRequest
		getAccountPatientResponse    *patientaccountssql.AccountPatientLink
		getAccountPatientErr         error
		getPatientResponse           *patients.GetPatientResponse
		getPatientErr                error
		getUnverifiedPatientResponse *patients.GetUnverifiedPatientResponse
		getUnverifiedPatientErr      error

		want         *patientaccountspb.GetAccountPatientLinkResponse
		wantGRPCCode codes.Code
	}{
		{
			desc:                         "base case - verified patient",
			request:                      &patientaccountspb.GetAccountPatientLinkRequest{AccountPatientLinkId: 1},
			getPatientResponse:           exampleGetPatientResponse,
			getUnverifiedPatientResponse: exampleGetUnverifiedPatientResponse,
			getAccountPatientResponse:    exampleGetAccountPatientResponse,

			want: &patientaccountspb.GetAccountPatientLinkResponse{
				AccountPatientLink: &patientaccountspb.AccountPatientLink{
					Id:               *proto.Int64(1),
					AccountId:        *proto.Int64(2),
					Patient:          &patientaccountspb.AccountPatientLink_VerifiedPatient{VerifiedPatient: exampleGetPatientResponse.Patient},
					ConsistencyToken: exampleConsistencyToken,
					AccessLevel:      exampleAccessLevelToProto,
					ConsentingRelationship: &patientaccountspb.ConsentingRelationship{
						Category: patientaccountspb.ConsentingRelationship_CATEGORY_SELF,
					},
					UpdatedAt: timestamppb.New(exampleGetAccountPatientResponse.UpdatedAt),
				},
				ConsistencyToken: exampleConsistencyToken,
			},
		},
		{
			desc:                         "base case - unverified patient",
			request:                      &patientaccountspb.GetAccountPatientLinkRequest{AccountPatientLinkId: 1},
			getUnverifiedPatientResponse: exampleGetUnverifiedPatientResponse,
			getAccountPatientResponse: &patientaccountssql.AccountPatientLink{
				ID:                       1,
				AccountID:                2,
				UnverifiedPatientID:      sqltypes.ToValidNullInt64(4),
				AccessLevelID:            AccessLevelIDPrimary.Int64(),
				ConsentingRelationshipID: ConsentingRelationshipIDSelf.Int64(),
				UpdatedAt:                time.Time{},
			},

			want: &patientaccountspb.GetAccountPatientLinkResponse{
				AccountPatientLink: &patientaccountspb.AccountPatientLink{
					Id:               *proto.Int64(1),
					AccountId:        *proto.Int64(2),
					Patient:          &patientaccountspb.AccountPatientLink_UnverifiedPatient{UnverifiedPatient: exampleGetUnverifiedPatientResponse.Patient},
					ConsistencyToken: exampleConsistencyToken,
					AccessLevel:      exampleAccessLevelToProto,
					ConsentingRelationship: &patientaccountspb.ConsentingRelationship{
						Category: patientaccountspb.ConsentingRelationship_CATEGORY_SELF,
					},
					UpdatedAt: timestamppb.New(exampleGetAccountPatientResponse.UpdatedAt),
				},
				ConsistencyToken: exampleConsistencyToken,
			},
		},
		{
			desc:    "invalid account patient ID",
			request: &patientaccountspb.GetAccountPatientLinkRequest{AccountPatientLinkId: -1},

			wantGRPCCode: codes.InvalidArgument,
		},
		{
			desc:                 "account patient not found in DB",
			request:              &patientaccountspb.GetAccountPatientLinkRequest{AccountPatientLinkId: 1},
			getAccountPatientErr: errAccountPatientNotFound,

			wantGRPCCode: codes.Internal,
		},
		{
			desc:                      "GetPatient error",
			request:                   &patientaccountspb.GetAccountPatientLinkRequest{AccountPatientLinkId: 1},
			getAccountPatientResponse: exampleGetAccountPatientResponse,
			getPatientErr:             errors.New("failed to get patient"),

			wantGRPCCode: codes.Internal,
		},
		{
			desc:    "GetUnverifiedPatient error",
			request: &patientaccountspb.GetAccountPatientLinkRequest{AccountPatientLinkId: 1},
			getAccountPatientResponse: &patientaccountssql.AccountPatientLink{
				ID:                       1,
				AccountID:                2,
				UnverifiedPatientID:      sqltypes.ToValidNullInt64(4),
				AccessLevelID:            AccessLevelIDPrimary.Int64(),
				ConsentingRelationshipID: ConsentingRelationshipIDSelf.Int64(),
				UpdatedAt:                time.Time{},
			},
			getUnverifiedPatientErr: errors.New("failed to get unverified patient"),

			wantGRPCCode: codes.Internal,
		},
		{
			desc:    "failed to convert account patient to proto",
			request: &patientaccountspb.GetAccountPatientLinkRequest{AccountPatientLinkId: 1},
			getAccountPatientResponse: &patientaccountssql.AccountPatientLink{
				ID:                       1,
				AccountID:                2,
				UnverifiedPatientID:      sqltypes.ToValidNullInt64(4),
				AccessLevelID:            AccessLevelIDPrimary.Int64(),
				ConsentingRelationshipID: ConsentingRelationshipIDSelf.Int64(),
				UpdatedAt:                invalidDate,
			},
			getUnverifiedPatientResponse: exampleGetUnverifiedPatientResponse,

			wantGRPCCode: codes.Internal,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			grpcServer := GRPCServer{
				DB: &mockPatientAccountsDB{
					getAccountPatientLinkResult: tc.getAccountPatientResponse,
					getAccountPatientLinkErr:    tc.getAccountPatientErr,
				},
				PatientsServiceClient: &PatientServiceClientMock{
					GetPatientHandler: func(ctx context.Context, in *patients.GetPatientRequest, opts ...grpc.CallOption) (*patients.GetPatientResponse, error) {
						return tc.getPatientResponse, tc.getPatientErr
					},
					GetUnverifiedPatientHandler: func(ctx context.Context, in *patients.GetUnverifiedPatientRequest, opts ...grpc.CallOption) (*patients.GetUnverifiedPatientResponse, error) {
						return tc.getUnverifiedPatientResponse, tc.getUnverifiedPatientErr
					},
				},
				Logger: zap.NewNop().Sugar(),
			}

			resp, err := grpcServer.GetAccountPatientLink(context.Background(), tc.request)
			reqStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}
			testutils.MustMatch(t, tc.wantGRPCCode, reqStatus.Code())
			testutils.MustMatchProto(t, tc.want, resp)
		})
	}
}

func TestGRPCServerUpdateAddress(t *testing.T) {
	now := time.Now()
	later := time.Now().Add(10 * time.Minute)
	baseID := now.UnixNano()
	id1 := baseID + 1
	id2 := baseID + 2
	addressID := baseID + 3
	addressLineOne := "1234 main st"
	addressLineTwo := "#2"
	city := "springfield"
	zipcode := "90210"
	locationDetails := "brick house"
	stateCode := "CA"
	newAddressLineOne := "5678 other st"

	originalAddressSQL := patientaccountssql.Address{
		ID:              addressID,
		AccountID:       id1,
		AddressLineOne:  sqltypes.ToValidNullString(addressLineOne),
		AddressLineTwo:  sqltypes.ToNullString(&addressLineTwo),
		City:            sqltypes.ToValidNullString(city),
		Zipcode:         sqltypes.ToValidNullString(zipcode),
		StateCode:       sqltypes.ToValidNullString(stateCode),
		LocationDetails: sqltypes.ToValidNullString(locationDetails),
		FacilityTypeID:  FacilityTypeProtoToID[patientaccountspb.FacilityType_FACILITY_TYPE_HOME],
	}

	addressLineOneUpdateOnlyAddressSQL := patientaccountssql.Address{
		ID:              addressID,
		AddressLineOne:  sqltypes.ToValidNullString(newAddressLineOne),
		AddressLineTwo:  sqltypes.ToNullString(&addressLineTwo),
		City:            sqltypes.ToValidNullString(city),
		Zipcode:         sqltypes.ToValidNullString(zipcode),
		StateCode:       sqltypes.ToValidNullString(stateCode),
		LocationDetails: sqltypes.ToValidNullString(locationDetails),
		FacilityTypeID:  FacilityTypeProtoToID[patientaccountspb.FacilityType_FACILITY_TYPE_HOME],
	}
	addressLineOneUpdateOnlyAccountProto, addressLineOneUpdateOnlyConsistencyToken, _ := accountAddressProtoFromSQL(&addressLineOneUpdateOnlyAddressSQL)

	differentUpdatedAtAddressSQL := patientaccountssql.Address{
		ID:              addressID,
		AddressLineOne:  sqltypes.ToValidNullString(newAddressLineOne),
		AddressLineTwo:  sqltypes.ToNullString(&addressLineTwo),
		City:            sqltypes.ToValidNullString(city),
		Zipcode:         sqltypes.ToValidNullString(zipcode),
		StateCode:       sqltypes.ToValidNullString(stateCode),
		LocationDetails: sqltypes.ToValidNullString(locationDetails),
		FacilityTypeID:  FacilityTypeProtoToID[patientaccountspb.FacilityType_FACILITY_TYPE_HOME],
		UpdatedAt:       later,
	}
	_, differentUpdatedAtAddressConsistencyToken, _ := accountAddressProtoFromSQL(&differentUpdatedAtAddressSQL)

	invalidTokenAddressSQL := patientaccountssql.Address{
		ID:              addressID,
		AddressLineOne:  sqltypes.ToValidNullString(newAddressLineOne),
		AddressLineTwo:  sqltypes.ToNullString(&addressLineTwo),
		City:            sqltypes.ToValidNullString(city),
		Zipcode:         sqltypes.ToValidNullString(zipcode),
		StateCode:       sqltypes.ToValidNullString(stateCode),
		LocationDetails: sqltypes.ToValidNullString(locationDetails),
		FacilityTypeID:  FacilityTypeProtoToID[patientaccountspb.FacilityType_FACILITY_TYPE_HOME],
		UpdatedAt:       invalidDate,
	}

	responseID := "asff-ffsa-asff-ffsa"
	validCommonAddress := &common.Address{
		AddressLineOne: proto.String(addressLineOne),
		AddressLineTwo: proto.String(addressLineTwo),
		City:           proto.String(city),
		State:          proto.String(stateCode),
		ZipCode:        proto.String(zipcode),
	}
	validLoc := &common.Location{
		LatitudeE6:  37422410,
		LongitudeE6: -122084168,
	}
	validateAddressResult := &googlemapsclient.ValidateAddressResponse{
		Address:                    validCommonAddress,
		Geocodeable:                true,
		IsComplete:                 true,
		GoogleValidationResponseID: responseID,
		Location:                   validLoc,
	}
	validSuggestedAddress := &patientaccountspb.SuggestedAddress{
		Address:                    validCommonAddress,
		Geocodeable:                true,
		IsComplete:                 true,
		GoogleValidationResponseId: responseID,
		Location:                   validLoc,
	}
	incompleteValidateAddressResult := &googlemapsclient.ValidateAddressResponse{
		Address:                    validCommonAddress,
		Geocodeable:                true,
		IsComplete:                 false,
		GoogleValidationResponseID: responseID,
		Location:                   validLoc,
	}
	invalidValidateAddressResult := &googlemapsclient.ValidateAddressResponse{
		Address:                    validCommonAddress,
		Geocodeable:                false,
		IsComplete:                 false,
		Reasons:                    []string{"We weren't able to find the location of your address."},
		GoogleValidationResponseID: responseID,
		Location:                   validLoc,
	}

	tcs := []struct {
		name                  string
		mockDBService         *mockPatientAccountsDB
		request               *patientaccountspb.UpdateAddressRequest
		validateAddressResult *googlemapsclient.ValidateAddressResponse
		validateAddressErr    error

		want         *patientaccountspb.UpdateAddressResponse
		wantGRPCCode codes.Code
	}{
		{
			name: "success - base case",
			mockDBService: &mockPatientAccountsDB{
				getAddressResult:    &originalAddressSQL,
				updateAddressResult: &addressLineOneUpdateOnlyAddressSQL,
			},
			request: &patientaccountspb.UpdateAddressRequest{
				AddressId: addressID,
				Address: &common.Address{
					AddressLineOne: proto.String(newAddressLineOne),
					AddressLineTwo: proto.String(addressLineTwo),
					City:           proto.String(city),
					ZipCode:        proto.String(zipcode),
					State:          proto.String(stateCode),
				},
				LocationDetails:  proto.String(locationDetails),
				FacilityType:     patientaccountspb.FacilityType_FACILITY_TYPE_HOME.Enum(),
				ConsistencyToken: addressLineOneUpdateOnlyConsistencyToken,
			},
			validateAddressResult: validateAddressResult,

			wantGRPCCode: codes.OK,
			want: &patientaccountspb.UpdateAddressResponse{
				AddressValidationStatus: patientaccountspb.AddressValidationStatus_ADDRESS_VALIDATION_STATUS_VALID,
				Address:                 addressLineOneUpdateOnlyAccountProto,
				ConsistencyToken:        addressLineOneUpdateOnlyConsistencyToken,
				SuggestedAddress:        validSuggestedAddress,
			},
		},
		{
			name: "error - empty address fields",
			mockDBService: &mockPatientAccountsDB{
				getAddressResult:    &originalAddressSQL,
				updateAddressResult: &addressLineOneUpdateOnlyAddressSQL,
			},
			request: &patientaccountspb.UpdateAddressRequest{
				AddressId:        id1,
				Address:          &common.Address{},
				ConsistencyToken: addressLineOneUpdateOnlyConsistencyToken,
				LocationDetails:  nil,
			},
			validateAddressResult: validateAddressResult,

			wantGRPCCode: codes.InvalidArgument,
		},
		{
			name: "error - invalid address id",
			mockDBService: &mockPatientAccountsDB{
				getAddressResult:    &originalAddressSQL,
				updateAddressResult: &addressLineOneUpdateOnlyAddressSQL,
			},
			request: &patientaccountspb.UpdateAddressRequest{
				AddressId: 0,
				Address: &common.Address{
					AddressLineOne: proto.String(newAddressLineOne),
					AddressLineTwo: proto.String(addressLineTwo),
					City:           proto.String(city),
					ZipCode:        proto.String(zipcode),
					State:          proto.String(stateCode),
				},
				ConsistencyToken: addressLineOneUpdateOnlyConsistencyToken,
				LocationDetails:  proto.String(locationDetails),
				FacilityType:     patientaccountspb.FacilityType_FACILITY_TYPE_HOME.Enum(),
			},
			validateAddressResult: validateAddressResult,

			wantGRPCCode: codes.InvalidArgument,
		},
		{
			name: "error - failed to update",
			mockDBService: &mockPatientAccountsDB{
				getAddressResult: &originalAddressSQL,
				updateAddressErr: errors.New("error, error, error"),
			},
			request: &patientaccountspb.UpdateAddressRequest{
				AddressId: id1,
				Address: &common.Address{
					AddressLineOne: proto.String(newAddressLineOne),
					AddressLineTwo: proto.String(addressLineTwo),
					City:           proto.String(city),
					ZipCode:        proto.String(zipcode),
					State:          proto.String(stateCode),
				},
				ConsistencyToken: addressLineOneUpdateOnlyConsistencyToken,
				LocationDetails:  proto.String(locationDetails),
				FacilityType:     patientaccountspb.FacilityType_FACILITY_TYPE_HOME.Enum(),
			},
			validateAddressResult: validateAddressResult,

			wantGRPCCode: codes.Internal,
		},
		{
			name: "error - get address failed",
			mockDBService: &mockPatientAccountsDB{
				getAddressErr:       errAccountAddressNotFound,
				updateAddressResult: &addressLineOneUpdateOnlyAddressSQL,
			},
			request: &patientaccountspb.UpdateAddressRequest{
				AddressId: id2,
				Address: &common.Address{
					AddressLineOne: proto.String(newAddressLineOne),
					AddressLineTwo: proto.String(addressLineTwo),
					City:           proto.String(city),
					ZipCode:        proto.String(zipcode),
					State:          proto.String(stateCode),
				},
				ConsistencyToken: addressLineOneUpdateOnlyConsistencyToken,
				LocationDetails:  proto.String(locationDetails),
				FacilityType:     patientaccountspb.FacilityType_FACILITY_TYPE_HOME.Enum(),
			},
			validateAddressResult: validateAddressResult,

			wantGRPCCode: codes.NotFound,
		},
		{
			name: "error - no consistency token",
			mockDBService: &mockPatientAccountsDB{
				getAddressResult:    &originalAddressSQL,
				updateAddressResult: &addressLineOneUpdateOnlyAddressSQL,
			},
			request: &patientaccountspb.UpdateAddressRequest{
				AddressId: id1,
				Address: &common.Address{
					AddressLineOne: proto.String(newAddressLineOne),
					AddressLineTwo: proto.String(addressLineTwo),
					City:           proto.String(city),
					ZipCode:        proto.String(zipcode),
					State:          proto.String(stateCode),
				},
				LocationDetails: proto.String(locationDetails),
				FacilityType:    patientaccountspb.FacilityType_FACILITY_TYPE_HOME.Enum(),
			},
			validateAddressResult: validateAddressResult,

			wantGRPCCode: codes.InvalidArgument,
		},
		{
			name: "error - consistency token is wrong",
			mockDBService: &mockPatientAccountsDB{
				getAddressResult:    &originalAddressSQL,
				updateAddressResult: &invalidTokenAddressSQL,
			},
			request: &patientaccountspb.UpdateAddressRequest{
				AddressId: addressID,
				Address: &common.Address{
					AddressLineOne: proto.String(newAddressLineOne),
					AddressLineTwo: proto.String(addressLineTwo),
					City:           proto.String(city),
					ZipCode:        proto.String(zipcode),
					State:          proto.String(stateCode),
				},
				ConsistencyToken: differentUpdatedAtAddressConsistencyToken,
				LocationDetails:  proto.String(locationDetails),
				FacilityType:     patientaccountspb.FacilityType_FACILITY_TYPE_HOME.Enum(),
			},
			validateAddressResult: validateAddressResult,

			wantGRPCCode: codes.FailedPrecondition,
		},
		{
			name: "error - failed to convert address to proto",
			mockDBService: &mockPatientAccountsDB{
				getAddressResult:    &originalAddressSQL,
				updateAddressResult: &invalidTokenAddressSQL,
			},
			request: &patientaccountspb.UpdateAddressRequest{
				AddressId: id1,
				Address: &common.Address{
					AddressLineOne: proto.String(newAddressLineOne),
					AddressLineTwo: proto.String(addressLineTwo),
					City:           proto.String(city),
					ZipCode:        proto.String(zipcode),
					State:          proto.String(stateCode),
				},
				ConsistencyToken: addressLineOneUpdateOnlyConsistencyToken,
				LocationDetails:  proto.String(locationDetails),
				FacilityType:     patientaccountspb.FacilityType_FACILITY_TYPE_HOME.Enum(),
			},
			validateAddressResult: validateAddressResult,

			wantGRPCCode: codes.Internal,
		},
		{
			name: "needs confirmation - validateAddress returns success but with NEEDS_CONFIRMATION status",
			mockDBService: &mockPatientAccountsDB{
				getAddressResult:    &originalAddressSQL,
				updateAddressResult: &addressLineOneUpdateOnlyAddressSQL,
			},
			request: &patientaccountspb.UpdateAddressRequest{
				AddressId: addressID,
				Address: &common.Address{
					AddressLineOne: proto.String(newAddressLineOne),
					AddressLineTwo: proto.String(addressLineTwo),
					City:           proto.String(city),
					ZipCode:        proto.String(zipcode),
					State:          proto.String(stateCode),
				},
				LocationDetails:  proto.String(locationDetails),
				ConsistencyToken: addressLineOneUpdateOnlyConsistencyToken,
				FacilityType:     patientaccountspb.FacilityType_FACILITY_TYPE_HOME.Enum(),
			},
			validateAddressResult: incompleteValidateAddressResult,

			wantGRPCCode: codes.OK,
			want: &patientaccountspb.UpdateAddressResponse{
				AddressValidationStatus: patientaccountspb.AddressValidationStatus_ADDRESS_VALIDATION_STATUS_NEEDS_CONFIRMATION,
				Address:                 addressLineOneUpdateOnlyAccountProto,
				ConsistencyToken:        addressLineOneUpdateOnlyConsistencyToken,
				SuggestedAddress: &patientaccountspb.SuggestedAddress{
					Address:                    validCommonAddress,
					Geocodeable:                true,
					IsComplete:                 false,
					GoogleValidationResponseId: responseID,
					Location:                   validLoc,
				},
			},
		},
		{
			name: "invalid - validateAddress short circuits with suggested result",
			request: &patientaccountspb.UpdateAddressRequest{
				AddressId: addressID,
				Address: &common.Address{
					AddressLineOne: proto.String("whee"),
					AddressLineTwo: proto.String("lala"),
					City:           proto.String(city),
					ZipCode:        proto.String(zipcode),
					State:          proto.String(stateCode),
				},
				LocationDetails:  proto.String(locationDetails),
				ConsistencyToken: addressLineOneUpdateOnlyConsistencyToken,
				FacilityType:     patientaccountspb.FacilityType_FACILITY_TYPE_HOME.Enum(),
			},
			validateAddressResult: invalidValidateAddressResult,

			wantGRPCCode: codes.OK,
			want: &patientaccountspb.UpdateAddressResponse{
				AddressValidationStatus: patientaccountspb.AddressValidationStatus_ADDRESS_VALIDATION_STATUS_INVALID,
				SuggestedAddress: &patientaccountspb.SuggestedAddress{
					Address:                    validCommonAddress,
					Geocodeable:                false,
					GoogleValidationResponseId: responseID,
					Reasons:                    []string{"We weren't able to find the location of your address."},
					Location:                   validLoc,
				},
			},
		},
		{
			name: "error - validateAddress throws error",
			request: &patientaccountspb.UpdateAddressRequest{
				AddressId: addressID,
				Address: &common.Address{
					AddressLineOne: proto.String("whee"),
					AddressLineTwo: proto.String("lala"),
					City:           proto.String(city),
					ZipCode:        proto.String(zipcode),
					State:          proto.String(stateCode),
				},
				LocationDetails:  proto.String(locationDetails),
				ConsistencyToken: addressLineOneUpdateOnlyConsistencyToken,
				FacilityType:     patientaccountspb.FacilityType_FACILITY_TYPE_HOME.Enum(),
			},
			validateAddressErr: errors.New("lalala"),

			wantGRPCCode: codes.Internal,
		},
		{
			name: "error - empty facility type",
			request: &patientaccountspb.UpdateAddressRequest{
				AddressId: addressID,
				Address: &common.Address{
					AddressLineOne: proto.String(newAddressLineOne),
					AddressLineTwo: proto.String(addressLineTwo),
					City:           proto.String(city),
					ZipCode:        proto.String(zipcode),
					State:          proto.String(stateCode),
				},
				LocationDetails: proto.String(locationDetails),
			},

			wantGRPCCode: codes.InvalidArgument,
		},
		{
			name: "error - invalid facility type",
			request: &patientaccountspb.UpdateAddressRequest{
				AddressId: addressID,
				Address: &common.Address{
					AddressLineOne: proto.String(newAddressLineOne),
					AddressLineTwo: proto.String(addressLineTwo),
					City:           proto.String(city),
					ZipCode:        proto.String(zipcode),
					State:          proto.String(stateCode),
				},
				LocationDetails: proto.String(locationDetails),
				FacilityType:    patientaccountspb.FacilityType_FACILITY_TYPE_UNSPECIFIED.Enum(),
			},

			wantGRPCCode: codes.InvalidArgument,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.name, func(t *testing.T) {
			grpcServer := GRPCServer{
				DB: tc.mockDBService,
				AddressValidationClient: &MockGMapsAddressValidationClient{
					ValidateAddressResult: tc.validateAddressResult,
					ValidateAddressErr:    tc.validateAddressErr,
				},
				Logger: zap.NewNop().Sugar(),
			}
			resp, err := grpcServer.UpdateAddress(context.Background(), tc.request)
			reqStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}
			testutils.MustMatch(t, tc.wantGRPCCode, reqStatus.Code())
			testutils.MustMatchProto(t, tc.want, resp)
		})
	}
}

func TestAddUnverifiedAccountPatientLink(t *testing.T) {
	now := time.Now()
	nowTimestamp := protoconv.TimeToProtoTimestamp(&now)
	nowConsistencyToken, _ := protoconv.TimestampToBytes(nowTimestamp)

	exampleAccountPatientSQL := &patientaccountssql.AccountPatientLink{
		ID:                       1,
		AccountID:                2,
		UnverifiedPatientID:      sqltypes.ToValidNullInt64(3),
		AccessLevelID:            AccessLevelIDPrimary.Int64(),
		ConsentingRelationshipID: ConsentingRelationshipIDSelf.Int64(),
		UpdatedAt:                now,
	}
	exampleGetUnverifiedPatient := &patients.GetUnverifiedPatientResponse{
		Patient: &patients.UnverifiedPatient{
			Id:       1,
			AthenaId: proto.Int64(2),
			DateOfBirth: &common.Date{
				Year:  2023,
				Month: 6,
				Day:   9,
			},
			GivenName:  proto.String("John"),
			FamilyName: proto.String("Doe"),
			PhoneNumber: &common.PhoneNumber{
				CountryCode: proto.Int32(1),
				PhoneNumber: proto.String("(555) 666-6888"),
			},
			LegalSex:  common.Sex_SEX_MALE,
			BirthSex:  common.BirthSex_BIRTH_SEX_MALE,
			UpdatedAt: nowTimestamp,
		},
		ConsistencyToken: nowConsistencyToken,
	}
	exampleAccessLevelToProto := AccessLevelIDToProto[exampleAccountPatientSQL.AccessLevelID]

	tcs := []struct {
		desc                                   string
		request                                *patientaccountspb.AddUnverifiedAccountPatientLinkRequest
		getUnverifiedPatientResponse           *patients.GetUnverifiedPatientResponse
		getUnverifiedPatientErr                error
		createUnverifiedAccountPatientResponse *patientaccountssql.AccountPatientLink
		createUnverifiedAccountPatientErr      error

		want         *patientaccountspb.AddUnverifiedAccountPatientLinkResponse
		wantGRPCCode codes.Code
	}{
		{
			desc: "base case",
			request: &patientaccountspb.AddUnverifiedAccountPatientLinkRequest{
				AccountId:           1,
				UnverifiedPatientId: exampleGetUnverifiedPatient.Patient.GetId(),
				ConsentingRelationship: &patientaccountspb.ConsentingRelationship{
					Category: patientaccountspb.ConsentingRelationship_CATEGORY_SELF,
				},
			},

			createUnverifiedAccountPatientResponse: exampleAccountPatientSQL,
			getUnverifiedPatientResponse:           exampleGetUnverifiedPatient,

			want: &patientaccountspb.AddUnverifiedAccountPatientLinkResponse{
				AccountPatientLink: &patientaccountspb.AccountPatientLink{
					Id:          1,
					AccountId:   2,
					Patient:     &patientaccountspb.AccountPatientLink_UnverifiedPatient{UnverifiedPatient: exampleGetUnverifiedPatient.Patient},
					AccessLevel: exampleAccessLevelToProto,
					ConsentingRelationship: &patientaccountspb.ConsentingRelationship{
						Category: patientaccountspb.ConsentingRelationship_CATEGORY_SELF,
					},
					UpdatedAt: nowTimestamp,
				},
				ConsistencyToken: nowConsistencyToken,
			},
		},
		{
			desc: "nil account ID",
			request: &patientaccountspb.AddUnverifiedAccountPatientLinkRequest{
				UnverifiedPatientId: exampleGetUnverifiedPatient.Patient.GetId(),
				ConsentingRelationship: &patientaccountspb.ConsentingRelationship{
					Category: patientaccountspb.ConsentingRelationship_CATEGORY_SELF,
				},
			},

			wantGRPCCode: codes.InvalidArgument,
		},
		{
			desc: "nil unverified patient id",
			request: &patientaccountspb.AddUnverifiedAccountPatientLinkRequest{
				AccountId: 1,
				ConsentingRelationship: &patientaccountspb.ConsentingRelationship{
					Category: patientaccountspb.ConsentingRelationship_CATEGORY_SELF,
				},
			},

			wantGRPCCode: codes.InvalidArgument,
		},
		{
			desc: "nil consenting relationship",
			request: &patientaccountspb.AddUnverifiedAccountPatientLinkRequest{
				AccountId:           1,
				UnverifiedPatientId: exampleGetUnverifiedPatient.Patient.GetId(),
			},

			createUnverifiedAccountPatientResponse: exampleAccountPatientSQL,
			getUnverifiedPatientResponse:           exampleGetUnverifiedPatient,

			wantGRPCCode: codes.InvalidArgument,
		},
		{
			desc: "invalid consenting relationship category",
			request: &patientaccountspb.AddUnverifiedAccountPatientLinkRequest{
				AccountId:              1,
				UnverifiedPatientId:    exampleGetUnverifiedPatient.Patient.GetId(),
				ConsentingRelationship: &patientaccountspb.ConsentingRelationship{},
			},

			createUnverifiedAccountPatientResponse: exampleAccountPatientSQL,
			getUnverifiedPatientResponse:           exampleGetUnverifiedPatient,

			wantGRPCCode: codes.InvalidArgument,
		},
		{
			desc: "unverified patient not found",
			request: &patientaccountspb.AddUnverifiedAccountPatientLinkRequest{
				AccountId:           1,
				UnverifiedPatientId: exampleGetUnverifiedPatient.Patient.GetId(),
				ConsentingRelationship: &patientaccountspb.ConsentingRelationship{
					Category: patientaccountspb.ConsentingRelationship_CATEGORY_SELF,
				},
			},
			getUnverifiedPatientErr: status.Error(codes.NotFound, "unverified patient not found"),

			wantGRPCCode: codes.NotFound,
		},
		{
			desc: "failed to get unverified patient",
			request: &patientaccountspb.AddUnverifiedAccountPatientLinkRequest{
				AccountId:           1,
				UnverifiedPatientId: exampleGetUnverifiedPatient.Patient.GetId(),
				ConsentingRelationship: &patientaccountspb.ConsentingRelationship{
					Category: patientaccountspb.ConsentingRelationship_CATEGORY_SELF,
				},
			},

			getUnverifiedPatientErr: errors.New("failed to get unverified patient"),

			wantGRPCCode: codes.Internal,
		},
		{
			desc: "failed to create account patient",
			request: &patientaccountspb.AddUnverifiedAccountPatientLinkRequest{
				AccountId:           1,
				UnverifiedPatientId: exampleGetUnverifiedPatient.Patient.GetId(),
				ConsentingRelationship: &patientaccountspb.ConsentingRelationship{
					Category: patientaccountspb.ConsentingRelationship_CATEGORY_SELF,
				},
			},

			createUnverifiedAccountPatientErr: errors.New("failed to create account patient"),

			wantGRPCCode: codes.Internal,
		},
		{
			desc: "failed to convert account patient to proto",
			request: &patientaccountspb.AddUnverifiedAccountPatientLinkRequest{
				AccountId:           1,
				UnverifiedPatientId: exampleGetUnverifiedPatient.Patient.GetId(),
				ConsentingRelationship: &patientaccountspb.ConsentingRelationship{
					Category: patientaccountspb.ConsentingRelationship_CATEGORY_SELF,
				},
			},
			createUnverifiedAccountPatientResponse: &patientaccountssql.AccountPatientLink{
				ID:                       1,
				AccountID:                2,
				UnverifiedPatientID:      sqltypes.ToValidNullInt64(3),
				AccessLevelID:            AccessLevelIDPrimary.Int64(),
				ConsentingRelationshipID: ConsentingRelationshipIDSelf.Int64(),
				UpdatedAt:                invalidDate,
			},
			getUnverifiedPatientResponse: exampleGetUnverifiedPatient,

			wantGRPCCode: codes.Internal,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			grpcServer := GRPCServer{
				DB: &mockPatientAccountsDB{
					createAccountPatientLinkResult: tc.createUnverifiedAccountPatientResponse,
					createAccountPatientLinkErr:    tc.createUnverifiedAccountPatientErr,
				},
				PatientsServiceClient: &PatientServiceClientMock{
					GetUnverifiedPatientHandler: func(ctx context.Context, r *patients.GetUnverifiedPatientRequest, opts ...grpc.CallOption) (*patients.GetUnverifiedPatientResponse, error) {
						return tc.getUnverifiedPatientResponse, tc.getUnverifiedPatientErr
					},
				},
				Logger: zap.NewNop().Sugar(),
			}

			resp, err := grpcServer.AddUnverifiedAccountPatientLink(context.Background(), tc.request)
			reqStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, tc.wantGRPCCode, reqStatus.Code())
			testutils.MustMatchProto(t, tc.want, resp)
		})
	}
}

func TestGRPCServerUpdateAccountPatientLink(t *testing.T) {
	now := time.Now()
	nowTimestamp := protoconv.TimeToProtoTimestamp(&now)
	nowConsistencyToken, _ := protoconv.TimestampToBytes(nowTimestamp)

	exampleAccountPatient := &patientaccountssql.AccountPatientLink{
		ID:                       2,
		AccountID:                2,
		PatientID:                sqltypes.ToValidNullInt64(3),
		AccessLevelID:            AccessLevelIDPrimary.Int64(),
		ConsentingRelationshipID: ConsentingRelationshipIDSelf.Int64(),
		UpdatedAt:                time.Time{},
	}
	examplePatient := &common.Patient{
		Id: proto.String("1"),
		Name: &common.Name{
			GivenName:  proto.String("John"),
			FamilyName: proto.String("Doe"),
		},
	}
	exampleUnverifiedPatient := &patients.UnverifiedPatient{
		Id:       1,
		AthenaId: proto.Int64(2),
		DateOfBirth: &common.Date{
			Year:  2023,
			Month: 6,
			Day:   9,
		},
		GivenName:  proto.String("John"),
		FamilyName: proto.String("Doe"),
		PhoneNumber: &common.PhoneNumber{
			CountryCode: proto.Int32(1),
			PhoneNumber: proto.String("(555) 666-6888"),
		},
		LegalSex:  common.Sex_SEX_MALE,
		BirthSex:  common.BirthSex_BIRTH_SEX_MALE,
		UpdatedAt: nowTimestamp,
	}
	exampleAccessLevelToProto := AccessLevelIDToProto[exampleAccountPatient.AccessLevelID]
	exampleConsistencyToken, _ := protoconv.TimestampToBytes(timestamppb.New(exampleAccountPatient.UpdatedAt))

	tcs := []struct {
		desc                         string
		request                      *patientaccountspb.UpdateAccountPatientLinkRequest
		updateAccountPatientResponse *patientaccountssql.AccountPatientLink
		updateAccountPatientErr      error
		getAccountPatientResponse    *patientaccountssql.AccountPatientLink
		getAccountPatientErr         error
		getPatientResponse           *patients.GetPatientResponse
		getPatientErr                error
		getUnverifiedPatientResponse *patients.GetUnverifiedPatientResponse
		getUnverifiedPatientErr      error

		want         *patientaccountspb.UpdateAccountPatientLinkResponse
		wantGRPCCode codes.Code
	}{
		{
			desc: "base case",
			request: &patientaccountspb.UpdateAccountPatientLinkRequest{
				AccountPatientLinkId: 2,
				AccessLevel:          patientaccountspb.AccountPatientLink_ACCESS_LEVEL_PRIMARY,
				ConsentingRelationship: &patientaccountspb.ConsentingRelationship{
					Category: patientaccountspb.ConsentingRelationship_CATEGORY_SELF,
				},
				ConsistencyToken: exampleConsistencyToken,
			},
			getAccountPatientResponse:    exampleAccountPatient,
			getPatientResponse:           &patients.GetPatientResponse{Patient: examplePatient},
			getUnverifiedPatientResponse: &patients.GetUnverifiedPatientResponse{Patient: exampleUnverifiedPatient},
			updateAccountPatientResponse: &patientaccountssql.AccountPatientLink{
				ID:                       1,
				AccountID:                2,
				UnverifiedPatientID:      sqltypes.ToValidNullInt64(1),
				AccessLevelID:            AccessLevelIDPrimary.Int64(),
				ConsentingRelationshipID: ConsentingRelationshipIDSelf.Int64(),
				UpdatedAt:                now,
			},

			want: &patientaccountspb.UpdateAccountPatientLinkResponse{
				AccountPatientLink: &patientaccountspb.AccountPatientLink{
					Id:          1,
					AccountId:   2,
					AccessLevel: exampleAccessLevelToProto,
					ConsentingRelationship: &patientaccountspb.ConsentingRelationship{
						Category: patientaccountspb.ConsentingRelationship_CATEGORY_SELF,
					},
					UpdatedAt: nowTimestamp,
				},
				ConsistencyToken: nowConsistencyToken,
			},
		},
		{
			desc: "nil account ID",
			request: &patientaccountspb.UpdateAccountPatientLinkRequest{
				AccessLevel: patientaccountspb.AccountPatientLink_ACCESS_LEVEL_PRIMARY,
				ConsentingRelationship: &patientaccountspb.ConsentingRelationship{
					Category: patientaccountspb.ConsentingRelationship_CATEGORY_SELF,
				},
				ConsistencyToken: exampleConsistencyToken,
			},

			wantGRPCCode: codes.InvalidArgument,
		},
		{
			desc: "nil access level",
			request: &patientaccountspb.UpdateAccountPatientLinkRequest{
				AccountPatientLinkId: 2,
				ConsentingRelationship: &patientaccountspb.ConsentingRelationship{
					Category: patientaccountspb.ConsentingRelationship_CATEGORY_SELF,
				},
				ConsistencyToken: exampleConsistencyToken,
			},

			wantGRPCCode: codes.InvalidArgument,
		},
		{
			desc: "nil consenting relationship",
			request: &patientaccountspb.UpdateAccountPatientLinkRequest{
				AccountPatientLinkId: 2,
				AccessLevel:          patientaccountspb.AccountPatientLink_ACCESS_LEVEL_PRIMARY,
				ConsistencyToken:     exampleConsistencyToken,
			},
			getAccountPatientResponse:    exampleAccountPatient,
			getPatientResponse:           &patients.GetPatientResponse{Patient: examplePatient},
			getUnverifiedPatientResponse: &patients.GetUnverifiedPatientResponse{Patient: exampleUnverifiedPatient},
			updateAccountPatientResponse: &patientaccountssql.AccountPatientLink{
				ID:                       1,
				AccountID:                2,
				UnverifiedPatientID:      sqltypes.ToValidNullInt64(1),
				AccessLevelID:            AccessLevelIDPrimary.Int64(),
				ConsentingRelationshipID: ConsentingRelationshipIDSelf.Int64(),
				UpdatedAt:                now,
			},

			wantGRPCCode: codes.InvalidArgument,
		},
		{
			desc: "invalid consenting relationship category",
			request: &patientaccountspb.UpdateAccountPatientLinkRequest{
				AccountPatientLinkId:   2,
				AccessLevel:            patientaccountspb.AccountPatientLink_ACCESS_LEVEL_PRIMARY,
				ConsentingRelationship: &patientaccountspb.ConsentingRelationship{},
				ConsistencyToken:       exampleConsistencyToken,
			},
			getAccountPatientResponse:    exampleAccountPatient,
			getPatientResponse:           &patients.GetPatientResponse{Patient: examplePatient},
			getUnverifiedPatientResponse: &patients.GetUnverifiedPatientResponse{Patient: exampleUnverifiedPatient},
			updateAccountPatientResponse: &patientaccountssql.AccountPatientLink{
				ID:                       1,
				AccountID:                2,
				UnverifiedPatientID:      sqltypes.ToValidNullInt64(1),
				AccessLevelID:            AccessLevelIDPrimary.Int64(),
				ConsentingRelationshipID: ConsentingRelationshipIDSelf.Int64(),
				UpdatedAt:                now,
			},

			wantGRPCCode: codes.InvalidArgument,
		},
		{
			desc: "nil consistency token",
			request: &patientaccountspb.UpdateAccountPatientLinkRequest{
				AccountPatientLinkId: 2,
				AccessLevel:          patientaccountspb.AccountPatientLink_ACCESS_LEVEL_PRIMARY,
				ConsentingRelationship: &patientaccountspb.ConsentingRelationship{
					Category: patientaccountspb.ConsentingRelationship_CATEGORY_SELF,
				},
			},

			wantGRPCCode: codes.InvalidArgument,
		},
		{
			desc: "failed to get account patient",
			request: &patientaccountspb.UpdateAccountPatientLinkRequest{
				AccountPatientLinkId: 2,
				AccessLevel:          patientaccountspb.AccountPatientLink_ACCESS_LEVEL_PRIMARY,
				ConsentingRelationship: &patientaccountspb.ConsentingRelationship{
					Category: patientaccountspb.ConsentingRelationship_CATEGORY_SELF,
				},
				ConsistencyToken: exampleConsistencyToken,
			},
			getAccountPatientErr: errors.New("failed to get account patient"),

			wantGRPCCode: codes.Internal,
		},
		{
			desc: "invalid consistency token",
			request: &patientaccountspb.UpdateAccountPatientLinkRequest{
				AccountPatientLinkId: 2,
				AccessLevel:          patientaccountspb.AccountPatientLink_ACCESS_LEVEL_PRIMARY,
				ConsentingRelationship: &patientaccountspb.ConsentingRelationship{
					Category: patientaccountspb.ConsentingRelationship_CATEGORY_SELF,
				},
				ConsistencyToken: nowConsistencyToken,
			},
			getPatientResponse:           &patients.GetPatientResponse{Patient: examplePatient},
			getUnverifiedPatientResponse: &patients.GetUnverifiedPatientResponse{Patient: exampleUnverifiedPatient},
			getAccountPatientResponse:    exampleAccountPatient,

			wantGRPCCode: codes.FailedPrecondition,
		},
		{
			desc: "failed to update account patient",
			request: &patientaccountspb.UpdateAccountPatientLinkRequest{
				AccountPatientLinkId: 2,
				AccessLevel:          patientaccountspb.AccountPatientLink_ACCESS_LEVEL_PRIMARY,
				ConsentingRelationship: &patientaccountspb.ConsentingRelationship{
					Category: patientaccountspb.ConsentingRelationship_CATEGORY_SELF,
				},
				ConsistencyToken: exampleConsistencyToken,
			},
			getAccountPatientResponse:    exampleAccountPatient,
			getPatientResponse:           &patients.GetPatientResponse{Patient: examplePatient},
			getUnverifiedPatientResponse: &patients.GetUnverifiedPatientResponse{Patient: exampleUnverifiedPatient},
			updateAccountPatientErr:      errors.New("failed to update account patient"),

			wantGRPCCode: codes.Internal,
		},
		{
			desc: "failed to convert account patient to proto",
			request: &patientaccountspb.UpdateAccountPatientLinkRequest{
				AccountPatientLinkId: 2,
				AccessLevel:          patientaccountspb.AccountPatientLink_ACCESS_LEVEL_PRIMARY,
				ConsentingRelationship: &patientaccountspb.ConsentingRelationship{
					Category: patientaccountspb.ConsentingRelationship_CATEGORY_SELF,
				},
				ConsistencyToken: exampleConsistencyToken,
			},
			getAccountPatientResponse:    exampleAccountPatient,
			getPatientResponse:           &patients.GetPatientResponse{Patient: examplePatient},
			getUnverifiedPatientResponse: &patients.GetUnverifiedPatientResponse{Patient: exampleUnverifiedPatient},
			updateAccountPatientResponse: &patientaccountssql.AccountPatientLink{
				ID:                       1,
				AccountID:                2,
				UnverifiedPatientID:      sqltypes.ToValidNullInt64(1),
				AccessLevelID:            AccessLevelIDPrimary.Int64(),
				ConsentingRelationshipID: ConsentingRelationshipIDSelf.Int64(),
				UpdatedAt:                invalidDate,
			},

			wantGRPCCode: codes.Internal,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			grpcServer := GRPCServer{
				DB: &mockPatientAccountsDB{
					updateAccountPatientLinkResult: tc.updateAccountPatientResponse,
					updateAccountPatientLinkErr:    tc.updateAccountPatientErr,
					getAccountPatientLinkResult:    tc.getAccountPatientResponse,
					getAccountPatientLinkErr:       tc.getAccountPatientErr,
				},
				PatientsServiceClient: &PatientServiceClientMock{
					GetPatientHandler: func(ctx context.Context, in *patients.GetPatientRequest, opts ...grpc.CallOption) (*patients.GetPatientResponse, error) {
						return tc.getPatientResponse, tc.getPatientErr
					},
					GetUnverifiedPatientHandler: func(ctx context.Context, in *patients.GetUnverifiedPatientRequest, opts ...grpc.CallOption) (*patients.GetUnverifiedPatientResponse, error) {
						return tc.getUnverifiedPatientResponse, tc.getUnverifiedPatientErr
					},
				},
				Logger: zap.NewNop().Sugar(),
			}

			resp, err := grpcServer.UpdateAccountPatientLink(context.Background(), tc.request)
			reqStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, tc.wantGRPCCode, reqStatus.Code())
			testutils.MustMatchProto(t, tc.want, resp)
		})
	}
}
