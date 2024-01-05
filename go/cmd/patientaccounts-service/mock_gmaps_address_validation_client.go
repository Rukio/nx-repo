package main

import (
	"context"

	"github.com/*company-data-covered*/services/go/pkg/googlemapsclient"
)

type MockGMapsAddressValidationClient struct {
	ValidateAddressResult *googlemapsclient.ValidateAddressResponse
	ValidateAddressErr    error
}

func (m MockGMapsAddressValidationClient) ValidateAddress(ctx context.Context, _ *googlemapsclient.ValidateAddressRequest) (*googlemapsclient.ValidateAddressResponse, error) {
	return m.ValidateAddressResult, m.ValidateAddressErr
}
