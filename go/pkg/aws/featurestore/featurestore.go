package featurestore

import (
	"context"
	"errors"

	"github.com/aws/aws-sdk-go-v2/aws"
	fsruntime "github.com/aws/aws-sdk-go-v2/service/sagemakerfeaturestoreruntime"
	fstypes "github.com/aws/aws-sdk-go-v2/service/sagemakerfeaturestoreruntime/types"
)

type FeatureStore interface {
	GetRecord(context.Context, *fsruntime.GetRecordInput, ...func(*fsruntime.Options)) (*fsruntime.GetRecordOutput, error)
}

type ClientParams struct {
	AwsConfig    *aws.Config
	FeatureStore FeatureStore
}

type Client struct {
	featureStore FeatureStore
}

func NewClient(clientParams ClientParams) (*Client, error) {
	client := Client{}

	switch {
	case clientParams.FeatureStore != nil:
		client.featureStore = clientParams.FeatureStore
	case clientParams.AwsConfig != nil:
		client.featureStore = fsruntime.NewFromConfig(*clientParams.AwsConfig)
	default:
		return nil, errors.New("feature store client requires aws config or feature store implementation")
	}

	return &client, nil
}

func (c *Client) GetRecord(ctx context.Context, recordInput *fsruntime.GetRecordInput) ([]fstypes.FeatureValue, error) {
	getRecordOutput, err := c.featureStore.GetRecord(ctx, recordInput)
	if err != nil {
		return nil, err
	}

	return getRecordOutput.Record, nil
}
