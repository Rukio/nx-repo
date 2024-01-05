// Package sns follows aws documentation to verify signature, since aws go sdk doesn't have this logic.
// aws documentation https://docs.aws.amazon.com/sns/latest/dg/sns-verify-signature-of-message.html
package sns

import (
	"bytes"
	"context"
	"crypto/x509"
	"encoding/base64"
	"encoding/json"
	"encoding/pem"
	"errors"
	"io"
	"net/http"
	"reflect"
)

const (
	subscriptionConfirmation = "SubscriptionConfirmation"
	signatureVersion2        = "2"
)

var (
	NotificationKeys = []string{"Message", "MessageId", "Subject", "Timestamp", "TopicArn", "Type"}
	SubscriptionKeys = []string{"Message", "MessageId", "SubscribeURL", "Timestamp", "Token", "TopicArn", "Type"}
)

type Payload struct {
	Message          string `json:"Message"`
	MessageId        string `json:"MessageId"` //nolint // To create the signature AWS uses Id instead of ID
	Signature        string `json:"Signature"`
	SignatureVersion string `json:"SignatureVersion"`
	SigningCertURL   string `json:"SigningCertURL"`
	SubscribeURL     string `json:"SubscribeURL"`
	Subject          string `json:"Subject"`
	Timestamp        string `json:"Timestamp"`
	Token            string `json:"Token"`
	TopicArn         string `json:"TopicArn"`
	Type             string `json:"Type"`
	UnsubscribeURL   string `json:"UnsubscribeURL"`
}

// GetPayload first step in aws documentation.
func GetPayload(reqBody io.Reader) (Payload, error) {
	var payload Payload
	err := json.NewDecoder(reqBody).Decode(&payload)
	return payload, err
}

// getAWSCertificate second step in aws documentation.
func getAWSCertificate(ctx context.Context, certURL string) (*x509.Certificate, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, certURL, nil)
	if err != nil {
		return nil, err
	}
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}

	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	decodedPem, _ := pem.Decode(body)
	if decodedPem == nil {
		return nil, errors.New("decoded PEM file is empty")
	}

	return x509.ParseCertificate(decodedPem.Bytes)
}

// Third step in aws documentation.
func getMessageKeys(msgType string) []string {
	if msgType == subscriptionConfirmation {
		return SubscriptionKeys
	}
	return NotificationKeys
}

func VerifySignature(ctx context.Context, payload Payload) error {
	parsedCertificate, err := getAWSCertificate(ctx, payload.SigningCertURL)
	if err != nil {
		return err
	}

	builtSignature := buildSignature(payload, getMessageKeys(payload.Type))

	// sixth step in aws documentation.
	payloadSignature, err := base64.StdEncoding.DecodeString(payload.Signature)
	if err != nil {
		return err
	}

	// checkSignature performs steps 7,8 and 9 from aws documentation.
	return parsedCertificate.CheckSignature(getSignatureAlgorithm(payload.SignatureVersion), builtSignature, payloadSignature)
}

// fifth step in aws documentation.
func buildSignature(payload Payload, keys []string) []byte {
	var builtSignature bytes.Buffer
	for _, key := range keys {
		reflectedStruct := reflect.ValueOf(payload)
		field := reflect.Indirect(reflectedStruct).FieldByName(key)
		value := field.String()
		if field.IsValid() && value != "" {
			builtSignature.WriteString(key + "\n")
			builtSignature.WriteString(value + "\n")
		}
	}
	return builtSignature.Bytes()
}

func getSignatureAlgorithm(signatureVersion string) x509.SignatureAlgorithm {
	if signatureVersion == signatureVersion2 {
		return x509.SHA256WithRSA
	}
	return x509.SHA1WithRSA
}
