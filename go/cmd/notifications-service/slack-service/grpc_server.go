package slack

import (
	"context"

	slackpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/slack"
	"go.uber.org/zap"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type GRPCServer struct {
	slackpb.SlackServiceServer
	Logger      *zap.SugaredLogger
	SlackClient Client
}

func (s *GRPCServer) PostMessage(ctx context.Context, req *slackpb.PostMessageRequest) (*slackpb.PostMessageResponse, error) {
	if req.Message == "" {
		return nil, status.Error(codes.InvalidArgument, "Message is not defined")
	}
	if req.Email == "" {
		return nil, status.Error(codes.InvalidArgument, "Email is not defined")
	}

	userID, err := s.SlackClient.GetUserIDByEmail(req.Email)
	if err != nil {
		// TODO: use InvalidArgument status code in case there is no user with specified email
		return nil, status.Error(codes.Internal, err.Error())
	}

	err = s.SlackClient.PostMessage(userID, req.Message)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	return &slackpb.PostMessageResponse{}, nil
}
