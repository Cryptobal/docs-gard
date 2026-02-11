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

interface DocumentExpiringEmailProps {
  documentTitle: string;
  expirationDate: string;
  daysRemaining: number;
  documentUrl: string;
}

export default function DocumentExpiringEmail({
  documentTitle,
  expirationDate,
  daysRemaining,
  documentUrl,
}: DocumentExpiringEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Documento por vencer: {documentTitle}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Documento por vencer</Heading>
          <Text style={text}>
            El documento <strong>{documentTitle}</strong> vence pronto.
            Te queda{daysRemaining === 1 ? "" : "n"} <strong>{daysRemaining} día{daysRemaining === 1 ? "" : "s"}</strong> para tomar acción.
          </Text>
          <Section style={box}>
            <Text style={line}><strong>Documento:</strong> {documentTitle}</Text>
            <Text style={line}><strong>Fecha de vencimiento:</strong> {expirationDate}</Text>
            <Text style={line}><strong>Días restantes:</strong> {daysRemaining}</Text>
          </Section>
          <Section style={buttonWrap}>
            <Button href={documentUrl} style={button}>Ver documento</Button>
          </Section>
          <Text style={footnote}>
            Puedes renovar o actualizar el documento antes de su vencimiento para evitar interrupciones.
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
const box = { backgroundColor: "#fefce8", border: "1px solid #fde047", borderRadius: "8px", padding: "14px 16px", margin: "14px 0" };
const line = { color: "#1e293b", fontSize: "14px", margin: "0 0 6px" };
const buttonWrap = { textAlign: "center" as const, margin: "20px 0 8px" };
const button = { backgroundColor: "#f59e0b", color: "#fff", borderRadius: "8px", padding: "12px 20px", textDecoration: "none", fontSize: "15px", fontWeight: "700" };
const footnote = { color: "#94a3b8", fontSize: "12px", lineHeight: "1.5", margin: "16px 0 0" };
