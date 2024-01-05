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

func TestListConfigurationSources(t *testing.T) {
	ctx := context.Background()
	logger := zap.NewNop().Sugar()

	currentTime := time.Now()
	baseID := currentTime.UnixNano()
	phoneNumber := "5558882211"

	getConfigurationSourceRequestWithID := &partnerpb.ListConfigurationSourcesRequest{
		PartnerConfigurationId: baseID,
	}
	sourcesByPartnerConfigurationIDRow := []*partnersql.GetPartnerConfigurationSourcesByPartnerConfigurationIDRow{
		{
			ID:                     baseID,
			PartnerID:              baseID,
			PartnerConfigurationID: baseID,
			CallbackNumber:         phoneNumber,
			CreatedAt:              currentTime,
			UpdatedAt:              currentTime},
	}
	sources := []*partnerpb.Source{{
		Id:                     proto.Int64(baseID),
		PartnerId:              baseID,
		PartnerConfigurationId: baseID,
		CallbackNumber: &common.PhoneNumber{
			PhoneNumber: &phoneNumber,
		},
		DefaultVisitAddress: &common.Address{},
		CreatedAt:           protoconv.TimeToProtoTimestamp(&currentTime),
		UpdatedAt:           protoconv.TimeToProtoTimestamp(&currentTime)},
	}

	tests := []struct {
		name    string
		server  *Server
		request *partnerpb.ListConfigurationSourcesRequest

		want    *partnerpb.ListConfigurationSourcesResponse
		wantErr error
	}{
		{
			name: "sucessfully get partner configuration source using id",
			server: &Server{
				DBService: &mockDBService{
					getPartnerConfigurationSourcesByPartnerConfigurationIDResp: sourcesByPartnerConfigurationIDRow,
				},
				Logger: logger,
			},
			request: getConfigurationSourceRequestWithID,

			want: &partnerpb.ListConfigurationSourcesResponse{
				Sources: sources,
			},
		},
		{
			name: "fails when the partner configuration source by partner configuration id query fails",
			server: &Server{
				DBService: &mockDBService{
					getPartnerConfigurationSourcesByPartnerConfigurationIDErr: pgx.ErrTxClosed,
				},
				Logger: logger,
			},
			request: getConfigurationSourceRequestWithID,

			wantErr: status.Errorf(codes.Internal, "GetPartnerConfigurationSourcesByPartnerConfigurationID error: %v", pgx.ErrTxClosed),
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			response, err := test.server.ListConfigurationSources(ctx, test.request)

			testutils.MustMatch(t, test.want, response)
			testutils.MustMatch(t, test.wantErr, err)
		})
	}
}
