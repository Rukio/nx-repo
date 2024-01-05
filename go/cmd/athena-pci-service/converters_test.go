package main

import (
	"testing"

	"github.com/*company-data-covered*/services/go/pkg/athena/converters"
	athenapcipb "github.com/*company-data-covered*/services/go/pkg/generated/proto/athena_pci"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"google.golang.org/protobuf/proto"
)

var (
	athenaPatientID         = "312"
	accountNumber           = "12345"
	billingAddress          = "test billing address"
	billingZip              = "test billing zip"
	billingCity             = "NYC"
	billingState            = "NY"
	nameOnCard              = "test name on card"
	amount                  = "0.19"
	cardType                = "primary"
	storedCardID            = "98475"
	preferredCard           = "true"
	expirationMonthYear     = "05-2030"
	lastFourDigits          = "7767"
	cvv                     = proto.Int64(12345)
	departmentID            = proto.Int64(76543)
	expirationMonth         = proto.Int64(11)
	expirationYear          = proto.Int64(2099)
	paymentID               = "100023"
	successFalse            = "false"
	successTrue             = "true"
	errorTextNotEnoughFunds = "not enough funds"
)

func TestPaymentProtoToAthena(t *testing.T) {
	tcs := []struct {
		description  string
		paymentProto *athenapcipb.CreatePatientPaymentRequest

		want *converters.PatientPaymentInformation
	}{
		{
			description: "success - base case",
			paymentProto: &athenapcipb.CreatePatientPaymentRequest{
				AthenaPatientId: athenaPatientID,
				AccountNumber:   &accountNumber,
				BillingAddress:  &billingAddress,
				BillingZip:      &billingZip,
				Cvv:             cvv,
				ExpirationMonth: expirationMonth,
				ExpirationYear:  expirationYear,
				NameOnCard:      &nameOnCard,
				Amount:          &amount,
				DepartmentId:    departmentID,
			},

			want: &converters.PatientPaymentInformation{
				AccountNumber:   &accountNumber,
				BillingAddress:  &billingAddress,
				BillingZip:      &billingZip,
				CVV:             cvv,
				ExpirationMonth: expirationMonth,
				ExpirationYear:  expirationYear,
				NameOnCard:      &nameOnCard,
				Amount:          &amount,
				DepartmentID:    departmentID,
			},
		},
		{
			description: "success - empty",
			paymentProto: &athenapcipb.CreatePatientPaymentRequest{
				AthenaPatientId: athenaPatientID,
			},

			want: &converters.PatientPaymentInformation{},
		},
		{
			description:  "success - receiving request as nil",
			paymentProto: nil,

			want: nil,
		},
	}
	for _, tc := range tcs {
		t.Run(tc.description, func(t *testing.T) {
			testutils.MustMatch(t, tc.want, paymentProtoToAthena(tc.paymentProto))
		})
	}
}

func TestPaymentResponseAthenaToProto(t *testing.T) {
	tcs := []struct {
		description     string
		paymentResponse *converters.PatientPaymentResponse

		want *athenapcipb.CreatePatientPaymentResponse
	}{
		{
			description: "success - successful payment",
			paymentResponse: &converters.PatientPaymentResponse{
				PaymentID: &paymentID,
				Success:   &successTrue,
				ErrorText: nil,
			},

			want: &athenapcipb.CreatePatientPaymentResponse{
				PaymentId: &paymentID,
				Success:   &successTrue,
				ErrorText: nil,
			},
		},
		{
			description: "success - failed payment",
			paymentResponse: &converters.PatientPaymentResponse{
				PaymentID: &paymentID,
				Success:   &successFalse,
				ErrorText: &errorTextNotEnoughFunds,
			},

			want: &athenapcipb.CreatePatientPaymentResponse{
				PaymentId: &paymentID,
				Success:   &successFalse,
				ErrorText: &errorTextNotEnoughFunds,
			},
		},
		{
			description:     "success - empty response payment",
			paymentResponse: &converters.PatientPaymentResponse{},

			want: &athenapcipb.CreatePatientPaymentResponse{},
		},
		{
			description:     "success - receiving request as nil",
			paymentResponse: nil,

			want: nil,
		},
	}
	for _, tc := range tcs {
		t.Run(tc.description, func(t *testing.T) {
			testutils.MustMatch(t, tc.want, paymentResponseAthenaToProto(tc.paymentResponse))
		})
	}
}

func TestCreditCardAthenaToProto(t *testing.T) {
	tests := []struct {
		description      string
		athenaCreditCard *converters.GetStoredCreditCardResponse

		want *athenapcipb.CreditCard
	}{
		{
			description: "success - base case",
			athenaCreditCard: &converters.GetStoredCreditCardResponse{
				CardType:                 cardType,
				BillingZip:               billingZip,
				BillingCity:              billingCity,
				BillingState:             billingState,
				BillingAddress:           billingAddress,
				StoredCardID:             storedCardID,
				PreferredCard:            preferredCard,
				CardExpirationMonthYear:  expirationMonthYear,
				CardNumberLastFourDigits: lastFourDigits,
			},

			want: &athenapcipb.CreditCard{
				CardType:             cardType,
				BillingZip:           billingZip,
				BillingCity:          billingCity,
				BillingState:         billingState,
				BillingAddress:       billingAddress,
				Id:                   storedCardID,
				IsPreferredCard:      preferredCard,
				ExpirationMonthYear:  expirationMonthYear,
				NumberLastFourDigits: lastFourDigits,
			},
		},
		{
			description:      "success - response with empty fields",
			athenaCreditCard: &converters.GetStoredCreditCardResponse{},

			want: &athenapcipb.CreditCard{},
		},
		{
			description:      "success - receiving cc as nil",
			athenaCreditCard: nil,

			want: nil,
		},
	}
	for _, tt := range tests {
		t.Run(tt.description, func(t *testing.T) {
			testutils.MustMatch(t, tt.want, creditCardAthenaToProto(tt.athenaCreditCard))
		})
	}
}

func TestCreateCreditCardProtoToAthena(t *testing.T) {
	tests := []struct {
		description      string
		athenaCreditCard *athenapcipb.CreatePatientCreditCardRequest

		want *converters.AthenaCreditCardInformation
	}{
		{
			description: "success - base case",
			athenaCreditCard: &athenapcipb.CreatePatientCreditCardRequest{
				AthenaPatientId: athenaPatientID,
				DepartmentId:    departmentID,
				AccountNumber:   &accountNumber,
				BillingAddress:  &billingAddress,
				BillingZip:      &billingZip,
				Cvv:             cvv,
				ExpirationMonth: expirationMonth,
				ExpirationYear:  expirationYear,
				NameOnCard:      &nameOnCard,
			},

			want: &converters.AthenaCreditCardInformation{
				AccountNumber:   &accountNumber,
				BillingAddress:  &billingAddress,
				BillingZip:      &billingZip,
				CVV:             cvv,
				ExpirationMonth: expirationMonth,
				ExpirationYear:  expirationYear,
				NameOnCard:      &nameOnCard,
				DepartmentID:    departmentID,
			},
		},
		{
			description:      "success - response with empty fields",
			athenaCreditCard: &athenapcipb.CreatePatientCreditCardRequest{},

			want: &converters.AthenaCreditCardInformation{},
		},
		{
			description:      "success - receiving cc as nil",
			athenaCreditCard: nil,

			want: nil,
		},
	}
	for _, tt := range tests {
		t.Run(tt.description, func(t *testing.T) {
			testutils.MustMatch(t, tt.want, createCreditCardProtoToAthena(tt.athenaCreditCard))
		})
	}
}

func TestCreateCreditCardResponseAthenaToProto(t *testing.T) {
	tcs := []struct {
		description    string
		createResponse *converters.UploadPatientCreditCardResponse

		want *athenapcipb.CreatePatientCreditCardResponse
	}{
		{
			description: "success - successful payment",
			createResponse: &converters.UploadPatientCreditCardResponse{
				PaymentID: &paymentID,
				Success:   &successTrue,
				ErrorText: nil,
			},

			want: &athenapcipb.CreatePatientCreditCardResponse{
				PaymentId: &paymentID,
				Success:   &successTrue,
				ErrorText: nil,
			},
		},
		{
			description: "success - failed payment",
			createResponse: &converters.UploadPatientCreditCardResponse{
				PaymentID: &paymentID,
				Success:   &successFalse,
				ErrorText: &errorTextNotEnoughFunds,
			},

			want: &athenapcipb.CreatePatientCreditCardResponse{
				PaymentId: &paymentID,
				Success:   &successFalse,
				ErrorText: &errorTextNotEnoughFunds,
			},
		},
		{
			description:    "success - empty response payment",
			createResponse: &converters.UploadPatientCreditCardResponse{},

			want: &athenapcipb.CreatePatientCreditCardResponse{},
		},
		{
			description:    "success - receiving request as nil",
			createResponse: nil,

			want: nil,
		},
	}
	for _, tc := range tcs {
		t.Run(tc.description, func(t *testing.T) {
			testutils.MustMatch(t, tc.want, createCreditCardResponseAthenaToProto(tc.createResponse))
		})
	}
}
