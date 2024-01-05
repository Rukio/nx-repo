package patientconv

import (
	"encoding/base64"

	patientspb "github.com/*company-data-covered*/services/go/pkg/generated/proto/patients"
	"github.com/*company-data-covered*/services/go/pkg/patient"
	"github.com/pkg/errors"
	"google.golang.org/protobuf/proto"
)

var (
	errNoInsuranceImageProto = errors.New("insurance image proto cannot be nil")
	errNoInsuranceIDProto    = errors.New("insurance id cannot be nil")
	errNoPatientIDProto      = errors.New("patient id cannot be nil")
	errNoImageTypeProto      = errors.New("insurance image type cannot be nil")
	errNoImageProto          = errors.New("insurance image cannot be nil")
)

func ProtoToStationInsuranceImage(insuranceImageProto *patientspb.AddInsuranceImageRequest) (*patient.StationInsuranceWithRawImage, error) {
	if insuranceImageProto == nil {
		return nil, errNoInsuranceImageProto
	}

	if insuranceImageProto.InsuranceId == nil {
		return nil, errNoInsuranceIDProto
	}

	if insuranceImageProto.PatientId == nil {
		return nil, errNoPatientIDProto
	}

	if insuranceImageProto.CardImage.Image == nil {
		return nil, errNoImageProto
	}

	if insuranceImageProto.CardImage.Image.Data == nil {
		return nil, errNoImageProto
	}

	if insuranceImageProto.CardImage.Image.Type == patientspb.Image_MIME_TYPE_UNSPECIFIED {
		return nil, errNoImageProto
	}

	imageDataURI := imageToDataURI(insuranceImageProto.CardImage.Image.Data, &insuranceImageProto.CardImage.Image.Type)

	var stationInsurance *patient.StationInsuranceWithRawImage
	if insuranceImageProto.CardImage.SideType == patientspb.InsuranceCardImage_SIDE_TYPE_FRONT {
		stationInsurance = &patient.StationInsuranceWithRawImage{
			CardFront: proto.String(imageDataURI),
			StationInsurance: patient.StationInsurance{
				ImageRequiresVerification: &insuranceImageProto.Verified,
			},
		}
	}

	if insuranceImageProto.CardImage.SideType == patientspb.InsuranceCardImage_SIDE_TYPE_BACK {
		stationInsurance = &patient.StationInsuranceWithRawImage{
			CardBack: proto.String(imageDataURI),
			StationInsurance: patient.StationInsurance{
				ImageRequiresVerification: &insuranceImageProto.Verified,
			},
		}
	}

	return stationInsurance, nil
}

func imageToDataURI(data []byte, mimeType *patientspb.Image_MIMEType) string {
	var imageTypeString string

	switch *mimeType {
	case patientspb.Image_MIME_TYPE_JPEG, patientspb.Image_MIME_TYPE_JPG:
		imageTypeString = "jpg"
	case patientspb.Image_MIME_TYPE_PNG:
		imageTypeString = "png"
	case patientspb.Image_MIME_TYPE_TIFF:
		imageTypeString = "tiff"
	}

	return "data:image/" + imageTypeString + ";base64," + base64.StdEncoding.EncodeToString(data)
}

func ProtoToStationInsuranceImageRemoval(insuranceImageProto *patientspb.RemoveInsuranceImageRequest) (*patient.StationInsuranceImageRemoval, error) {
	if insuranceImageProto == nil {
		return nil, errNoInsuranceImageProto
	}

	if insuranceImageProto.InsuranceId == nil {
		return nil, errNoInsuranceIDProto
	}

	if insuranceImageProto.PatientId == nil {
		return nil, errNoPatientIDProto
	}

	if insuranceImageProto.ImageType == nil {
		return nil, errNoImageTypeProto
	}

	stationInsurance := &patient.StationInsuranceImageRemoval{
		Insurance: &patient.StationInsurance{},
	}

	if *insuranceImageProto.ImageType == patientspb.InsuranceImageType_INSURANCE_IMAGE_TYPE_FRONT {
		stationInsurance.Insurance.RemoveCardFront = proto.Bool(true)
	}

	if *insuranceImageProto.ImageType == patientspb.InsuranceImageType_INSURANCE_IMAGE_TYPE_BACK {
		stationInsurance.Insurance.RemoveCardBack = proto.Bool(true)
	}

	return stationInsurance, nil
}
