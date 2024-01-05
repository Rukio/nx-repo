package featurestore

import (
	"context"
	"errors"
	"testing"

	"github.com/*company-data-covered*/services/go/pkg/testutils"
	fsruntime "github.com/aws/aws-sdk-go-v2/service/sagemakerfeaturestoreruntime"
	fstypes "github.com/aws/aws-sdk-go-v2/service/sagemakerfeaturestoreruntime/types"
)

type mockFeatureStore struct {
	GetRecordResp *fsruntime.GetRecordOutput
	GetRecordErr  error
}

func (m mockFeatureStore) GetRecord(context.Context, *fsruntime.GetRecordInput, ...func(*fsruntime.Options)) (*fsruntime.GetRecordOutput, error) {
	return m.GetRecordResp, m.GetRecordErr
}

func TestNewClient(t *testing.T) {
	tests := []struct {
		name         string
		clientParams ClientParams

		wantErr bool
	}{
		{
			name: "returns success if implemented feature store is passed in",
			clientParams: ClientParams{
				FeatureStore: &mockFeatureStore{},
			},

			wantErr: false,
		},
		{
			name: "with invalid params",

			wantErr: true,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			_, err := NewClient(test.clientParams)

			testutils.MustMatch(t, err != nil, test.wantErr)
		})
	}
}

func TestGetRecord(t *testing.T) {
	ctx := context.Background()

	tests := []struct {
		name         string
		featureStore FeatureStore
		recordInput  *fsruntime.GetRecordInput

		wantErr bool
		want    []fstypes.FeatureValue
	}{
		{
			name: "successful response from feature store",
			featureStore: &mockFeatureStore{
				GetRecordResp: &fsruntime.GetRecordOutput{
					Record: []fstypes.FeatureValue{},
				},
			},

			wantErr: false,
			want:    []fstypes.FeatureValue{},
		},
		{
			name: "feature store returns error",
			featureStore: &mockFeatureStore{
				GetRecordErr: errors.New("test error"),
			},

			wantErr: true,
			want:    nil,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			client, _ := NewClient(ClientParams{
				FeatureStore: test.featureStore,
			})
			resp, err := client.GetRecord(ctx, test.recordInput)

			testutils.MustMatch(t, err != nil, test.wantErr)
			testutils.MustMatch(t, resp, test.want)
		})
	}
}
