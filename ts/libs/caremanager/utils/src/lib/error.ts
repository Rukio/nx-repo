const DEFAULT_ERROR_MESSAGE = 'Unknown error';

export const getErrorMessage = async (error: Response) => {
  try {
    const jsonError = await error.json();

    return jsonError.message || DEFAULT_ERROR_MESSAGE;
  } catch {
    return DEFAULT_ERROR_MESSAGE;
  }
};
