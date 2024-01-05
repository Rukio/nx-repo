package slack

import (
	"errors"
	"fmt"

	"github.com/slack-go/slack"
)

type slackAPI interface {
	GetUserByEmail(email string) (*slack.User, error)
	PostMessage(string, ...slack.MsgOption) (string, string, error)
	AuthTest() (*slack.AuthTestResponse, error)
}

type Client interface {
	GetUserIDByEmail(email string) (string, error)
	PostMessage(userID string, message string) error
	AuthTest() error
}

type client struct {
	clientAPI slackAPI
}

func NewSlackClient(slackBotToken string) (Client, error) {
	if slackBotToken == "" {
		return nil, errors.New("slack bot token is not set")
	}

	return &client{clientAPI: slack.New(slackBotToken)}, nil
}

func (sc *client) GetUserIDByEmail(email string) (string, error) {
	user, err := sc.clientAPI.GetUserByEmail(email)
	if err != nil {
		return "", err
	}
	if user == nil {
		return "", fmt.Errorf("slack user with email: %s was not found", email)
	}
	return user.ID, nil
}

func (sc *client) PostMessage(userID string, message string) error {
	_, _, err := sc.clientAPI.PostMessage(userID, slack.MsgOptionText(message, false))
	return err
}

func (sc *client) AuthTest() error {
	_, err := sc.clientAPI.AuthTest()
	return err
}
