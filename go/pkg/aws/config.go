package aws

import (
	"context"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
)

type awsConfig interface {
	LoadConfig(ctx context.Context, optFns ...func(*config.LoadOptions) error) (aws.Config, error)
}

type defaultAwsConfig struct {
}

func (a defaultAwsConfig) LoadConfig(
	ctx context.Context,
	optFns ...func(*config.LoadOptions) error) (aws.Config, error) {
	return config.LoadDefaultConfig(ctx, optFns...)
}

type ProviderOptions struct {
	AwsConfig       awsConfig
	Region          string
	AccessKeyID     string
	SecretAccessKey string
}

func NewAWSConfig(ctx context.Context, options ProviderOptions) (*aws.Config, error) {
	var cfg aws.Config
	var err error

	configImpl := awsConfig(defaultAwsConfig{})
	if options.AwsConfig != nil {
		configImpl = options.AwsConfig
	}

	if options.AccessKeyID == "" && options.SecretAccessKey == "" {
		cfg, err = configImpl.LoadConfig(ctx, config.WithRegion(options.Region))
		return &cfg, err
	}

	staticCredentialsProvider := credentials.NewStaticCredentialsProvider(options.AccessKeyID, options.SecretAccessKey, "")

	_, err = staticCredentialsProvider.Retrieve(ctx)
	if err != nil {
		return nil, err
	}

	cfg, err = configImpl.LoadConfig(ctx,
		config.WithRegion(options.Region),
		config.WithCredentialsProvider(staticCredentialsProvider),
	)

	return &cfg, err
}
