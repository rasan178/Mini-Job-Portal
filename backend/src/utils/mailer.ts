import nodemailer from "nodemailer";
import { buildWelcomeEmail, buildApplicationStatusEmail } from "./emailTemplates";

const getSmtpPort = () => {
  const raw = process.env.SMTP_PORT;
  if (!raw) return 587;
  const parsed = Number(raw);
  return Number.isNaN(parsed) ? 587 : parsed;
};

const isSmtpConfigured = () => {
  return !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  );
};

const getTransporter = () => {
  const secure = process.env.SMTP_SECURE === "true";
  const host = process.env.SMTP_HOST || "";
  const rawPass = process.env.SMTP_PASS || "";
  // Gmail app passwords are shown in grouped format; normalize accidental spaces.
  const password = host.includes("gmail.com") ? rawPass.replace(/\s+/g, "") : rawPass;
  return nodemailer.createTransport({
    host,
    port: getSmtpPort(),
    secure,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
    auth: {
      user: process.env.SMTP_USER,
      pass: password,
    },
  });
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
  const transporter = getTransporter();

  await transporter.sendMail({
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
  const transporter = getTransporter();

  await transporter.sendMail({
    from,
    to,
    subject: email.subject,
    text: email.text,
    html: email.html,
  });
};
