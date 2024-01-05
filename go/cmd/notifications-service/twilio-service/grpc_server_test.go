package twilio

import (
	"context"
	"errors"
	"testing"

	"github.com/*company-data-covered*/services/go/pkg/baselogger"
	commonpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
	twiliopb "github.com/*company-data-covered*/services/go/pkg/generated/proto/twilio"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"google.golang.org/protobuf/proto"
)

func TestSendSMS(t *testing.T) {
	tcs := []struct {
		desc      string
		input     *twiliopb.SendSMSRequest
		twilioAPI twilioAPI

		want      *twiliopb.SendSMSResponse
		wantError bool
	}{
		{
			desc: "should work without errors",
			input: &twiliopb.SendSMSRequest{
				Message: "some notification",
				PhoneNumber: &commonpb.PhoneNumber{
					PhoneNumberType: commonpb.PhoneNumber_PHONE_NUMBER_TYPE_MOBILE,
					CountryCode:     proto.Int32(1),
					PhoneNumber:     proto.String("(555) 067-6888"),
				},
			},
			twilioAPI: &mockTwilioAPI{},

			want: &twiliopb.SendSMSResponse{},
		},
		{
			desc: "should return error for empty message",
			input: &twiliopb.SendSMSRequest{
				Message: "",
				PhoneNumber: &commonpb.PhoneNumber{
					PhoneNumberType: commonpb.PhoneNumber_PHONE_NUMBER_TYPE_MOBILE,
					CountryCode:     proto.Int32(1),
					PhoneNumber:     proto.String("(555) 067-6888"),
				},
			},
			twilioAPI: &mockTwilioAPI{},

			want:      nil,
			wantError: true,
		},
		{
			desc: "should return error for empty phone number",
			input: &twiliopb.SendSMSRequest{
				Message: "some notification",
				PhoneNumber: &commonpb.PhoneNumber{
					PhoneNumberType: commonpb.PhoneNumber_PHONE_NUMBER_TYPE_MOBILE,
					CountryCode:     proto.Int32(1),
					PhoneNumber:     proto.String(""),
				},
			},
			twilioAPI: &mockTwilioAPI{},

			want:      nil,
			wantError: true,
		},
		{
			desc: "should return error if CreateMessage fails",
			input: &twiliopb.SendSMSRequest{
				Message: "some notification",
				PhoneNumber: &commonpb.PhoneNumber{
					PhoneNumberType: commonpb.PhoneNumber_PHONE_NUMBER_TYPE_MOBILE,
					CountryCode:     proto.Int32(1),
					PhoneNumber:     proto.String("(555) 067-6888"),
				},
			},
			twilioAPI: &mockTwilioAPI{CreateMessageErr: errors.New("twilio error")},

			want:      nil,
			wantError: true,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			s := GRPCServer{
				Logger:       baselogger.NewSugaredLogger(baselogger.LoggerOptions{}),
				TwilioClient: &client{api: tc.twilioAPI},
			}
			response, err := s.SendSMS(context.Background(), tc.input)
			if tc.wantError != (err != nil) {
				t.Fatal(err)
			}
			testutils.MustMatch(t, response, tc.want)
		})
	}
}
