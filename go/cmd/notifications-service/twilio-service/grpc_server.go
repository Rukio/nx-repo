package twilio

import (
	"context"
	"regexp"
	"strconv"

	twiliopb "github.com/*company-data-covered*/services/go/pkg/generated/proto/twilio"
	"go.uber.org/zap"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

const (
	numberFormatRegExpRule = "[^0-9]+"
)

type GRPCServer struct {
	twiliopb.TwilioServiceServer
	Logger       *zap.SugaredLogger
	TwilioClient Client
}

func (s *GRPCServer) SendSMS(ctx context.Context, req *twiliopb.SendSMSRequest) (*twiliopb.SendSMSResponse, error) {
	s.Logger.Debug("SendSMS was called.")

	if req.Message == "" {
		return nil, status.Error(codes.InvalidArgument, "Message is not defined")
	}
	if req.PhoneNumber.GetPhoneNumber() == "" {
		return nil, status.Error(codes.InvalidArgument, "Phone number is not defined")
	}

	fullNumber := req.PhoneNumber.GetPhoneNumber()
	if req.PhoneNumber.GetCountryCode() != 0 {
		countryCode := strconv.FormatInt(int64(req.PhoneNumber.GetCountryCode()), 10)
		fullNumber = countryCode + fullNumber
	}
	numberFormatRegExp := regexp.MustCompile(numberFormatRegExpRule)
	fullFormattedNumber := numberFormatRegExp.ReplaceAllString(fullNumber, "")

	resp, err := s.TwilioClient.CreateMessage(fullFormattedNumber, req.Message)
	if err != nil {
		s.Logger.Errorf("Failed to send SMS message: %v, to number: *****%s", err, fullFormattedNumber[len(fullFormattedNumber)-4:])
		return nil, err
	}

	s.Logger.Debug("Sent SMS message", "phone number: *****", fullFormattedNumber[len(fullFormattedNumber)-4:], "message SID", resp.Sid, "account SID", resp.AccountSid)

	return &twiliopb.SendSMSResponse{}, nil
}
