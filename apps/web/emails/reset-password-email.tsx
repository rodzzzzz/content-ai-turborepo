import {
    Body,
    Button,
    Container,
    Head,
    Heading,
    Html,
    Img,
    Link,
    Preview,
    Section,
    Text,
    Hr,
} from '@react-email/components';
import { Tailwind } from '@react-email/tailwind';

interface ResetPasswordEmailProps {
    username: string;
    resetLink: string;
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://gocontentai.com';

export const ResetPasswordEmail = ({
    username,
    resetLink,
}: ResetPasswordEmailProps) => {
    return (
        <Html>
            <Head />
            <Preview>Reset your Content AI password</Preview>
            <Tailwind
                config={{
                    theme: {
                        extend: {
                            colors: {
                                primary: '#000000',
                                'primary-foreground': '#ffffff',
                                background: '#ffffff',
                                muted: '#f4f4f5',
                                'muted-foreground': '#71717a',
                            },
                        },
                    },
                }}
            >
                <Body className="bg-background font-sans">
                    <Container className="mx-auto px-4 py-8">
                        <Section className="rounded-lg bg-card p-8 shadow-sm">
                            <Img
                                src={`${baseUrl}/logo.svg`}
                                alt="Content AI"
                                width={80}
                                height={80}
                            />
                            <Heading className="my-8 text-3xl font-bold">
                                Reset Your Password
                            </Heading>

                            <Text className="mb-4 text-base text-muted-foreground">
                                Hi {username},
                            </Text>

                            <Text className="mb-4 text-base text-muted-foreground">
                                We received a request to reset your password for
                                your Content AI account.
                            </Text>

                            <Text className="mb-6 text-base text-muted-foreground">
                                Click the button below to reset your password:
                            </Text>

                            <Section className="mb-6 text-center">
                                <Button
                                    className="w-full rounded-md bg-primary py-3 font-medium text-primary-foreground"
                                    href={resetLink}
                                >
                                    Reset Password
                                </Button>
                            </Section>

                            <Text className="text-base text-muted-foreground">
                                This link will expire in 1 hour. If you didn't
                                request a password reset, you can safely ignore
                                this email.
                            </Text>
                        </Section>

                        <Hr />

                        <Text className="text-center text-xs text-muted-foreground">
                            © {new Date().getFullYear()} Content AI. All rights
                            reserved.
                        </Text>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

export default ResetPasswordEmail;
