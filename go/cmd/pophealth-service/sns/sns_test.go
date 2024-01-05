package sns

import (
	"bytes"
	"context"
	"crypto"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha1"
	"crypto/sha256"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/base64"
	"encoding/pem"
	"errors"
	"fmt"
	"math/big"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/*company-data-covered*/services/go/pkg/testutils"
)

const (
	certificateName     = "certificate.pem"
	fixturesPath        = "./fixtures/"
	privateKeyName      = "private.rsa"
	signingCertPathTest = "/test/cert"
	badBodyPathTest     = "/test/badbody"
	errorPathTest       = "/test/error"
)

func TestGetPayload(t *testing.T) {
	snsTemplate := `
		"Type" : "%s",
		"MessageId" : "%s",
  		"TopicArn" : "%s",
  		"Subject" : "%s",
  		"Message" : "test\nmessage",
  		"Timestamp" : "%s",
  		"SignatureVersion" : "%s",
  		"Signature" : "%s",
		"SigningCertURL" : "%s",
  		"UnsubscribeURL" : "%s"
`
	baseSNSPayload := Payload{
		MessageId:        "22b80b92-fdea-4c2c-8f9d-bdfb0c7bf324",
		Signature:        "EXAMPLEw6JRN...",
		SignatureVersion: "1",
		SigningCertURL:   "https://sns.us-west-2.amazonaws.com/SimpleNotificationService-f3ecfb7224c7233fe7bb5f59f96de52f.pem",
		Subject:          "My First Message",
		Timestamp:        "2012-05-02T00:54:06.655Z",
		TopicArn:         "arn:aws:sns:us-west-2:123456789012:MyTopic",
		Type:             "Notification",
		UnsubscribeURL:   "https://sns.us-west-2.amazonaws.com/?Action=Unsubscribe&SubscriptionArn=arn:aws:sns:us-west-2:123456789012:MyTopic:c9135db0-26c4-47ec-8998-413945fb5a96",
	}
	tests := []struct {
		name            string
		rawPayload      string
		expectedPayload Payload

		hasError bool
	}{
		{
			name: "happy path",
			rawPayload: fmt.Sprintf("{%s}", fmt.Sprintf(snsTemplate,
				baseSNSPayload.Type,
				baseSNSPayload.MessageId,
				baseSNSPayload.TopicArn,
				baseSNSPayload.Subject,
				baseSNSPayload.Timestamp,
				baseSNSPayload.SignatureVersion,
				baseSNSPayload.Signature,
				baseSNSPayload.SigningCertURL,
				baseSNSPayload.UnsubscribeURL,
			)),
			expectedPayload: Payload{
				Message: `test
message`,
				MessageId:        baseSNSPayload.MessageId,
				Signature:        baseSNSPayload.Signature,
				SignatureVersion: baseSNSPayload.SignatureVersion,
				SigningCertURL:   baseSNSPayload.SigningCertURL,
				Subject:          baseSNSPayload.Subject,
				Timestamp:        baseSNSPayload.Timestamp,
				TopicArn:         baseSNSPayload.TopicArn,
				Type:             baseSNSPayload.Type,
				UnsubscribeURL:   baseSNSPayload.UnsubscribeURL,
			},
			hasError: false,
		},
		{
			name: "error parsing sns payload",
			rawPayload: fmt.Sprintf("{%s", fmt.Sprintf(snsTemplate,
				baseSNSPayload.Type,
				baseSNSPayload.MessageId,
				baseSNSPayload.TopicArn,
				baseSNSPayload.Subject,
				baseSNSPayload.Timestamp,
				baseSNSPayload.SignatureVersion,
				baseSNSPayload.Signature,
				baseSNSPayload.SigningCertURL,
				baseSNSPayload.UnsubscribeURL,
			)),

			hasError: true,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			r := strings.NewReader(test.rawPayload)
			got, err := GetPayload(r)
			if (err != nil) != test.hasError {
				t.Errorf("expeccted error:  %v, but got: %v", test.hasError, err)
			}
			if !test.hasError {
				testutils.MustMatch(t, test.expectedPayload, got, "payloads don't match")
			}
		})
	}
}

func TestGetAWSCertificate(t *testing.T) {
	ctx := context.Background()
	srvr := createTestHTTPServer()
	defer srvr.Close()
	err := createTestCertificate(fixturesPath, privateKeyName, certificateName)
	if err != nil {
		t.Fatal(err)
	}
	defer cleanupTestCertificate(fixturesPath)
	tests := []struct {
		name    string
		certURL string

		hasError bool
	}{
		{
			name:    "happy path",
			certURL: srvr.URL + signingCertPathTest,

			hasError: false,
		},
		{
			name:    "error bad certificate",
			certURL: srvr.URL + badBodyPathTest,

			hasError: true,
		},
		{
			name:    "error server",
			certURL: srvr.URL + errorPathTest,

			hasError: true,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			cert, err := getAWSCertificate(ctx, test.certURL)
			if (err != nil) != test.hasError {
				t.Errorf("expeccted error:  %v, but got: %v", test.hasError, err)
			}
			if (cert == nil) != test.hasError {
				t.Errorf("certifcate is nil, expected not to be")
			}
		})
	}
}

func TestGetMessageKeys(t *testing.T) {
	tests := []struct {
		name    string
		msgType string

		expectedKeys []string
	}{
		{
			name:    "subscription type",
			msgType: subscriptionConfirmation,

			expectedKeys: SubscriptionKeys,
		},
		{
			name:    "notification type",
			msgType: "Notification",

			expectedKeys: NotificationKeys,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			got := getMessageKeys(test.msgType)
			testutils.MustMatch(t, test.expectedKeys, got, "keys don't match")
		})
	}
}

func TestBuildSignature(t *testing.T) {
	tests := []struct {
		name    string
		keys    []string
		payload Payload

		expectedResult []byte
	}{
		{
			name:    "Happy path",
			keys:    []string{"Message"},
			payload: Payload{Message: "hello"},

			expectedResult: []byte("Message\nhello\n"),
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			got := buildSignature(test.payload, test.keys)
			testutils.MustMatch(t, test.expectedResult, got, "signature doesn't match")
		})
	}
}

func TestVerifySignature(t *testing.T) {
	ctx := context.Background()
	srvr := createTestHTTPServer()
	defer srvr.Close()
	err := createTestCertificate(fixturesPath, privateKeyName, certificateName)
	if err != nil {
		t.Fatal(err)
	}
	defer cleanupTestCertificate(fixturesPath)
	basePayload := Payload{
		Message:          "message",
		MessageId:        "12345",
		SignatureVersion: "1",
		Subject:          "test message",
		Timestamp:        "2012-05-02T00:54:06.655Z",
		TopicArn:         "arn:aws:sns:us-west-2:123456789012:MyTopic",
	}
	tests := []struct {
		name    string
		payload *Payload

		hasError bool
	}{
		{
			name: "happy path subscription v1",
			payload: &Payload{
				Message:          basePayload.Message,
				MessageId:        basePayload.MessageId,
				SignatureVersion: basePayload.SignatureVersion,
				SigningCertURL:   srvr.URL + signingCertPathTest,
				Subject:          basePayload.Subject,
				Timestamp:        basePayload.Timestamp,
				TopicArn:         basePayload.Timestamp,
				Type:             subscriptionConfirmation,
			},
		},
		{
			name: "happy path notification v1",
			payload: &Payload{
				Message:          basePayload.Message,
				MessageId:        basePayload.MessageId,
				SignatureVersion: basePayload.SignatureVersion,
				SigningCertURL:   srvr.URL + signingCertPathTest,
				Subject:          basePayload.Subject,
				Timestamp:        basePayload.Timestamp,
				TopicArn:         basePayload.TopicArn,
				Type:             "Notification",
			},
		},
		{
			name: "happy path subscription v2",
			payload: &Payload{
				Message:          basePayload.Message,
				MessageId:        basePayload.MessageId,
				SignatureVersion: "2",
				SigningCertURL:   srvr.URL + signingCertPathTest,
				Subject:          basePayload.Subject,
				Timestamp:        basePayload.Timestamp,
				TopicArn:         basePayload.Timestamp,
				Type:             subscriptionConfirmation,
			},
		},
		{
			name: "happy path notification v2",
			payload: &Payload{
				Message:          basePayload.Message,
				MessageId:        basePayload.MessageId,
				SignatureVersion: "2",
				SigningCertURL:   srvr.URL + signingCertPathTest,
				Subject:          basePayload.Subject,
				Timestamp:        basePayload.Timestamp,
				TopicArn:         basePayload.TopicArn,
				Type:             "Notification",
			},
		},
		{
			name: "tampered subscription",
			payload: &Payload{
				Message:          basePayload.Message,
				MessageId:        basePayload.MessageId,
				SignatureVersion: basePayload.SignatureVersion,
				SigningCertURL:   srvr.URL + signingCertPathTest,
				Subject:          basePayload.Subject,
				Timestamp:        basePayload.Timestamp,
				TopicArn:         basePayload.TopicArn,
				Type:             subscriptionConfirmation,
			},
			hasError: true,
		},
		{
			name: "tampered notification",
			payload: &Payload{
				Message:          basePayload.Message,
				MessageId:        basePayload.MessageId,
				SignatureVersion: basePayload.SignatureVersion,
				SigningCertURL:   srvr.URL + signingCertPathTest,
				Subject:          basePayload.Subject,
				Timestamp:        basePayload.Timestamp,
				TopicArn:         basePayload.TopicArn,
				Type:             "Notification",
			},
			hasError: true,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			err = signTestPayload(test.payload, getMessageKeys(test.payload.Type))
			if err != nil {
				t.Fatal(err)
			}
			if test.hasError {
				test.payload.Message = "tampered message"
			}
			err = VerifySignature(ctx, *test.payload)
			if (err != nil) != test.hasError {
				t.Errorf("expeccted error:  %v, but got: %v", test.hasError, err)
			}
		})
	}
}

func signTestPayload(payload *Payload, keys []string) error {
	msg := buildSignature(*payload, keys)
	signed, err := signTestMsg(msg, payload.SignatureVersion)
	if err != nil {
		return err
	}
	payload.Signature = base64.StdEncoding.EncodeToString(signed)
	return nil
}

func signTestMsg(msg []byte, signatureVersion string) ([]byte, error) {
	cert, err := os.ReadFile(fixturesPath + privateKeyName)
	if err != nil {
		return nil, err
	}
	pKeyDecodedPem, _ := pem.Decode(cert)
	if pKeyDecodedPem == nil {
		return nil, errors.New("decoded private Key PEM file is empty")
	}
	privateKeyImported, err := x509.ParsePKCS1PrivateKey(pKeyDecodedPem.Bytes)
	if err != nil {
		return nil, err
	}
	var hashSum []byte
	if signatureVersion == signatureVersion2 {
		hash := sha256.New()
		_, err = hash.Write(msg)
		if err != nil {
			return nil, err
		}
		hashSum = hash.Sum(nil)
	} else {
		hash := sha1.New()
		_, err = hash.Write(msg)
		if err != nil {
			return nil, err
		}
		hashSum = hash.Sum(nil)
	}

	return rsa.SignPKCS1v15(rand.Reader, privateKeyImported, getHashAlgorithm(signatureVersion), hashSum)
}

func getHashAlgorithm(signatureVersion string) crypto.Hash {
	if signatureVersion == signatureVersion2 {
		return crypto.SHA256
	}
	return crypto.SHA1
}

func createTestCertificate(fixturesPath, privateKeyName, certificateName string) error {
	// 0755, it means octal number to grant all permissions to owner, execution to group and execution to others
	permissions := os.FileMode(0755)
	err := os.Mkdir(fixturesPath, permissions)
	if err != nil {
		return err
	}
	pKey, cert, err := generateTestCertificate()
	if err != nil {
		return err
	}
	if err = os.WriteFile(fixturesPath+privateKeyName, pKey.Bytes(), permissions); err != nil {
		return err
	}
	return os.WriteFile(fixturesPath+certificateName, cert.Bytes(), permissions)
}

func cleanupTestCertificate(fixturesPath string) {
	os.RemoveAll(fixturesPath)
}

func generateTestCertificate() (*bytes.Buffer, *bytes.Buffer, error) {
	caPrivKey, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		return nil, nil, err
	}

	ca := &x509.Certificate{
		SerialNumber: big.NewInt(2019),
		Subject: pkix.Name{
			Organization:  []string{"Dispatch Health."},
			Country:       []string{"US"},
			Province:      []string{""},
			Locality:      []string{""},
			StreetAddress: []string{"dummy address"},
			PostalCode:    []string{"12345"},
		},
		NotBefore:             time.Now(),
		NotAfter:              time.Now().AddDate(0, 0, 2),
		IsCA:                  false,
		ExtKeyUsage:           []x509.ExtKeyUsage{x509.ExtKeyUsageClientAuth, x509.ExtKeyUsageServerAuth},
		KeyUsage:              x509.KeyUsageDigitalSignature | x509.KeyUsageCertSign,
		BasicConstraintsValid: true,
		SignatureAlgorithm:    x509.SHA1WithRSA,
	}
	caBytes, err := x509.CreateCertificate(rand.Reader, ca, ca, &caPrivKey.PublicKey, caPrivKey)
	if err != nil {
		return nil, nil, err
	}

	cert := new(bytes.Buffer)
	_ = pem.Encode(cert, &pem.Block{
		Type:  "CERTIFICATE",
		Bytes: caBytes,
	})

	privateKey := new(bytes.Buffer)
	_ = pem.Encode(privateKey, &pem.Block{
		Type:  "RSA PRIVATE KEY",
		Bytes: x509.MarshalPKCS1PrivateKey(caPrivKey),
	})
	return privateKey, cert, nil
}

func createTestHTTPServer() *httptest.Server {
	return httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		switch request.URL.Path {
		case signingCertPathTest:
			cert, _ := os.ReadFile(fixturesPath + certificateName)
			writer.WriteHeader(http.StatusOK)
			writer.Write(cert)
		case badBodyPathTest:
			writer.Header().Set("Content-Length", "1")
			writer.WriteHeader(http.StatusOK)
		case errorPathTest:
			writer.WriteHeader(http.StatusInternalServerError)
		default:
			writer.WriteHeader(http.StatusNotFound)
		}
	}))
}
