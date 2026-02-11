"use client";

import { MessageSquareText } from "lucide-react";
import { CollapsibleSection } from "./CollapsibleSection";
import { NotesSection } from "./NotesSection";

interface QuoteNotesWrapperProps {
  quoteId: string;
  currentUserId: string;
}

export function QuoteNotesWrapper({ quoteId, currentUserId }: QuoteNotesWrapperProps) {
  return (
    <div className="mt-4">
      <CollapsibleSection
        icon={<MessageSquareText className="h-4 w-4" />}
        title="Notas"
        defaultOpen
      >
        <NotesSection entityType="quote" entityId={quoteId} currentUserId={currentUserId} />
      </CollapsibleSection>
    </div>
  );
}
