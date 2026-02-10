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
  Link,
} from "@react-email/components";
import * as React from "react";

interface SignatureReminderEmailProps {
  recipientName: string;
  documentTitle: string;
  signingUrl: string;
  expiresAt?: string | null;
}

export default function SignatureReminderEmail({
  recipientName,
  documentTitle,
  signingUrl,
  expiresAt,
}: SignatureReminderEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Recordatorio de firma pendiente</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Recordatorio de firma</Heading>
          <Text style={text}>Hola {recipientName},</Text>
          <Text style={text}>
            Aún está pendiente tu firma para el documento <strong>{documentTitle}</strong>.
          </Text>
          {expiresAt ? <Text style={text}>Fecha límite: {expiresAt}</Text> : null}
          <Section style={buttonWrap}>
            <Button href={signingUrl} style={button}>Firmar ahora</Button>
          </Section>
          <Text style={small}>
            Si no puedes hacer click, copia este enlace:
            <br />
            <Link href={signingUrl} style={link}>
              {signingUrl}
            </Link>
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
const small = { color: "#64748b", fontSize: "13px", lineHeight: "1.5", marginTop: "20px" };
const buttonWrap = { textAlign: "center" as const, margin: "20px 0 8px" };
const button = { backgroundColor: "#14b8a6", color: "#fff", borderRadius: "8px", padding: "12px 20px", textDecoration: "none", fontSize: "15px", fontWeight: "700" };
const link = { color: "#0ea5e9", textDecoration: "underline", wordBreak: "break-all" as const };
