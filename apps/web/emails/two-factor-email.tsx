import {
    Body,
    Container,
    Head,
    Heading,
    Html,
    Preview,
    Section,
    Text,
    Hr,
    Img,
} from '@react-email/components';
import { Tailwind } from '@react-email/tailwind';

interface TwoFactorEmailProps {
    username: string;
    code: string;
}

const baseUrl = 'https://gocontentai.com';

export const TwoFactorEmail = ({ username, code }: TwoFactorEmailProps) => {
    return (
        <Html>
            <Head />
            <Preview>Your Content AI verification code</Preview>
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
                                Your Verification Code
                            </Heading>

                            <Text className="mb-4 text-base text-muted-foreground">
                                Hi {username},
                            </Text>

                            <Text className="mb-4 text-base text-muted-foreground">
                                Here is your verification code for Content AI:
                            </Text>

                            <Section className="mb-6 bg-muted text-center">
                                <Text className="text-4xl font-bold tracking-widest text-primary">
                                    {code}
                                </Text>
                            </Section>

                            <Text className="mb-4 text-base text-muted-foreground">
                                This code will expire in 1 hour. If you didn't
                                request this code, please ignore this email and
                                ensure your account is secure.
                            </Text>

                            <Text className="text-base text-muted-foreground">
                                For security reasons, please do not share this
                                code with anyone.
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

export default TwoFactorEmail;
