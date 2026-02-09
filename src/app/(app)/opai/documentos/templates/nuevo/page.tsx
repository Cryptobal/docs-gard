import { DocumentosSubnav } from "@/components/opai/DocumentosSubnav";
import { DocTemplateEditorClient } from "@/components/docs/DocTemplateEditorClient";

export default function NewDocTemplatePage() {
  return (
    <>
      <DocumentosSubnav />
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <DocTemplateEditorClient />
      </div>
    </>
  );
}
