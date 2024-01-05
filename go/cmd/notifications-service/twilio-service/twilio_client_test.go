package twilio

import (
	"errors"
	"testing"

	api "github.com/twilio/twilio-go/rest/api/v2010"
)

type mockTwilioAPI struct {
	CreateMessageErr error
}

func (tc *mockTwilioAPI) CreateMessage(params *api.CreateMessageParams) (*api.ApiV2010Message, error) {
	return &api.ApiV2010Message{}, tc.CreateMessageErr
}

func TestCreateMessage_TwilioClient(t *testing.T) {
	tcs := []struct {
		Desc        string
		PhoneNumber string
		Message     string
		TwilioAPI   twilioAPI

		Output   *string
		HasError bool
	}{
		{
			Desc:        "works",
			PhoneNumber: "some_phone_number",
			Message:     "some info message",
			TwilioAPI:   &mockTwilioAPI{},

			HasError: false,
		},
		{
			Desc:        "should return twilio error",
			PhoneNumber: "some_phone_number",
			Message:     "some info message",
			TwilioAPI:   &mockTwilioAPI{CreateMessageErr: errors.New("twilio error")},

			HasError: true,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			sw := client{api: tc.TwilioAPI}
			_, err := sw.CreateMessage(tc.PhoneNumber, tc.Message)
			if tc.HasError != (err != nil) {
				t.Fatal(err)
			}
		})
	}
}

func TestNewTwilioClient(t *testing.T) {
	tcs := []struct {
		Desc       string
		AccountSid string
		APIKey     string
		APISecret  string
		FromNumber string

		HasError bool
	}{
		{
			Desc:       "works",
			AccountSid: "ACCOUNT_SID",
			APIKey:     "API_KEY",
			APISecret:  "API_SECRET",
			FromNumber: "FROM_NUMBER",

			HasError: false,
		},
		{
			Desc:       "should return an error if Account Sid is empty",
			AccountSid: "",
			APIKey:     "API_KEY",
			APISecret:  "API_SECRET",
			FromNumber: "FROM_NUMBER",

			HasError: true,
		},
		{
			Desc:       "should return an error if Api Key is empty",
			AccountSid: "ACCOUNT_SID",
			APIKey:     "",
			APISecret:  "API_SECRET",
			FromNumber: "FROM_NUMBER",

			HasError: true,
		},
		{
			Desc:       "should return an error if Api Secret is empty",
			AccountSid: "ACCOUNT_SID",
			APIKey:     "API_KEY",
			APISecret:  "",
			FromNumber: "FROM_NUMBER",

			HasError: true,
		},
		{
			Desc:       "should return an error if From Number is empty",
			AccountSid: "ACCOUNT_SID",
			APIKey:     "API_KEY",
			APISecret:  "API_SECRET",
			FromNumber: "",

			HasError: true,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			_, err := NewTwilioClient(tc.AccountSid, tc.APIKey, tc.APISecret, tc.FromNumber)
			if tc.HasError != (err != nil) {
				t.Fatal(err)
			}
		})
	}
}
