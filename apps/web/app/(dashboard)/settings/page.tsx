import { FolderIcon } from 'lucide-react';

import { AudioLinesIcon, DatabaseIcon } from 'lucide-react';
import Link from 'next/link';

export default function Settings() {
    <div className="flex-1 p-4 lg:py-8 lg:pr-8">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Link href="/assets/knowledge">
                <div className="flex items-center gap-4 rounded-lg border bg-white p-4 transition-all duration-300 hover:bg-gray-50 lg:flex-col lg:items-start">
                    <DatabaseIcon className="h-10 w-10 stroke-muted-foreground stroke-1" />

                    <div className="flex flex-col">
                        <h2 className="text-base font-medium lg:text-lg">
                            Knowledge Base
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Manage your knowledge base
                        </p>
                    </div>
                </div>
            </Link>
            <Link href="/assets/tone">
                <div className="flex items-center gap-4 rounded-lg border bg-white p-4 transition-all duration-300 hover:bg-gray-50 lg:flex-col lg:items-start">
                    <AudioLinesIcon className="h-10 w-10 stroke-muted-foreground stroke-1" />
                    <div className="flex flex-col">
                        <h2 className="text-base font-medium lg:text-lg">
                            Tone & Personality
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Manage your tone and personality
                        </p>
                    </div>
                </div>
            </Link>
            <Link href="/assets/media">
                <div className="flex items-center gap-4 rounded-lg border bg-white p-4 transition-all duration-300 hover:bg-gray-50 lg:flex-col lg:items-start">
                    <FolderIcon className="h-10 w-10 stroke-muted-foreground stroke-1" />
                    <div className="flex flex-col">
                        <h2 className="text-base font-medium lg:text-lg">
                            Media Storage
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Manage your media
                        </p>
                    </div>
                </div>
            </Link>
        </div>
    </div>;
}
