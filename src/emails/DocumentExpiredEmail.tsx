import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface DocumentExpiredEmailProps {
  documentTitle: string;
  expirationDate: string;
  documentUrl: string;
}

export default function DocumentExpiredEmail({
  documentTitle,
  expirationDate,
  documentUrl,
}: DocumentExpiredEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Documento vencido: {documentTitle}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Documento vencido</Heading>
          <Text style={text}>
            El documento <strong>{documentTitle}</strong> ha vencido y requiere atención inmediata.
          </Text>
          <Section style={box}>
            <Text style={line}><strong>Documento:</strong> {documentTitle}</Text>
            <Text style={line}><strong>Venció el:</strong> {expirationDate}</Text>
          </Section>
          <Section style={buttonWrap}>
            <Button href={documentUrl} style={button}>Ver documento</Button>
          </Section>
          <Text style={footnote}>
            Revisa el documento y decide si necesitas renovarlo, actualizar sus condiciones o archivarlo.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = { backgroundColor: "#f6f9fc", fontFamily: "Arial, sans-serif", padding: "24px 0" };
const container = { backgroundColor: "#fff", borderRadius: "10px", maxWidth: "600px", margin: "0 auto", padding: "28px" };
const h1 = { color: "#0f172a", fontSize: "24px", margin: "0 0 16px" };
const text = { color: "#334155", fontSize: "15px", lineHeight: "1.6", margin: "0 0 12px" };
const box = { backgroundColor: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "8px", padding: "14px 16px", margin: "14px 0" };
const line = { color: "#1e293b", fontSize: "14px", margin: "0 0 6px" };
const buttonWrap = { textAlign: "center" as const, margin: "20px 0 8px" };
const button = { backgroundColor: "#ef4444", color: "#fff", borderRadius: "8px", padding: "12px 20px", textDecoration: "none", fontSize: "15px", fontWeight: "700" };
const footnote = { color: "#94a3b8", fontSize: "12px", lineHeight: "1.5", margin: "16px 0 0" };
