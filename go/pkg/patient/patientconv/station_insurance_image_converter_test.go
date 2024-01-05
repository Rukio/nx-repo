package patientconv

import (
	"testing"

	patientspb "github.com/*company-data-covered*/services/go/pkg/generated/proto/patients"
	"github.com/*company-data-covered*/services/go/pkg/patient"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"google.golang.org/protobuf/proto"
)

var imageEncoded = "iVBORw0KGgoAAAANSUhEU=="

func TestProtoToStationInsuranceImage(t *testing.T) {
	tcs := []struct {
		Desc                string
		InputInsuranceImage *patientspb.AddInsuranceImageRequest
		WantInsuranceImage  *patient.StationInsuranceWithRawImage
		HasErr              bool
	}{
		{
			Desc:                "Base image front case",
			InputInsuranceImage: exampleInsuranceImageProto(patientspb.InsuranceCardImage_SIDE_TYPE_FRONT.Enum()),
			WantInsuranceImage:  exampleStationInsuranceImageRequest(patientspb.InsuranceCardImage_SIDE_TYPE_FRONT.Enum()),
		},
		{
			Desc:                "Base image back case",
			InputInsuranceImage: exampleInsuranceImageProto(patientspb.InsuranceCardImage_SIDE_TYPE_BACK.Enum()),
			WantInsuranceImage:  exampleStationInsuranceImageRequest(patientspb.InsuranceCardImage_SIDE_TYPE_BACK.Enum()),
		},
		{
			Desc:   "Nil proto insurance image",
			HasErr: true,
		},
		{
			Desc: "Insurance image without insurance id",
			InputInsuranceImage: &patientspb.AddInsuranceImageRequest{
				PatientId: patientID,
				CardImage: &patientspb.InsuranceCardImage{
					Image: &patientspb.Image{
						Data: []byte(imageEncoded),
						Type: patientspb.Image_MIME_TYPE_PNG,
					},
					SideType: patientspb.InsuranceCardImage_SIDE_TYPE_BACK,
				},
			},
			HasErr: true,
		},
		{
			Desc: "Insurance image without patient id",
			InputInsuranceImage: &patientspb.AddInsuranceImageRequest{
				InsuranceId: insuranceID,
				CardImage: &patientspb.InsuranceCardImage{
					Image: &patientspb.Image{
						Data: []byte(imageEncoded),
						Type: patientspb.Image_MIME_TYPE_PNG,
					},
					SideType: patientspb.InsuranceCardImage_SIDE_TYPE_BACK,
				},
			},
			HasErr: true,
		},
		{
			Desc: "Insurance image without image",
			InputInsuranceImage: &patientspb.AddInsuranceImageRequest{
				InsuranceId: insuranceID,
				PatientId:   patientID,
				CardImage: &patientspb.InsuranceCardImage{
					SideType: patientspb.InsuranceCardImage_SIDE_TYPE_BACK,
				},
			},
			HasErr: true,
		},
		{
			Desc: "Insurance image without card image type",
			InputInsuranceImage: &patientspb.AddInsuranceImageRequest{
				InsuranceId: insuranceID,
				PatientId:   patientID,
				CardImage: &patientspb.InsuranceCardImage{
					Image: &patientspb.Image{
						Data: []byte(imageEncoded),
					},
					SideType: patientspb.InsuranceCardImage_SIDE_TYPE_BACK,
				},
			},
			HasErr: true,
		},
		{
			Desc: "Insurance image without card image data",
			InputInsuranceImage: &patientspb.AddInsuranceImageRequest{
				InsuranceId: insuranceID,
				PatientId:   patientID,
				CardImage: &patientspb.InsuranceCardImage{
					Image: &patientspb.Image{
						Type: patientspb.Image_MIME_TYPE_PNG,
					},
					SideType: patientspb.InsuranceCardImage_SIDE_TYPE_BACK,
				},
			},
			HasErr: true,
		},
		{
			Desc: "Insurance image unspecified card side type",
			InputInsuranceImage: &patientspb.AddInsuranceImageRequest{
				InsuranceId: insuranceID,
				PatientId:   patientID,
				CardImage: &patientspb.InsuranceCardImage{
					Image: &patientspb.Image{
						Data: []byte(imageEncoded),
						Type: patientspb.Image_MIME_TYPE_PNG,
					},
					SideType: patientspb.InsuranceCardImage_SIDE_TYPE_UNSPECIFIED,
				},
			},
			HasErr: true,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			convertedInsuranceImage, err := ProtoToStationInsuranceImage(tc.InputInsuranceImage)
			if tc.HasErr == (err != nil) {
				return
			}
			if err != nil {
				t.Errorf("ProtoToStationInsuranceImage hit unexpected error %s with test case %+v", err, tc)
			}
			testutils.MustMatch(t, convertedInsuranceImage, tc.WantInsuranceImage, "insurance image doesn't match")
		})
	}
}

func TestProtoToStationInsuranceImageRemoval(t *testing.T) {
	tcs := []struct {
		Desc                       string
		InputInsuranceImageRemoval *patientspb.RemoveInsuranceImageRequest
		WantInsuranceImage         *patient.StationInsuranceImageRemoval
		HasErr                     bool
	}{

		{
			Desc:                       "Base image front removal case",
			InputInsuranceImageRemoval: exampleInsuranceImageRemovalProto(patientspb.InsuranceImageType_INSURANCE_IMAGE_TYPE_FRONT.Enum()),
			WantInsuranceImage:         exampleStationInsuranceImageRemovalRequest(patientspb.InsuranceImageType_INSURANCE_IMAGE_TYPE_FRONT),
		},
		{
			Desc:                       "Base image back removal case",
			InputInsuranceImageRemoval: exampleInsuranceImageRemovalProto(patientspb.InsuranceImageType_INSURANCE_IMAGE_TYPE_BACK.Enum()),
			WantInsuranceImage:         exampleStationInsuranceImageRemovalRequest(patientspb.InsuranceImageType_INSURANCE_IMAGE_TYPE_BACK),
		},
		{
			Desc:   "Nil proto insurance image removal",
			HasErr: true,
		},
		{
			Desc: "Insurance image removal without insurance id",
			InputInsuranceImageRemoval: &patientspb.RemoveInsuranceImageRequest{
				PatientId: patientID,
				ImageType: patientspb.InsuranceImageType_INSURANCE_IMAGE_TYPE_BACK.Enum(),
			},
			HasErr: true,
		},
		{
			Desc: "Insurance image removal without patient id",
			InputInsuranceImageRemoval: &patientspb.RemoveInsuranceImageRequest{
				InsuranceId: insuranceID,
				ImageType:   patientspb.InsuranceImageType_INSURANCE_IMAGE_TYPE_FRONT.Enum(),
			},
			HasErr: true,
		},
		{
			Desc: "Insurance image removal without image type",
			InputInsuranceImageRemoval: &patientspb.RemoveInsuranceImageRequest{
				InsuranceId: insuranceID,
				PatientId:   patientID,
			},
			HasErr: true,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			convertedInsuranceImage, err := ProtoToStationInsuranceImageRemoval(tc.InputInsuranceImageRemoval)
			if tc.HasErr == (err != nil) {
				return
			}
			if err != nil {
				t.Errorf("ProtoToStationInsuranceImageRemoval hit unexpected error %s with test case %+v", err, tc)
			}
			testutils.MustMatch(t, convertedInsuranceImage, tc.WantInsuranceImage, "insurance image removal doesn't match")
		})
	}
}

func exampleInsuranceImageProto(sideType *patientspb.InsuranceCardImage_SideType) *patientspb.AddInsuranceImageRequest {
	return &patientspb.AddInsuranceImageRequest{
		InsuranceId: insuranceID,
		PatientId:   patientID,
		CardImage: &patientspb.InsuranceCardImage{
			Image: &patientspb.Image{
				Data: []byte(imageEncoded),
				Type: patientspb.Image_MIME_TYPE_PNG,
			},
			SideType: *sideType,
		},
		Verified: *proto.Bool(true),
	}
}

func exampleStationInsuranceImageRequest(sideType *patientspb.InsuranceCardImage_SideType) *patient.StationInsuranceWithRawImage {
	stationInsuranceImage := &patient.StationInsuranceWithRawImage{
		StationInsurance: patient.StationInsurance{
			ImageRequiresVerification: proto.Bool(true),
		},
	}

	if sideType == patientspb.InsuranceCardImage_SIDE_TYPE_FRONT.Enum() {
		stationInsuranceImage.CardFront = proto.String(imageEncoded)
	}

	if sideType == patientspb.InsuranceCardImage_SIDE_TYPE_BACK.Enum() {
		stationInsuranceImage.CardBack = proto.String(imageEncoded)
	}

	return stationInsuranceImage
}

func exampleInsuranceImageRemovalProto(imageType *patientspb.InsuranceImageType) *patientspb.RemoveInsuranceImageRequest {
	return &patientspb.RemoveInsuranceImageRequest{
		InsuranceId: insuranceID,
		PatientId:   patientID,
		ImageType:   imageType,
	}
}

func exampleStationInsuranceImageRemovalRequest(imageType patientspb.InsuranceImageType) *patient.StationInsuranceImageRemoval {
	stationInsurance := &patient.StationInsuranceImageRemoval{
		Insurance: &patient.StationInsurance{},
	}

	if imageType == patientspb.InsuranceImageType_INSURANCE_IMAGE_TYPE_FRONT {
		stationInsurance.Insurance.RemoveCardFront = proto.Bool(true)
	}

	if imageType == patientspb.InsuranceImageType_INSURANCE_IMAGE_TYPE_BACK {
		stationInsurance.Insurance.RemoveCardBack = proto.Bool(true)
	}

	return stationInsurance
}
