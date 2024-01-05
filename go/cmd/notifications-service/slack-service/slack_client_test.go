package slack

import (
	"errors"
	"testing"

	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"github.com/slack-go/slack"
)

type mockSlackAPI struct {
	UserID              string
	GetUserIDByEmailErr error
	PostMessageErr      error
	AuthTestErr         error
}

func (sc *mockSlackAPI) GetUserByEmail(_ string) (*slack.User, error) {
	if sc.UserID == "" {
		return nil, sc.GetUserIDByEmailErr
	}
	return &slack.User{ID: sc.UserID}, sc.GetUserIDByEmailErr
}

func (sc *mockSlackAPI) PostMessage(_ string, _ ...slack.MsgOption) (string, string, error) {
	return "", "", sc.PostMessageErr
}

func (sc *mockSlackAPI) AuthTest() (*slack.AuthTestResponse, error) {
	return nil, sc.AuthTestErr
}

func TestGetUserIDByEmail(t *testing.T) {
	tcs := []struct {
		desc     string
		email    string
		slackAPI slackAPI

		output   string
		hasError bool
	}{
		{
			desc:     "works",
			email:    "some@email.com",
			slackAPI: &mockSlackAPI{UserID: "user ID"},

			output:   "user ID",
			hasError: false,
		},
		{
			desc:     "should return slack error",
			email:    "some@email.com",
			slackAPI: &mockSlackAPI{GetUserIDByEmailErr: errors.New("slack error")},

			output:   "",
			hasError: true,
		},
		{
			desc:     "should return error if slack user is nil",
			email:    "some@email.com",
			slackAPI: &mockSlackAPI{},

			output:   "",
			hasError: true,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			sw := &client{clientAPI: tc.slackAPI}
			response, err := sw.GetUserIDByEmail(tc.email)
			if tc.hasError != (err != nil) {
				t.Fatal(err)
			}
			testutils.MustMatch(t, response, tc.output, "did not receive expected output")
		})
	}
}

func TestPostMessage_SlackClient(t *testing.T) {
	tcs := []struct {
		desc     string
		userID   string
		message  string
		slackAPI slackAPI

		output   *string
		hasError bool
	}{
		{
			desc:     "works",
			userID:   "some_user_id",
			message:  "some info message",
			slackAPI: &mockSlackAPI{},

			hasError: false,
		},
		{
			desc:     "should return slack error",
			userID:   "some_user_id",
			message:  "some info message",
			slackAPI: &mockSlackAPI{PostMessageErr: errors.New("slack error")},

			hasError: true,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			sw := &client{clientAPI: tc.slackAPI}
			err := sw.PostMessage(tc.userID, tc.message)
			if tc.hasError != (err != nil) {
				t.Fatal(err)
			}
		})
	}
}

func TestAuthTest(t *testing.T) {
	tcs := []struct {
		desc     string
		slackAPI slackAPI

		hasError bool
	}{
		{
			desc:     "works",
			slackAPI: &mockSlackAPI{},

			hasError: false,
		},
		{
			desc:     "should return slack error",
			slackAPI: &mockSlackAPI{AuthTestErr: errors.New("slack error")},

			hasError: true,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			sw := &client{clientAPI: tc.slackAPI}
			err := sw.AuthTest()
			if tc.hasError != (err != nil) {
				t.Fatal(err)
			}
		})
	}
}
