import { DocumentosSubnav } from "@/components/opai/DocumentosSubnav";
import { DocumentosTopbar } from "@/components/opai/DocumentosTopbar";
import { DocTemplateEditorClient } from "@/components/docs/DocTemplateEditorClient";

export default function NewDocTemplatePage() {
  return (
    <>
      <DocumentosTopbar />
      <DocumentosSubnav />
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <DocTemplateEditorClient />
      </div>
    </>
  );
}
