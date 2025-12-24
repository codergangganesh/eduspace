import { AuthHeader } from "@/components/layout/AuthHeader";
import { LoginForm } from "@/components/auth/LoginForm";
import { BackgroundDecoration } from "@/components/auth/BackgroundDecoration";

export default function Login() {
  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <AuthHeader />

      {/* Main Content */}
      <main className="flex-1 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-[480px] mx-auto flex flex-col gap-6">
          {/* Page Heading */}
          <div className="flex flex-col gap-2 text-center sm:text-left animate-fade-in">
            <h1 className="text-foreground text-3xl sm:text-4xl font-black leading-tight tracking-[-0.033em]">
              Welcome Back
            </h1>
            <p className="text-muted-foreground text-base font-normal leading-normal">
              Please enter your details to sign in.
            </p>
          </div>

          {/* Login Form Card */}
          <LoginForm />

          {/* Footer Info */}
          <div className="text-center animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <p className="text-xs text-muted-foreground/70">
              Protected by reCAPTCHA and subject to the{" "}
              <a className="underline hover:text-muted-foreground" href="#">
                Privacy Policy
              </a>{" "}
              and{" "}
              <a className="underline hover:text-muted-foreground" href="#">
                Terms of Service
              </a>
              .
            </p>
          </div>
        </div>
      </main>

      <BackgroundDecoration />
    </div>
  );
}
