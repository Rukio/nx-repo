package slack

import (
	"context"
	"errors"
	"testing"

	"github.com/*company-data-covered*/services/go/pkg/baselogger"
	slackpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/slack"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
)

func TestPostMessage(t *testing.T) {
	tcs := []struct {
		desc     string
		input    *slackpb.PostMessageRequest
		slackAPI slackAPI

		want     *slackpb.PostMessageResponse
		hasError bool
	}{
		{
			desc: "should work without errors",
			input: &slackpb.PostMessageRequest{
				Message: "some notification",
				Email:   "user@example.com",
			},
			slackAPI: &mockSlackAPI{UserID: "user ID"},

			want: &slackpb.PostMessageResponse{},
		},
		{
			desc: "should return error for empty message",
			input: &slackpb.PostMessageRequest{
				Message: "",
				Email:   "user@example.com",
			},
			slackAPI: &mockSlackAPI{UserID: "user ID"},

			want:     nil,
			hasError: true,
		},
		{
			desc: "should return error for empty email",
			input: &slackpb.PostMessageRequest{
				Message: "some notification",
				Email:   "",
			},
			slackAPI: &mockSlackAPI{UserID: "user ID"},

			want:     nil,
			hasError: true,
		},
		{
			desc: "should return error if GetUserIDByEmail fails",
			input: &slackpb.PostMessageRequest{
				Message: "some notification",
				Email:   "user@example.com",
			},
			slackAPI: &mockSlackAPI{GetUserIDByEmailErr: errors.New("slack error")},

			want:     nil,
			hasError: true,
		},
		{
			desc: "should return error if PostMessage fails",
			input: &slackpb.PostMessageRequest{
				Message: "some notification",
				Email:   "user@example.com",
			},
			slackAPI: &mockSlackAPI{PostMessageErr: errors.New("slack error")},

			want:     nil,
			hasError: true,
		},
		{
			desc: "should return error for PostMessage with internal error",
			input: &slackpb.PostMessageRequest{
				Message: "some notification",
				Email:   "user@example.com",
			},
			slackAPI: &mockSlackAPI{
				UserID:         "user ID",
				PostMessageErr: errors.New("internal error"),
			},

			want:     nil,
			hasError: true,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			s := GRPCServer{
				Logger:      baselogger.NewSugaredLogger(baselogger.LoggerOptions{}),
				SlackClient: &client{clientAPI: tc.slackAPI},
			}
			response, err := s.PostMessage(context.Background(), tc.input)
			if tc.hasError != (err != nil) {
				t.Fatal(err)
			}
			testutils.MustMatch(t, response, tc.want)
		})
	}
}
