import { DocumentosSubnav } from "@/components/opai/DocumentosSubnav";
import { DocGenerateClient } from "@/components/docs/DocGenerateClient";
import { Suspense } from "react";

export default function NewDocumentPage() {
  return (
    <>
      <DocumentosSubnav />
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <Suspense>
          <DocGenerateClient />
        </Suspense>
      </div>
    </>
  );
}
