package aws

import (
	"context"
	"testing"

	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
)

type testAwsConfig struct {
}

func (a testAwsConfig) LoadConfig(
	ctx context.Context,
	optFns ...func(*config.LoadOptions) error) (aws.Config, error) {
	return aws.Config{}, nil
}

func TestNewAWSConfig(t *testing.T) {
	ctx := context.Background()

	tests := []struct {
		name    string
		options ProviderOptions

		wantErr bool
		want    *aws.Config
	}{
		{
			name: "returns config based on default credential chain",
			options: ProviderOptions{
				AwsConfig: testAwsConfig{},
				Region:    "us-west-1",
			},

			wantErr: false,
			want:    &aws.Config{},
		},
		{
			name: "returns config if credentials are passed in",
			options: ProviderOptions{
				AwsConfig:       testAwsConfig{},
				Region:          "us-west-1",
				AccessKeyID:     "Test AccessKeyID",
				SecretAccessKey: "SecretAccessKey",
			},

			wantErr: false,
			want:    &aws.Config{},
		},
		{
			name: "error if AccessKeyID is missing",
			options: ProviderOptions{
				AwsConfig:       testAwsConfig{},
				Region:          "us-west-1",
				SecretAccessKey: "SecretAccessKey",
			},

			wantErr: true,
		},
		{
			name: "error if SecretAccessKey is missing",
			options: ProviderOptions{
				AwsConfig:   testAwsConfig{},
				Region:      "us-west-1",
				AccessKeyID: "Test AccessKeyID",
			},

			wantErr: true,
		},
		{
			name: "returns config if region is missing",
			options: ProviderOptions{
				AwsConfig:       testAwsConfig{},
				AccessKeyID:     "Test AccessKeyID",
				SecretAccessKey: "SecretAccessKey",
			},

			wantErr: false,
			want:    &aws.Config{},
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			resp, err := NewAWSConfig(ctx, test.options)

			testutils.MustMatch(t, err != nil, test.wantErr)
			if (test.want == nil) != (resp == nil) {
				t.Fatalf("response does not match want")
			}
			if resp != nil && test.want != nil {
				testutils.MustMatch(t, *resp, *test.want)
			}
		})
	}
}
