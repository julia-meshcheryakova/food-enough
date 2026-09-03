// Guest mode: the app works without an account. Auth is optional (sign-in still
// available for returning users), so this no longer gates the flow — profile,
// menu and results all degrade to localStorage for anonymous visitors.
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
