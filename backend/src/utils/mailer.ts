import nodemailer, { type SendMailOptions } from "nodemailer";
import dns from "node:dns";
import net from "node:net";
import { buildWelcomeEmail, buildApplicationStatusEmail } from "./emailTemplates";

const getSmtpPort = () => {
  const raw = process.env.SMTP_PORT;
  if (!raw) return 587;
  const parsed = Number(raw);
  return Number.isNaN(parsed) ? 587 : parsed;
};

const getTimeout = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const isSmtpConfigured = () => {
  return !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  );
};

type SmtpAttempt = {
  host: string;
  port: number;
  secure: boolean;
  servername?: string;
};

const resolveHosts = async (host: string): Promise<Array<{ host: string; servername?: string }>> => {
  const forceIpv4 = process.env.SMTP_FORCE_IPV4 !== "false";

  if (!forceIpv4 || !host || net.isIP(host)) {
    return [{ host, servername: net.isIP(host) ? undefined : host }];
  }

  try {
    const addresses = await dns.promises.resolve4(host);
    const uniqueAddresses = Array.from(new Set(addresses));
    if (!uniqueAddresses.length) {
      return [{ host, servername: host }];
    }

    return [
      ...uniqueAddresses.map((address) => ({ host: address, servername: host })),
      // Keep hostname as a final fallback if direct IPv4 attempts fail.
      { host, servername: host },
    ];
  } catch (error) {
    console.warn(`Failed IPv4 DNS resolve for ${host}:`, (error as Error).message);
    return [{ host, servername: host }];
  }
};

const getSmtpAttempts = async (): Promise<SmtpAttempt[]> => {
  const host = process.env.SMTP_HOST || "";
  const configuredPort = getSmtpPort();
  const configuredSecure = process.env.SMTP_SECURE === "true";
  const hosts = await resolveHosts(host);
  const attempts: SmtpAttempt[] = [];
  const attemptKeys = new Set<string>();

  const addAttempt = (item: SmtpAttempt) => {
    const key = `${item.host}:${item.port}:${item.secure}`;
    if (attemptKeys.has(key)) return;
    attemptKeys.add(key);
    attempts.push(item);
  };

  for (const item of hosts) {
    addAttempt({
      host: item.host,
      port: configuredPort,
      secure: configuredSecure,
      servername: item.servername,
    });
  }

  // Some providers block one SMTP port. For Gmail, try both standard ports.
  if (host.includes("gmail.com")) {
    for (const item of hosts) {
      addAttempt({ host: item.host, port: 587, secure: false, servername: item.servername });
      addAttempt({ host: item.host, port: 465, secure: true, servername: item.servername });
    }
  }

  return attempts;
};

const getTransporter = (attempt: SmtpAttempt) => {
  const rawPass = process.env.SMTP_PASS || "";
  const configuredHost = process.env.SMTP_HOST || "";
  // Gmail app passwords are shown in grouped format; normalize accidental spaces.
  const password = configuredHost.includes("gmail.com") ? rawPass.replace(/\s+/g, "") : rawPass;

  const transportOptions: Record<string, unknown> = {
    host: attempt.host,
    port: attempt.port,
    secure: attempt.secure,
    connectionTimeout: getTimeout(process.env.SMTP_CONNECTION_TIMEOUT_MS, 20_000),
    greetingTimeout: getTimeout(process.env.SMTP_GREETING_TIMEOUT_MS, 20_000),
    socketTimeout: getTimeout(process.env.SMTP_SOCKET_TIMEOUT_MS, 30_000),
    auth: {
      user: process.env.SMTP_USER,
      pass: password,
    },
  };

  if (attempt.servername) {
    transportOptions.tls = {
      servername: attempt.servername,
    };
  }

  return nodemailer.createTransport(transportOptions as never);
};

const isRetryableError = (error: unknown) => {
  const code = (error as { code?: string })?.code || "";
  const message = (error as { message?: string })?.message || "";
  return (
    code === "ETIMEDOUT" ||
    code === "ESOCKET" ||
    code === "ENETUNREACH" ||
    code === "EHOSTUNREACH" ||
    code === "ECONNREFUSED" ||
    code === "ECONNRESET" ||
    message.includes("ENETUNREACH") ||
    message.includes("Connection timeout")
  );
};

const sendMailWithRetry = async (mail: SendMailOptions) => {
  const attempts = await getSmtpAttempts();
  let lastError: unknown;

  for (let i = 0; i < attempts.length; i += 1) {
    const attempt = attempts[i];
    try {
      const transporter = getTransporter(attempt);
      await transporter.sendMail(mail);
      return;
    } catch (error) {
      lastError = error;
      console.warn(
        `SMTP attempt ${i + 1}/${attempts.length} failed (${attempt.host}:${attempt.port}, secure=${attempt.secure}):`,
        (error as Error).message
      );

      if (!isRetryableError(error) || i === attempts.length - 1) {
        throw error;
      }
    }
  }

  throw lastError;
};

type WelcomeEmailInput = {
  to: string;
  name: string;
  role: "candidate" | "employer" | "admin";
};

export const sendWelcomeEmail = async ({ to, name, role }: WelcomeEmailInput) => {
  if (!isSmtpConfigured()) {
    console.warn("Email not sent: SMTP config missing.");
    return;
  }

  const appName = process.env.APP_NAME || "Mini Job Portal";
  const appUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const from = process.env.EMAIL_FROM || process.env.SMTP_USER || "";
  const email = buildWelcomeEmail({ name, role, appName, appUrl });

  await sendMailWithRetry({
    from,
    to,
    subject: email.subject,
    text: email.text,
    html: email.html,
  });
};

type StatusEmailInput = {
  to: string;
  name: string;
  jobTitle: string;
  status: string;
};

export const sendApplicationStatusEmail = async ({ to, name, jobTitle, status }: StatusEmailInput) => {
  if (!isSmtpConfigured()) {
    console.warn("Email not sent: SMTP config missing.");
    return;
  }

  const appName = process.env.APP_NAME || "Mini Job Portal";
  const appUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const from = process.env.EMAIL_FROM || process.env.SMTP_USER || "";
  const email = buildApplicationStatusEmail({ name, jobTitle, status, appName, appUrl });

  await sendMailWithRetry({
    from,
    to,
    subject: email.subject,
    text: email.text,
    html: email.html,
  });
};
