import { SignatureSignClient } from "@/components/docs/SignatureSignClient";

export default async function SignTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <SignatureSignClient token={token} />;
}
