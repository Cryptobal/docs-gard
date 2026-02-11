/**
 * Convierte documento Tiptap JSON a HTML para emails.
 */

export function tiptapToEmailHtml(doc: unknown): string {
  if (!doc || typeof doc !== "object") return "";
  const d = doc as { content?: unknown[] };
  if (!d.content || !Array.isArray(d.content)) return "";

  const renderNode = (node: unknown): string => {
    if (!node || typeof node !== "object") return "";
    const n = node as Record<string, unknown>;
    const type = n.type as string;
    const content = (n.content as unknown[]) || [];

    switch (type) {
      case "doc":
        return content.map(renderNode).join("");
      case "paragraph": {
        const style = (n.attrs as Record<string, string>)?.textAlign ? `text-align:${(n.attrs as Record<string, string>).textAlign};` : "";
        const inner = content.map(renderNode).join("");
        return inner ? `<p style="margin:0 0 8px;${style}">${inner}</p>` : `<p style="margin:0 0 8px;">&nbsp;</p>`;
      }
      case "heading": {
        const lvl = ((n.attrs as Record<string, number>)?.level) || 2;
        const inner = content.map(renderNode).join("");
        return `<h${lvl} style="margin:0 0 8px;">${inner}</h${lvl}>`;
      }
      case "bulletList":
        return `<ul style="margin:0 0 8px;padding-left:24px;">${content.map(renderNode).join("")}</ul>`;
      case "orderedList":
        return `<ol style="margin:0 0 8px;padding-left:24px;">${content.map(renderNode).join("")}</ol>`;
      case "listItem":
        return `<li style="margin:0 0 4px;">${content.map(renderNode).join("")}</li>`;
      case "text": {
        let text = String((n.text as string) || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        for (const mark of (n.marks as Array<{ type: string; attrs?: Record<string, string> }>) || []) {
          switch (mark.type) {
            case "bold": text = `<strong>${text}</strong>`; break;
            case "italic": text = `<em>${text}</em>`; break;
            case "underline": text = `<u>${text}</u>`; break;
            case "strike": text = `<s>${text}</s>`; break;
            case "link": text = `<a href="${mark.attrs?.href || "#"}" style="color:#0059A3;text-decoration:underline;">${text}</a>`; break;
            case "textStyle": if (mark.attrs?.color) text = `<span style="color:${mark.attrs.color}">${text}</span>`; break;
          }
        }
        return text;
      }
      case "hardBreak": return "<br/>";
      case "horizontalRule": return `<hr style="border:none;border-top:1px solid #e5e7eb;margin:12px 0;"/>`;
      case "blockquote": return `<blockquote style="border-left:3px solid #e5e7eb;padding-left:12px;margin:8px 0;color:#666;">${content.map(renderNode).join("")}</blockquote>`;
      default:
        return content.map(renderNode).join("");
    }
  };

  return `<div style="font-family:Arial,sans-serif;font-size:14px;color:#333;line-height:1.6;">${renderNode(doc)}</div>`;
}
