package twilio

import (
	"errors"

	"github.com/twilio/twilio-go"
	api "github.com/twilio/twilio-go/rest/api/v2010"
)

type twilioAPI interface {
	CreateMessage(params *api.CreateMessageParams) (*api.ApiV2010Message, error)
}

type Client interface {
	CreateMessage(phoneNumber string, message string) (*api.ApiV2010Message, error)
}

type client struct {
	api        twilioAPI
	fromNumber string
}

func NewTwilioClient(accountSID string, apiKey string, apiSecret string, fromNumber string) (Client, error) {
	if accountSID == "" {
		return nil, errors.New("twilio account SID is not set")
	}
	if apiKey == "" {
		return nil, errors.New("twilio API key is not set")
	}

	if apiSecret == "" {
		return nil, errors.New("twilio API secret is not set")
	}

	if fromNumber == "" {
		return nil, errors.New("from number is not set")
	}

	restClient := twilio.NewRestClientWithParams(
		twilio.ClientParams{
			Username:   apiKey,
			Password:   apiSecret,
			AccountSid: accountSID,
		},
	)

	return &client{
		api:        restClient.Api,
		fromNumber: fromNumber,
	}, nil
}

func (sc *client) CreateMessage(phoneNumber string, message string) (*api.ApiV2010Message, error) {
	params := &api.CreateMessageParams{}

	params.SetTo(phoneNumber)
	params.SetFrom(sc.fromNumber)
	params.SetBody(message)

	resp, err := sc.api.CreateMessage(params)

	return resp, err
}
