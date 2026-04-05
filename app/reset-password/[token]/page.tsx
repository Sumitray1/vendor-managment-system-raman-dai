import ResetForm from "./reset-form";

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const tokenValue = decodeURIComponent(token).trim();
  return <ResetForm token={tokenValue} />;
}

