package expressgrpc

import (
	"context"
	"testing"
	"time"

	"github.com/jackc/pgx/v4"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	"github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
	"github.com/*company-data-covered*/services/go/pkg/protoconv"
	"google.golang.org/protobuf/proto"

	partnerpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/partner"
	partnersql "github.com/*company-data-covered*/services/go/pkg/generated/sql/partner"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"go.uber.org/zap"
)

func TestGetConfigurationSource(t *testing.T) {
	ctx := context.Background()
	logger := zap.NewNop().Sugar()

	currentTime := time.Now()
	baseID := currentTime.UnixNano()
	phoneNumber := "5558882211"

	getConfigurationSourceRequestWithID := &partnerpb.GetConfigurationSourceRequest{
		Id: baseID,
	}
	partnerConfigurationSourceByIDRow := partnersql.GetPartnerConfigurationSourceByIDRow{
		ID:                     baseID,
		PartnerID:              baseID + 1,
		PartnerConfigurationID: baseID + 2,
		CallbackNumber:         phoneNumber,
		CreatedAt:              currentTime,
		UpdatedAt:              currentTime,
	}
	source := partnerpb.Source{
		Id:                     proto.Int64(baseID),
		PartnerId:              baseID + 1,
		PartnerConfigurationId: baseID + 2,
		CallbackNumber: &common.PhoneNumber{
			PhoneNumber: &phoneNumber,
		},
		DefaultVisitAddress: &common.Address{},
		CreatedAt:           protoconv.TimeToProtoTimestamp(&currentTime),
		UpdatedAt:           protoconv.TimeToProtoTimestamp(&currentTime),
	}

	tests := []struct {
		name    string
		server  *Server
		request *partnerpb.GetConfigurationSourceRequest

		want    *partnerpb.GetConfigurationSourceResponse
		wantErr error
	}{
		{
			name: "sucessfully get partner configuration source using id",
			server: &Server{
				DBService: &mockDBService{
					getPartnerConfigurationSourceByIDResp: partnerConfigurationSourceByIDRow,
				},
				Logger: logger,
			},
			request: getConfigurationSourceRequestWithID,

			want: &partnerpb.GetConfigurationSourceResponse{
				Source: &source,
			},
		},
		{
			name: "fails when no partner configuration source matches the given id",
			server: &Server{
				DBService: &mockDBService{
					getPartnerConfigurationSourceByIDErr: pgx.ErrNoRows,
				},
				Logger: logger,
			},
			request: getConfigurationSourceRequestWithID,

			wantErr: status.Errorf(codes.NotFound, "configuration source with ID %v was not found", baseID),
		},
		{
			name: "fails when the partner configuration source by id query fails",
			server: &Server{
				DBService: &mockDBService{
					getPartnerConfigurationSourceByIDErr: pgx.ErrTxClosed,
				},
				Logger: logger,
			},
			request: getConfigurationSourceRequestWithID,

			wantErr: status.Errorf(codes.Internal, "GetPartnerConfigurationSourceByID error: %v", pgx.ErrTxClosed),
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			response, err := test.server.GetConfigurationSource(ctx, test.request)

			testutils.MustMatch(t, test.want, response)
			testutils.MustMatch(t, test.wantErr, err)
		})
	}
}
