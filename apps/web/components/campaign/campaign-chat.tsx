'use client';

import { useChat } from '@ai-sdk/react';
import { Fragment, useEffect, useRef, useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { DefaultChatTransport, UIMessage } from 'ai';
import { DateRange } from 'react-day-picker';
import { GlobeIcon, SearchCheckIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import {
    Conversation,
    ConversationContent,
    ConversationScrollButton,
} from '../ai-elements/conversation';
import { Message, MessageContent } from '../ai-elements/message';
import { Response } from '../ai-elements/response';
import {
    Reasoning,
    ReasoningContent,
    ReasoningTrigger,
} from '../ai-elements/reasoning';
import { ChatForm } from './chat-form';
import { setHours } from 'date-fns';
import { useCampaignChatStore } from '@/hooks/use-campaign-chat-store';
import { Platform } from '@prisma/client';
import { isEmpty } from 'lodash';
import { ToolCallAccordion } from './tool-call-accordion';
import {
    KnowledgeSource,
    KnowledgeSources,
    KnowledgeSourcesLoading,
} from './knowledge-sources';
import { useCampaignPreview } from '@/contexts/campaign-preview-context';
import { CampaignType } from '@/types/campaign';
import { CampaignPlan, PromptStreamingDisplay } from './campaign-plan';
import { CampaignUpdateIndicator } from './campaign-update-indicator';
import {
    Source,
    Sources,
    SourcesContent,
    SourcesTrigger,
} from '../ai-elements/sources';
import { useSubscription } from '@/contexts/subscription-context';
import { Button } from '@/components/ui/button';
import { LoadingMessage } from './loading-message';
import { DiffRegistry } from '@/types/campaign-update';

interface CampaignChatProps {
    campaignId: string;
}

type InitialMessage = {
    message: string;
    platforms: Platform[];
    campaignDateRange?: DateRange;
    deepResearch: boolean;
    gatherCompanyKnowledge: boolean;
};

export function CampaignChat({ campaignId }: CampaignChatProps) {
    const [input, setInput] = useState('');
    const [imageUrl, setImageUrl] = useState<string[]>([]);
    const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([
        Platform.FACEBOOK,
        Platform.TWITTER,
        Platform.LINKEDIN,
    ] as Platform[]);
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [deepResearch, setDeepResearch] = useState(false);
    const [gatherCompanyKnowledge, setGatherCompanyKnowledge] = useState(false);
    const [includeBlogPosts, setIncludeBlogPosts] = useState(false);
    const initializationRef = useRef(false);

    const { currentCampaign, refetch } = useCampaignChatStore(campaignId);
    const { campaignPlan, pendingDiffs } = useCampaignPreview();
    const { refetch: refetchSubscription } = useSubscription();

    // Only use existing messages if they exist, otherwise start with empty array
    const initialMessages: UIMessage[] =
        currentCampaign?.messages && !isEmpty(currentCampaign.messages)
            ? currentCampaign.messages.map((msg) => {
                return {
                    id: msg.id,
                    role: msg.role as UIMessage['role'],
                    parts: msg.parts as UIMessage['parts'],
                };
            })
            : [];

    const {
        messages,
        setMessages,
        sendMessage,
        status,
        stop,
        error,
        regenerate,
    } = useChat({
        id: campaignId,
        messages: initialMessages,
        transport: new DefaultChatTransport({
            api: '/api/campaign',
        }),
        onError: (error) => {
            console.error('Chat error:', error);
            // Error will be displayed in UI, toast is just for notification
            toast({
                title: 'Error',
                description: 'Something went wrong. Please try again.',
                variant: 'destructive',
            });
        },
        onFinish: async () => {
            setDeepResearch(false);
            setGatherCompanyKnowledge(false);

            refetch();
            refetchSubscription();
        },
    });

    useEffect(() => {
        if (initializationRef.current) return;
        initializationRef.current = true;

        if (currentCampaign) {

            const initialMessage =
                currentCampaign.initialMessage as unknown as InitialMessage;

            // Only send initial message if there are no existing messages in the chat
            if (isEmpty(currentCampaign.messages) && initialMessage) {
                const {
                    platforms,
                    campaignDateRange,
                    deepResearch,
                    gatherCompanyKnowledge,
                } = initialMessage;

                setSelectedPlatforms(platforms);
                setDateRange(campaignDateRange);
                setDeepResearch(deepResearch);
                setGatherCompanyKnowledge(gatherCompanyKnowledge);

                // Send the initial message only if it hasn't been processed yet
                sendMessage(initialMessage.message as unknown as UIMessage, {
                    body: {
                        dateRange: {
                            from: campaignDateRange?.from
                                ? setHours(
                                    campaignDateRange.from,
                                    new Date().getHours(),
                                )
                                : undefined,
                            to: campaignDateRange?.to
                                ? setHours(
                                    campaignDateRange.to,
                                    new Date().getHours(),
                                )
                                : undefined,
                        },
                        selectedPlatforms: platforms,
                        deepResearch,
                        gatherCompanyKnowledge,
                    },
                });
            }
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentCampaign, initialMessages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.stopPropagation();
        e.preventDefault();
        if (!input.trim() || status === 'submitted' || status === 'streaming')
            return;

        // If there's an error, remove the last user message before retrying
        if (error != null) {
            console.log(messages);
            setMessages(
                messages.at(-1)?.role === 'user'
                    ? messages.slice(0, -1)
                    : messages,
            );
        }

        try {
            const messageContent = input.trim();

            setInput('');

            await sendMessage(
                {
                    role: 'user',
                    parts: [{ type: 'text', text: messageContent }],
                },
                {
                    body: {
                        dateRange: {
                            from: dateRange?.from
                                ? setHours(
                                    dateRange.from,
                                    new Date().getHours(),
                                )
                                : undefined,
                            to: dateRange?.to
                                ? setHours(dateRange.to, new Date().getHours())
                                : undefined,
                        },
                        selectedPlatforms,
                        deepResearch,
                        gatherCompanyKnowledge,
                        latestCampaign: campaignPlan,
                        diffRegistry: pendingDiffs,
                    },
                },
            );
        } catch (error) {
            console.error('Failed to send message:', error);
            toast({
                title: 'Error',
                description: 'Something went wrong. Please try again.',
                variant: 'destructive',
            });
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            void handleSubmit(e as unknown as React.FormEvent);
        }
    };

    return (
        <>
            <Conversation>
                <ConversationContent className="space-y-4">
                    {messages.map((message, index) => {
                        return (
                            <div key={index}>
                                {message.parts.map((part, i) => {
                                    switch (part.type) {
                                        case 'step-start':
                                            // show step boundaries as horizontal lines:
                                            return index > 0 ? (
                                                <div
                                                    key={`${message.id}-${i}`}
                                                    className="py-1"
                                                ></div>
                                            ) : null;
                                        case 'text':
                                            return (
                                                <Fragment
                                                    key={`${message.id}-${i}`}
                                                >
                                                    <Message
                                                        from={message.role}
                                                    >
                                                        <MessageContent>
                                                            <Response>
                                                                {part.text}
                                                            </Response>
                                                        </MessageContent>
                                                    </Message>
                                                </Fragment>
                                            );
                                        case 'tool-web_search':
                                            switch (part.state) {
                                                case 'input-available':
                                                case 'input-streaming':
                                                    return (
                                                        <div
                                                            key={`${message.id}-${i}`}
                                                            className="flex animate-pulse items-center gap-2 py-3 text-sm text-muted-foreground"
                                                        >
                                                            <GlobeIcon className="h-4 w-4 flex-shrink-0" />
                                                            Searching the web...
                                                        </div>
                                                    );
                                                case 'output-available':
                                                    const input =
                                                        part.input as {
                                                            action: {
                                                                query: string;
                                                            };
                                                        };
                                                    return (
                                                        <div
                                                            key={`${message.id}-${i}`}
                                                            className="flex max-w-2xl items-center gap-2 py-3 text-sm text-muted-foreground"
                                                        >
                                                            <SearchCheckIcon className="h-4 w-4 flex-shrink-0" />
                                                            <p className="line-clamp-1">{`Searched the web for: ${input.action.query}`}</p>
                                                        </div>
                                                    );
                                                default:
                                                    return JSON.stringify(part);
                                            }
                                        case 'tool-youtube_scraper':
                                        case 'tool-twitter_scraper':
                                        case 'tool-get_user_platform_insights':
                                            return (
                                                <ToolCallAccordion
                                                    key={`${part.toolCallId}-${i}`}
                                                    toolName={part.type.replace(
                                                        'tool-',
                                                        '',
                                                    )}
                                                    result={part.output}
                                                    isRunning={
                                                        status ===
                                                        'streaming' &&
                                                        i ===
                                                        message.parts
                                                            .length -
                                                        1 &&
                                                        message.id ===
                                                        messages.at(-1)?.id
                                                    }
                                                />
                                            );
                                        case 'tool-get_company_knowledge':
                                            return (
                                                <div
                                                    key={`${message.id}-tool-${i}`}
                                                    className="w-full max-w-3xl"
                                                >
                                                    <motion.div
                                                        layout
                                                        initial={{
                                                            opacity: 0,
                                                            y: 10,
                                                        }}
                                                        animate={{
                                                            opacity: 1,
                                                            y: 0,
                                                        }}
                                                        transition={{
                                                            duration: 0.2,
                                                        }}
                                                    >
                                                        {part.state ===
                                                            'output-available' ? (
                                                            <KnowledgeSources
                                                                result={
                                                                    part.output as KnowledgeSource
                                                                }
                                                            />
                                                        ) : (
                                                            <KnowledgeSourcesLoading />
                                                        )}
                                                    </motion.div>
                                                </div>
                                            );
                                        case 'reasoning':
                                            return part.text ? (
                                                <Reasoning
                                                    key={`${message.id}-${i}`}
                                                    className="w-full"
                                                    isStreaming={
                                                        status ===
                                                        'streaming' &&
                                                        i ===
                                                        message.parts
                                                            .length -
                                                        1 &&
                                                        message.id ===
                                                        messages.at(-1)?.id
                                                    }
                                                >
                                                    <ReasoningTrigger />
                                                    <ReasoningContent>
                                                        {part.text}
                                                    </ReasoningContent>
                                                </Reasoning>
                                            ) : null;
                                        case 'tool-add_content_ideas':
                                        case 'tool-delete_content_ideas':
                                            return (
                                                <CampaignUpdateIndicator
                                                    key={`${part.toolCallId}-${i}`}
                                                    toolName={part.type.replace('tool-', '')}
                                                    state={part.state}
                                                    output={
                                                        part.state === 'output-available'
                                                            ? (part.output as DiffRegistry)
                                                            : undefined
                                                    }
                                                    errorText={part.errorText}
                                                />
                                            );
                                        case 'tool-create_campaign_plan':
                                        case 'tool-update_campaign_plan':
                                            switch (part.state) {
                                                case 'input-streaming':
                                                    if (
                                                        part.input &&
                                                        typeof part.input ===
                                                        'object'
                                                    ) {
                                                        const input =
                                                            part.input as {
                                                                prompt: string;
                                                            };
                                                        return (
                                                            <PromptStreamingDisplay
                                                                key={`${message.id}-${i}`}
                                                                prompt={
                                                                    input.prompt ||
                                                                    ''
                                                                }
                                                                title="Creating prompt..."
                                                            />
                                                        );
                                                    }
                                                case 'input-available':
                                                    return (
                                                        <div
                                                            key={`${message.id}-${i}`}
                                                            className="py-4"
                                                        >
                                                            <LoadingMessage message="Preparing campaign plan..." />
                                                        </div>
                                                    );
                                                case 'output-available':
                                                    return (
                                                        <CampaignPlan
                                                            key={
                                                                part.toolCallId
                                                            }
                                                            campaign={
                                                                part.output as CampaignType
                                                            }
                                                        />
                                                    );
                                                case 'output-error':
                                                    return (
                                                        <div
                                                            key={`${message.id}-${i}`}
                                                            className="text-sm text-muted-foreground"
                                                        >
                                                            {part.errorText}
                                                        </div>
                                                    );
                                            }
                                        case 'source-url':
                                            return null;
                                        default:
                                            return <pre key={`${message.id}-${i}`} className="text-pretty rounded-md bg-muted p-4 text-xs">{JSON.stringify(part, null, 2)}</pre>;
                                    }
                                })}
                                {message.role === 'assistant' &&
                                    message.parts.some(
                                        (part) => part.type === 'source-url',
                                    ) && (
                                        <Sources>
                                            <SourcesTrigger
                                                count={
                                                    message.parts.filter(
                                                        (part) =>
                                                            part.type ===
                                                            'source-url',
                                                    ).length
                                                }
                                            />
                                            {message.parts.map((part, i) => {
                                                switch (part.type) {
                                                    case 'source-url':
                                                        return (
                                                            <SourcesContent
                                                                key={`${message.id}-${i}`}
                                                            >
                                                                <Source
                                                                    key={`${message.id}-${i}`}
                                                                    href={
                                                                        part.url
                                                                    }
                                                                    title={
                                                                        part.url
                                                                    }
                                                                />
                                                            </SourcesContent>
                                                        );
                                                }
                                            })}
                                        </Sources>
                                    )}
                            </div>
                        );
                    })}
                    {status === 'submitted' && (
                        <Message from="assistant">
                            <MessageContent className="overflow-visible">
                                <LoadingMessage />
                            </MessageContent>
                        </Message>
                    )}
                    {error && (
                        <Message from="assistant">
                            <MessageContent>
                                <div className="rounded-lg border border-destructive p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-destructive">
                                                Uh oh! Something went wrong
                                            </p>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                An error occurred while
                                                processing your request. Please
                                                try again.
                                            </p>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => regenerate()}
                                            className="shrink-0"
                                        >
                                            Retry
                                        </Button>
                                    </div>
                                </div>
                            </MessageContent>
                        </Message>
                    )}
                </ConversationContent>

                <ConversationScrollButton />
            </Conversation>

            <ChatForm
                input={input}
                setInput={setInput}
                imageUrl={imageUrl}
                setImageUrl={setImageUrl}
                handleSubmit={handleSubmit}
                handleKeyDown={handleKeyDown}
                status={status}
                stop={stop}
                setMessages={setMessages}
                selectedPlatforms={selectedPlatforms}
                setSelectedPlatforms={setSelectedPlatforms}
                dateRange={dateRange}
                setDateRange={setDateRange}
                deepResearch={deepResearch}
                gatherCompanyKnowledge={gatherCompanyKnowledge}
                setDeepResearch={setDeepResearch}
                setGatherCompanyKnowledge={setGatherCompanyKnowledge}
                includeBlogPosts={includeBlogPosts}
                setIncludeBlogPosts={setIncludeBlogPosts}
                placeholder={
                    campaignPlan
                        ? 'What do you want to improve with your campaign?'
                        : undefined
                }
            />
        </>
    );
}