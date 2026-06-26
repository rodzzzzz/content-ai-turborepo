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

interface WelcomeEmailProps {
    username: string;
    confirmLink: string;
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://gocontentai.com';

export const WelcomeEmail = ({ username, confirmLink }: WelcomeEmailProps) => {
    return (
        <Html>
            <Head />
            <Preview>Welcome to Content AI - Please confirm your email</Preview>
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
                                Welcome to Content AI!
                            </Heading>

                            <Text className="mb-4 text-base text-muted-foreground">
                                Hi {username},
                            </Text>

                            <Text className="mb-4 text-base text-muted-foreground">
                                Thank you for joining Content AI! We're excited
                                to have you on board.
                            </Text>

                            <Text className="mb-6 text-base text-muted-foreground">
                                To get started, please confirm your email
                                address by clicking the button below:
                            </Text>

                            <Section className="mb-6 text-center">
                                <Button
                                    className="w-full rounded-md bg-primary py-3 font-medium text-primary-foreground"
                                    href={confirmLink}
                                >
                                    Confirm Email Address
                                </Button>
                            </Section>

                            <Text className="mb-4 text-base text-muted-foreground">
                                If the button above doesn't work, you can also
                                copy and paste this link into your browser:
                            </Text>

                            <Text className="mb-6 break-all text-base text-muted-foreground">
                                <Link href={confirmLink}>{confirmLink}</Link>
                            </Text>

                            <Text className="text-base text-muted-foreground">
                                This link will expire in 24 hours. If you didn't
                                create an account with Content AI, you can
                                safely ignore this email.
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

export default WelcomeEmail;
