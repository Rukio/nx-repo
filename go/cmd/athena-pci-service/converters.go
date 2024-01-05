package main

import (
	"github.com/*company-data-covered*/services/go/pkg/athena/converters"
	athenapcipb "github.com/*company-data-covered*/services/go/pkg/generated/proto/athena_pci"
)

func paymentProtoToAthena(request *athenapcipb.CreatePatientPaymentRequest) *converters.PatientPaymentInformation {
	if request == nil {
		return nil
	}

	return &converters.PatientPaymentInformation{
		AccountNumber:   request.AccountNumber,
		BillingAddress:  request.BillingAddress,
		BillingZip:      request.BillingZip,
		CVV:             request.Cvv,
		ExpirationMonth: request.ExpirationMonth,
		ExpirationYear:  request.ExpirationYear,
		NameOnCard:      request.NameOnCard,
		Amount:          request.Amount,
		DepartmentID:    request.DepartmentId,
	}
}

func paymentResponseAthenaToProto(response *converters.PatientPaymentResponse) *athenapcipb.CreatePatientPaymentResponse {
	if response == nil {
		return nil
	}

	return &athenapcipb.CreatePatientPaymentResponse{
		PaymentId: response.PaymentID,
		Success:   response.Success,
		ErrorText: response.ErrorText,
	}
}

func creditCardAthenaToProto(athenaCreditCard *converters.GetStoredCreditCardResponse) *athenapcipb.CreditCard {
	if athenaCreditCard == nil {
		return nil
	}

	return &athenapcipb.CreditCard{
		Id:                   athenaCreditCard.StoredCardID,
		Status:               athenaCreditCard.Status,
		CardType:             athenaCreditCard.CardType,
		BillingZip:           athenaCreditCard.BillingZip,
		BillingCity:          athenaCreditCard.BillingCity,
		BillingState:         athenaCreditCard.BillingState,
		IsPreferredCard:      athenaCreditCard.PreferredCard,
		BillingAddress:       athenaCreditCard.BillingAddress,
		ExpirationMonthYear:  athenaCreditCard.CardExpirationMonthYear,
		NumberLastFourDigits: athenaCreditCard.CardNumberLastFourDigits,
	}
}

func createCreditCardProtoToAthena(request *athenapcipb.CreatePatientCreditCardRequest) *converters.AthenaCreditCardInformation {
	if request == nil {
		return nil
	}

	return &converters.AthenaCreditCardInformation{
		AccountNumber:   request.AccountNumber,
		BillingAddress:  request.BillingAddress,
		BillingZip:      request.BillingZip,
		CVV:             request.Cvv,
		ExpirationMonth: request.ExpirationMonth,
		ExpirationYear:  request.ExpirationYear,
		NameOnCard:      request.NameOnCard,
		DepartmentID:    request.DepartmentId,
	}
}

func createCreditCardResponseAthenaToProto(response *converters.UploadPatientCreditCardResponse) *athenapcipb.CreatePatientCreditCardResponse {
	if response == nil {
		return nil
	}

	return &athenapcipb.CreatePatientCreditCardResponse{
		StoredCardId: response.StoredCardID,
		ErrorText:    response.ErrorText,
		Success:      response.Success,
		PaymentId:    response.PaymentID,
	}
}
