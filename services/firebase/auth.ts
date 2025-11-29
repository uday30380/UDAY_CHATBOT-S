// Mocking Firebase auth to avoid build errors due to missing modules or incorrect environment setup.
// This service is currently unused in the application main flow.

export const signInWithGoogle = async () => {
  console.warn("Firebase Auth is mocked and not active.");
  return null;
};

export const loginAnonymously = async () => {
  console.warn("Firebase Auth is mocked and not active.");
  return null;
};

export const logoutUser = async () => {
  console.warn("Firebase Auth is mocked and not active.");
};

export const getCurrentUser = () => {
  return null;
};
