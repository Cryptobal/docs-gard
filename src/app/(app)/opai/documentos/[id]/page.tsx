import { DocumentosSubnav } from "@/components/opai/DocumentosSubnav";
import { DocDetailClient } from "@/components/docs/DocDetailClient";

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <>
      <DocumentosSubnav />
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <DocDetailClient documentId={id} />
      </div>
    </>
  );
}
