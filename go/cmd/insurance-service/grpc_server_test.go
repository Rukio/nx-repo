package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strconv"
	"testing"
	"time"

	"github.com/*company-data-covered*/services/go/pkg/baselogger"
	"github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
	insurancepb "github.com/*company-data-covered*/services/go/pkg/generated/proto/insurance"
	insuranceplanpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/insurance_plan"
	payergrouppb "github.com/*company-data-covered*/services/go/pkg/generated/proto/payer_group"
	statepb "github.com/*company-data-covered*/services/go/pkg/generated/proto/state"
	insurancesql "github.com/*company-data-covered*/services/go/pkg/generated/sql/insurance"
	"github.com/*company-data-covered*/services/go/pkg/protoconv"
	"github.com/*company-data-covered*/services/go/pkg/sqltypes"
	"github.com/*company-data-covered*/services/go/pkg/station"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"github.com/jackc/pgx/v4"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/proto"
)

var (
	mockPayerName                        = "Awesome Payer"
	mockPayerNotes                       = "Like this payer"
	mockPayerIsActive                    = false
	mockNetworkName                      = "Awesome Network"
	mockNetworkNotes                     = "This note isn't empty"
	mockNetworkIsActive                  = true
	mockNetworkEligibilityCheckEnabled   = false
	mockNetworkProviderEnrollmentEnabled = false
	mockNetworkAddress                   = "This address isn't empty"
	mockNetworkZipcode                   = "This zipcode isn't empty"
	mockNetworkCity                      = "This city isn't empty"
	mockNetworkBillingState              = "This state isn't empty"
	mockEMCCode                          = "EMCcode123"
)

type insuranceGRPCServerParams struct {
	mockedDB                       *mockInsuranceDB
	mockPayerGroupServiceClient    *MockPayerGroupServiceClient
	mockStateServiceClient         *MockStateServiceClient
	mockInsurancePlanServiceClient *MockInsurancePlanServiceClient
	mockStationClient              *station.Client
}

func setup(params insuranceGRPCServerParams) *InsuranceGRPCServer {
	return &InsuranceGRPCServer{
		InsuranceDB:          params.mockedDB,
		Logger:               baselogger.NewSugaredLogger(baselogger.LoggerOptions{}),
		PayerGroupService:    params.mockPayerGroupServiceClient,
		StateService:         params.mockStateServiceClient,
		InsurancePlanService: params.mockInsurancePlanServiceClient,
		StationClient:        params.mockStationClient,
	}
}

func TestNewGRPCServer(t *testing.T) {
	tests := []struct {
		description string
		want        *InsuranceGRPCServer
	}{
		{
			description: "must instantiate a GRPCServer",
			want:        &InsuranceGRPCServer{},
		},
	}
	for _, tt := range tests {
		t.Run(tt.description, func(t *testing.T) {
			got := &InsuranceGRPCServer{}
			testutils.MustMatch(t, tt.want, got, "GRPCServer doesn't match")
		})
	}
}

func TestCreateInsurancePayer(t *testing.T) {
	now := time.Now()
	baseID := now.UnixNano()

	type args struct {
		r *insurancepb.CreateInsurancePayerRequest
	}

	tcs := []struct {
		description     string
		mockInsuranceDB *mockInsuranceDB
		args            args

		want     *insurancepb.CreateInsurancePayerResponse
		wantCode codes.Code
	}{
		{
			description: "success - creates insurance payer",
			mockInsuranceDB: &mockInsuranceDB{
				createInsurancePayerResult: &insurancesql.InsurancePayer{
					Name:         mockPayerName,
					IsActive:     mockPayerIsActive,
					Notes:        sqltypes.ToValidNullString(mockPayerNotes),
					PayerGroupID: baseID,
					CreatedAt:    now,
					UpdatedAt:    now,
				},
			},
			args: args{
				r: &insurancepb.CreateInsurancePayerRequest{
					Name:         mockPayerName,
					Active:       proto.Bool(mockPayerIsActive),
					Notes:        proto.String(mockPayerNotes),
					PayerGroupId: proto.Int64(baseID),
				},
			},

			wantCode: codes.OK,
			want: &insurancepb.CreateInsurancePayerResponse{Payer: &insurancepb.InsurancePayer{
				Name:         mockPayerName,
				Active:       mockPayerIsActive,
				PayerGroupId: baseID,
				Notes:        mockPayerNotes,
				CreatedAt:    protoconv.TimeToProtoTimestamp(&now),
				UpdatedAt:    protoconv.TimeToProtoTimestamp(&now),
			}},
		},
		{
			description: "error case - can't create insurance payer with duplicated name",
			mockInsuranceDB: &mockInsuranceDB{
				createInsurancePayerResult: nil,
				createInsurancePayerError:  errors.New("invalid attempt to create insurance payer with not unique name"),
			},
			args: args{
				r: &insurancepb.CreateInsurancePayerRequest{
					Name:         mockPayerName,
					Active:       proto.Bool(mockPayerIsActive),
					Notes:        proto.String(mockPayerNotes),
					PayerGroupId: proto.Int64(baseID),
				},
			},

			wantCode: codes.Internal,
		},
		{
			description: "error case - can't create insurance payer",
			mockInsuranceDB: &mockInsuranceDB{
				createInsurancePayerResult: nil,
				createInsurancePayerError:  errors.New("invalid attempt to create insurance payer without name"),
			},
			args: args{
				r: &insurancepb.CreateInsurancePayerRequest{
					Active:       proto.Bool(mockPayerIsActive),
					Notes:        proto.String(mockPayerNotes),
					PayerGroupId: proto.Int64(baseID),
				},
			},

			wantCode: codes.InvalidArgument,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.description, func(t *testing.T) {
			grpcServer := setup(insuranceGRPCServerParams{
				mockedDB: tc.mockInsuranceDB,
			})

			resp, err := grpcServer.CreateInsurancePayer(context.Background(), tc.args.r)
			reqStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, tc.wantCode, reqStatus.Code())
			testutils.MustMatch(t, tc.want, resp)
		})
	}
}

func TestDeleteInsurancePayer(t *testing.T) {
	now := time.Now()
	baseID := now.UnixNano()
	payerGroupID := baseID + 1

	type args struct {
		r *insurancepb.DeleteInsurancePayerRequest
	}

	tcs := []struct {
		description     string
		mockInsuranceDB *mockInsuranceDB
		args            args

		wantCode codes.Code
		want     *insurancepb.DeleteInsurancePayerResponse
	}{
		{
			description: "success - deletes insurance payer",
			mockInsuranceDB: &mockInsuranceDB{
				deleteInsurancePayerResult: &insurancesql.InsurancePayer{
					ID:           baseID,
					Name:         mockPayerName,
					IsActive:     mockPayerIsActive,
					Notes:        sqltypes.ToValidNullString(mockPayerNotes),
					PayerGroupID: payerGroupID,
					CreatedAt:    now,
					UpdatedAt:    now,
					DeletedAt:    sqltypes.ToValidNullTime(now),
				},
			},
			args: args{
				r: &insurancepb.DeleteInsurancePayerRequest{PayerId: baseID},
			},

			wantCode: codes.OK,
			want:     &insurancepb.DeleteInsurancePayerResponse{},
		},
		{
			description: "failure - invalid payer_id argument",

			wantCode: codes.InvalidArgument,
			want:     nil,
		},
		{
			description: "failure - no such insurance payer",
			mockInsuranceDB: &mockInsuranceDB{
				deleteInsurancePayerError: pgx.ErrNoRows,
			},
			args: args{
				r: &insurancepb.DeleteInsurancePayerRequest{PayerId: baseID},
			},

			wantCode: codes.NotFound,
			want:     nil,
		},
		{
			description: "failure - internal error",
			mockInsuranceDB: &mockInsuranceDB{
				deleteInsurancePayerError: errors.New("internal error"),
			},
			args: args{
				r: &insurancepb.DeleteInsurancePayerRequest{PayerId: baseID},
			},

			wantCode: codes.Internal,
			want:     nil,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.description, func(t *testing.T) {
			grpcServer := setup(insuranceGRPCServerParams{
				mockedDB: tc.mockInsuranceDB,
			})

			resp, err := grpcServer.DeleteInsurancePayer(context.Background(), tc.args.r)
			reqStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, tc.wantCode, reqStatus.Code())
			testutils.MustMatch(t, tc.want, resp)
		})
	}
}

func TestGetInsurancePayer(t *testing.T) {
	now := time.Now()
	baseID := now.UnixNano()
	payerGroupID := baseID + 1

	type args struct {
		r *insurancepb.GetInsurancePayerRequest
	}

	tcs := []struct {
		description     string
		args            args
		mockInsuranceDB *mockInsuranceDB

		wantCode codes.Code
		want     *insurancepb.GetInsurancePayerResponse
	}{
		{
			description: "success - successfully get payer",
			args: args{
				&insurancepb.GetInsurancePayerRequest{
					PayerId: baseID,
				},
			},
			mockInsuranceDB: &mockInsuranceDB{
				getInsurancePayerResult: &insurancesql.InsurancePayer{
					ID:           baseID,
					Name:         mockPayerName,
					IsActive:     mockPayerIsActive,
					Notes:        sqltypes.ToValidNullString(mockPayerNotes),
					PayerGroupID: payerGroupID,
					CreatedAt:    now,
					UpdatedAt:    now,
				},
			},

			wantCode: codes.OK,
			want: &insurancepb.GetInsurancePayerResponse{Payer: &insurancepb.InsurancePayer{
				Id:           baseID,
				Name:         mockPayerName,
				Active:       mockPayerIsActive,
				Notes:        mockPayerNotes,
				PayerGroupId: payerGroupID,
				CreatedAt:    protoconv.TimeToProtoTimestamp(&now),
				UpdatedAt:    protoconv.TimeToProtoTimestamp(&now),
			}},
		},
		{
			description: "failure - trying to get unexisting payer",
			args: args{
				&insurancepb.GetInsurancePayerRequest{
					PayerId: baseID,
				},
			},
			mockInsuranceDB: &mockInsuranceDB{
				getInsurancePayerError: pgx.ErrNoRows,
			},

			wantCode: codes.NotFound,
			want:     nil,
		},
		{
			description: "failure - internal error in db method",
			args: args{
				&insurancepb.GetInsurancePayerRequest{
					PayerId: baseID,
				},
			},
			mockInsuranceDB: &mockInsuranceDB{
				getInsurancePayerError: errors.New("internal error"),
			},

			wantCode: codes.Internal,
			want:     nil,
		},
		{
			description: "failure - invalid payer.id argument",
			args: args{
				&insurancepb.GetInsurancePayerRequest{
					PayerId: 0,
				},
			},
			mockInsuranceDB: &mockInsuranceDB{
				getInsurancePayerError: pgx.ErrNoRows,
			},

			wantCode: codes.InvalidArgument,
			want:     nil,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.description, func(t *testing.T) {
			grpcServer := setup(insuranceGRPCServerParams{
				mockedDB: tc.mockInsuranceDB,
			})

			resp, err := grpcServer.GetInsurancePayer(context.Background(), tc.args.r)
			reqStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, tc.wantCode, reqStatus.Code())
			testutils.MustMatch(t, tc.want, resp)
		})
	}
}

func TestGetInsuranceNetwork(t *testing.T) {
	now := time.Now()
	baseID := now.UnixNano()
	packageID := baseID + 1
	insuranceClassificationID := baseID + 2
	insurancePlanID := baseID + 3
	insurancePayerID := baseID + 4

	type args struct {
		r *insurancepb.GetInsuranceNetworkRequest
	}

	tcs := []struct {
		description     string
		args            args
		mockInsuranceDB *mockInsuranceDB

		wantCode codes.Code
		want     *insurancepb.GetInsuranceNetworkResponse
	}{
		{
			description: "success - successfully get network with all data",
			args: args{
				&insurancepb.GetInsuranceNetworkRequest{
					NetworkId: baseID,
				},
			},
			mockInsuranceDB: &mockInsuranceDB{
				getInsuranceNetworkResult: &insurancesql.InsuranceNetwork{
					ID:                        baseID,
					Name:                      mockNetworkName,
					IsActive:                  mockNetworkIsActive,
					Notes:                     sqltypes.ToValidNullString(mockNetworkNotes),
					PackageID:                 packageID,
					InsuranceClassificationID: insuranceClassificationID,
					InsurancePlanID:           insurancePlanID,
					InsurancePayerID:          insurancePayerID,
					EligibilityCheckEnabled:   mockNetworkEligibilityCheckEnabled,
					ProviderEnrollmentEnabled: mockNetworkProviderEnrollmentEnabled,
					CreatedAt:                 now,
					UpdatedAt:                 now,
				},
				getInsuranceNetworkStatesByInsuranceNetworksIDsResult: []*insurancesql.InsuranceNetworkState{
					{
						StateAbbr:          "CO",
						InsuranceNetworkID: baseID,
					},
					{
						StateAbbr:          "LA",
						InsuranceNetworkID: baseID,
					},
				},
				getInsuranceNetworkAddressesByInsuranceNetworksIDsResult: []*insurancesql.InsuranceNetworkAddress{{
					BillingState: mockNetworkBillingState,
					City:         mockNetworkCity,
					Zipcode:      mockNetworkZipcode,
					Address:      mockNetworkAddress,
				}},
			},

			wantCode: codes.OK,
			want: &insurancepb.GetInsuranceNetworkResponse{Network: &insurancepb.InsuranceNetwork{
				Id:                        baseID,
				Name:                      mockNetworkName,
				Active:                    mockNetworkIsActive,
				Notes:                     mockNetworkNotes,
				PackageId:                 packageID,
				InsuranceClassificationId: insuranceClassificationID,
				InsurancePlanId:           insurancePlanID,
				InsurancePayerId:          insurancePayerID,
				Addresses: []*common.Address{{
					State:          proto.String(mockNetworkBillingState),
					City:           proto.String(mockNetworkCity),
					ZipCode:        proto.String(mockNetworkZipcode),
					AddressLineOne: proto.String(mockNetworkAddress),
				}},
				CreatedAt:  protoconv.TimeToProtoTimestamp(&now),
				UpdatedAt:  protoconv.TimeToProtoTimestamp(&now),
				StateAbbrs: []string{"CO", "LA"},
			}},
		},
		{
			description: "success - successfully get network without states and addresses",
			args: args{
				&insurancepb.GetInsuranceNetworkRequest{
					NetworkId: baseID,
				},
			},
			mockInsuranceDB: &mockInsuranceDB{
				getInsuranceNetworkResult: &insurancesql.InsuranceNetwork{
					ID:                        baseID,
					Name:                      mockNetworkName,
					IsActive:                  mockNetworkIsActive,
					Notes:                     sqltypes.ToValidNullString(mockNetworkNotes),
					PackageID:                 packageID,
					InsuranceClassificationID: insuranceClassificationID,
					InsurancePlanID:           insurancePlanID,
					InsurancePayerID:          insurancePayerID,
					EligibilityCheckEnabled:   mockNetworkEligibilityCheckEnabled,
					ProviderEnrollmentEnabled: mockNetworkProviderEnrollmentEnabled,
					CreatedAt:                 now,
					UpdatedAt:                 now,
				},
				getInsuranceNetworkStatesByInsuranceNetworksIDsResult: nil,
			},

			wantCode: codes.OK,
			want: &insurancepb.GetInsuranceNetworkResponse{Network: &insurancepb.InsuranceNetwork{
				Id:                        baseID,
				Name:                      mockNetworkName,
				Active:                    mockNetworkIsActive,
				Notes:                     mockNetworkNotes,
				PackageId:                 packageID,
				InsuranceClassificationId: insuranceClassificationID,
				InsurancePlanId:           insurancePlanID,
				InsurancePayerId:          insurancePayerID,
				Addresses:                 []*common.Address{},
				CreatedAt:                 protoconv.TimeToProtoTimestamp(&now),
				UpdatedAt:                 protoconv.TimeToProtoTimestamp(&now),
				StateAbbrs:                nil,
			}},
		},
		{
			description: "failure - trying to get unexisting network",
			args: args{
				&insurancepb.GetInsuranceNetworkRequest{
					NetworkId: baseID,
				},
			},
			mockInsuranceDB: &mockInsuranceDB{
				getInsuranceNetworkError: pgx.ErrNoRows,
			},

			wantCode: codes.NotFound,
			want:     nil,
		},
		{
			description: "failure - internal error in get insurance network db method",
			args: args{
				&insurancepb.GetInsuranceNetworkRequest{
					NetworkId: baseID,
				},
			},
			mockInsuranceDB: &mockInsuranceDB{
				getInsuranceNetworkResult: &insurancesql.InsuranceNetwork{
					ID:                        baseID,
					Name:                      mockNetworkName,
					IsActive:                  mockNetworkIsActive,
					Notes:                     sqltypes.ToValidNullString(mockNetworkNotes),
					PackageID:                 packageID,
					InsuranceClassificationID: insuranceClassificationID,
					InsurancePlanID:           insurancePlanID,
					InsurancePayerID:          insurancePayerID,
					City:                      sqltypes.ToValidNullString(mockNetworkCity),
					Zipcode:                   sqltypes.ToValidNullString(mockNetworkZipcode),
					Address:                   sqltypes.ToValidNullString(mockNetworkAddress),
					EligibilityCheckEnabled:   mockNetworkEligibilityCheckEnabled,
					ProviderEnrollmentEnabled: mockNetworkProviderEnrollmentEnabled,
					CreatedAt:                 now,
					UpdatedAt:                 now,
				},
				getInsuranceNetworkStatesByInsuranceNetworksIDsError: errors.New("internal error"),
			},

			wantCode: codes.Internal,
			want:     nil,
		},
		{
			description: "failure - internal error in get insurance network states db method",
			args: args{
				&insurancepb.GetInsuranceNetworkRequest{
					NetworkId: baseID,
				},
			},
			mockInsuranceDB: &mockInsuranceDB{
				getInsuranceNetworkError: errors.New("internal error"),
			},

			wantCode: codes.Internal,
			want:     nil,
		},
		{
			description: "failure - invalid network.id argument",
			args: args{
				&insurancepb.GetInsuranceNetworkRequest{
					NetworkId: 0,
				},
			},
			mockInsuranceDB: &mockInsuranceDB{
				getInsuranceNetworkError: pgx.ErrNoRows,
			},

			wantCode: codes.InvalidArgument,
			want:     nil,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.description, func(t *testing.T) {
			grpcServer := setup(insuranceGRPCServerParams{
				mockedDB: tc.mockInsuranceDB,
			})

			resp, err := grpcServer.GetInsuranceNetwork(context.Background(), tc.args.r)
			reqStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, tc.wantCode, reqStatus.Code())
			testutils.MustMatch(t, tc.want, resp)
		})
	}
}

func TestGetInsuranceNetworkByInsurancePlanID(t *testing.T) {
	now := time.Now()
	baseID := now.UnixNano()
	packageID := baseID + 1
	insuranceClassificationID := baseID + 2
	insurancePlanID := baseID + 3
	insurancePayerID := baseID + 4
	payerGroupID := baseID + 5

	type args struct {
		r *insurancepb.GetInsuranceNetworkByInsurancePlanIDRequest
	}

	tcs := []struct {
		description     string
		args            args
		mockInsuranceDB *mockInsuranceDB

		wantCode codes.Code
		want     *insurancepb.GetInsuranceNetworkByInsurancePlanIDResponse
	}{
		{
			description: "success - successfully get network with all data",
			args: args{
				&insurancepb.GetInsuranceNetworkByInsurancePlanIDRequest{
					InsurancePlanId: insurancePlanID,
				},
			},
			mockInsuranceDB: &mockInsuranceDB{
				getInsuranceNetworkByInsurancePlanIDResult: &insurancesql.GetInsuranceNetworkByInsurancePlanIDRow{
					ID:                        baseID,
					Name:                      mockNetworkName,
					IsActive:                  mockNetworkIsActive,
					Notes:                     sqltypes.ToValidNullString(mockNetworkNotes),
					PackageID:                 packageID,
					InsuranceClassificationID: insuranceClassificationID,
					InsurancePlanID:           insurancePlanID,
					InsurancePayerID:          insurancePayerID,
					InsurancePayerGroupID:     payerGroupID,
					City:                      sqltypes.ToValidNullString(mockNetworkCity),
					Zipcode:                   sqltypes.ToValidNullString(mockNetworkZipcode),
					Address:                   sqltypes.ToValidNullString(mockNetworkAddress),
					BillingState:              sqltypes.ToValidNullString(mockNetworkBillingState),
					EligibilityCheckEnabled:   mockNetworkEligibilityCheckEnabled,
					ProviderEnrollmentEnabled: mockNetworkProviderEnrollmentEnabled,
					CreatedAt:                 now,
					UpdatedAt:                 now,
				},
				getInsuranceNetworkAddressesByInsuranceNetworksIDsResult: []*insurancesql.InsuranceNetworkAddress{{
					BillingState: mockNetworkBillingState,
					City:         mockNetworkCity,
					Zipcode:      mockNetworkZipcode,
					Address:      mockNetworkAddress,
				}},
			},

			wantCode: codes.OK,
			want: &insurancepb.GetInsuranceNetworkByInsurancePlanIDResponse{Network: &insurancepb.InsuranceNetwork{
				Id:                        baseID,
				Name:                      mockNetworkName,
				Active:                    mockNetworkIsActive,
				Notes:                     mockNetworkNotes,
				PackageId:                 packageID,
				InsuranceClassificationId: insuranceClassificationID,
				InsurancePlanId:           insurancePlanID,
				InsurancePayerId:          insurancePayerID,
				InsurancePayerGroupId:     payerGroupID,
				Addresses: []*common.Address{{
					State:          proto.String(mockNetworkBillingState),
					City:           proto.String(mockNetworkCity),
					ZipCode:        proto.String(mockNetworkZipcode),
					AddressLineOne: proto.String(mockNetworkAddress),
				}},
				CreatedAt: protoconv.TimeToProtoTimestamp(&now),
				UpdatedAt: protoconv.TimeToProtoTimestamp(&now),
			}},
		},
		{
			description: "failure - trying to get unexisting network",
			args: args{
				&insurancepb.GetInsuranceNetworkByInsurancePlanIDRequest{
					InsurancePlanId: insurancePlanID,
				},
			},
			mockInsuranceDB: &mockInsuranceDB{
				getInsuranceNetworkByInsurancePlanIDError: pgx.ErrNoRows,
			},

			wantCode: codes.NotFound,
			want:     nil,
		},
		{
			description: "failure - internal error in get insurance network by insurance plan id db method",
			args: args{
				&insurancepb.GetInsuranceNetworkByInsurancePlanIDRequest{
					InsurancePlanId: insurancePlanID,
				},
			},
			mockInsuranceDB: &mockInsuranceDB{
				getInsuranceNetworkByInsurancePlanIDError: errors.New("internal error"),
			},

			wantCode: codes.Internal,
			want:     nil,
		},
		{
			description: "failure - invalid insurance_plan_id argument",
			args: args{
				&insurancepb.GetInsuranceNetworkByInsurancePlanIDRequest{
					InsurancePlanId: 0,
				},
			},
			mockInsuranceDB: &mockInsuranceDB{
				getInsuranceNetworkByInsurancePlanIDError: pgx.ErrNoRows,
			},

			wantCode: codes.InvalidArgument,
			want:     nil,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.description, func(t *testing.T) {
			grpcServer := setup(insuranceGRPCServerParams{
				mockedDB: tc.mockInsuranceDB,
			})

			resp, err := grpcServer.GetInsuranceNetworkByInsurancePlanID(context.Background(), tc.args.r)
			reqStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, tc.wantCode, reqStatus.Code())
			testutils.MustMatch(t, tc.want, resp)
		})
	}
}

func TestListInsurancePayers(t *testing.T) {
	now := time.Now()
	baseID := now.UnixNano()
	baseNetworkID := baseID + 1
	baseInsuranceClassificationID := baseID + 2
	baseInsurancePlanID := baseID + 3
	basePackageID := baseID + 4
	basePayerGroupID := baseID + 5

	r := &insurancepb.ListInsurancePayersRequest{}

	tcs := []struct {
		description     string
		mockInsuranceDB *mockInsuranceDB

		wantCode codes.Code
		wantResp *insurancepb.ListInsurancePayersResponse
	}{
		{
			description: "success - successfully get all possible data",
			mockInsuranceDB: &mockInsuranceDB{
				getInsurancePayersWithFilterAndOrderResult: []*insurancesql.InsurancePayer{{
					ID:           baseID,
					Name:         mockPayerName,
					IsActive:     mockPayerIsActive,
					Notes:        sqltypes.ToValidNullString(mockPayerNotes),
					PayerGroupID: basePayerGroupID,
					CreatedAt:    now,
					UpdatedAt:    now,
				}},
				searchInsuranceNetworksResult: []*insurancesql.SearchInsuranceNetworksRow{{
					ID:                        baseNetworkID,
					Name:                      mockNetworkName,
					InsurancePayerID:          baseID,
					InsurancePlanID:           baseInsurancePlanID,
					InsuranceClassificationID: baseInsuranceClassificationID,
					PackageID:                 basePackageID,
				}},
				getInsuranceNetworkStatesByInsuranceNetworksIDsResult: []*insurancesql.InsuranceNetworkState{{
					ID:                 1,
					InsuranceNetworkID: baseNetworkID,
					StateAbbr:          "CO",
				}},
			},

			wantCode: codes.OK,
			wantResp: &insurancepb.ListInsurancePayersResponse{
				Payers: []*insurancepb.InsurancePayer{{
					Id:           baseID,
					Name:         mockPayerName,
					Active:       mockPayerIsActive,
					Notes:        mockPayerNotes,
					PayerGroupId: basePayerGroupID,
					CreatedAt:    protoconv.TimeToProtoTimestamp(&now),
					UpdatedAt:    protoconv.TimeToProtoTimestamp(&now),
					InsuranceNetworks: []*insurancepb.InsurancePayer_InsuranceNetwork{{
						Id:                        baseNetworkID,
						Name:                      mockNetworkName,
						PackageId:                 basePackageID,
						InsuranceClassificationId: baseInsuranceClassificationID,
						InsurancePlanId:           baseInsurancePlanID,
					}},
					StateAbbrs: []string{"CO"},
				}},
			},
		},
		{
			description: "success - successfully with only payers array",
			mockInsuranceDB: &mockInsuranceDB{
				getInsurancePayersWithFilterAndOrderResult: []*insurancesql.InsurancePayer{{
					ID:           baseID,
					Name:         mockPayerName,
					IsActive:     mockPayerIsActive,
					Notes:        sqltypes.ToValidNullString(mockPayerNotes),
					PayerGroupID: basePayerGroupID,
					CreatedAt:    now,
					UpdatedAt:    now,
				}},
			},

			wantCode: codes.OK,
			wantResp: &insurancepb.ListInsurancePayersResponse{
				Payers: []*insurancepb.InsurancePayer{{
					Id:           baseID,
					Name:         mockPayerName,
					Active:       mockPayerIsActive,
					Notes:        mockPayerNotes,
					PayerGroupId: basePayerGroupID,
					CreatedAt:    protoconv.TimeToProtoTimestamp(&now),
					UpdatedAt:    protoconv.TimeToProtoTimestamp(&now),
				}},
			},
		},
		{
			description: "success - successfully get empty payers array",
			mockInsuranceDB: &mockInsuranceDB{
				getInsurancePayersWithFilterAndOrderResult: []*insurancesql.InsurancePayer{},
			},

			wantCode: codes.OK,
			wantResp: &insurancepb.ListInsurancePayersResponse{
				Payers: nil,
			},
		},
		{
			description: "failure - return error from getInsuranceNetworks DB method",
			mockInsuranceDB: &mockInsuranceDB{
				getInsurancePayersWithFilterAndOrderResult: []*insurancesql.InsurancePayer{{
					ID:           baseID,
					Name:         mockPayerName,
					IsActive:     mockPayerIsActive,
					Notes:        sqltypes.ToValidNullString(mockPayerNotes),
					PayerGroupID: basePayerGroupID,
					CreatedAt:    now,
					UpdatedAt:    now,
				}},
				searchInsuranceNetworksError: errors.New("unexpected error"),
			},

			wantCode: codes.Internal,
		},
		{
			description: "failure - return error from getInsuranceNetworkStates DB method",
			mockInsuranceDB: &mockInsuranceDB{
				getInsurancePayersWithFilterAndOrderResult: []*insurancesql.InsurancePayer{{
					ID:           baseID,
					Name:         mockPayerName,
					IsActive:     mockPayerIsActive,
					Notes:        sqltypes.ToValidNullString(mockPayerNotes),
					PayerGroupID: basePayerGroupID,
					CreatedAt:    now,
					UpdatedAt:    now,
				}},
				searchInsuranceNetworksResult:                        []*insurancesql.SearchInsuranceNetworksRow{},
				getInsuranceNetworkStatesByInsuranceNetworksIDsError: errors.New("unexpected error"),
			},

			wantCode: codes.Internal,
		},
		{
			description: "failure - return error from getInsruancePayers DB method",
			mockInsuranceDB: &mockInsuranceDB{
				getInsurancePayersWithFilterAndOrderError: errors.New("unexpected error"),
			},

			wantCode: codes.Internal,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.description, func(t *testing.T) {
			grpcServer := setup(insuranceGRPCServerParams{
				mockedDB: tc.mockInsuranceDB,
			})

			resp, err := grpcServer.ListInsurancePayers(context.Background(), r)
			reqStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, tc.wantCode, reqStatus.Code())
			testutils.MustMatch(t, tc.wantResp, resp)
		})
	}
}

func TestSearchInsuranceNetworks(t *testing.T) {
	now := time.Now()
	baseID := now.UnixNano()
	packageID := baseID + 1
	insuranceClassificationID := baseID + 2
	insurancePlanID := baseID + 3
	insurancePayerID := baseID + 4
	billingCityID := baseID + 5
	stationGoodResponse := []int64{baseID}
	stationBadResponse := struct {
		networks []int64
	}{networks: stationGoodResponse}

	tcs := []struct {
		description         string
		input               *insurancepb.SearchInsuranceNetworksRequest
		mockInsuranceDB     *mockInsuranceDB
		stationHTTPStatus   int
		stationHTTPResponse any

		wantCode codes.Code
	}{
		{
			description: "success - successfully get all possible data",
			input:       &insurancepb.SearchInsuranceNetworksRequest{},
			mockInsuranceDB: &mockInsuranceDB{
				searchInsuranceNetworksResult: []*insurancesql.SearchInsuranceNetworksRow{{
					ID:                        baseID,
					Name:                      mockNetworkName,
					InsurancePayerID:          insurancePayerID,
					InsurancePlanID:           insurancePlanID,
					InsuranceClassificationID: insuranceClassificationID,
					PackageID:                 packageID,
				}},
				getInsuranceNetworkStatesByInsuranceNetworksIDsResult: []*insurancesql.InsuranceNetworkState{{
					ID:                 1,
					InsuranceNetworkID: baseID,
					StateAbbr:          "CO",
				}},
				getInsuranceNetworkAddressesByInsuranceNetworksIDsResult: []*insurancesql.InsuranceNetworkAddress{{
					BillingState: mockNetworkBillingState,
					City:         mockNetworkCity,
					Zipcode:      mockNetworkZipcode,
					Address:      mockNetworkAddress,
				}},
			},
			stationHTTPResponse: stationGoodResponse,
			stationHTTPStatus:   http.StatusOK,

			wantCode: codes.OK,
		},
		{
			description: "success - successfully with only networks array",
			input:       &insurancepb.SearchInsuranceNetworksRequest{},
			mockInsuranceDB: &mockInsuranceDB{
				searchInsuranceNetworksResult: []*insurancesql.SearchInsuranceNetworksRow{{
					ID:                        baseID,
					Name:                      mockNetworkName,
					InsurancePayerID:          insurancePayerID,
					InsurancePlanID:           insurancePlanID,
					InsuranceClassificationID: insuranceClassificationID,
					PackageID:                 packageID,
				}},
			},
			stationHTTPResponse: stationGoodResponse,
			stationHTTPStatus:   http.StatusOK,

			wantCode: codes.OK,
		},
		{
			description: "success - successfully with only insurance plan IDs filter",
			input: &insurancepb.SearchInsuranceNetworksRequest{
				InsurancePlanIds: []int64{insurancePlanID},
			},
			mockInsuranceDB: &mockInsuranceDB{
				searchInsuranceNetworksResult: []*insurancesql.SearchInsuranceNetworksRow{{
					ID:                        baseID,
					Name:                      mockNetworkName,
					InsurancePayerID:          insurancePayerID,
					InsurancePlanID:           insurancePlanID,
					InsuranceClassificationID: insuranceClassificationID,
					PackageID:                 packageID,
				}},
			},
			stationHTTPResponse: stationGoodResponse,
			stationHTTPStatus:   http.StatusOK,

			wantCode: codes.OK,
		},
		{
			description: "success - successfully with only package IDs array",
			input: &insurancepb.SearchInsuranceNetworksRequest{
				PackageIds: []int64{packageID},
			},
			mockInsuranceDB: &mockInsuranceDB{
				searchInsuranceNetworksResult: []*insurancesql.SearchInsuranceNetworksRow{{
					ID:                        baseID,
					Name:                      mockNetworkName,
					InsurancePayerID:          insurancePayerID,
					InsurancePlanID:           insurancePlanID,
					InsuranceClassificationID: insuranceClassificationID,
					PackageID:                 packageID,
				}},
			},
			stationHTTPResponse: stationGoodResponse,
			stationHTTPStatus:   http.StatusOK,

			wantCode: codes.OK,
		},
		{
			description: "success - successfully get empty payers array",
			input:       &insurancepb.SearchInsuranceNetworksRequest{},
			mockInsuranceDB: &mockInsuranceDB{
				searchInsuranceNetworksResult: []*insurancesql.SearchInsuranceNetworksRow{},
			},
			stationHTTPResponse: stationGoodResponse,
			stationHTTPStatus:   http.StatusOK,

			wantCode: codes.OK,
		},
		{
			description: "failure - return error from getInsuranceNetworks DB method",
			input:       &insurancepb.SearchInsuranceNetworksRequest{},
			mockInsuranceDB: &mockInsuranceDB{
				searchInsuranceNetworksError: errors.New("unexpected error"),
			},
			stationHTTPResponse: stationGoodResponse,
			stationHTTPStatus:   http.StatusOK,

			wantCode: codes.Internal,
		},
		{
			description: "failure - return error from getInsuranceNetworkStates DB method",
			input:       &insurancepb.SearchInsuranceNetworksRequest{},
			mockInsuranceDB: &mockInsuranceDB{
				searchInsuranceNetworksResult: []*insurancesql.SearchInsuranceNetworksRow{{
					ID:                        baseID,
					Name:                      mockNetworkName,
					InsurancePayerID:          insurancePayerID,
					InsurancePlanID:           insurancePlanID,
					InsuranceClassificationID: insuranceClassificationID,
					PackageID:                 packageID,
				}},
				getInsuranceNetworkStatesByInsuranceNetworksIDsError: errors.New("unexpected error"),
			},
			stationHTTPResponse: stationGoodResponse,
			stationHTTPStatus:   http.StatusOK,

			wantCode: codes.Internal,
		},
		{
			description: "failure - return error from station",
			input: &insurancepb.SearchInsuranceNetworksRequest{
				BillingCityId: &billingCityID,
			},
			stationHTTPResponse: stationBadResponse,
			stationHTTPStatus:   http.StatusOK,

			wantCode: codes.Internal,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.description, func(t *testing.T) {
			stationServer := httptest.NewServer(http.HandlerFunc(
				func(rw http.ResponseWriter, req *http.Request) {
					rw.WriteHeader(tc.stationHTTPStatus)
					resp, err := json.Marshal(tc.stationHTTPResponse)
					if err != nil {
						t.Fatalf("failed to marshal json: %s", err)
					}
					rw.Write(resp)
				},
			))
			defer stationServer.Close()

			grpcServer := setup(insuranceGRPCServerParams{
				mockedDB: tc.mockInsuranceDB,
				mockStationClient: &station.Client{
					AuthToken:  mockAuthValuer{},
					StationURL: stationServer.URL,
					HTTPClient: stationServer.Client(),
				},
			})

			_, err := grpcServer.SearchInsuranceNetworks(context.Background(), tc.input)
			reqStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, tc.wantCode, reqStatus.Code())
		})
	}
}

func TestUpdateInsurancePayer(t *testing.T) {
	now := time.Now()
	baseID := now.UnixNano()
	payerGroupID := baseID + 1

	type args struct {
		r *insurancepb.UpdateInsurancePayerRequest
	}

	tcs := []struct {
		description     string
		mockInsuranceDB *mockInsuranceDB
		args            args

		wantCode codes.Code
		want     *insurancepb.UpdateInsurancePayerResponse
	}{
		{
			description: "success - updates insurance payer",
			mockInsuranceDB: &mockInsuranceDB{
				updateInsurancePayerResult: &insurancesql.InsurancePayer{
					ID:           baseID,
					Name:         mockPayerName,
					IsActive:     mockPayerIsActive,
					Notes:        sqltypes.ToValidNullString(mockPayerNotes),
					PayerGroupID: payerGroupID,
					CreatedAt:    now,
					UpdatedAt:    now,
				},
			},
			args: args{
				r: &insurancepb.UpdateInsurancePayerRequest{
					PayerId: baseID,
					Name:    mockPayerName,
				},
			},

			wantCode: codes.OK,
			want: &insurancepb.UpdateInsurancePayerResponse{Payer: &insurancepb.InsurancePayer{
				Id:           baseID,
				Name:         mockPayerName,
				Active:       mockPayerIsActive,
				Notes:        mockPayerNotes,
				PayerGroupId: payerGroupID,
				CreatedAt:    protoconv.TimeToProtoTimestamp(&now),
				UpdatedAt:    protoconv.TimeToProtoTimestamp(&now),
			}},
		},
		{
			description: "failure - invalid payer.id argument",
			args: args{
				r: &insurancepb.UpdateInsurancePayerRequest{
					Name: mockPayerName,
				},
			},

			wantCode: codes.InvalidArgument,
			want:     nil,
		},
		{
			description: "failure - invalid payer.name argument",
			args: args{
				r: &insurancepb.UpdateInsurancePayerRequest{
					PayerId: baseID,
				},
			},

			wantCode: codes.InvalidArgument,
			want:     nil,
		},
		{
			description: "failure - no such insurance payer",
			mockInsuranceDB: &mockInsuranceDB{
				updateInsurancePayerError: pgx.ErrNoRows,
			},
			args: args{
				r: &insurancepb.UpdateInsurancePayerRequest{
					PayerId: baseID,
					Name:    mockPayerName,
				},
			},

			wantCode: codes.NotFound,
			want:     nil,
		},
		{
			description: "failure - internal error",
			mockInsuranceDB: &mockInsuranceDB{
				updateInsurancePayerError: errors.New("internal error"),
			},
			args: args{
				r: &insurancepb.UpdateInsurancePayerRequest{
					PayerId: baseID,
					Name:    mockPayerName,
				},
			},

			wantCode: codes.Internal,
			want:     nil,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.description, func(t *testing.T) {
			grpcServer := setup(insuranceGRPCServerParams{
				mockedDB: tc.mockInsuranceDB,
			})

			resp, err := grpcServer.UpdateInsurancePayer(context.Background(), tc.args.r)
			reqStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, tc.wantCode, reqStatus.Code())
			testutils.MustMatch(t, tc.want, resp)
		})
	}
}

func TestListInsuranceClassifications(t *testing.T) {
	now := time.Now()
	baseID := now.UnixNano()
	mockClassificationName := "Aetna"

	stationGoodResponse := &[]StationInsuranceClassification{
		{
			ID:   baseID,
			Name: mockClassificationName,
		},
	}
	stationBadResponse := struct {
		serviceLines *[]StationInsuranceClassification
	}{serviceLines: stationGoodResponse}

	tcs := []struct {
		description         string
		stationHTTPStatus   int
		stationHTTPResponse any

		want         *insurancepb.ListInsuranceClassificationsResponse
		wantGRPCCode codes.Code
	}{
		{
			description:         "success - base case",
			stationHTTPStatus:   http.StatusOK,
			stationHTTPResponse: stationGoodResponse,

			want: &insurancepb.ListInsuranceClassificationsResponse{
				InsuranceClassifications: InsuranceClassificationsProtoFromStationInsuranceClassifications(*stationGoodResponse),
			},
			wantGRPCCode: codes.OK,
		},
		{
			description:         "failure - unable to get insurance classifications",
			stationHTTPStatus:   http.StatusOK,
			stationHTTPResponse: stationBadResponse,

			want:         nil,
			wantGRPCCode: codes.Internal,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.description, func(t *testing.T) {
			stationServer := httptest.NewServer(http.HandlerFunc(
				func(rw http.ResponseWriter, req *http.Request) {
					rw.WriteHeader(tc.stationHTTPStatus)
					resp, err := json.Marshal(tc.stationHTTPResponse)
					if err != nil {
						t.Fatalf("failed to marshal json: %s", err)
					}
					rw.Write(resp)
				},
			))
			defer stationServer.Close()

			grpcServer := &InsuranceGRPCServer{
				StationClient: &station.Client{
					AuthToken:  mockAuthValuer{},
					StationURL: stationServer.URL,
					HTTPClient: stationServer.Client(),
				},
				Logger: baselogger.NewSugaredLogger(baselogger.LoggerOptions{}),
			}

			resp, err := grpcServer.ListInsuranceClassifications(context.Background(), &insurancepb.ListInsuranceClassificationsRequest{})
			reqStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, resp, tc.want)
			testutils.MustMatch(t, reqStatus.Code(), tc.wantGRPCCode)
		})
	}
}

func TestListModalities(t *testing.T) {
	stationSuccessResponse := &StationModalitiesResponse{
		Modalities: []StationModality{
			{
				ID:          1,
				DisplayName: "Virtual",
				Type:        "virtual",
			},
		},
	}
	stationBadResponse := []StationModalitiesResponse{*stationSuccessResponse}

	tcs := []struct {
		description         string
		stationHTTPStatus   int
		stationHTTPResponse any

		want         *insurancepb.ListModalitiesResponse
		wantGRPCCode codes.Code
	}{
		{
			description:         "success - base case",
			stationHTTPStatus:   http.StatusOK,
			stationHTTPResponse: stationSuccessResponse,

			want: &insurancepb.ListModalitiesResponse{
				Modalities: []*insurancepb.Modality{
					{
						Id:          1,
						DisplayName: "Virtual",
						Type:        "virtual",
					},
				},
			},
			wantGRPCCode: codes.OK,
		},
		{
			description:         "failure - unable to get modalities",
			stationHTTPStatus:   http.StatusOK,
			stationHTTPResponse: stationBadResponse,

			want:         nil,
			wantGRPCCode: codes.Internal,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.description, func(t *testing.T) {
			stationServer := httptest.NewServer(http.HandlerFunc(
				func(rw http.ResponseWriter, req *http.Request) {
					rw.WriteHeader(tc.stationHTTPStatus)
					resp, err := json.Marshal(tc.stationHTTPResponse)
					if err != nil {
						t.Fatalf("failed to marshal json: %s", err)
					}
					rw.Write(resp)
				},
			))
			defer stationServer.Close()

			grpcServer := &InsuranceGRPCServer{
				StationClient: &station.Client{
					AuthToken:  mockAuthValuer{},
					StationURL: stationServer.URL,
					HTTPClient: stationServer.Client(),
				},
				Logger: baselogger.NewSugaredLogger(baselogger.LoggerOptions{}),
			}

			resp, err := grpcServer.ListModalities(context.Background(), &insurancepb.ListModalitiesRequest{})
			reqStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, resp, tc.want)
			testutils.MustMatch(t, reqStatus.Code(), tc.wantGRPCCode)
		})
	}
}

func TestListServiceLines(t *testing.T) {
	now := time.Now()
	baseID := now.UnixNano()
	existingAppointmentTypeID := int(baseID + 1)
	newAppointmentTypeID := int(baseID + 2)
	shiftTypeID := baseID + 3
	mockServiceLineName := "Acute Service Line"
	mockAppointmentTypeName := "D06 In-Person"

	stationGoodResponse := []StationServiceLine{
		{
			ID:      baseID,
			Name:    mockServiceLineName,
			Default: true,
			ExistingPatientAppointmentType: &StationAppointmentType{
				ID:   strconv.Itoa(existingAppointmentTypeID),
				Name: mockAppointmentTypeName,
			},
			NewPatientAppointmentType: &StationAppointmentType{
				ID:   strconv.Itoa(newAppointmentTypeID),
				Name: mockAppointmentTypeName,
			},
			ShiftTypeID:              shiftTypeID,
			OutOfNetworkInsurance:    false,
			RequireCheckout:          false,
			RequireMedicalNecessity:  false,
			RequireConsentSignature:  false,
			Followup2Day:             false,
			Followup14To30Day:        false,
			Is911:                    true,
			UpgradeableWithScreening: false,
			UpdatedAt:                now.String(),
			CreatedAt:                now.String(),
		},
	}
	stationBadResponse := struct {
		serviceLines []StationServiceLine
	}{serviceLines: stationGoodResponse}

	tcs := []struct {
		description         string
		stationHTTPStatus   int
		stationHTTPResponse any

		want         *insurancepb.ListServiceLinesResponse
		wantGRPCCode codes.Code
	}{
		{
			description:         "success - base case",
			stationHTTPStatus:   http.StatusOK,
			stationHTTPResponse: stationGoodResponse,

			want: &insurancepb.ListServiceLinesResponse{
				ServiceLines: ServiceLinesProtoFromStationServiceLines(stationGoodResponse),
			},
			wantGRPCCode: codes.OK,
		},
		{
			description:         "failure - unable to get service lines",
			stationHTTPStatus:   http.StatusOK,
			stationHTTPResponse: stationBadResponse,

			want:         nil,
			wantGRPCCode: codes.Internal,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.description, func(t *testing.T) {
			stationServer := httptest.NewServer(http.HandlerFunc(
				func(rw http.ResponseWriter, req *http.Request) {
					rw.WriteHeader(tc.stationHTTPStatus)
					resp, err := json.Marshal(tc.stationHTTPResponse)
					if err != nil {
						t.Fatalf("failed to marshal json: %s", err)
					}
					rw.Write(resp)
				},
			))
			defer stationServer.Close()

			grpcServer := &InsuranceGRPCServer{
				StationClient: &station.Client{
					AuthToken:  mockAuthValuer{},
					StationURL: stationServer.URL,
					HTTPClient: stationServer.Client(),
				},
				Logger: baselogger.NewSugaredLogger(baselogger.LoggerOptions{}),
			}

			resp, err := grpcServer.ListServiceLines(context.Background(), &insurancepb.ListServiceLinesRequest{})
			reqStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, resp, tc.want)
			testutils.MustMatch(t, reqStatus.Code(), tc.wantGRPCCode)
		})
	}
}

func TestListPayerGroups(t *testing.T) {
	tcs := []struct {
		description string
		request     *insurancepb.ListPayerGroupsRequest

		wantGrpcRes *payergrouppb.ListPayerGroupsResponse
		wantGrpcErr error
		wantErrMsg  string
		wantCode    codes.Code
		want        *insurancepb.ListPayerGroupsResponse
	}{
		{
			description: "success - list payer groups",
			wantCode:    codes.OK,
			request:     &insurancepb.ListPayerGroupsRequest{},
			wantGrpcRes: &payergrouppb.ListPayerGroupsResponse{
				PayerGroups: []*payergrouppb.PayerGroup{
					{
						Id:           1,
						Name:         "Test",
						PayerGroupId: 3,
					},
					{
						Id:           2,
						Name:         "Test Two",
						PayerGroupId: 5,
					},
				},
			},
			want: &insurancepb.ListPayerGroupsResponse{
				PayerGroups: []*insurancepb.PayerGroup{
					{
						Id:           1,
						Name:         "Test",
						PayerGroupId: 3,
					},
					{
						Id:           2,
						Name:         "Test Two",
						PayerGroupId: 5,
					},
				},
			},
		},
		{
			description: "error - list payer groups",
			wantCode:    codes.Internal,
			request:     &insurancepb.ListPayerGroupsRequest{},
			wantGrpcErr: errors.New("internal error"),
			wantErrMsg:  "failed to get payer groups internal error",
		},
		{
			description: "success - empty list of payer groups",
			wantCode:    codes.OK,
			request:     &insurancepb.ListPayerGroupsRequest{},
			wantGrpcRes: &payergrouppb.ListPayerGroupsResponse{
				PayerGroups: []*payergrouppb.PayerGroup{},
			},
			want: &insurancepb.ListPayerGroupsResponse{
				PayerGroups: []*insurancepb.PayerGroup{},
			},
		},
	}

	for _, tc := range tcs {
		t.Run(tc.description, func(t *testing.T) {
			grpcServer := setup(insuranceGRPCServerParams{
				mockPayerGroupServiceClient: &MockPayerGroupServiceClient{
					ListPayerGroupsResult: tc.wantGrpcRes,
					ListPayerGroupsErr:    tc.wantGrpcErr,
				},
			})

			resp, err := grpcServer.ListPayerGroups(context.Background(), tc.request)
			reqStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, tc.wantCode, reqStatus.Code())
			testutils.MustMatch(t, tc.wantErrMsg, reqStatus.Message())
			testutils.MustMatch(t, tc.want, resp)
		})
	}
}

func TestListStates(t *testing.T) {
	tcs := []struct {
		description string
		request     *insurancepb.ListStatesRequest

		wantGrpcRes *statepb.ListStatesResponse
		wantGrpcErr error
		wantErrMsg  string
		wantCode    codes.Code
		want        *insurancepb.ListStatesResponse
	}{
		{
			description: "success - list states",
			wantCode:    codes.OK,
			request:     &insurancepb.ListStatesRequest{},
			wantGrpcRes: &statepb.ListStatesResponse{
				States: []*statepb.State{
					{Id: 1, Name: "Colorado", Abbreviation: "CO", BillingCities: nil},
					{Id: 2, Name: "Texas", Abbreviation: "TX", BillingCities: nil}},
			},
			want: &insurancepb.ListStatesResponse{
				States: []*insurancepb.State{
					{Id: 1, Name: "Colorado", Abbreviation: "CO", BillingCities: []*insurancepb.BillingCity{}},
					{Id: 2, Name: "Texas", Abbreviation: "TX", BillingCities: []*insurancepb.BillingCity{}},
				},
			},
		},
		{
			description: "error - list states",
			wantCode:    codes.Internal,
			request:     &insurancepb.ListStatesRequest{},
			wantGrpcErr: errors.New("internal error"),
			wantErrMsg:  "failed to get states: internal error",
		},
		{
			description: "success - empty list of states",
			wantCode:    codes.OK,
			request:     &insurancepb.ListStatesRequest{},
			wantGrpcRes: &statepb.ListStatesResponse{
				States: []*statepb.State{},
			},

			want: &insurancepb.ListStatesResponse{
				States: []*insurancepb.State{},
			},
		},
	}

	for _, tc := range tcs {
		t.Run(tc.description, func(t *testing.T) {
			grpcServer := setup(insuranceGRPCServerParams{
				mockStateServiceClient: &MockStateServiceClient{
					ListStatesResult: tc.wantGrpcRes,
					ListStatesErr:    tc.wantGrpcErr,
				},
			})

			resp, err := grpcServer.ListStates(context.Background(), tc.request)
			reqStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, tc.wantCode, reqStatus.Code())
			testutils.MustMatch(t, tc.wantErrMsg, reqStatus.Message())
			testutils.MustMatch(t, tc.want, resp)
		})
	}
}

func TestCreateInsuranceNetwork(t *testing.T) {
	now := time.Now()
	baseID := now.UnixNano()
	selfPayPackageID := int64(0)
	packageID := baseID + 1
	insuranceClassificationID := baseID + 2
	insurancePayerID := baseID + 3

	type args struct {
		r *insurancepb.CreateInsuranceNetworkRequest
	}

	tcs := []struct {
		description     string
		mockInsuranceDB *mockInsuranceDB
		args            args
		grpcRes         *insuranceplanpb.CreateInsurancePlanResponse
		grpcErr         error

		want     *insurancepb.CreateInsuranceNetworkResponse
		wantCode codes.Code
	}{
		{
			description: "success - creates insurance network",
			mockInsuranceDB: &mockInsuranceDB{
				createInsuranceNetworkResult: &insurancesql.InsuranceNetwork{
					Name:                      mockNetworkName,
					PackageID:                 packageID,
					InsuranceClassificationID: insuranceClassificationID,
					InsurancePayerID:          insurancePayerID,
					CreatedAt:                 now,
					UpdatedAt:                 now,
				},
			},
			args: args{
				r: &insurancepb.CreateInsuranceNetworkRequest{
					Name:                      mockNetworkName,
					PackageId:                 &packageID,
					InsuranceClassificationId: insuranceClassificationID,
					InsurancePayerId:          insurancePayerID,
				},
			},
			grpcRes: &insuranceplanpb.CreateInsurancePlanResponse{
				InsurancePlan: &insuranceplanpb.InsurancePlan{
					Id:   baseID,
					Name: mockNetworkName,
				},
			},

			wantCode: codes.OK,
			want: &insurancepb.CreateInsuranceNetworkResponse{
				Network: &insurancepb.InsuranceNetwork{
					Name:                      mockNetworkName,
					PackageId:                 packageID,
					InsuranceClassificationId: insuranceClassificationID,
					InsurancePayerId:          insurancePayerID,
					CreatedAt:                 protoconv.TimeToProtoTimestamp(&now),
					UpdatedAt:                 protoconv.TimeToProtoTimestamp(&now),
					Addresses:                 []*common.Address{},
				},
			},
		},
		{
			description: "success - creates insurance network with package id = 0 for Self Pay insurance plans",
			mockInsuranceDB: &mockInsuranceDB{
				createInsuranceNetworkResult: &insurancesql.InsuranceNetwork{
					Name:                      mockNetworkName,
					PackageID:                 selfPayPackageID,
					InsuranceClassificationID: insuranceClassificationID,
					InsurancePayerID:          insurancePayerID,
					CreatedAt:                 now,
					UpdatedAt:                 now,
				},
			},
			args: args{
				r: &insurancepb.CreateInsuranceNetworkRequest{
					Name:                      mockNetworkName,
					PackageId:                 &selfPayPackageID,
					InsuranceClassificationId: insuranceClassificationID,
					InsurancePayerId:          insurancePayerID,
				},
			},
			grpcRes: &insuranceplanpb.CreateInsurancePlanResponse{
				InsurancePlan: &insuranceplanpb.InsurancePlan{
					Id:   baseID,
					Name: mockNetworkName,
				},
			},

			wantCode: codes.OK,
			want: &insurancepb.CreateInsuranceNetworkResponse{
				Network: &insurancepb.InsuranceNetwork{
					Name:                      mockNetworkName,
					PackageId:                 selfPayPackageID,
					InsuranceClassificationId: insuranceClassificationID,
					InsurancePayerId:          insurancePayerID,
					CreatedAt:                 protoconv.TimeToProtoTimestamp(&now),
					UpdatedAt:                 protoconv.TimeToProtoTimestamp(&now),
					Addresses:                 []*common.Address{},
				},
			},
		},
		{
			description: "error case - failed create insurance network without name",
			args: args{
				r: &insurancepb.CreateInsuranceNetworkRequest{
					Name: "",
				},
			},
			grpcRes: &insuranceplanpb.CreateInsurancePlanResponse{
				InsurancePlan: &insuranceplanpb.InsurancePlan{
					Id:   baseID,
					Name: mockNetworkName,
				},
			},

			wantCode: codes.InvalidArgument,
		},
		{
			description: "error case - failed create insurance network without insurance plan id",
			args: args{
				r: &insurancepb.CreateInsuranceNetworkRequest{
					Name:                      "",
					PackageId:                 &packageID,
					InsuranceClassificationId: insuranceClassificationID,
					InsurancePayerId:          insurancePayerID,
				},
			},
			grpcRes: &insuranceplanpb.CreateInsurancePlanResponse{
				InsurancePlan: &insuranceplanpb.InsurancePlan{
					Id:   baseID,
					Name: mockNetworkName,
				},
			},

			wantCode: codes.InvalidArgument,
		},
		{
			description: "error case - failed create insurance network without package id",
			args: args{
				r: &insurancepb.CreateInsuranceNetworkRequest{
					Name:                      mockNetworkName,
					InsuranceClassificationId: insuranceClassificationID,
					InsurancePayerId:          insurancePayerID,
				},
			},
			grpcRes: &insuranceplanpb.CreateInsurancePlanResponse{
				InsurancePlan: &insuranceplanpb.InsurancePlan{
					Id:   baseID,
					Name: mockNetworkName,
				},
			},

			wantCode: codes.InvalidArgument,
		},
		{
			description: "error case - failed create insurance network without classification id",
			args: args{
				r: &insurancepb.CreateInsuranceNetworkRequest{
					Name:                      mockNetworkName,
					PackageId:                 &packageID,
					InsuranceClassificationId: 0,
					InsurancePayerId:          insurancePayerID,
				},
			},
			grpcRes: &insuranceplanpb.CreateInsurancePlanResponse{
				InsurancePlan: &insuranceplanpb.InsurancePlan{
					Id:   baseID,
					Name: mockNetworkName,
				},
			},

			wantCode: codes.InvalidArgument,
		},
		{
			description: "error case - failed create insurance network without payer id",
			args: args{
				r: &insurancepb.CreateInsuranceNetworkRequest{
					Name:                      mockNetworkName,
					PackageId:                 &packageID,
					InsuranceClassificationId: insuranceClassificationID,
					InsurancePayerId:          0,
				},
			},
			grpcRes: &insuranceplanpb.CreateInsurancePlanResponse{
				InsurancePlan: &insuranceplanpb.InsurancePlan{
					Id:   baseID,
					Name: mockNetworkName,
				},
			},

			wantCode: codes.InvalidArgument,
		},
		{
			description: "error case - failed to create insurance network due station error",
			args: args{
				r: &insurancepb.CreateInsuranceNetworkRequest{
					Name:                      mockNetworkName,
					PackageId:                 &packageID,
					InsuranceClassificationId: insuranceClassificationID,
					InsurancePayerId:          insurancePayerID,
				},
			},
			grpcErr: status.Errorf(codes.Internal, "something went wrong"),

			wantCode: codes.Internal,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.description, func(t *testing.T) {
			grpcServer := setup(insuranceGRPCServerParams{
				mockedDB: tc.mockInsuranceDB,
				mockInsurancePlanServiceClient: &MockInsurancePlanServiceClient{
					CreateInsurancePlanResult: tc.grpcRes,
					CreateInsurancePlanErr:    tc.grpcErr,
				},
			})

			resp, err := grpcServer.CreateInsuranceNetwork(context.Background(), tc.args.r)
			reqStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, tc.wantCode, reqStatus.Code())
			testutils.MustMatch(t, tc.want, resp)
		})
	}
}

func TestUpdateInsuranceNetwork(t *testing.T) {
	now := time.Now()
	baseID := now.UnixNano()
	packageID := baseID + 1
	insuranceClassificationID := baseID + 2
	insurancePlanID := baseID + 3
	insurancePayerID := baseID + 4

	type args struct {
		r *insurancepb.UpdateInsuranceNetworkRequest
	}

	tcs := []struct {
		description             string
		mockInsuranceDB         *mockInsuranceDB
		args                    args
		insurancePlanServiceRes *insuranceplanpb.UpdateInsurancePlanResponse
		insurancePlanServiceErr error

		wantCode codes.Code
		want     *insurancepb.UpdateInsuranceNetworkResponse
	}{
		{
			description: "success - updates insurance network",
			mockInsuranceDB: &mockInsuranceDB{
				updateInsuranceNetworkResult: &insurancesql.InsuranceNetwork{
					ID:                        baseID,
					Name:                      mockNetworkName,
					IsActive:                  mockNetworkIsActive,
					Notes:                     sqltypes.ToValidNullString(mockNetworkNotes),
					PackageID:                 packageID,
					InsuranceClassificationID: insuranceClassificationID,
					InsurancePayerID:          insurancePayerID,
					InsurancePlanID:           insurancePlanID,
					CreatedAt:                 now,
					UpdatedAt:                 now,
				},
				getInsuranceNetworkAddressesByInsuranceNetworksIDsResult: []*insurancesql.InsuranceNetworkAddress{{
					BillingState: mockNetworkBillingState,
					City:         mockNetworkCity,
					Zipcode:      mockNetworkZipcode,
					Address:      mockNetworkAddress,
				}},
			},
			args: args{
				r: &insurancepb.UpdateInsuranceNetworkRequest{
					NetworkId:                 baseID,
					Name:                      mockNetworkName,
					Active:                    &mockNetworkIsActive,
					Notes:                     &mockNetworkNotes,
					PackageId:                 &packageID,
					InsurancePlanId:           insurancePlanID,
					InsuranceClassificationId: insuranceClassificationID,
					InsurancePayerId:          insurancePayerID,
					Addresses: []*common.Address{{
						City:           &mockNetworkCity,
						State:          &mockNetworkBillingState,
						AddressLineOne: &mockNetworkAddress,
						ZipCode:        &mockNetworkZipcode,
					}},
				},
			},
			insurancePlanServiceRes: &insuranceplanpb.UpdateInsurancePlanResponse{
				InsurancePlan: &insuranceplanpb.InsurancePlan{
					Id:   baseID,
					Name: mockNetworkName,
				},
			},

			wantCode: codes.OK,
			want: &insurancepb.UpdateInsuranceNetworkResponse{
				Network: &insurancepb.InsuranceNetwork{
					Id:                        baseID,
					Name:                      mockNetworkName,
					Active:                    mockNetworkIsActive,
					Notes:                     mockNetworkNotes,
					PackageId:                 packageID,
					InsurancePlanId:           insurancePlanID,
					InsuranceClassificationId: insuranceClassificationID,
					InsurancePayerId:          insurancePayerID,
					CreatedAt:                 protoconv.TimeToProtoTimestamp(&now),
					UpdatedAt:                 protoconv.TimeToProtoTimestamp(&now),
					Addresses: []*common.Address{{
						City:           &mockNetworkCity,
						State:          &mockNetworkBillingState,
						AddressLineOne: &mockNetworkAddress,
						ZipCode:        &mockNetworkZipcode,
					}},
				},
			},
		},
		{
			description: "failure - invalid network.id argument",
			args: args{
				r: &insurancepb.UpdateInsuranceNetworkRequest{
					Name:            mockNetworkName,
					InsurancePlanId: insurancePlanID,
				},
			},
			insurancePlanServiceRes: &insuranceplanpb.UpdateInsurancePlanResponse{
				InsurancePlan: &insuranceplanpb.InsurancePlan{
					Id:   insurancePlanID,
					Name: mockNetworkName,
				},
			},

			wantCode: codes.InvalidArgument,
			want:     nil,
		},
		{
			description: "failure - invalid network.name argument",
			args: args{
				r: &insurancepb.UpdateInsuranceNetworkRequest{
					NetworkId:       baseID,
					Name:            "",
					InsurancePlanId: insurancePlanID,
				},
			},
			insurancePlanServiceRes: &insuranceplanpb.UpdateInsurancePlanResponse{
				InsurancePlan: &insuranceplanpb.InsurancePlan{
					Id:   insurancePlanID,
					Name: mockNetworkName,
				},
			},

			wantCode: codes.InvalidArgument,
			want:     nil,
		},
		{
			description: "failure - invalid network.package_id argument",
			args: args{
				r: &insurancepb.UpdateInsuranceNetworkRequest{
					NetworkId:       baseID,
					Name:            mockNetworkName,
					InsurancePlanId: insurancePlanID,
				},
			},
			insurancePlanServiceRes: &insuranceplanpb.UpdateInsurancePlanResponse{
				InsurancePlan: &insuranceplanpb.InsurancePlan{
					Id:   insurancePlanID,
					Name: mockNetworkName,
				},
			},

			wantCode: codes.InvalidArgument,
			want:     nil,
		},
		{
			description: "failure - invalid network.insurance_classification_id argument",
			args: args{
				r: &insurancepb.UpdateInsuranceNetworkRequest{
					NetworkId:                 baseID,
					Name:                      mockNetworkName,
					PackageId:                 &packageID,
					InsuranceClassificationId: 0,
					InsurancePlanId:           insurancePlanID,
				},
			},
			insurancePlanServiceRes: &insuranceplanpb.UpdateInsurancePlanResponse{
				InsurancePlan: &insuranceplanpb.InsurancePlan{
					Id:   baseID + 2,
					Name: mockNetworkName,
				},
			},

			wantCode: codes.InvalidArgument,
			want:     nil,
		},
		{
			description: "failure - failed to create insurance network due db error",
			args: args{
				r: &insurancepb.UpdateInsuranceNetworkRequest{
					NetworkId:                 baseID,
					Name:                      mockNetworkName,
					PackageId:                 &packageID,
					InsuranceClassificationId: insuranceClassificationID,
					InsurancePayerId:          0,
					InsurancePlanId:           insurancePlanID,
				},
			},
			insurancePlanServiceRes: &insuranceplanpb.UpdateInsurancePlanResponse{
				InsurancePlan: &insuranceplanpb.InsurancePlan{
					Id:   baseID + 3,
					Name: mockNetworkName,
				},
			},
			mockInsuranceDB: &mockInsuranceDB{
				updateInsuranceNetworkError: fmt.Errorf("something went wrong"),
			},

			wantCode: codes.Internal,
			want:     nil,
		},
		{
			description: "failure - failed to create insurance network due station error",
			args: args{
				r: &insurancepb.UpdateInsuranceNetworkRequest{
					NetworkId:                 baseID,
					Name:                      mockNetworkName,
					Active:                    &mockNetworkIsActive,
					Notes:                     &mockNetworkNotes,
					PackageId:                 &packageID,
					InsurancePlanId:           insurancePlanID,
					InsuranceClassificationId: insuranceClassificationID,
					InsurancePayerId:          insurancePayerID,
				},
			},
			insurancePlanServiceErr: status.Errorf(codes.Internal, "something went wrong"),

			wantCode: codes.Internal,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.description, func(t *testing.T) {
			grpcServer := setup(insuranceGRPCServerParams{
				mockedDB: tc.mockInsuranceDB,
				mockInsurancePlanServiceClient: &MockInsurancePlanServiceClient{
					UpdateInsurancePlanResult: tc.insurancePlanServiceRes,
					UpdateInsurancePlanErr:    tc.insurancePlanServiceErr,
				},
			})

			resp, err := grpcServer.UpdateInsuranceNetwork(context.Background(), tc.args.r)
			reqStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, tc.wantCode, reqStatus.Code())
			testutils.MustMatch(t, tc.want, resp)
		})
	}
}

func TestUpdateInsuranceNetworkStates(t *testing.T) {
	baseID := time.Now().UnixNano()

	tcs := []struct {
		description     string
		mockInsuranceDB *mockInsuranceDB
		req             *insurancepb.UpdateInsuranceNetworkStatesRequest

		wantCode codes.Code
		want     *insurancepb.UpdateInsuranceNetworkStatesResponse
	}{
		{
			description: "success - updates insurance network",
			mockInsuranceDB: &mockInsuranceDB{
				updateInsuranceNetworkStatesResult: []*insurancesql.InsuranceNetworkState{
					{
						InsuranceNetworkID: baseID,
						StateAbbr:          "CO",
					},
					{
						InsuranceNetworkID: baseID,
						StateAbbr:          "NY",
					},
				},
			},
			req: &insurancepb.UpdateInsuranceNetworkStatesRequest{
				NetworkId:  baseID,
				StateAbbrs: []string{"CO", "NY"},
			},

			wantCode: codes.OK,
			want: &insurancepb.UpdateInsuranceNetworkStatesResponse{
				StateAbbrs: []string{"CO", "NY"},
			},
		},
		{
			description: "success - updates insurance network with empty states array",
			mockInsuranceDB: &mockInsuranceDB{
				updateInsuranceNetworkStatesResult: []*insurancesql.InsuranceNetworkState{},
			},
			req: &insurancepb.UpdateInsuranceNetworkStatesRequest{
				NetworkId:  baseID,
				StateAbbrs: []string{},
			},

			wantCode: codes.OK,
			want: &insurancepb.UpdateInsuranceNetworkStatesResponse{
				StateAbbrs: nil,
			},
		},
		{
			description: "failure - updates with invalid insurance network id",
			mockInsuranceDB: &mockInsuranceDB{
				updateInsuranceNetworkStatesResult: []*insurancesql.InsuranceNetworkState{},
			},
			req: &insurancepb.UpdateInsuranceNetworkStatesRequest{
				NetworkId:  0,
				StateAbbrs: []string{},
			},

			wantCode: codes.InvalidArgument,
			want:     nil,
		},
		{
			description: "failure - some internal error",
			mockInsuranceDB: &mockInsuranceDB{
				updateInsuranceNetworkStatesError: fmt.Errorf("something went wrong"),
			},
			req: &insurancepb.UpdateInsuranceNetworkStatesRequest{
				NetworkId:  baseID,
				StateAbbrs: []string{},
			},

			wantCode: codes.Internal,
			want:     nil,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.description, func(t *testing.T) {
			grpcServer := setup(insuranceGRPCServerParams{
				mockedDB: tc.mockInsuranceDB,
			})

			resp, err := grpcServer.UpdateInsuranceNetworkStates(context.Background(), tc.req)
			reqStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, tc.wantCode, reqStatus.Code())
			testutils.MustMatch(t, tc.want, resp)
		})
	}
}

func TestListInsuranceNetworkModalityConfigs(t *testing.T) {
	baseID := time.Now().UnixNano()
	networkID := baseID + 1
	billingCityID := baseID + 2
	serviceLineID := baseID + 3
	modalityID := baseID + 4

	stationSuccessResponse := &StationNetworkModalityConfigsResponse{
		Configs: []StationNetworkModalityConfig{
			{
				ID:            &baseID,
				NetworkID:     networkID,
				BillingCityID: billingCityID,
				ServiceLineID: serviceLineID,
				ModalityID:    modalityID,
			},
		},
	}
	stationBadResponse := []StationNetworkModalityConfigsResponse{*stationSuccessResponse}

	tcs := []struct {
		description         string
		input               *insurancepb.ListInsuranceNetworkModalityConfigsRequest
		stationHTTPStatus   int
		stationHTTPResponse any

		want         *insurancepb.ListInsuranceNetworkModalityConfigsResponse
		wantGRPCCode codes.Code
	}{
		{
			description:         "success - base case",
			input:               &insurancepb.ListInsuranceNetworkModalityConfigsRequest{NetworkId: baseID},
			stationHTTPResponse: stationSuccessResponse,
			stationHTTPStatus:   http.StatusOK,

			want: &insurancepb.ListInsuranceNetworkModalityConfigsResponse{
				Configs: []*insurancepb.InsuranceNetworkModalityConfig{
					{
						Id:            &baseID,
						NetworkId:     networkID,
						BillingCityId: billingCityID,
						ServiceLineId: serviceLineID,
						ModalityId:    modalityID,
					},
				},
			},
			wantGRPCCode: codes.OK,
		},
		{
			description: "failure - invalid network ID param",
			input:       &insurancepb.ListInsuranceNetworkModalityConfigsRequest{NetworkId: int64(0)},

			wantGRPCCode: codes.InvalidArgument,
		},
		{
			description:         "failure - unable to get network modality configs",
			input:               &insurancepb.ListInsuranceNetworkModalityConfigsRequest{NetworkId: baseID},
			stationHTTPStatus:   http.StatusOK,
			stationHTTPResponse: stationBadResponse,

			wantGRPCCode: codes.Internal,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.description, func(t *testing.T) {
			stationServer := httptest.NewServer(http.HandlerFunc(
				func(rw http.ResponseWriter, req *http.Request) {
					rw.WriteHeader(tc.stationHTTPStatus)
					resp, err := json.Marshal(tc.stationHTTPResponse)
					if err != nil {
						t.Fatalf("failed to marshal json: %s", err)
					}
					rw.Write(resp)
				},
			))
			defer stationServer.Close()

			grpcServer := &InsuranceGRPCServer{
				StationClient: &station.Client{
					AuthToken:  mockAuthValuer{},
					StationURL: stationServer.URL,
					HTTPClient: stationServer.Client(),
				},
				Logger: baselogger.NewSugaredLogger(baselogger.LoggerOptions{}),
			}

			resp, err := grpcServer.ListInsuranceNetworkModalityConfigs(context.Background(), tc.input)
			reqStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, resp, tc.want)
			testutils.MustMatch(t, reqStatus.Code(), tc.wantGRPCCode)
		})
	}
}

func TestUpdateInsuranceNetworkModalityConfigs(t *testing.T) {
	baseID := time.Now().UnixNano()
	networkID := baseID + 1
	billingCityID := baseID + 2
	serviceLineID := baseID + 3
	modalityID := baseID + 4

	stationSuccessResponse := &StationNetworkModalityConfigsResponse{
		Configs: []StationNetworkModalityConfig{
			{
				ID:            &baseID,
				NetworkID:     networkID,
				BillingCityID: billingCityID,
				ServiceLineID: serviceLineID,
				ModalityID:    modalityID,
			},
		},
	}
	stationBadResponse := []StationNetworkModalityConfigsResponse{*stationSuccessResponse}

	tcs := []struct {
		description         string
		input               *insurancepb.UpdateInsuranceNetworkModalityConfigsRequest
		stationHTTPStatus   int
		stationHTTPResponse any

		want         *insurancepb.UpdateInsuranceNetworkModalityConfigsResponse
		wantGRPCCode codes.Code
	}{
		{
			description: "success - base case",
			input: &insurancepb.UpdateInsuranceNetworkModalityConfigsRequest{
				NetworkId: baseID,
				Configs: []*insurancepb.InsuranceNetworkModalityConfig{
					{
						Id:            &baseID,
						NetworkId:     networkID,
						BillingCityId: billingCityID,
						ServiceLineId: serviceLineID,
						ModalityId:    modalityID,
					},
				},
			},
			stationHTTPResponse: stationSuccessResponse,
			stationHTTPStatus:   http.StatusOK,

			want: &insurancepb.UpdateInsuranceNetworkModalityConfigsResponse{
				Configs: []*insurancepb.InsuranceNetworkModalityConfig{
					{
						Id:            &baseID,
						NetworkId:     networkID,
						BillingCityId: billingCityID,
						ServiceLineId: serviceLineID,
						ModalityId:    modalityID,
					},
				},
			},
			wantGRPCCode: codes.OK,
		},
		{
			description: "failure - invalid network ID param",
			input: &insurancepb.UpdateInsuranceNetworkModalityConfigsRequest{
				NetworkId: int64(0),
				Configs:   []*insurancepb.InsuranceNetworkModalityConfig{},
			},

			wantGRPCCode: codes.InvalidArgument,
		},
		{
			description: "failure - unable to update network modality configs",
			input: &insurancepb.UpdateInsuranceNetworkModalityConfigsRequest{
				NetworkId: baseID,
				Configs:   []*insurancepb.InsuranceNetworkModalityConfig{},
			},
			stationHTTPResponse: stationBadResponse,
			stationHTTPStatus:   http.StatusOK,

			wantGRPCCode: codes.Internal,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.description, func(t *testing.T) {
			stationServer := httptest.NewServer(http.HandlerFunc(
				func(rw http.ResponseWriter, req *http.Request) {
					rw.WriteHeader(tc.stationHTTPStatus)
					resp, err := json.Marshal(tc.stationHTTPResponse)
					if err != nil {
						t.Fatalf("failed to marshal json: %s", err)
					}
					rw.Write(resp)
				},
			))
			defer stationServer.Close()

			grpcServer := &InsuranceGRPCServer{
				StationClient: &station.Client{
					AuthToken:  mockAuthValuer{},
					StationURL: stationServer.URL,
					HTTPClient: stationServer.Client(),
				},
				Logger: baselogger.NewSugaredLogger(baselogger.LoggerOptions{}),
			}

			resp, err := grpcServer.UpdateInsuranceNetworkModalityConfigs(context.Background(), tc.input)
			reqStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, resp, tc.want)
			testutils.MustMatch(t, reqStatus.Code(), tc.wantGRPCCode)
		})
	}
}

func TestListInsuranceNetworkServiceLines(t *testing.T) {
	now := time.Now()
	baseID := now.UnixNano()
	mockServiceLineName := "Acute"
	mockAppointmentTypeName := "D06"
	existingAppointmentTypeID := int(baseID + 1)
	newAppointmentTypeID := int(baseID + 2)
	shiftTypeID := baseID + 3

	stationGoodResponse := []StationServiceLine{
		{
			ID:      baseID,
			Name:    mockServiceLineName,
			Default: true,
			ExistingPatientAppointmentType: &StationAppointmentType{
				ID:   strconv.Itoa(existingAppointmentTypeID),
				Name: mockAppointmentTypeName,
			},
			NewPatientAppointmentType: &StationAppointmentType{
				ID:   strconv.Itoa(newAppointmentTypeID),
				Name: mockAppointmentTypeName,
			},
			ShiftTypeID:              shiftTypeID,
			OutOfNetworkInsurance:    false,
			RequireCheckout:          false,
			RequireMedicalNecessity:  false,
			RequireConsentSignature:  false,
			Followup2Day:             false,
			Followup14To30Day:        false,
			Is911:                    true,
			UpgradeableWithScreening: false,
			UpdatedAt:                now.String(),
			CreatedAt:                now.String(),
		},
	}
	stationBadResponse := struct {
		serviceLines []StationServiceLine
	}{serviceLines: stationGoodResponse}

	tcs := []struct {
		name                string
		input               *insurancepb.ListInsuranceNetworkServiceLinesRequest
		stationHTTPStatus   int
		stationHTTPResponse any

		want         *insurancepb.ListInsuranceNetworkServiceLinesResponse
		wantGRPCCode codes.Code
	}{
		{
			name:                "success - base case",
			input:               &insurancepb.ListInsuranceNetworkServiceLinesRequest{NetworkId: baseID},
			stationHTTPStatus:   http.StatusOK,
			stationHTTPResponse: stationGoodResponse,

			want: &insurancepb.ListInsuranceNetworkServiceLinesResponse{
				ServiceLines: ServiceLinesProtoFromStationServiceLines(stationGoodResponse),
			},
			wantGRPCCode: codes.OK,
		},
		{
			name:  "failure - invalid network ID param",
			input: &insurancepb.ListInsuranceNetworkServiceLinesRequest{NetworkId: int64(0)},

			wantGRPCCode: codes.InvalidArgument,
		},
		{
			name:                "failure - unable to get service lines",
			input:               &insurancepb.ListInsuranceNetworkServiceLinesRequest{NetworkId: baseID},
			stationHTTPStatus:   http.StatusOK,
			stationHTTPResponse: stationBadResponse,

			wantGRPCCode: codes.Internal,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.name, func(t *testing.T) {
			stationServer := httptest.NewServer(http.HandlerFunc(
				func(rw http.ResponseWriter, req *http.Request) {
					rw.WriteHeader(tc.stationHTTPStatus)
					resp, err := json.Marshal(tc.stationHTTPResponse)
					if err != nil {
						t.Fatalf("failed to marshal json: %s", err)
					}
					rw.Write(resp)
				},
			))
			defer stationServer.Close()

			grpcServer := &InsuranceGRPCServer{
				StationClient: &station.Client{
					AuthToken:  mockAuthValuer{},
					StationURL: stationServer.URL,
					HTTPClient: stationServer.Client(),
				},
				Logger: baselogger.NewSugaredLogger(baselogger.LoggerOptions{}),
			}

			resp, err := grpcServer.ListInsuranceNetworkServiceLines(context.Background(), tc.input)
			reqStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, tc.want, resp)
			testutils.MustMatch(t, tc.wantGRPCCode, reqStatus.Code())
		})
	}
}

func TestUpsertInsuranceNetworkCreditCardRules(t *testing.T) {
	now := time.Now()
	baseID := now.UnixNano()
	packageID := baseID + 1
	insuranceClassificationID := baseID + 2
	insurancePlanID := baseID + 3
	insurancePayerID := baseID + 4

	type args struct {
		r *insurancepb.UpsertInsuranceNetworkCreditCardRulesRequest
	}

	tcs := []struct {
		description     string
		args            args
		mockInsuranceDB *mockInsuranceDB
		grpcRes         *insuranceplanpb.UpsertInsurancePlanCreditCardPolicyResponse
		grpcErr         error

		want     *insurancepb.UpsertInsuranceNetworkCreditCardRulesResponse
		wantCode codes.Code
	}{
		{
			description: "success - updates insurance network credit card rules",
			args: args{
				r: &insurancepb.UpsertInsuranceNetworkCreditCardRulesRequest{
					NetworkId: baseID,
					CreditCardRules: []*insurancepb.InsuranceNetworkCreditCardRule{
						{
							ServiceLineId:  baseID + 1,
							CreditCardRule: "DISABLED",
						},
						{
							ServiceLineId:  baseID + 2,
							CreditCardRule: "OPTIONAL",
						},
					},
				},
			},
			mockInsuranceDB: &mockInsuranceDB{
				getInsuranceNetworkResult: &insurancesql.InsuranceNetwork{
					ID:                        baseID,
					Name:                      mockNetworkName,
					IsActive:                  mockNetworkIsActive,
					Notes:                     sqltypes.ToValidNullString(mockNetworkNotes),
					PackageID:                 packageID,
					InsuranceClassificationID: insuranceClassificationID,
					InsurancePayerID:          insurancePayerID,
					InsurancePlanID:           insurancePlanID,
					EligibilityCheckEnabled:   mockNetworkEligibilityCheckEnabled,
					ProviderEnrollmentEnabled: mockNetworkProviderEnrollmentEnabled,
					CreatedAt:                 now,
					UpdatedAt:                 now,
				},
			},
			grpcRes: &insuranceplanpb.UpsertInsurancePlanCreditCardPolicyResponse{},

			wantCode: codes.OK,
			want:     &insurancepb.UpsertInsuranceNetworkCreditCardRulesResponse{},
		},
		{
			description: "error case - failed to update insurance network credit card rules without insurance network id",
			args: args{
				r: &insurancepb.UpsertInsuranceNetworkCreditCardRulesRequest{
					CreditCardRules: []*insurancepb.InsuranceNetworkCreditCardRule{
						{
							ServiceLineId:  baseID + 1,
							CreditCardRule: "DISABLED",
						},
						{
							ServiceLineId:  baseID + 2,
							CreditCardRule: "OPTIONAL",
						},
					},
				},
			},
			mockInsuranceDB: &mockInsuranceDB{
				getInsuranceNetworkResult: &insurancesql.InsuranceNetwork{
					ID:                        baseID,
					Name:                      mockNetworkName,
					IsActive:                  mockNetworkIsActive,
					Notes:                     sqltypes.ToValidNullString(mockNetworkNotes),
					PackageID:                 packageID,
					InsuranceClassificationID: insuranceClassificationID,
					InsurancePayerID:          insurancePayerID,
					InsurancePlanID:           insurancePlanID,
					EligibilityCheckEnabled:   mockNetworkEligibilityCheckEnabled,
					ProviderEnrollmentEnabled: mockNetworkProviderEnrollmentEnabled,
					CreatedAt:                 now,
					UpdatedAt:                 now,
				},
			},
			grpcRes: &insuranceplanpb.UpsertInsurancePlanCreditCardPolicyResponse{},

			wantCode: codes.InvalidArgument,
		},
		{
			description: "error case - failed to update insurance network credit card rules due no rows from db",
			args: args{
				r: &insurancepb.UpsertInsuranceNetworkCreditCardRulesRequest{
					NetworkId: baseID,
					CreditCardRules: []*insurancepb.InsuranceNetworkCreditCardRule{
						{
							ServiceLineId:  baseID + 1,
							CreditCardRule: "DISABLED",
						},
						{
							ServiceLineId:  baseID + 2,
							CreditCardRule: "OPTIONAL",
						},
					},
				},
			},
			mockInsuranceDB: &mockInsuranceDB{
				getInsuranceNetworkError: pgx.ErrNoRows,
			},
			grpcRes: &insuranceplanpb.UpsertInsurancePlanCreditCardPolicyResponse{},

			wantCode: codes.NotFound,
		},
		{
			description: "error case - failed to update insurance network credit card rules due db error",
			args: args{
				r: &insurancepb.UpsertInsuranceNetworkCreditCardRulesRequest{
					NetworkId: baseID,
					CreditCardRules: []*insurancepb.InsuranceNetworkCreditCardRule{
						{
							ServiceLineId:  baseID + 1,
							CreditCardRule: "DISABLED",
						},
						{
							ServiceLineId:  baseID + 2,
							CreditCardRule: "OPTIONAL",
						},
					},
				},
			},
			mockInsuranceDB: &mockInsuranceDB{
				getInsuranceNetworkError: errors.New("invalid attempt to get insurance network"),
			},
			grpcRes: &insuranceplanpb.UpsertInsurancePlanCreditCardPolicyResponse{},

			wantCode: codes.Internal,
		},
		{
			description: "error case - failed to update insurance network credit card rules due station error",
			args: args{
				r: &insurancepb.UpsertInsuranceNetworkCreditCardRulesRequest{
					NetworkId: baseID,
					CreditCardRules: []*insurancepb.InsuranceNetworkCreditCardRule{
						{
							ServiceLineId:  baseID + 1,
							CreditCardRule: "DISABLED",
						},
						{
							ServiceLineId:  baseID + 2,
							CreditCardRule: "OPTIONAL",
						},
					},
				},
			},
			mockInsuranceDB: &mockInsuranceDB{
				getInsuranceNetworkResult: &insurancesql.InsuranceNetwork{
					ID:                        baseID,
					Name:                      mockNetworkName,
					IsActive:                  mockNetworkIsActive,
					Notes:                     sqltypes.ToValidNullString(mockNetworkNotes),
					PackageID:                 packageID,
					InsuranceClassificationID: insuranceClassificationID,
					InsurancePayerID:          insurancePayerID,
					InsurancePlanID:           insurancePlanID,
					EligibilityCheckEnabled:   mockNetworkEligibilityCheckEnabled,
					ProviderEnrollmentEnabled: mockNetworkProviderEnrollmentEnabled,
					CreatedAt:                 now,
					UpdatedAt:                 now,
				},
			},
			grpcErr: status.Errorf(codes.InvalidArgument, "Invalid update insurance plan credit card policies body request"),

			wantCode: codes.InvalidArgument,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.description, func(t *testing.T) {
			grpcServer := setup(insuranceGRPCServerParams{
				mockInsurancePlanServiceClient: &MockInsurancePlanServiceClient{
					UpsertInsurancePlanCreditCardPolicyResult: tc.grpcRes,
					UpsertInsurancePlanCreditCardPolicyErr:    tc.grpcErr,
				},
				mockedDB: tc.mockInsuranceDB,
			})

			resp, err := grpcServer.UpsertInsuranceNetworkCreditCardRules(context.Background(), tc.args.r)
			reqStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, tc.wantCode, reqStatus.Code())
			testutils.MustMatch(t, tc.want, resp)
		})
	}
}

func TestListInsuranceNetworkCreditCardRules(t *testing.T) {
	baseID := time.Now().UnixNano()
	insurancePlanID := baseID + 1
	serviceLineID := baseID + 2

	type args struct {
		r *insurancepb.ListInsuranceNetworkCreditCardRulesRequest
	}

	tcs := []struct {
		desc                    string
		ctx                     context.Context
		mockInsuranceDB         *mockInsuranceDB
		args                    args
		insurancePlanServiceRes *insuranceplanpb.ListInsurancePlanCreditCardPolicyResponse
		insurancePlanServiceErr error

		wantCode codes.Code
		want     *insurancepb.ListInsuranceNetworkCreditCardRulesResponse
	}{
		{
			desc: "success - returns list of credit card rules",
			ctx:  context.Background(),
			mockInsuranceDB: &mockInsuranceDB{
				getInsuranceNetworkResult: &insurancesql.InsuranceNetwork{
					ID:              baseID,
					InsurancePlanID: insurancePlanID,
				},
			},
			args: args{
				r: &insurancepb.ListInsuranceNetworkCreditCardRulesRequest{NetworkId: baseID},
			},
			insurancePlanServiceRes: &insuranceplanpb.ListInsurancePlanCreditCardPolicyResponse{
				CreditCardPolicies: []*insuranceplanpb.InsurancePlanCreditCardPolicy{
					{
						Id:                 &baseID,
						ServiceLineId:      serviceLineID,
						OnboardingCcPolicy: "disabled",
					},
				},
			},

			wantCode: codes.OK,
			want: &insurancepb.ListInsuranceNetworkCreditCardRulesResponse{
				CreditCardRules: []*insurancepb.InsuranceNetworkCreditCardRule{
					{
						Id:             &baseID,
						ServiceLineId:  serviceLineID,
						CreditCardRule: "disabled",
					},
				},
			},
		},
		{
			desc: "failure - invalid network.id argument",
			ctx:  context.Background(),
			args: args{
				r: &insurancepb.ListInsuranceNetworkCreditCardRulesRequest{NetworkId: int64(0)},
			},

			wantCode: codes.InvalidArgument,
		},
		{
			desc: "failure - return DB error",
			ctx:  context.Background(),
			mockInsuranceDB: &mockInsuranceDB{
				getInsuranceNetworkError: errors.New("something went wrong"),
			},
			args: args{
				r: &insurancepb.ListInsuranceNetworkCreditCardRulesRequest{NetworkId: baseID},
			},

			wantCode: codes.Internal,
		},
		{
			desc: "failure - station returned an error",
			mockInsuranceDB: &mockInsuranceDB{
				getInsuranceNetworkResult: &insurancesql.InsuranceNetwork{
					ID:              baseID,
					InsurancePlanID: insurancePlanID,
				},
			},
			args: args{
				r: &insurancepb.ListInsuranceNetworkCreditCardRulesRequest{NetworkId: baseID},
			},
			insurancePlanServiceErr: status.Errorf(codes.Internal, "something went wrong"),

			wantCode: codes.Internal,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			grpcServer := setup(insuranceGRPCServerParams{
				mockedDB: tc.mockInsuranceDB,
				mockInsurancePlanServiceClient: &MockInsurancePlanServiceClient{
					ListInsurancePlanCreditCardPolicyResult: tc.insurancePlanServiceRes,
					ListInsurancePlanCreditCardPolicyErr:    tc.insurancePlanServiceErr,
				},
			})

			resp, err := grpcServer.ListInsuranceNetworkCreditCardRules(tc.ctx, tc.args.r)
			reqStatus, ok := status.FromError(err)

			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, tc.wantCode, reqStatus.Code())
			testutils.MustMatch(t, tc.want, resp)
		})
	}
}

func TestListAppointmentTypes(t *testing.T) {
	baseID := time.Now().UnixNano()
	mockAppointmentTypeName := "D06 In-Person"

	stationGoodResponse := []StationAppointmentType{
		{
			ID:   strconv.Itoa(int(baseID)),
			Name: mockAppointmentTypeName,
		},
	}
	stationBadResponse := struct {
		appointmentTypes []StationAppointmentType
	}{appointmentTypes: stationGoodResponse}

	tcs := []struct {
		description         string
		stationHTTPStatus   int
		stationHTTPResponse any

		want         *insurancepb.ListAppointmentTypesResponse
		wantGRPCCode codes.Code
	}{
		{
			description:         "success - base case",
			stationHTTPStatus:   http.StatusOK,
			stationHTTPResponse: stationGoodResponse,

			want: &insurancepb.ListAppointmentTypesResponse{
				AppointmentTypes: AppointmentTypesProtoFromStationAppointmentTypes(stationGoodResponse),
			},
			wantGRPCCode: codes.OK,
		},
		{
			description:         "failure - unable to get appointment types",
			stationHTTPStatus:   http.StatusOK,
			stationHTTPResponse: stationBadResponse,

			wantGRPCCode: codes.Internal,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.description, func(t *testing.T) {
			stationServer := httptest.NewServer(http.HandlerFunc(
				func(rw http.ResponseWriter, req *http.Request) {
					rw.WriteHeader(tc.stationHTTPStatus)
					resp, err := json.Marshal(tc.stationHTTPResponse)
					if err != nil {
						t.Fatalf("failed to marshal json: %s", err)
					}
					rw.Write(resp)
				},
			))
			defer stationServer.Close()

			grpcServer := &InsuranceGRPCServer{
				StationClient: &station.Client{
					AuthToken:  mockAuthValuer{},
					StationURL: stationServer.URL,
					HTTPClient: stationServer.Client(),
				},
				Logger: baselogger.NewSugaredLogger(baselogger.LoggerOptions{}),
			}

			resp, err := grpcServer.ListAppointmentTypes(context.Background(), &insurancepb.ListAppointmentTypesRequest{})

			reqStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, resp, tc.want)
			testutils.MustMatch(t, reqStatus.Code(), tc.wantGRPCCode)
		})
	}
}

func TestUpdateInsuranceNetworkAppointmentTypes(t *testing.T) {
	baseID := time.Now().UnixNano()
	networkID := baseID + 1
	serviceLineID := baseID + 2
	invalidNetworkID := int64(0)
	modalityType := "in_person"
	newPatientAppointmentType := "D0-NewPatient"
	existingPatientAppointmentType := "D0-ExistingPatient"
	requestAppointmentTypes := []*insurancepb.UpdateInsuranceNetworkAppointmentTypesRequest_InsuranceNetworkAppointmentType{
		{
			NetworkId:                      networkID,
			ServiceLineId:                  serviceLineID,
			ModalityType:                   modalityType,
			ExistingPatientAppointmentType: existingPatientAppointmentType,
			NewPatientAppointmentType:      newPatientAppointmentType,
		},
	}
	mockNetworkAppointmentTypesDB := []*insurancesql.InsuranceNetworksAppointmentType{
		{
			ID:                             baseID,
			NetworkID:                      networkID,
			ServiceLineID:                  serviceLineID,
			ModalityType:                   modalityType,
			ExistingPatientAppointmentType: existingPatientAppointmentType,
			NewPatientAppointmentType:      newPatientAppointmentType,
		},
	}
	mockNetworkAppointmentTypes := InsuranceNetworkAppointmentTypesProtoFromSQL(mockNetworkAppointmentTypesDB)

	tcs := []struct {
		description     string
		input           *insurancepb.UpdateInsuranceNetworkAppointmentTypesRequest
		mockInsuranceDB *mockInsuranceDB

		wantCode codes.Code
		wantResp *insurancepb.UpdateInsuranceNetworkAppointmentTypesResponse
	}{
		{
			description: "success - returns newly created appointment types for given network",
			input: &insurancepb.UpdateInsuranceNetworkAppointmentTypesRequest{
				NetworkId:        networkID,
				AppointmentTypes: requestAppointmentTypes,
			},
			mockInsuranceDB: &mockInsuranceDB{
				updateInsuranceNetworkAppointmentTypesResponse: mockNetworkAppointmentTypesDB,
			},

			wantCode: codes.OK,
			wantResp: &insurancepb.UpdateInsuranceNetworkAppointmentTypesResponse{
				AppointmentTypes: mockNetworkAppointmentTypes,
			},
		},
		{
			description: "failure - invalid network.id param",
			input: &insurancepb.UpdateInsuranceNetworkAppointmentTypesRequest{
				NetworkId:        invalidNetworkID,
				AppointmentTypes: requestAppointmentTypes,
			},

			wantCode: codes.InvalidArgument,
		},
		{
			description: "failure - DB error failed to update appointment types",
			input: &insurancepb.UpdateInsuranceNetworkAppointmentTypesRequest{
				NetworkId:        networkID,
				AppointmentTypes: requestAppointmentTypes,
			},
			mockInsuranceDB: &mockInsuranceDB{
				updateInsuranceNetworkAppointmentTypesError: errors.New("something went wrong"),
			},

			wantCode: codes.Internal,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.description, func(t *testing.T) {
			grpcServer := setup(insuranceGRPCServerParams{
				mockedDB: tc.mockInsuranceDB,
			})

			resp, err := grpcServer.UpdateInsuranceNetworkAppointmentTypes(context.Background(), tc.input)
			reqStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, tc.wantCode, reqStatus.Code())
			testutils.MustMatchProto(t, tc.wantResp, resp)
		})
	}
}

func TestListInsuranceNetworkAppointmentTypes(t *testing.T) {
	baseID := time.Now().UnixNano()
	networkID := baseID + 1
	serviceLineID := baseID + 2
	invalidNetworkID := int64(0)
	modalityType := "tele-p"
	newPatientAppointmentType := "NewPatient"
	existingPatientAppointmentType := "Existing Patient"
	mockNetworkAppointmentTypesDB := []*insurancesql.InsuranceNetworksAppointmentType{
		{
			ID:                             baseID,
			NetworkID:                      networkID,
			ServiceLineID:                  serviceLineID,
			ModalityType:                   modalityType,
			ExistingPatientAppointmentType: existingPatientAppointmentType,
			NewPatientAppointmentType:      newPatientAppointmentType,
		},
	}
	mockNetworkAppointmentTypes := InsuranceNetworkAppointmentTypesProtoFromSQL(mockNetworkAppointmentTypesDB)

	tcs := []struct {
		description     string
		input           *insurancepb.ListInsuranceNetworkAppointmentTypesRequest
		mockInsuranceDB *mockInsuranceDB

		wantCode codes.Code
		wantResp *insurancepb.ListInsuranceNetworkAppointmentTypesResponse
	}{
		{
			description: "success - returns appointment types for given network",
			input: &insurancepb.ListInsuranceNetworkAppointmentTypesRequest{
				NetworkId: networkID,
			},
			mockInsuranceDB: &mockInsuranceDB{
				getInsuranceNetworkAppointmentTypesByInsuranceNetworkIDResult: mockNetworkAppointmentTypesDB,
			},

			wantCode: codes.OK,
			wantResp: &insurancepb.ListInsuranceNetworkAppointmentTypesResponse{
				AppointmentTypes: mockNetworkAppointmentTypes,
			},
		},
		{
			description: "success - returns appointment types for given network and service line",
			input: &insurancepb.ListInsuranceNetworkAppointmentTypesRequest{
				NetworkId:     networkID,
				ServiceLineId: &serviceLineID,
			},
			mockInsuranceDB: &mockInsuranceDB{
				getInsuranceNetworkAppointmentTypesByInsuranceNetworkIDResult: mockNetworkAppointmentTypesDB,
			},

			wantCode: codes.OK,
			wantResp: &insurancepb.ListInsuranceNetworkAppointmentTypesResponse{
				AppointmentTypes: mockNetworkAppointmentTypes,
			},
		},
		{
			description: "failure - invalid network.id param",
			input: &insurancepb.ListInsuranceNetworkAppointmentTypesRequest{
				NetworkId: invalidNetworkID,
			},

			wantCode: codes.InvalidArgument,
		},
		{
			description: "failure - received DB error",
			input: &insurancepb.ListInsuranceNetworkAppointmentTypesRequest{
				NetworkId: networkID,
			},
			mockInsuranceDB: &mockInsuranceDB{
				getInsuranceNetworkAppointmentTypesByInsuranceNetworkIDError: errors.New("something went wrong"),
			},

			wantCode: codes.Internal,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.description, func(t *testing.T) {
			grpcServer := setup(insuranceGRPCServerParams{
				mockedDB: tc.mockInsuranceDB,
			})

			resp, err := grpcServer.ListInsuranceNetworkAppointmentTypes(context.Background(), tc.input)
			reqStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, tc.wantCode, reqStatus.Code())
			testutils.MustMatch(t, tc.wantResp, resp)
		})
	}
}
