package googlemapsclient

import (
	"context"
	"errors"
	"testing"

	"cloud.google.com/go/maps/addressvalidation/apiv1/addressvalidationpb"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"google.golang.org/grpc"
	"google.golang.org/grpc/metadata"
	"google.golang.org/protobuf/proto"
)

type MockAddressValidationClient struct {
	t                      *testing.T
	ValidateAddressRequest *addressvalidationpb.ValidateAddressRequest
	ValidateAddressResult  *addressvalidationpb.ValidateAddressResponse
	ValidateAddressErr     error
}

func (mavc MockAddressValidationClient) ValidateAddress(ctx context.Context, req *addressvalidationpb.ValidateAddressRequest, opts ...grpc.CallOption) (*addressvalidationpb.ValidateAddressResponse, error) {
	outgoingCtx, _ := metadata.FromOutgoingContext(ctx)
	if outgoingCtx.Get(googleAPIKeyHeader) == nil {
		return nil, errors.New("API Key header required")
	}
	if !proto.Equal(mavc.ValidateAddressRequest, req) {
		testutils.MustMatchProto(mavc.t, mavc.ValidateAddressRequest, req)
	}
	return mavc.ValidateAddressResult, mavc.ValidateAddressErr
}
