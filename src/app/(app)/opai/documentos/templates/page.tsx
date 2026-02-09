import { DocumentosSubnav } from "@/components/opai/DocumentosSubnav";
import { DocTemplatesClient } from "@/components/docs/DocTemplatesClient";

export default function DocTemplatesPage() {
  return (
    <>
      <DocumentosSubnav />
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <DocTemplatesClient />
      </div>
    </>
  );
}
