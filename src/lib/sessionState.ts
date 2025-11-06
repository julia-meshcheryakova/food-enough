// Session state management for user flow

export const setFirstTimeUser = (isFirstTime: boolean) => {
  sessionStorage.setItem('isFirstTimeUser', JSON.stringify(isFirstTime));
};

export const isFirstTimeUser = (): boolean => {
  const stored = sessionStorage.getItem('isFirstTimeUser');
  if (stored === null) {
    // Check if profile exists in localStorage
    const hasProfile = localStorage.getItem('foodEnoughProfile') !== null;
    return !hasProfile;
  }
  return JSON.parse(stored);
};

export const setPreviousPage = (page: string) => {
  sessionStorage.setItem('previousPage', page);
};

export const getPreviousPage = (): string | null => {
  return sessionStorage.getItem('previousPage');
};

export const clearPreviousPage = () => {
  sessionStorage.removeItem('previousPage');
};
