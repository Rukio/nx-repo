package main

import (
	"bytes"
	"context"
	"encoding/xml"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"time"

	"go.uber.org/zap"

	awsConfig "github.com/*company-data-covered*/services/go/pkg/aws"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/s3/types"
	"github.com/aws/aws-sdk-go-v2/service/sns"
)

const (
	putEventConfigError        = "unable to put event config in %s bucket, other configurations in place"
	bucketNameTitle            = "bucket name"
	subscriptionDeliveryPolicy = `{
  		"healthyRetryPolicy": {
    		"minDelayTarget": 10,
    		"maxDelayTarget": 300,
    		"numRetries": 19,
    		"numNoDelayRetries": 2,
    		"numMinDelayRetries": 3,
    		"numMaxDelayRetries": 9,
    		"backoffFunction": "geometric"
		},
  		"sicklyRetryPolicy": null,
  		"throttlePolicy": {
    		"maxReceivesPerSecond": 2
  		},
  		"guaranteed": false
  	}`
	awsSnsHeader             = "X-Amz-Sns-Message-Type"
	subscriptionConfirmation = "SubscriptionConfirmation"
	notification             = "Notification"
)

type s3API interface {
	GetBucketLocation(context.Context, *s3.GetBucketLocationInput, ...func(*s3.Options)) (*s3.GetBucketLocationOutput, error)
	DeleteObject(context.Context, *s3.DeleteObjectInput, ...func(*s3.Options)) (*s3.DeleteObjectOutput, error)
	GetBucketNotificationConfiguration(context.Context, *s3.GetBucketNotificationConfigurationInput, ...func(*s3.Options)) (*s3.GetBucketNotificationConfigurationOutput, error)
	PutBucketNotificationConfiguration(context.Context, *s3.PutBucketNotificationConfigurationInput, ...func(*s3.Options)) (*s3.PutBucketNotificationConfigurationOutput, error)
	CopyObject(context.Context, *s3.CopyObjectInput, ...func(*s3.Options)) (*s3.CopyObjectOutput, error)
	GetObject(context.Context, *s3.GetObjectInput, ...func(*s3.Options)) (*s3.GetObjectOutput, error)
	PutObject(context.Context, *s3.PutObjectInput, ...func(*s3.Options)) (*s3.PutObjectOutput, error)
}

type snsAPI interface {
	ListSubscriptionsByTopic(context.Context, *sns.ListSubscriptionsByTopicInput, ...func(*sns.Options)) (*sns.ListSubscriptionsByTopicOutput, error)
	Subscribe(context.Context, *sns.SubscribeInput, ...func(*sns.Options)) (*sns.SubscribeOutput, error)
}

type ConfirmSubscriptionResponse struct {
	XMLName         xml.Name `xml:"ConfirmSubscriptionResponse"`
	SubscriptionArn string   `xml:"ConfirmSubscriptionResult>SubscriptionArn"`
	RequestID       string   `xml:"ResponseMetadata>RequestId"`
}

type S3Event struct {
	Records []S3EventRecord `json:"Records"`
}

type S3EventRecord struct {
	EventVersion      string              `json:"eventVersion"`
	EventSource       string              `json:"eventSource"`
	AWSRegion         string              `json:"awsRegion"`
	EventTime         time.Time           `json:"eventTime"`
	EventName         string              `json:"eventName"`
	PrincipalID       S3UserIdentity      `json:"userIdentity"`
	RequestParameters S3RequestParameters `json:"requestParameters"`
	ResponseElements  map[string]string   `json:"responseElements"`
	S3                S3Entity            `json:"s3"`
}

type S3UserIdentity struct {
	PrincipalID string `json:"principalId"`
}

type S3RequestParameters struct {
	SourceIPAddress string `json:"sourceIPAddress"`
}

type S3Entity struct {
	SchemaVersion   string   `json:"s3SchemaVersion"`
	ConfigurationID string   `json:"configurationId"`
	Bucket          S3Bucket `json:"bucket"`
	Object          S3Object `json:"object"`
}

type S3Bucket struct {
	Name          string         `json:"name"`
	OwnerIdentity S3UserIdentity `json:"ownerIdentity"`
	Arn           string         `json:"arn"`
}

type S3Object struct {
	Key           string `json:"key"`
	Size          int64  `json:"size,omitempty"`
	URLDecodedKey string `json:"urlDecodedKey"`
	VersionID     string `json:"versionId"`
	ETag          string `json:"eTag"`
	Sequencer     string `json:"sequencer"`
}

type AwsClient struct {
	config          aws.Config
	s3Client        s3API
	snsClient       snsAPI
	partnerTopicArn *string
	resultsTopicArn *string
	logger          *zap.SugaredLogger
}

func NewAWSClient(
	ctx context.Context,
	partnerTopicArn string,
	resultsTopicArn string,
	options awsConfig.ProviderOptions,
	logger *zap.SugaredLogger,
) (*AwsClient, error) {
	if partnerTopicArn == "" {
		return nil, errors.New("missing event partners file aws topic")
	}
	if resultsTopicArn == "" {
		return nil, errors.New("missing results file aws topic")
	}
	config, err := awsConfig.NewAWSConfig(ctx, options)
	if err != nil {
		return nil, err
	}
	s := &AwsClient{config: *config, partnerTopicArn: &partnerTopicArn, resultsTopicArn: &resultsTopicArn, logger: logger}
	s.s3Client = s.createS3Client()
	s.snsClient = sns.NewFromConfig(s.config)
	return s, nil
}

func (c *AwsClient) BucketExists(ctx context.Context, bucketName string) bool {
	params := s3.GetBucketLocationInput{
		Bucket: &bucketName,
	}
	_, err := c.s3Client.GetBucketLocation(ctx, &params)
	if err != nil {
		c.logger.Errorw("error getting bucket location",
			bucketNameTitle, bucketName,
			zap.Error(err))
	}
	return err == nil
}

func (c *AwsClient) PutBucketNotification(ctx context.Context, bucketName string, filterFolders []string) error {
	var topicConfigurations []types.TopicConfiguration
	for _, folder := range filterFolders {
		topicConfigurations = append(topicConfigurations, types.TopicConfiguration{
			Events: []types.Event{
				"s3:ObjectCreated:*",
			},
			TopicArn: c.partnerTopicArn,
			Filter: &types.NotificationConfigurationFilter{
				Key: &types.S3KeyFilter{
					FilterRules: []types.FilterRule{
						{
							Name:  types.FilterRuleNamePrefix,
							Value: aws.String(folder + "/"),
						},
					},
				},
			},
		})
	}

	params := s3.GetBucketNotificationConfigurationInput{
		Bucket: &bucketName,
	}
	resp, err := c.s3Client.GetBucketNotificationConfiguration(ctx, &params)
	if err != nil {
		c.logger.Errorw("error getting notification configuration from bucket",
			bucketNameTitle, &bucketName,
			zap.Error(err))

		return err
	}
	if bucketHasNoOtherConfig(resp) {
		return c.putBucketTopicNotification(ctx, bucketName, topicConfigurations)
	}
	if !findNotification(resp.TopicConfigurations, *c.partnerTopicArn) {
		return fmt.Errorf(putEventConfigError, bucketName)
	}
	return nil
}

func (c *AwsClient) putBucketTopicNotification(ctx context.Context, bucketName string, configs []types.TopicConfiguration) error {
	params := s3.PutBucketNotificationConfigurationInput{
		Bucket: &bucketName,
		NotificationConfiguration: &types.NotificationConfiguration{
			TopicConfigurations: configs,
		},
	}
	_, err := c.s3Client.PutBucketNotificationConfiguration(ctx, &params)
	if err != nil {
		c.logger.Errorw("error putting bucket notification",
			bucketNameTitle, &bucketName,
			zap.Error(err))
	}
	return err
}

func (c *AwsClient) createS3Client() *s3.Client {
	return s3.NewFromConfig(c.config, func(options *s3.Options) {
		options.UsePathStyle = true
	})
}

func (c AwsClient) DeleteS3File(ctx context.Context, bucketName string, objectKey string) error {
	input := s3.DeleteObjectInput{
		Bucket: &bucketName,
		Key:    &objectKey,
	}
	_, err := c.s3Client.DeleteObject(ctx, &input)
	if err != nil {
		c.logger.Errorw("error deleting file from bucket",
			bucketNameTitle, &bucketName,
			zap.Error(err))
	}
	return err
}

func (c AwsClient) AddS3File(ctx context.Context, bucketName string, objectKey string, file []byte) error {
	putObject := s3.PutObjectInput{
		Bucket:      &bucketName,
		Key:         &objectKey,
		Body:        bytes.NewReader(file),
		ContentType: aws.String(http.DetectContentType(file)),
	}
	_, err := c.s3Client.PutObject(ctx, &putObject)
	if err != nil {
		c.logger.Errorw("error adding file to bucket",
			bucketNameTitle, &bucketName,
			zap.Error(err))
	}
	return err
}

func (c *AwsClient) SubscribePartnerTopic(ctx context.Context, protocol, endpoint string) error {
	return c.subscribeTopic(ctx, *c.partnerTopicArn, protocol, endpoint)
}

func (c *AwsClient) SubscribeResultsTopic(ctx context.Context, protocol, endpoint string) error {
	return c.subscribeTopic(ctx, *c.resultsTopicArn, protocol, endpoint)
}

func (c *AwsClient) subscribeTopic(ctx context.Context, topicArn, protocol, endpoint string) error {
	existsSub, err := c.existsSubscription(ctx, topicArn, protocol, endpoint)
	if err != nil {
		c.logger.Errorw("error checking subscription",
			"topic", topicArn,
			"protocol", protocol,
			"endpoint", endpoint,
			zap.Error(err))
		return err
	}
	if !existsSub {
		attrs := map[string]string{
			"DeliveryPolicy": subscriptionDeliveryPolicy,
		}
		_, err = c.snsClient.Subscribe(ctx, &sns.SubscribeInput{
			Protocol:              &protocol,
			TopicArn:              &topicArn,
			Attributes:            attrs,
			Endpoint:              &endpoint,
			ReturnSubscriptionArn: false,
		})
		if err != nil {
			c.logger.Errorw("error subscribing sns client",
				"topic", topicArn,
				"protocol", protocol,
				"endpoint", endpoint,
				zap.Error(err))
			return err
		}
	}
	return nil
}

func (c *AwsClient) existsSubscription(ctx context.Context, topicArn, protocol, endpoint string) (bool, error) {
	response, err := c.snsClient.ListSubscriptionsByTopic(ctx, &sns.ListSubscriptionsByTopicInput{
		TopicArn: &topicArn,
	})
	if err != nil {
		c.logger.Errorw("error listing subscriptions",
			"topic", topicArn,
			"protocol", protocol,
			"endpoint", endpoint,
			zap.Error(err))
		return false, err
	}
	for _, subscription := range response.Subscriptions {
		if *subscription.Endpoint == endpoint && *subscription.Protocol == protocol {
			return true, nil
		}
	}
	return false, nil
}

func findNotification(notifications []types.TopicConfiguration, topicArn string) bool {
	for _, notification := range notifications {
		if *notification.TopicArn == topicArn {
			return true
		}
	}
	return false
}

func bucketHasNoOtherConfig(configs *s3.GetBucketNotificationConfigurationOutput) bool {
	return configs == nil ||
		(configs.QueueConfigurations == nil && configs.LambdaFunctionConfigurations == nil && configs.TopicConfigurations == nil) ||
		(len(configs.QueueConfigurations) == 0 && len(configs.LambdaFunctionConfigurations) == 0 && len(configs.TopicConfigurations) == 0)
}

func (c *AwsClient) CopyFile(ctx context.Context, copySource string, destBucket string, destKey string) error {
	params := s3.CopyObjectInput{
		Bucket:     aws.String(destBucket),
		Key:        aws.String(destKey),
		CopySource: aws.String(url.PathEscape(copySource)),
	}
	_, err := c.s3Client.CopyObject(ctx, &params)
	if err != nil {
		c.logger.Errorw("error copying file to bucket",
			"destination bucket", destBucket,
			"destination key", destKey,
			"copy source", copySource,
			zap.Error(err))
	}
	return err
}

func (c *AwsClient) GetS3File(ctx context.Context, bucketName string, objectKey string) (io.ReadCloser, error) {
	getObject := s3.GetObjectInput{
		Bucket: aws.String(bucketName),
		Key:    aws.String(objectKey),
	}
	resp, err := c.s3Client.GetObject(ctx, &getObject)
	if err != nil {
		c.logger.Errorw("error getting file from bucket",
			bucketNameTitle, bucketName,
			zap.Error(err))
		return nil, err
	}
	return resp.Body, nil
}
