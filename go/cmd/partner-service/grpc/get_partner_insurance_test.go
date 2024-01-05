package grpc

import (
	"context"
	"errors"
	"strconv"
	"testing"
	"time"

	insurancepb "github.com/*company-data-covered*/services/go/pkg/generated/proto/insurance"
	partnerpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/partner"
	patientspb "github.com/*company-data-covered*/services/go/pkg/generated/proto/patients"
	partnersql "github.com/*company-data-covered*/services/go/pkg/generated/sql/partner"
	"github.com/*company-data-covered*/services/go/pkg/sqltypes"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"github.com/jackc/pgx/v4"
	"go.uber.org/zap"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/proto"
)

func TestGetPartnerInsurance(t *testing.T) {
	ctx := context.Background()
	logger := zap.NewNop().Sugar()
	baseID := time.Now().UnixNano()

	insurancePackageID := int64(12345)
	insuranceNetwork := &insurancepb.InsuranceNetwork{
		PackageId:             insurancePackageID,
		InsurancePlanId:       baseID,
		InsurancePayerName:    "Test Insurance",
		InsurancePayerGroupId: baseID + 1,
	}
	validPartner := partnersql.Partner{
		ID:                 baseID,
		InsurancePackageID: sqltypes.ToValidNullInt64(insurancePackageID),
	}
	validRequest := &partnerpb.GetPartnerInsuranceRequest{CareRequestId: baseID}
	validResponse := &partnerpb.GetPartnerInsuranceResponse{
		Insurance: &patientspb.InsuranceRecord{
			Priority: patientspb.InsurancePriority_INSURANCE_PRIORITY_PRIMARY,
			GroupId:  proto.String(strconv.FormatInt(insuranceNetwork.InsurancePayerGroupId, 10)),
			PrimaryInsuranceHolder: &patientspb.PrimaryInsuranceHolder{
				PatientRelationToSubscriber: patientspb.PatientRelationToSubscriber_PATIENT_RELATION_TO_SUBSCRIBER_PATIENT.Enum(),
			},
			CompanyName:     proto.String(insuranceNetwork.InsurancePayerName),
			PackageId:       proto.String(strconv.FormatInt(insuranceNetwork.PackageId, 10)),
			InsurancePlanId: proto.Int64(insuranceNetwork.InsurancePlanId),
		},
	}
	insuranceError := errors.New("failed to search insurance networks")
	tests := []struct {
		name    string
		server  *Server
		request *partnerpb.GetPartnerInsuranceRequest

		want    *partnerpb.GetPartnerInsuranceResponse
		wantErr error
	}{
		{
			name: "successfully returns insurance information for a source partner",
			server: &Server{
				DBService: &mockDBService{
					getInsuranceByCareRequestAndOriginSourceResp: validPartner,
				},
				InsuranceClient: &mockInsuranceClient{
					response: insurancepb.SearchInsuranceNetworksResponse{
						Networks: []*insurancepb.InsuranceNetwork{
							insuranceNetwork,
						},
					},
				},
				Logger: logger,
			},
			request: validRequest,

			want: validResponse,
		},
		{
			name: "successfully returns insurance information for a pop health partner",
			server: &Server{
				DBService: &mockDBService{
					getInsuranceByCareRequestAndOriginSourceErr:     pgx.ErrNoRows,
					getInsuranceByCareRequestAndOriginPopHealthResp: validPartner,
				},
				InsuranceClient: &mockInsuranceClient{
					response: insurancepb.SearchInsuranceNetworksResponse{
						Networks: []*insurancepb.InsuranceNetwork{
							insuranceNetwork,
						},
					},
				},
				Logger: logger,
			},
			request: validRequest,

			want: validResponse,
		},
		{
			name: "fails when GetInsuranceByCareRequestAndOrigin returns an error for source partner",
			server: &Server{
				DBService: &mockDBService{
					getInsuranceByCareRequestAndOriginSourceErr: pgx.ErrTxClosed,
				},
				Logger: logger,
			},
			request: validRequest,

			wantErr: status.Errorf(codes.Internal, "GetInsuranceByCareRequestAndOrigin error: %v", pgx.ErrTxClosed),
		},
		{
			name: "successfully returns empty insurance information when pop health partner is not found",
			server: &Server{
				DBService: &mockDBService{
					getInsuranceByCareRequestAndOriginSourceErr:    pgx.ErrNoRows,
					getInsuranceByCareRequestAndOriginPopHealthErr: pgx.ErrNoRows,
				},
				Logger: logger,
			},
			request: validRequest,

			want: &partnerpb.GetPartnerInsuranceResponse{},
		},
		{
			name: "fails when GetInsuranceByCareRequestAndOrigin returns an error for pop health partner",
			server: &Server{
				DBService: &mockDBService{
					getInsuranceByCareRequestAndOriginSourceErr:    pgx.ErrNoRows,
					getInsuranceByCareRequestAndOriginPopHealthErr: pgx.ErrTxClosed,
				},
				Logger: logger,
			},
			request: validRequest,

			wantErr: status.Errorf(codes.Internal, "GetInsuranceByCareRequestAndOrigin error: %v", pgx.ErrTxClosed),
		},
		{
			name: "fails when SearchInsuranceNetworks returns an error",
			server: &Server{
				DBService: &mockDBService{
					getInsuranceByCareRequestAndOriginSourceResp: validPartner,
				},
				InsuranceClient: &mockInsuranceClient{
					err: insuranceError,
				},
				Logger: logger,
			},
			request: validRequest,

			wantErr: status.Errorf(codes.Internal, "SearchInsuranceNetworks error: %v", insuranceError),
		},
		{
			name: "fails when SearchInsuranceNetworks returns an empty list of networks",
			server: &Server{
				DBService: &mockDBService{
					getInsuranceByCareRequestAndOriginSourceResp: validPartner,
				},
				InsuranceClient: &mockInsuranceClient{
					response: insurancepb.SearchInsuranceNetworksResponse{
						Networks: []*insurancepb.InsuranceNetwork{},
					},
				},
				Logger: logger,
			},
			request: validRequest,

			wantErr: status.Errorf(codes.NotFound, "No networks found for insurance package id %d", insurancePackageID),
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			response, err := test.server.GetPartnerInsurance(ctx, test.request)

			testutils.MustMatch(t, test.want, response)
			testutils.MustMatch(t, test.wantErr, err)
		})
	}
}
