package secrets

import (
	"context"
	"errors"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/secretsmanager"
)

type awsSecretsClient interface {
	GetSecretValue(context.Context, *secretsmanager.GetSecretValueInput, ...func(*secretsmanager.Options)) (*secretsmanager.GetSecretValueOutput, error)
}

type awsProviderOptions struct {
	UseDefaultCredentialChain bool
	Region                    string
	AccessKeyID               string
	SecretAccessKey           string
}

func loadAwsConfig(ctx context.Context, options awsProviderOptions) (*aws.Config, error) {
	if options.Region == "" {
		return nil, errors.New("invalid credentials: region required")
	}

	if options.UseDefaultCredentialChain {
		cfg, err := config.LoadDefaultConfig(ctx, config.WithRegion(options.Region))
		return &cfg, err
	}

	if options.AccessKeyID == "" {
		return nil, errors.New("invalid credentials: access key required")
	}
	if options.SecretAccessKey == "" {
		return nil, errors.New("invalid credentials: secret key required")
	}

	cfg, err := config.LoadDefaultConfig(ctx,
		config.WithRegion(options.Region),
		config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(options.AccessKeyID, options.SecretAccessKey, "")),
	)
	return &cfg, err
}

func newAWSSecretsClient(ctx context.Context, options awsProviderOptions) (*secretsmanager.Client, error) {
	cfg, err := loadAwsConfig(ctx, options)
	if err != nil {
		return nil, err
	}

	return secretsmanager.NewFromConfig(*cfg), nil
}

// AWSProvider implements the secrets.Provider interface for the AWS SecretsManager API.
type AWSProvider struct {
	client awsSecretsClient
}

// Secret implements the secrets.Provider interface Secret method.
func (p AWSProvider) Secret(ctx context.Context, secretKey string) (*Secret, error) {
	output, err := p.client.GetSecretValue(ctx, &secretsmanager.GetSecretValueInput{SecretId: aws.String(secretKey)})

	if err != nil {
		return nil, &UnavailableError{SecretName: secretKey, Reason: err}
	}

	return NewSecret(*output.SecretString), nil
}

func NewAWSProvider(ctx context.Context, options awsProviderOptions) (*AWSProvider, error) {
	client, err := newAWSSecretsClient(ctx, options)
	if err != nil {
		return nil, err
	}

	return &AWSProvider{
		client: client,
	}, nil
}
