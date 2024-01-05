package secrets

import (
	"context"
	"errors"
	"fmt"
	"testing"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/secretsmanager"
)

type mockAwsSecretsClient struct {
	err error
}

func (s mockAwsSecretsClient) GetSecretValue(ctx context.Context, params *secretsmanager.GetSecretValueInput,
	optFns ...func(*secretsmanager.Options)) (*secretsmanager.GetSecretValueOutput, error) {
	return &secretsmanager.GetSecretValueOutput{
		SecretString: aws.String(*params.SecretId + "-value"),
	}, s.err
}

func TestAWSProvider_Secret(t *testing.T) {
	tcs := []struct {
		Desc                      string
		UseDefaultCredentialChain bool
		Region                    string
		AccessKeyID               string
		SecretAccessKey           string
		SecretID                  string
		Value                     string
		Mock                      *mockAwsSecretsClient
		HasError                  bool
	}{
		{
			Desc:                      "Return valid secret",
			UseDefaultCredentialChain: false,
			Region:                    "us-east-1",
			AccessKeyID:               "accessKeyID",
			SecretAccessKey:           "secretAccessKey",
			SecretID:                  "secretId",
			Value:                     "secretId-value",
			Mock: &mockAwsSecretsClient{
				err: nil,
			},
			HasError: false,
		},
		{
			Desc:                      "Missing Access Key ID",
			UseDefaultCredentialChain: false,
			Region:                    "us-east-1",
			AccessKeyID:               "",
			SecretAccessKey:           "secretAccessKey",
			SecretID:                  "secretId",
			Value:                     "secretId-value",
			Mock: &mockAwsSecretsClient{
				err: errors.New("access key required"),
			},
			HasError: true,
		},
		{
			Desc:                      "Missing Secret Access Key",
			UseDefaultCredentialChain: false,
			Region:                    "us-east-1",
			AccessKeyID:               "accessKeyID",
			SecretAccessKey:           "",
			SecretID:                  "secretId",
			Value:                     "secretId-value",
			Mock: &mockAwsSecretsClient{
				err: errors.New("invalid credentials secret key required"),
			},
			HasError: true,
		},
		{
			Desc:                      "Missing Region",
			UseDefaultCredentialChain: false,
			Region:                    "",
			AccessKeyID:               "accessKeyID",
			SecretAccessKey:           "secretAccessKey",
			SecretID:                  "secretId",
			Value:                     "secretId-value",
			Mock: &mockAwsSecretsClient{
				err: errors.New("region required"),
			},
			HasError: true,
		},
		{
			Desc:            "Secret Not Found",
			Region:          "us-east-1",
			AccessKeyID:     "accessKeyID",
			SecretAccessKey: "secretAccessKey",
			SecretID:        "secretId",
			Value:           "secretId-value",
			Mock: &mockAwsSecretsClient{
				err: errors.New("internal error"),
			},
			HasError: true,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			awsProvider := AWSProvider{client: tc.Mock}

			output, err := awsProvider.Secret(context.Background(), tc.SecretID)

			if (err != nil) != tc.HasError {
				t.Fatalf("Unexpected Error State: %s\nexpected: %v\ngot: %v", tc.Desc, tc.HasError, err != nil)
			}

			if tc.HasError {
				expectedError := fmt.Sprintf("secret %s unavailable: %s", tc.SecretID, tc.Mock.err.Error())
				if err.Error() != expectedError {
					t.Errorf("Incorrect Error: %s\nexpected: %s\ngot: %s", tc.Desc, expectedError, err)
				}
			}

			if err == nil && output.Value() != tc.Value {
				t.Errorf("Incorrect Value: %s\nexpected: %s\ngot: %s", tc.Desc, tc.Value, output.Value())
			}
		})
	}
}

func TestNew(t *testing.T) {
	ctx := context.Background()
	tcs := []struct {
		Desc                      string
		UseDefaultCredentialChain bool
		Region                    string
		AccessKeyID               string
		SecretAccessKey           string
		HasError                  bool
	}{
		{
			Desc:                      "Use Default Credential Chain",
			UseDefaultCredentialChain: true,
			Region:                    "us-east-1",
			AccessKeyID:               "",
			SecretAccessKey:           "",
			HasError:                  false,
		},
		{
			Desc:                      "Use Static Credentials",
			UseDefaultCredentialChain: false,
			Region:                    "us-east-1",
			AccessKeyID:               "access",
			SecretAccessKey:           "secret",
			HasError:                  false,
		},
		{
			Desc:                      "Missing Region",
			UseDefaultCredentialChain: false,
			Region:                    "",
			AccessKeyID:               "access",
			SecretAccessKey:           "secret",
			HasError:                  true,
		},
		{
			Desc:                      "Missing AccessKeyID",
			UseDefaultCredentialChain: false,
			Region:                    "us-east-1",
			AccessKeyID:               "",
			SecretAccessKey:           "secret",
			HasError:                  true,
		},
		{
			Desc:                      "Missing Secret Access Key",
			UseDefaultCredentialChain: false,
			Region:                    "us-east-1",
			AccessKeyID:               "access",
			SecretAccessKey:           "",
			HasError:                  true,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			awsClient, err := NewAWSProvider(ctx,
				awsProviderOptions{tc.UseDefaultCredentialChain, tc.Region, tc.AccessKeyID, tc.SecretAccessKey},
			)

			if (err != nil) != tc.HasError {
				t.Fatalf("Unexpected Error State: %s\nexpected: %v\ngot: %v", tc.Desc, tc.HasError, err != nil)
			}

			if tc.HasError && tc.AccessKeyID == "" {
				expectedError := "invalid credentials: access key required"
				if err.Error() != expectedError {
					t.Fatalf("Incorrect Error: %s\nexpected: %s\ngot: %s", tc.Desc, expectedError, err)
				}
			}

			if tc.HasError && tc.SecretAccessKey == "" {
				expectedError := "invalid credentials: secret key required"
				if err.Error() != expectedError {
					t.Fatalf("Incorrect Error: %s\nexpected: %s\ngot: %s", tc.Desc, expectedError, err)
				}
			}

			if tc.HasError && tc.Region == "" {
				expectedError := "invalid credentials: region required"
				if err.Error() != expectedError {
					t.Fatalf("Incorrect Error: %s\nexpected: %s\ngot: %s", tc.Desc, expectedError, err)
				}
			}

			if !tc.HasError && awsClient == nil {
				t.Fatalf("the aws client should have been initialized")
			}
		})
	}
}
