type WelcomeEmailParams = {
  name: string;
  role: "candidate" | "employer" | "admin";
  appName: string;
  appUrl: string;
};

export const buildWelcomeEmail = ({
  name,
  role,
  appName,
  appUrl,
}: WelcomeEmailParams) => {
  const safeName = name.trim() || "there";
  const roleLabel =
    role === "candidate"
      ? "Candidate"
      : role === "employer"
      ? "Employer"
      : "Admin";

  const subject = `Welcome to ${appName}, ${safeName}!`;
  const text = [
    `Hi ${safeName},`,
    "",
    `Welcome to ${appName}. Your account is ready as ${roleLabel}.`,
    "",
    `Start here: ${appUrl}`,
    "",
    "Thanks,",
    `${appName} Team`,
  ].join("\n");

  const html = `
  <div style="font-family: Arial, sans-serif; background: #f6f3ee; padding: 24px;">
    <table style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #eee; overflow: hidden;">
      <tr>
        <td style="padding: 20px 24px; background: #FF7F11; color: #ffffff; font-size: 20px; font-weight: 700;">
          Welcome to ${appName}
        </td>
      </tr>
      <tr>
        <td style="padding: 24px; color: #1b1b1b; line-height: 1.5;">
          <p style="margin-top: 0;">Hi ${safeName},</p>
          <p>Your account has been created successfully.</p>
          <p><strong>Role:</strong> ${roleLabel}</p>
          <p style="margin-bottom: 24px;">You can now sign in and start using ${appName}.</p>
          <a href="${appUrl}" style="display: inline-block; padding: 12px 18px; background: #FF7F11; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600;">
            Go to ${appName}
          </a>
          <p style="margin-top: 24px; margin-bottom: 0; color: #5b5b5b;">
            Thanks,<br />
            ${appName} Team
          </p>
        </td>
      </tr>
    </table>
  </div>
  `;

  return { subject, text, html };
};

type StatusEmailParams = {
  name: string;
  jobTitle: string;
  status: string;
  appName: string;
  appUrl: string;
};

export const buildApplicationStatusEmail = ({
  name,
  jobTitle,
  status,
  appName,
  appUrl,
}: StatusEmailParams) => {
  const safeName = name.trim() || "there";
  const subject = `Update on your application for ${jobTitle} — ${status}`;

  const text = [
    `Hi ${safeName},`,
    "",
    `Your application for "${jobTitle}" has been updated to: ${status}.`,
    "",
    `You can view the job and your application here: ${appUrl}/jobs`,
    "",
    "Thanks,",
    `${appName} Team`,
  ].join("\n");

  const html = `
  <div style="font-family: Arial, sans-serif; background: #f6f3ee; padding: 24px;">
    <table style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #eee; overflow: hidden;">
      <tr>
        <td style="padding: 20px 24px; background: #FF7F11; color: #ffffff; font-size: 20px; font-weight: 700;">
          Application update
        </td>
      </tr>
      <tr>
        <td style="padding: 24px; color: #1b1b1b; line-height: 1.5;">
          <p style="margin-top: 0;">Hi ${safeName},</p>
          <p>Your application for <strong>${jobTitle}</strong> has been updated to:</p>
          <p style="font-size: 18px; font-weight: 700; margin: 12px 0;">${status}</p>
          <p style="margin-bottom: 24px;">You can view the job or your application in the portal.</p>
          <a href="${appUrl}/jobs" style="display: inline-block; padding: 12px 18px; background: #FF7F11; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600;">
            View jobs
          </a>
          <p style="margin-top: 24px; margin-bottom: 0; color: #5b5b5b;">
            Thanks,<br />
            ${appName} Team
          </p>
        </td>
      </tr>
    </table>
  </div>
  `;

  return { subject, text, html };
};
