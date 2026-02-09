/**
 * ContractToken — Extensión Tiptap para tokens/placeholders de documentos
 *
 * Crea un nodo inline "atom" (no editable internamente) que representa
 * un placeholder como {{account.name}}. Se renderiza en HTML con atributos
 * data-* para persistencia y se muestra visualmente como un chip/badge.
 */

import { Node, mergeAttributes } from "@tiptap/core";

export interface ContractTokenOptions {
  HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    contractToken: {
      /**
       * Insert a contract token node.
       */
      insertToken: (attrs: {
        module: string;
        tokenKey: string;
        label: string;
      }) => ReturnType;
    };
  }
}

export const ContractToken = Node.create<ContractTokenOptions>({
  name: "contractToken",
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,
  draggable: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      module: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-module"),
        renderHTML: (attributes) => ({
          "data-module": attributes.module,
        }),
      },
      tokenKey: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-token-key"),
        renderHTML: (attributes) => ({
          "data-token-key": attributes.tokenKey,
        }),
      },
      label: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-label"),
        renderHTML: (attributes) => ({
          "data-label": attributes.label,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="contract-token"]',
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        "data-type": "contract-token",
        class: "contract-token",
      }),
      `{{${node.attrs.label}}}`,
    ];
  },

  addCommands() {
    return {
      insertToken:
        (attrs) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs,
          });
        },
    };
  },

  // Backspace is handled natively by ProseMirror for atom nodes
});
