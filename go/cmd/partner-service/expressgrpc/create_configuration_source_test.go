package expressgrpc

import (
	"context"
	"testing"
	"time"

	"github.com/*company-data-covered*/services/go/pkg/generated/proto/common"

	partnersql "github.com/*company-data-covered*/services/go/pkg/generated/sql/partner"
	"github.com/jackc/pgx/v4"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	partnerpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/partner"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"go.uber.org/zap"
)

func TestCreateConfigurationSource(t *testing.T) {
	ctx := context.Background()
	logger := zap.NewNop().Sugar()

	baseID := time.Now().UnixNano()

	partnerID := baseID
	partnerConfigurationID := baseID
	callbackNumber := "4447772288"
	phoneNumber := &common.PhoneNumber{PhoneNumber: &callbackNumber}
	source := partnerpb.Source{
		PartnerId:              partnerID,
		PartnerConfigurationId: partnerConfigurationID,
		DefaultCallbackOption:  partnerpb.CallbackOption_CALLBACK_OPTION_SOURCE,
		CallbackNumber:         phoneNumber,
	}
	invalidCallbackOptionSource := partnerpb.Source{
		PartnerId:              partnerID,
		PartnerConfigurationId: partnerConfigurationID,
		DefaultCallbackOption:  partnerpb.CallbackOption_CALLBACK_OPTION_UNSPECIFIED,
		CallbackNumber:         phoneNumber,
	}
	invalidCallbackNumberSource := partnerpb.Source{
		PartnerId:              partnerID,
		PartnerConfigurationId: partnerConfigurationID,
	}
	validRequest := &partnerpb.CreateConfigurationSourceRequest{
		Source: &source,
	}
	requestWithoutSource := &partnerpb.CreateConfigurationSourceRequest{}
	requestWithInvalidCallbackOption := &partnerpb.CreateConfigurationSourceRequest{
		Source: &invalidCallbackOptionSource,
	}
	requestWithInvalidCallbackNumber := &partnerpb.CreateConfigurationSourceRequest{
		Source: &invalidCallbackNumberSource,
	}

	tests := []struct {
		name    string
		server  *Server
		request *partnerpb.CreateConfigurationSourceRequest

		want    *partnerpb.CreateConfigurationSourceResponse
		wantErr error
	}{
		{
			name: "successfully creates partner configuration source",
			server: &Server{
				DBService: &mockDBService{
					getPartnerByIDResp: &partnersql.GetPartnerByIDRow{},
					getPartnerConfigurationSourceByPartnerIDAndPartnerConfigurationIDErr: pgx.ErrNoRows,
					addPartnerConfigurationSourceResp:                                    &partnersql.PartnerConfigurationSource{ID: baseID},
				},
				Logger: logger,
			},
			request: validRequest,

			want: &partnerpb.CreateConfigurationSourceResponse{
				Source: &partnerpb.Source{
					Id:                     &baseID,
					PartnerId:              partnerID,
					PartnerConfigurationId: partnerConfigurationID,
					DefaultCallbackOption:  partnerpb.CallbackOption_CALLBACK_OPTION_SOURCE,
					CallbackNumber:         phoneNumber,
				},
			},
		},
		{
			name: "fails when source is not present",
			server: &Server{
				Logger: logger,
			},
			request: requestWithoutSource,

			wantErr: status.Errorf(codes.InvalidArgument, "source is required"),
		},
		{
			name: "fails when partner is not found",
			server: &Server{
				DBService: &mockDBService{
					getPartnerByIDErr: pgx.ErrNoRows,
				},
				Logger: logger,
			},
			request: validRequest,

			wantErr: status.Errorf(codes.NotFound, "partner with ID %v was not found", partnerID),
		},
		{
			name: "fails when querying for existing partner fails",
			server: &Server{
				DBService: &mockDBService{
					getPartnerByIDErr: pgx.ErrTxClosed,
				},
				Logger: logger,
			},
			request: validRequest,

			wantErr: status.Errorf(codes.Internal, "GetPartnerByID error: %v", pgx.ErrTxClosed),
		},
		{
			name: "fails when partner configuration is not found",
			server: &Server{
				DBService: &mockDBService{
					getPartnerConfigurationByIDErr: pgx.ErrNoRows,
				},
				Logger: logger,
			},
			request: validRequest,

			wantErr: status.Errorf(codes.NotFound, "partner configuration with ID %v was not found", partnerConfigurationID),
		},
		{
			name: "fails when querying for existing partner configuration fails",
			server: &Server{
				DBService: &mockDBService{
					getPartnerConfigurationByIDErr: pgx.ErrTxClosed,
				},
				Logger: logger,
			},
			request: validRequest,

			wantErr: status.Errorf(codes.Internal, "GetPartnerConfigurationByID error: %v", pgx.ErrTxClosed),
		},
		{
			name: "fails when a duplicate configuration source exists",
			server: &Server{
				DBService: &mockDBService{},
				Logger:    logger,
			},
			request: validRequest,

			wantErr: status.Errorf(codes.AlreadyExists, "PartnerConfigurationSource with PartnerID %d and PartnerConfigurationID %d already exists", partnerID, partnerConfigurationID),
		},
		{
			name: "fails when querying for an existing configuration source fails",
			server: &Server{
				DBService: &mockDBService{
					getPartnerConfigurationSourceByPartnerIDAndPartnerConfigurationIDErr: pgx.ErrTxClosed,
				},
				Logger: logger,
			},
			request: validRequest,

			wantErr: status.Errorf(codes.Internal, "GetPartnerConfigurationSourceByPartnerIDAndPartnerConfigurationID error: %v", pgx.ErrTxClosed),
		},
		{
			name: "fails when creating a configuration source fails",
			server: &Server{
				DBService: &mockDBService{
					getPartnerConfigurationSourceByPartnerIDAndPartnerConfigurationIDErr: pgx.ErrNoRows,
					addPartnerConfigurationSourceErr:                                     pgx.ErrTxClosed,
				},
				Logger: logger,
			},
			request: validRequest,

			wantErr: status.Errorf(codes.Internal, "AddPartnerConfigurationSource error: %v", pgx.ErrTxClosed),
		},
		{
			name: "fails when the default callback option is unspecified",
			server: &Server{
				DBService: &mockDBService{
					getPartnerConfigurationSourceByPartnerIDAndPartnerConfigurationIDErr: pgx.ErrNoRows,
					addPartnerConfigurationSourceErr:                                     pgx.ErrTxClosed,
				},
				Logger: logger,
			},
			request: requestWithInvalidCallbackOption,

			wantErr: status.Errorf(codes.InvalidArgument, "invalid callback option: %v", "unspecified"),
		},
		{
			name: "fails when callback number is not present",
			server: &Server{
				DBService: &mockDBService{
					getPartnerConfigurationSourceByPartnerIDAndPartnerConfigurationIDErr: pgx.ErrNoRows,
					addPartnerConfigurationSourceErr:                                     pgx.ErrTxClosed,
				},
				Logger: logger,
			},
			request: requestWithInvalidCallbackNumber,

			wantErr: status.Error(codes.InvalidArgument, "callback number is required"),
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			response, err := test.server.CreateConfigurationSource(ctx, test.request)

			testutils.MustMatch(t, test.want, response)
			testutils.MustMatch(t, test.wantErr, err)
		})
	}
}
