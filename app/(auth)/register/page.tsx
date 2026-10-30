import { RegisterForm } from "./register-form";

export default function RegisterPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Daftar</h1>
      <p className="mt-2 text-sm text-muted">Bikin akun ScrapeDesk, gratis buat mulai.</p>
      <RegisterForm />
    </div>
  );
}
