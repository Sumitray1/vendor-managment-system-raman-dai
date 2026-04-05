import { notFound } from "next/navigation";
import RegisterForm from "./register-form";

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const secretRaw = process.env.REGISTER_SECRET ?? "";
  const secret = secretRaw
    .trim()
    .replace(/^"(.*)"$/, "$1")
    .trim();
  const tokenValue = decodeURIComponent(token).trim();
  if (!secret || tokenValue !== secret) notFound();

  return <RegisterForm token={tokenValue} />;
}
