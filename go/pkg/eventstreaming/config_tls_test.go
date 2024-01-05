package eventstreaming

import (
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/pem"
	"errors"
	"fmt"
	"math/big"
	"testing"
	"time"

	"github.com/*company-data-covered*/services/go/pkg/testutils"
)

func genTestCertificateKeyPair(t *testing.T) ([]byte, []byte) {
	clientKey, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		t.Fatalf("failed to create test certificate: %v", err)
	}
	clientKeyPem := pem.EncodeToMemory(&pem.Block{Bytes: x509.MarshalPKCS1PrivateKey(clientKey), Type: "RSA PRIVATE KEY"})

	template := &x509.Certificate{
		Subject:      pkix.Name{CommonName: "client"},
		Issuer:       pkix.Name{CommonName: "ca"},
		SerialNumber: big.NewInt(0),
		NotAfter:     time.Now().Add(-1 * time.Hour),
		NotBefore:    time.Now().Add(1 * time.Hour),
		ExtKeyUsage:  []x509.ExtKeyUsage{x509.ExtKeyUsageClientAuth},
	}
	certDer, err := x509.CreateCertificate(rand.Reader, template, template, &clientKey.PublicKey, clientKey)
	if err != nil {
		t.Fatalf("failed to create test certificate: %v", err)
	}

	clientCertPem := pem.EncodeToMemory(&pem.Block{
		Type:  "CERTIFICATE",
		Bytes: certDer,
	})

	return clientKeyPem, clientCertPem
}

func TestSSLAuth(t *testing.T) {
	clientKeyPem, clientCertPem := genTestCertificateKeyPair(t)
	// self signed so client cert is technically the root CA
	rootCAPem := clientCertPem

	tcs := []struct {
		Desc  string
		Certs *ClientCerts

		WantErr error
	}{
		{
			Desc: "SSL is configured with valid certs",
			Certs: &ClientCerts{
				RootCA:     rootCAPem,
				ClientCert: clientCertPem,
				ClientKey:  clientKeyPem,
			},

			WantErr: nil,
		},
		{
			Desc: "SSL fails when configured with bad root CA",
			Certs: &ClientCerts{
				RootCA:     []byte("badcert"),
				ClientCert: clientCertPem,
				ClientKey:  clientKeyPem,
			},

			WantErr: errors.New("invalid cert: failed to load root CA"),
		},
		{
			Desc: "SSL fails with bad key pair",
			Certs: &ClientCerts{
				RootCA:     rootCAPem,
				ClientCert: []byte("badcert"),
				ClientKey:  clientKeyPem,
			},

			WantErr: errors.New("invalid cert: failed to load key pair"),
		},
	}

	for _, tc := range tcs {
		cfg := &ClientConfig{
			Brokers:  []string{"127.0.0.1:9095"},
			Certs:    tc.Certs,
			Producer: newTestProducerConfig(),
		}
		c, err := toSaramaConfig(cfg)

		testutils.MustMatch(t, tc.WantErr, err, fmt.Sprintf("%s: unexpected err", tc.Desc))
		if err != nil {
			continue
		}

		if !c.Net.TLS.Enable {
			t.Fatal("expect tls to be enabled on sarama config when certs are provided")
		}

		if c.Net.TLS.Config == nil {
			t.Fatal("expected tls config to be set on sarama config when certs are provided")
		}

		if c.Net.TLS.Config.RootCAs == nil && tc.Certs.RootCA != nil {
			t.Fatal("expect root ca to be set on sarama config when provided")
		}
	}
}
