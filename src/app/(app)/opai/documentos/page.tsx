import { DocumentosSubnav } from "@/components/opai/DocumentosSubnav";
import { DocumentosTopbar } from "@/components/opai/DocumentosTopbar";
import { DocsClient } from "@/components/docs/DocsClient";

export default function DocumentosPage() {
  return (
    <>
      <DocumentosTopbar />
      <DocumentosSubnav />
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <DocsClient />
      </div>
    </>
  );
}
