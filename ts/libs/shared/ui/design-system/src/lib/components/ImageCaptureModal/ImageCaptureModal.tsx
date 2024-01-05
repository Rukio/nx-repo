import { FC, useEffect, useState } from 'react';
import { Camera } from './components/Camera';
import { ImageConfirmation } from './components/ImageConfirmation';
import { usePhotoURL } from './hooks/usePhotoURL';
import { IMAGE_CAPTURE_MODAL_TEST_IDS } from './testIds';

export type ImageCaptureModalProps = {
  imageCapturePrimaryText?: string;
  imageCaptureSecondaryText?: string;
  imageConfirmationPrimaryText?: string;
  retakeButtonText?: string;
  continueButtonText?: string;
  isOpen: boolean;
  type: string;
  testIdPrefix: string;
  onCameraError: () => void;
  onCancel: () => void;
  onConfirm: (photo: Blob) => void;
};

const ImageCaptureModal: FC<ImageCaptureModalProps> = ({
  imageCapturePrimaryText,
  imageCaptureSecondaryText,
  imageConfirmationPrimaryText,
  retakeButtonText,
  continueButtonText,
  testIdPrefix,
  type,
  isOpen,
  onCameraError,
  onCancel,
  onConfirm,
}) => {
  const [showImageConfirmation, setShowImageConfirmation] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const { objectUrl, photo, setPhoto } = usePhotoURL(undefined);

  useEffect(() => {
    setShowCamera(isOpen);
    setShowImageConfirmation(false);
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const onCameraClose = () => {
    setShowCamera(false);
    onCancel();
  };

  const onChangePhoto = (changedPhoto: Blob) => {
    setShowCamera(false);
    setShowImageConfirmation(true);
    setPhoto(changedPhoto);
  };

  const onConfirmPhoto = () => {
    if (photo) {
      onConfirm(photo);
    }
  };

  const onRetakePhoto = () => {
    setPhoto(undefined);
    setShowCamera(true);
    setShowImageConfirmation(false);
  };

  return (
    <>
      <Camera
        testIdPrefix={IMAGE_CAPTURE_MODAL_TEST_IDS.getCameraTestId(
          testIdPrefix
        )}
        isOpen={showCamera}
        onClose={onCameraClose}
        onChangePhoto={onChangePhoto}
        topText={imageCapturePrimaryText}
        bottomText={imageCaptureSecondaryText}
        onError={onCameraError}
      />
      <ImageConfirmation
        testIdPrefix={IMAGE_CAPTURE_MODAL_TEST_IDS.getImageConfirmationTestId(
          testIdPrefix
        )}
        objectUrl={objectUrl ?? null}
        type={type}
        topText={imageConfirmationPrimaryText}
        retakeButtonText={retakeButtonText}
        confirmationButtonText={continueButtonText}
        isOpen={showImageConfirmation}
        onClose={onCancel}
        onConfirm={onConfirmPhoto}
        onRetake={onRetakePhoto}
      />
    </>
  );
};

export default ImageCaptureModal;
