import { Resend } from 'resend';
import { WelcomeEmail } from '@/emails/welcome-email';
import { ResetPasswordEmail } from '@/emails/reset-password-email';
import { TwoFactorEmail } from '@/emails/two-factor-email';

const resend = new Resend(process.env.RESEND_API_KEY);
const sendingEmail =
    process.env.SENDING_EMAIL || 'accounts@transactional.gocontentai.com';

const domain = process.env.NEXT_PUBLIC_APP_URL;

export const sendTwoFactorTokenEmail = async (
    email: string,
    name: string,
    token: string,
) => {
    await resend.emails.send({
        from: `Content AI <${sendingEmail}>`,
        to: email,
        subject: '2FA Code',
        react: TwoFactorEmail({ username: name, code: token }),
    });
};

export const sendPasswordResetEmail = async (
    email: string,
    name: string,
    token: string,
) => {
    const resetLink = `${domain}/auth/new-password?token=${token}`;

    await resend.emails.send({
        from: `Content AI <${sendingEmail}>`,
        to: email,
        subject: 'Reset your password',
        react: ResetPasswordEmail({ username: name, resetLink }),
    });
};

export const sendVerificationEmail = async (
    email: string,
    name: string,
    token: string,
) => {
    const confirmLink = `${domain}/auth/new-verification?token=${token}`;

    await resend.emails.send({
        from: `Content AI <${sendingEmail}>`,
        to: email,
        subject: 'Confirm your email',
        react: WelcomeEmail({ username: name, confirmLink }),
    });
};
