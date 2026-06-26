'use client';

import { generateCampaignTitleAndDescription } from '@/actions/campaign';
import { ChatForm } from '@/components/campaign/chat-form';
import { useCampaignChatStore } from '@/hooks/use-campaign-chat-store';
import { toast } from '@/hooks/use-toast';
import { redirect, useRouter } from 'next/navigation';
import { useState } from 'react';
import { DateRange } from 'react-day-picker';
import { Platform } from '@prisma/client';
import { AnimatePresence, motion } from 'framer-motion';
import { magicShadowVariants } from '@/components/ui/magic-shadow';
import { useCurrentUser } from '@/hooks/use-current-user';
import type { ExtendedUser } from '@/lib/auth-client';
import { DEFAULT_LOGOUT_REDIRECT } from '@/routes';
import { CampaignList } from '@/components/campaign/campaign-list';
import { useUploadThing } from '@/lib/uploadthing';
import { isEmpty } from 'lodash';
import { UIMessage } from 'ai';
import { cn } from '@/lib/utils';

export default function CampaignPage() {
    const user = useCurrentUser();

    if (!user) {
        redirect(DEFAULT_LOGOUT_REDIRECT);
    }

    const router = useRouter();
    const [input, setInput] = useState('');
    const [imageUrl, setImageUrl] = useState<string[]>([]);
    const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([
        Platform.TWITTER,
        Platform.FACEBOOK,
        Platform.LINKEDIN,
    ]);
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [deepResearch, setDeepResearch] = useState(false);
    const [gatherCompanyKnowledge, setGatherCompanyKnowledge] = useState(false);
    const [includeBlogPosts, setIncludeBlogPosts] = useState(false);
    const { createCampaign } = useCampaignChatStore();
    const [status, setStatus] = useState<'ready' | 'submitted'>('ready');
    const [isUploading, setIsUploading] = useState(false);

    // Upload thing hook for image uploads
    const { startUpload } = useUploadThing('postMediaUploader', {
        onClientUploadComplete: async () => {
            setIsUploading(false);
        },
        onUploadError: (error) => {
            console.error('Upload error:', error);
            setIsUploading(false);
            toast({
                title: 'Upload Error',
                description: 'Failed to upload images',
                variant: 'destructive',
            });
        },
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.stopPropagation();
        e.preventDefault();
        if (!input.trim() || isUploading) return;

        setStatus('submitted');

        try {
            const messageContent = input.trim();
            let finalImageUrls: string[] = [];

            // Upload images if any are selected
            if (!isEmpty(imageUrl)) {
                setIsUploading(true);

                // Convert data URLs to File objects
                const files: File[] = [];
                for (const dataUrl of imageUrl) {
                    const response = await fetch(dataUrl);
                    const blob = await response.blob();
                    const file = new File([blob], `image-${Date.now()}.png`, {
                        type: 'image/png',
                    });
                    files.push(file);
                }

                // Upload files
                const uploadResult = await startUpload(files);
                if (uploadResult) {
                    finalImageUrls = uploadResult.map((file) => file.ufsUrl);
                }
            }

            const initialMessage: Omit<UIMessage, 'id'> = {
                role: 'user',
                parts: [
                    ...(finalImageUrls.length > 0
                        ? finalImageUrls.map((url) => ({
                              type: 'file' as const,
                              mediaType: 'image/png',
                              url,
                          }))
                        : []),
                    { type: 'text' as const, text: messageContent },
                ],
            };

            const { title, description } =
                await generateCampaignTitleAndDescription(messageContent);

            // Create campaign with initial message
            const campaign = await createCampaign({
                title,
                description,
                platforms: selectedPlatforms,
                initialMessage: {
                    message: initialMessage,
                    platforms: selectedPlatforms,
                    campaignDateRange: dateRange,
                    deepResearch,
                    gatherCompanyKnowledge,
                    includeBlogPosts,
                },
            });

            if (!campaign) {
                throw new Error('Failed to create campaign');
            }

            // Redirect to campaign chat page
            router.replace(`/campaign/${campaign.id}`);
        } catch (error) {
            console.error('Failed to create campaign:', error);
            toast({
                title: 'Error',
                description: 'Failed to create campaign',
                variant: 'destructive',
            });

            setStatus('ready');
        } finally {
            setIsUploading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            void handleSubmit(e as unknown as React.FormEvent);
        }
    };

    return (
        <div className="flex h-full w-full flex-col items-center gap-12 overscroll-y-auto px-4 pb-12 pt-24 lg:gap-24 lg:pt-40">
            <div className="relative mx-auto flex w-full max-w-3xl flex-col gap-12">
                <AnimatePresence initial={false}>
                    {status === 'ready' && (
                        <motion.div
                            key={`creating-campaign-${status}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.3 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="absolute left-1/2 top-1/2 h-[300px] w-1/2 max-w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-magic mix-blend-multiply blur-3xl filter"
                        />
                    )}
                </AnimatePresence>

                <header className="relative flex w-full flex-col items-center gap-2 text-center">
                    <h1 className="text-pretty text-3xl font-bold leading-none tracking-tight md:text-4xl">
                        Let&apos;s make your next viral campaign!
                    </h1>
                    <p className="max-w-lg text-pretty leading-tight text-muted-foreground md:text-lg">
                        Tell me about your campaign. We will make the contents
                        for you.
                    </p>
                </header>
                <div className="group relative">
                    <AnimatePresence initial={false}>
                        {status === 'submitted' && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.5 }}
                            >
                                <div
                                    className={cn(
                                        magicShadowVariants({
                                            variant: 'animated-sm',
                                        }),
                                        'top-[31px]',
                                    )}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <div className="relative">
                        <ChatForm
                            input={input}
                            setInput={setInput}
                            imageUrl={imageUrl}
                            setImageUrl={setImageUrl}
                            handleSubmit={handleSubmit}
                            handleKeyDown={handleKeyDown}
                            status={status}
                            setMessages={() => {}}
                            selectedPlatforms={selectedPlatforms}
                            setSelectedPlatforms={setSelectedPlatforms}
                            dateRange={dateRange}
                            setDateRange={setDateRange}
                            placeholder="Tell me about your campaign..."
                            deepResearch={deepResearch}
                            gatherCompanyKnowledge={gatherCompanyKnowledge}
                            setDeepResearch={setDeepResearch}
                            setGatherCompanyKnowledge={
                                setGatherCompanyKnowledge
                            }
                            includeBlogPosts={includeBlogPosts}
                            setIncludeBlogPosts={setIncludeBlogPosts}
                            stop={() => {}}
                        />
                    </div>
                </div>
            </div>
            <CampaignList timeZone={(user as unknown as ExtendedUser).timeZone} />
        </div>
    );
}
