package main

import (
	"context"
	"io"
	"strings"
	"testing"

	"go.uber.org/zap"

	awsConfig "github.com/*company-data-covered*/services/go/pkg/aws"

	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/s3/types"
	"github.com/aws/aws-sdk-go-v2/service/sns"
	snsTypes "github.com/aws/aws-sdk-go-v2/service/sns/types"
	"github.com/aws/smithy-go/middleware"
	"google.golang.org/protobuf/proto"

	"github.com/*company-data-covered*/services/go/pkg/testutils"
)

const (
	testBucketName = "testBucketName"
	testTopicARN   = "arn:aws:sns:us-east-1:000000000000:testTopic"
)

var (
	protocol      = "http"
	endpoint      = "pophealth.com:8080/api/v1/files"
	otherEndpoint = "*company-data-covered*.com/api/v1/pophealth"
)

type mockAwsAPI struct {
	err                           error
	getBucketNotificationsResp    s3.GetBucketNotificationConfigurationOutput
	bucketNotificationConfigParam *s3.PutBucketNotificationConfigurationInput
	getBucketNotificationsErr     error
	copyObjectResp                s3.CopyObjectOutput
	getObjectResp                 s3.GetObjectOutput
	listSubscriptionsByTopicResp  sns.ListSubscriptionsByTopicOutput
	listSubscriptionsByTopicErr   error
	subscribeErr                  error
	putObjectErr                  error
}

func (s *mockAwsAPI) GetBucketLocation(context.Context, *s3.GetBucketLocationInput, ...func(*s3.Options)) (*s3.GetBucketLocationOutput, error) {
	return nil, s.err
}

func (s *mockAwsAPI) PutBucketNotificationConfiguration(_ context.Context, input *s3.PutBucketNotificationConfigurationInput, _ ...func(*s3.Options)) (*s3.PutBucketNotificationConfigurationOutput, error) {
	s.bucketNotificationConfigParam = input
	return nil, s.err
}

func (s *mockAwsAPI) GetBucketNotificationConfiguration(context.Context, *s3.GetBucketNotificationConfigurationInput, ...func(*s3.Options)) (*s3.GetBucketNotificationConfigurationOutput, error) {
	return &s.getBucketNotificationsResp, s.getBucketNotificationsErr
}

func (s *mockAwsAPI) CopyObject(context.Context, *s3.CopyObjectInput, ...func(*s3.Options)) (*s3.CopyObjectOutput, error) {
	return &s.copyObjectResp, s.err
}

func (s *mockAwsAPI) ListSubscriptionsByTopic(context.Context, *sns.ListSubscriptionsByTopicInput, ...func(*sns.Options)) (*sns.ListSubscriptionsByTopicOutput, error) {
	return &s.listSubscriptionsByTopicResp, s.listSubscriptionsByTopicErr
}

func (s *mockAwsAPI) Subscribe(context.Context, *sns.SubscribeInput, ...func(*sns.Options)) (*sns.SubscribeOutput, error) {
	return nil, s.subscribeErr
}

func (s *mockAwsAPI) GetObject(context.Context, *s3.GetObjectInput, ...func(*s3.Options)) (*s3.GetObjectOutput, error) {
	return &s.getObjectResp, s.err
}

func (s *mockAwsAPI) DeleteObject(context.Context, *s3.DeleteObjectInput, ...func(*s3.Options)) (*s3.DeleteObjectOutput, error) {
	return nil, s.err
}

func (s *mockAwsAPI) PutObject(context.Context, *s3.PutObjectInput, ...func(*s3.Options)) (*s3.PutObjectOutput, error) {
	return nil, s.putObjectErr
}

func (s *mockAwsAPI) MustMatchBucketNotificationInput(t *testing.T, want *s3.PutBucketNotificationConfigurationInput) {
	testutils.MustMatch(t, want, s.bucketNotificationConfigParam, "BucketNotificationConfigurationInput not equal")
}

func TestNewAWSClient(t *testing.T) {
	ctx := context.Background()
	tests := []struct {
		name         string
		partnerTopic string
		resultsTopic string
		region       string
		hasError     bool
	}{
		{
			name:         "happy path",
			partnerTopic: "test",
			resultsTopic: "test",
			region:       "us-east-1",
			hasError:     false,
		},
		{
			name:         "error missing partner topic",
			partnerTopic: "",
			resultsTopic: "test",
			region:       "us-east-1",
			hasError:     true,
		},
		{
			name:         "error missing results topic",
			partnerTopic: "test",
			resultsTopic: "",
			region:       "us-east-1",
			hasError:     true,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			client, err := NewAWSClient(ctx, test.partnerTopic, test.resultsTopic, awsConfig.ProviderOptions{
				Region: test.region,
			}, zap.NewNop().Sugar())
			if (err != nil) != test.hasError {
				t.Errorf("expeccted error:  %v, but got: %v", test.hasError, err)
			}
			if !test.hasError && client == nil {
				t.Error("aws client is nil, it should be not nil")
			}
		})
	}
}

func TestAwsClientBucketExists(t *testing.T) {
	ctx := context.Background()
	tests := []struct {
		name       string
		bucketName string
		mock       *mockAwsAPI

		expectedResp bool
	}{
		{
			name:       "happy path bucket exists",
			bucketName: testBucketName,
			mock: &mockAwsAPI{
				err: nil,
			},
			expectedResp: true,
		},
		{
			name:       "bucket does not exist",
			bucketName: testBucketName,
			mock: &mockAwsAPI{
				err: errInternalTest,
			},
			expectedResp: false,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			aws := &AwsClient{s3Client: test.mock, logger: zap.NewNop().Sugar()}
			exists := aws.BucketExists(ctx, test.bucketName)
			if exists != test.expectedResp {
				t.Errorf("got %v response, but expected response is %v", exists, test.expectedResp)
			}
		})
	}
}

func TestDeleteS3File(t *testing.T) {
	ctx := context.Background()
	objectKey := "testObjectKey"
	tests := []struct {
		name       string
		bucketName string
		objectKey  string
		mock       *mockAwsAPI

		hasError bool
	}{
		{
			name:       "delete file success",
			bucketName: testBucketName,
			objectKey:  objectKey,
			mock: &mockAwsAPI{
				err: nil,
			},
			hasError: false,
		},
		{
			name:       "delete file failure",
			bucketName: testBucketName,
			objectKey:  objectKey,
			mock: &mockAwsAPI{
				err: errInternalTest,
			},
			hasError: true,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			aws := &AwsClient{s3Client: test.mock, logger: zap.NewNop().Sugar()}
			err := aws.DeleteS3File(ctx, test.bucketName, test.objectKey)
			if (err != nil) != test.hasError {
				t.Errorf("got %v response, but expected response is %v", err, nil)
			}
		})
	}
}

func TestAwsClientPutBucketNotification(t *testing.T) {
	ctx := context.Background()
	otherTopic := "arn:aws:sns:us-east-1:000000000000:otherTopic"
	filterPrefixMultipleFolders := []string{"load", "import"}
	loadFolderExpected := "load/"
	importFolderExpected := "import/"
	tests := []struct {
		name       string
		bucketName string
		topicArn   string
		mock       *mockAwsAPI

		hasError bool
	}{
		{
			name:       "happy path, put notification new bucket",
			bucketName: testBucketName,
			topicArn:   testTopicARN,
			mock: &mockAwsAPI{
				err: nil,
			},
			hasError: false,
		},
		{
			name:       "happy path, put notification existing bucket",
			bucketName: testBucketName,
			topicArn:   testTopicARN,
			mock: &mockAwsAPI{
				err: nil,
				getBucketNotificationsResp: s3.GetBucketNotificationConfigurationOutput{
					TopicConfigurations: []types.TopicConfiguration{},
				},
			},
			hasError: false,
		},
		{
			name:       "happy path, existing notification",
			bucketName: testBucketName,
			topicArn:   testTopicARN,
			mock: &mockAwsAPI{
				err: nil,
				getBucketNotificationsResp: s3.GetBucketNotificationConfigurationOutput{
					TopicConfigurations: []types.TopicConfiguration{
						{
							TopicArn: proto.String(testTopicARN),
						},
					},
				},
			},
			hasError: false,
		},
		{
			name:       "error adding notification to new bucket",
			bucketName: testBucketName,
			topicArn:   testTopicARN,
			mock: &mockAwsAPI{
				err: errInternalTest,
			},
			hasError: true,
		},
		{
			name:       "error adding notification to existing bucket",
			bucketName: testBucketName,
			topicArn:   testTopicARN,
			mock: &mockAwsAPI{
				getBucketNotificationsResp: s3.GetBucketNotificationConfigurationOutput{
					TopicConfigurations: []types.TopicConfiguration{
						{
							TopicArn: &otherTopic,
						},
					},
				},
			},
			hasError: true,
		},
		{
			name:       "error getting notification on existing bucket",
			bucketName: testBucketName,
			topicArn:   testTopicARN,
			mock: &mockAwsAPI{
				getBucketNotificationsErr: errInternalTest,
			},
			hasError: true,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			aws := &AwsClient{s3Client: test.mock, partnerTopicArn: &test.topicArn, logger: zap.NewNop().Sugar()}
			err := aws.PutBucketNotification(ctx, test.bucketName, filterPrefixMultipleFolders)
			if (err != nil) != test.hasError {
				t.Errorf("expeccted error:  %v, but got: %v", test.hasError, err)
			}
			if test.mock.bucketNotificationConfigParam != nil {
				expectedBucketNotificationInput := &s3.PutBucketNotificationConfigurationInput{
					Bucket: &test.bucketName,
					NotificationConfiguration: &types.NotificationConfiguration{
						TopicConfigurations: []types.TopicConfiguration{
							{
								Events: []types.Event{
									"s3:ObjectCreated:*",
								},
								TopicArn: &test.topicArn,
								Filter: &types.NotificationConfigurationFilter{
									Key: &types.S3KeyFilter{
										FilterRules: []types.FilterRule{
											{
												Name:  types.FilterRuleNamePrefix,
												Value: &loadFolderExpected,
											},
										},
									},
								},
							},
							{
								Events: []types.Event{
									"s3:ObjectCreated:*",
								},
								TopicArn: &test.topicArn,
								Filter: &types.NotificationConfigurationFilter{
									Key: &types.S3KeyFilter{
										FilterRules: []types.FilterRule{
											{
												Name:  types.FilterRuleNamePrefix,
												Value: &importFolderExpected,
											},
										},
									},
								},
							},
						},
					},
				}
				test.mock.MustMatchBucketNotificationInput(t, expectedBucketNotificationInput)
			}
		})
	}
}

func TestAwsClientCopyFile(t *testing.T) {
	ctx := context.Background()
	copySource := "testSource"
	destBucket := "testDest"
	destKey := "testDestKey"
	tests := []struct {
		name string
		mock *mockAwsAPI

		hasError bool
	}{
		{
			name: "Copy Object success",
			mock: &mockAwsAPI{
				err: nil,
			},
			hasError: false,
		},
		{
			name: "Copy Object failure",
			mock: &mockAwsAPI{
				err: errInternalTest,
			},
			hasError: true,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			aws := &AwsClient{s3Client: test.mock, logger: zap.NewNop().Sugar()}
			err := aws.CopyFile(ctx, copySource, destBucket, destKey)
			if (err != nil) != test.hasError {
				t.Errorf("expected error:  %v, but got: %v", test.hasError, err)
			}
		})
	}
}

func TestAwsClientSubscribePartnerTopic(t *testing.T) {
	ctx := context.Background()

	tests := []struct {
		name string
		mock *mockAwsAPI

		hasError bool
	}{
		{
			name: "happy path subscribe, without error",
			mock: &mockAwsAPI{
				listSubscriptionsByTopicResp: sns.ListSubscriptionsByTopicOutput{
					NextToken:      nil,
					Subscriptions:  nil,
					ResultMetadata: middleware.Metadata{},
				},
			},
			hasError: false,
		},
		{
			name: "happy path subscribe, it already exists",
			mock: &mockAwsAPI{
				listSubscriptionsByTopicResp: sns.ListSubscriptionsByTopicOutput{
					NextToken: nil,
					Subscriptions: []snsTypes.Subscription{
						{
							Endpoint: &endpoint,
							Protocol: &protocol,
						},
					},
				},
			},
			hasError: false,
		},
		{
			name: "happy path subscribe, subscription not exists",
			mock: &mockAwsAPI{
				listSubscriptionsByTopicResp: sns.ListSubscriptionsByTopicOutput{
					NextToken: nil,
					Subscriptions: []snsTypes.Subscription{
						{
							Endpoint: &otherEndpoint,
							Protocol: &protocol,
						},
					},
				},
			},
			hasError: false,
		},
		{
			name: "error fetching existing subscriptions, apply subscription",
			mock: &mockAwsAPI{
				listSubscriptionsByTopicErr: errInternalTest,
			},
			hasError: true,
		},
		{
			name: "error subscribing topic",
			mock: &mockAwsAPI{
				subscribeErr: errInternalTest,
			},
			hasError: true,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			aws := &AwsClient{snsClient: test.mock, partnerTopicArn: proto.String(testTopicARN), logger: zap.NewNop().Sugar()}
			err := aws.SubscribePartnerTopic(ctx, protocol, endpoint)
			if (err != nil) != test.hasError {
				t.Errorf("expeccted error:  %v, but got: %v", test.hasError, err)
			}
		})
	}
}

func TestAwsClientSubscribeResultsTopic(t *testing.T) {
	ctx := context.Background()

	tests := []struct {
		name string
		mock *mockAwsAPI

		hasError bool
	}{
		{
			name: "happy path subscribe without error",
			mock: &mockAwsAPI{
				listSubscriptionsByTopicResp: sns.ListSubscriptionsByTopicOutput{
					NextToken:      nil,
					Subscriptions:  nil,
					ResultMetadata: middleware.Metadata{},
				},
			},
			hasError: false,
		},
		{
			name: "happy path subscribe it already exists",
			mock: &mockAwsAPI{
				listSubscriptionsByTopicResp: sns.ListSubscriptionsByTopicOutput{
					NextToken: nil,
					Subscriptions: []snsTypes.Subscription{
						{
							Endpoint: &endpoint,
							Protocol: &protocol,
						},
					},
				},
			},
			hasError: false,
		},
		{
			name: "happy path subscribe subscription not exists",
			mock: &mockAwsAPI{
				listSubscriptionsByTopicResp: sns.ListSubscriptionsByTopicOutput{
					NextToken: nil,
					Subscriptions: []snsTypes.Subscription{
						{
							Endpoint: &otherEndpoint,
							Protocol: &protocol,
						},
					},
				},
			},
			hasError: false,
		},
		{
			name: "error fetching existing subscriptions apply subscription",
			mock: &mockAwsAPI{
				listSubscriptionsByTopicErr: errInternalTest,
			},
			hasError: true,
		},
		{
			name: "error subscribing topic",
			mock: &mockAwsAPI{
				subscribeErr: errInternalTest,
			},
			hasError: true,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			aws := &AwsClient{snsClient: test.mock, resultsTopicArn: proto.String(testTopicARN), logger: zap.NewNop().Sugar()}
			err := aws.SubscribeResultsTopic(ctx, protocol, endpoint)
			if (err != nil) != test.hasError {
				t.Errorf("expeccted error:  %v, but got: %v", test.hasError, err)
			}
		})
	}
}

func TestAwsClientGetS3File(t *testing.T) {
	ctx := context.Background()
	bucketName := "testBucket"
	objectKey := "testKey"
	expectedContent := "Test"
	tests := []struct {
		name string
		mock *mockAwsAPI

		hasError     bool
		expectedResp string
	}{
		{
			name: "Get Object success",
			mock: &mockAwsAPI{
				getObjectResp: s3.GetObjectOutput{
					Body: io.NopCloser(strings.NewReader(expectedContent)),
				},
				err: nil,
			},
			hasError:     false,
			expectedResp: expectedContent,
		},
		{
			name: "Get Object failure",
			mock: &mockAwsAPI{
				err: errInternalTest,
			},
			hasError: true,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			aws := &AwsClient{s3Client: test.mock, logger: zap.NewNop().Sugar()}
			resp, err := aws.GetS3File(ctx, bucketName, objectKey)
			if (err != nil) != test.hasError {
				t.Errorf("expected error:  %v, but got: %v", test.hasError, err)
			}
			if test.hasError {
				return
			}
			defer resp.Close()
			buff := make([]byte, len(test.expectedResp))
			if _, err = resp.Read(buff); err != nil {
				t.Fatal("error reading response body")
			}
			if string(buff) != test.expectedResp {
				t.Errorf("expected %v, but got %v", test.expectedResp, string(buff))
			}
		})
	}
}

func TestAddS3File(t *testing.T) {
	ctx := context.Background()
	bucketName := "testBucketName"
	objectKey := "testObjectKey"
	tests := []struct {
		name       string
		awsService *mockAwsAPI
		bucketName string
		objectKey  string
		file       []byte

		hasError bool
	}{
		{
			name: "add file successfully",
			awsService: &mockAwsAPI{
				putObjectErr: nil,
			},
			bucketName: bucketName,
			objectKey:  objectKey,
			file:       []byte(`This is a test file.`),
			hasError:   false,
		},
		{
			name: "add file failure",
			awsService: &mockAwsAPI{
				putObjectErr: errInternalTest,
			},
			bucketName: bucketName,
			objectKey:  objectKey,
			file:       []byte(`This is a test failure file.`),
			hasError:   true,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			aws := &AwsClient{s3Client: test.awsService, logger: zap.NewNop().Sugar()}
			err := aws.AddS3File(ctx, test.bucketName, test.objectKey, test.file)
			if (err != nil) != test.hasError {
				t.Fatal(err)
			}
		})
	}
}
