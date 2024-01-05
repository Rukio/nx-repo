package grpc

import (
	"context"
	"testing"
	"time"

	partnerpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/partner"
	partnersql "github.com/*company-data-covered*/services/go/pkg/generated/sql/partner"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"github.com/jackc/pgx/v4"
	"go.uber.org/zap"
)

func TestGetPartner(t *testing.T) {
	ctx := context.Background()

	fakeID := time.Now().UnixNano()
	validRequest := &partnerpb.GetPartnerRequest{
		PartnerId: fakeID,
	}

	logger := zap.NewNop().Sugar()

	tests := []struct {
		name             string
		server           *Server
		request          *partnerpb.GetPartnerRequest
		hasError         bool
		expectedResponse *partnerpb.GetPartnerResponse
	}{
		{
			name: "valid request partner returns response with partner proto",
			server: &Server{
				DBService: &mockDBService{
					getPartnerByIDResp: partnersql.GetPartnerByIDRow{ID: fakeID},
				},
				Logger: logger,
			},
			request:          validRequest,
			hasError:         false,
			expectedResponse: &partnerpb.GetPartnerResponse{Partner: &partnerpb.Partner{Id: &fakeID}},
		},
		{
			name: "error is returned if partner was not found",
			server: &Server{
				DBService: &mockDBService{
					getPartnerByIDErr: pgx.ErrNoRows,
				},
				Logger: logger,
			},
			request:          validRequest,
			hasError:         true,
			expectedResponse: nil,
		},
		{
			name: "internal error is returned if something fails during fetch",
			server: &Server{
				DBService: &mockDBService{
					getPartnerByIDErr: pgx.ErrTxClosed,
				},
				Logger: logger,
			},
			request:          validRequest,
			hasError:         true,
			expectedResponse: nil,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			response, err := test.server.GetPartner(ctx, test.request)

			if (err != nil) != test.hasError {
				t.Fatal(err)
			}

			if !test.hasError {
				testutils.MustMatch(t, response.Partner.Id, test.expectedResponse.Partner.Id)
			}
		})
	}
}
