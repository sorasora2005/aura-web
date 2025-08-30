
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  // Axiosのエラーなど、より具体的なエラーオブジェクトをチェックすることもできる
  // if (axios.isAxiosError(error) && error.response) {
  //   return error.response.data.message;
  // }

  return String(error);
}