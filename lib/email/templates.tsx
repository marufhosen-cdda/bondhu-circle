import type { ReactNode } from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

/**
 * Shared React Email shell. Every template renders inside `<EmailLayout>`.
 * All copy is passed in by the caller so emails follow the user's locale.
 */

export interface EmailLayoutProps {
  preview: string;
  heading: string;
  children: ReactNode;
  footer?: string;
}

export function EmailLayout({ preview, heading, children, footer }: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={logo}>
            <Text style={logoText}>Bondhu Circle</Text>
          </Section>
          <Heading style={h1}>{heading}</Heading>
          {children}
          <Hr style={hr} />
          <Text style={footerText}>
            {footer ?? "Bondhu Circle — Find your people in Dhaka."}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export function EmailButton({ href, label }: { href: string; label: string }) {
  return (
    <Section style={{ marginTop: 24, marginBottom: 24 }}>
      <Link href={href} style={button}>
        {label}
      </Link>
    </Section>
  );
}

export function EmailParagraph({ children }: { children: ReactNode }) {
  return <Text style={p}>{children}</Text>;
}

export function OtpCode({ code }: { code: string }) {
  return (
    <Text
      style={{
        ...p,
        fontSize: 32,
        letterSpacing: 12,
        fontWeight: 700,
        textAlign: "center",
        background: "#f1f5f4",
        borderRadius: 12,
        padding: "16px 0",
        margin: "16px 0",
      }}
    >
      {code}
    </Text>
  );
}

const body = {
  backgroundColor: "#f6f7f6",
  fontFamily:
    "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  margin: 0,
  padding: "40px 0",
};

const container = {
  backgroundColor: "#ffffff",
  border: "1px solid #e4e7e6",
  borderRadius: 16,
  margin: "0 auto",
  maxWidth: 520,
  padding: "32px 36px",
};

const logo = { marginBottom: 8 };
const logoText = { color: "#0f766e", fontSize: 14, fontWeight: 700, letterSpacing: 1 };
const h1 = { color: "#0f172a", fontSize: 22, lineHeight: "28px", margin: "8px 0 16px" };
const p = { color: "#334155", fontSize: 15, lineHeight: "24px", margin: "0 0 16px" };
const hr = { borderColor: "#e4e7e6", margin: "24px 0" };
const footerText = { color: "#64748b", fontSize: 12, lineHeight: "18px", margin: 0 };
const button = {
  backgroundColor: "#0f766e",
  borderRadius: 12,
  color: "#ffffff",
  display: "inline-block",
  fontSize: 15,
  fontWeight: 600,
  padding: "12px 24px",
  textDecoration: "none",
};
