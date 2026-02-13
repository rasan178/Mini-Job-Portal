import nodemailer, { type SendMailOptions } from "nodemailer";
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
};

const getSmtpAttempts = (): SmtpAttempt[] => {
  const host = process.env.SMTP_HOST || "";
  const configuredPort = getSmtpPort();
  const configuredSecure = process.env.SMTP_SECURE === "true";
  const attempts: SmtpAttempt[] = [{ host, port: configuredPort, secure: configuredSecure }];

  // Some providers block one SMTP port. For Gmail, try both standard ports.
  if (host.includes("gmail.com")) {
    if (!attempts.some((item) => item.port === 587)) {
      attempts.push({ host, port: 587, secure: false });
    }
    if (!attempts.some((item) => item.port === 465)) {
      attempts.push({ host, port: 465, secure: true });
    }
  }

  return attempts;
};

const getTransporter = (attempt: SmtpAttempt) => {
  const rawPass = process.env.SMTP_PASS || "";
  // Gmail app passwords are shown in grouped format; normalize accidental spaces.
  const password = attempt.host.includes("gmail.com") ? rawPass.replace(/\s+/g, "") : rawPass;
  return nodemailer.createTransport({
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
  });
};

const isRetryableError = (error: unknown) => {
  const code = (error as { code?: string })?.code || "";
  const message = (error as { message?: string })?.message || "";
  return (
    code === "ETIMEDOUT" ||
    code === "ESOCKET" ||
    message.includes("Connection timeout")
  );
};

const sendMailWithRetry = async (mail: SendMailOptions) => {
  const attempts = getSmtpAttempts();
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
