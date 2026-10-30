import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Masuk</h1>
      <p className="mt-2 text-sm text-muted">Lanjutin ke dashboard ScrapeDesk.</p>
      <LoginForm />
    </div>
  );
}
