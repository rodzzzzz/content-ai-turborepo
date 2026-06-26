'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Blocks, User } from 'lucide-react';
import WritingStyle from './writing-style';
import Interests from './interests';
import PlatformGuidelines from './platform-guideline';

export default function PersonalityBuilder() {
    return (
        <div className="space-y-6">
            <Tabs defaultValue="writingStyle" className="w-full">
                <TabsList className="mb-6 grid w-full grid-cols-2">
                    <TabsTrigger
                        value="writingStyle"
                        className="flex items-center gap-1"
                    >
                        <User className="hidden h-4 w-4 flex-shrink-0 md:block" />
                        Personality
                    </TabsTrigger>

                    <TabsTrigger
                        value="platformGuidelines"
                        className="flex items-center gap-1"
                    >
                        <Blocks className="hidden h-4 w-4 flex-shrink-0 md:block" />
                        Platform Guidelines
                    </TabsTrigger>
                </TabsList>

                <TabsContent
                    value="writingStyle"
                    className="mt-0 flex flex-col gap-6"
                >
                    <WritingStyle />
                    <Interests />
                </TabsContent>
                <TabsContent
                    value="platformGuidelines"
                    className="mt-0 flex flex-col gap-6"
                >
                    <PlatformGuidelines />
                </TabsContent>
            </Tabs>
        </div>
    );
}
