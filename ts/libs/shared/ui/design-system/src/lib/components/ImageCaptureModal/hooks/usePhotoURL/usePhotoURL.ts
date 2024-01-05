import { useEffect, useState } from 'react';

/**
 * React Hook that receives an instance of Photo and
 * creates an URL representing the associated Blob, providing a state object containing the file
 * with a set function to change the photo object. It releases object URL when component
 * unmounts or parameter changes.
 * @param {Blob} initialObject - The initial photo model blob
 */
const usePhotoURL = (initialObject?: Blob) => {
  const [objectUrl, setObjectUrl] = useState<undefined | string>(undefined);
  const [photo, setPhoto] = useState<Blob | undefined>(initialObject);

  useEffect(() => {
    if (!photo) {
      return;
    }

    const { createObjectURL, revokeObjectURL } = URL ?? webkitURL;
    const newObjectUrl = createObjectURL(photo);
    setObjectUrl(newObjectUrl);

    return () => {
      revokeObjectURL(newObjectUrl);
      setObjectUrl(undefined);
    };
  }, [photo]);

  return {
    objectUrl,
    photo,
    setPhoto,
  };
};

export default usePhotoURL;
