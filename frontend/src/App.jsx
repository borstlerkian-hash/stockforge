import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import PaymentReturn from "@/pages/PaymentReturn";
import { Show, SignIn, SignUp, useAuth } from "@clerk/react";
import ClerkAuthProvider, { useClerkStatus } from "@/components/auth/ClerkAuthProvider";
const Terminal = lazy(() => import("@/pages/Terminal"));
const Landing = lazy(() => import("@/pages/Landing"));
import { Background } from "@/components/sf/Background";
import About from "@/pages/About";
import ErrorBoundary from "@/components/sf/ErrorBoundary";

const AuthPage = ({ children }) => (
  <div className="min-h-screen relative flex items-center justify-center px-4 py-10">
    <Background tier={5} />
    <div className="relative z-10 w-full max-w-md">
      {children}
    </div>
  </div>
);

const Home = () => (
  <>
    <Show when="signed-in"><Suspense fallback={<div className="min-h-screen bg-[#080B11]" />}><Terminal /></Suspense></Show>
    <Show when="signed-out"><Suspense fallback={<div className="min-h-screen bg-[#080B11]" />}><Landing /></Suspense></Show>
  </>
);

// Without a backend there is no Clerk config, so Show/SignIn would crash on a
// missing provider — render the signed-out landing for every route instead.
function StaticRoutes({ loading = false }) {
  return (
    <Routes>
      <Route path="/" element={<Suspense fallback={<div className="min-h-screen bg-[#080B11]" />}><Landing /></Suspense>} />
      {/* While auth boots, keep deep links (e.g. /sign-in) intact instead of
          redirecting them to the landing page before Clerk can take over. */}
      <Route path="*" element={loading ? <div className="min-h-screen bg-[#080B11]" /> : <Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ClerkAuthProvider>
        <AuthedRoutes />
      </ClerkAuthProvider>
    </ErrorBoundary>
  );
}

// Clerk mounts its browser client asynchronously; keep the public landing on screen
// while it loads instead of rendering an empty page.
function ClerkReady() {
  const { isLoaded } = useAuth();
  if (!isLoaded) return <StaticRoutes loading />;
  return (
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/sign-in/*" element={<AuthPage><SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" withSignUp /></AuthPage>} />
          <Route path="/sign-up/*" element={<AuthPage><SignUp routing="path" path="/sign-up" signInUrl="/sign-in" /></AuthPage>} />
          <Route path="/about" element={<About />} />
          <Route path="/payment/success" element={<PaymentReturn ok />} />
          <Route path="/payment/cancel" element={<PaymentReturn ok={false} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
  );
}

function AuthedRoutes() {
  const status = useClerkStatus();
  if (status === "off") return <StaticRoutes />;
  if (status === "loading") return <StaticRoutes loading />;
  return <ClerkReady />;
}

export default App;
