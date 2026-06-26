import { CircleHelpIcon, DatabaseIcon, Loader2 } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { isEmpty } from 'lodash';

interface CompanyKnowledge {
    type: 'company';
    content: {
        url: string;
        title: string;
        content: string;
    };
}

interface AdditionalKnowledge {
    type: 'additional';
    content: {
        answer: string;
        question: string;
    };
}

export type KnowledgeSource = CompanyKnowledge[] | AdditionalKnowledge[];

export function KnowledgeSourcesLoading() {
    return (
        <div className="flex items-center gap-2 py-4 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <p className="animate-pulse text-sm">
                Searching for relevant information...
            </p>
        </div>
    );
}

// const KnowledgeSourcesDisplay = ({
//     sources,
// }: {
//     sources: KnowledgeSource[];
// }) => (
//     <div className="flex w-fit gap-2 rounded-full border bg-muted px-2 py-1">
//         <div className="flex items-center gap-2">
//             <p className="text-xs font-medium text-muted-foreground">Sources</p>
//         </div>
//         <div className="flex gap-1">
//             {sources.map(
//                 ({ type, content }, sourceIndex) =>
//                     {
//                     if (type === 'company') {
//                         return (
//                         <Tooltip key={`${sourceIndex}-company`}>
//                                     <TooltipTrigger asChild>
//                                         <div>
//                                             <DatabaseIcon className="h-4 w-4 text-muted-foreground" />
//                                         </div>
//                                     </TooltipTrigger>
//                                     <TooltipContent className="flex max-w-md flex-col gap-2 border border-border bg-background text-foreground shadow-sm">
//                                         <h3 className="text-sm font-medium">
//                                             {content.content.title}
//                                         </h3>
//                                         <p className="line-clamp-4 text-xs text-muted-foreground">
//                                             {content.content.content}
//                                         </p>
//                                         <p className="text-xs italic">
//                                             {content.url}
//                                         </p>
//                                     </TooltipContent>
//                                 </Tooltip>
//                             );
//                     }

//                     if (type === 'additional') {

//                             return (
//                                 <Tooltip key={`${sourceIndex}-additional`}>
//                                     <TooltipTrigger asChild>
//                                         <div>
//                                             <CircleHelpIcon className="h-4 w-4 text-muted-foreground" />
//                                         </div>
//                                     </TooltipTrigger>
//                                     <TooltipContent className="flex max-w-md flex-col gap-2 border border-border bg-background text-foreground shadow-sm">
//                                         <h3 className="text-sm font-medium">
//                                             {content.question}
//                                         </h3>
//                                         <p className="text-xs text-muted-foreground">
//                                             {content.answer}
//                                         </p>
//                                     </TooltipContent>
//                                 </Tooltip>
//                             );
//                     }
//                 })}
//             </div>
//         </div>
//     </div>);

export function KnowledgeSources({ result }: { result: KnowledgeSource }) {
    if (isEmpty(result)) {
        return (
            <div className="flex items-center gap-2 py-1 text-sm text-muted-foreground">
                <CircleHelpIcon className="h-4 w-4" />
                <p>No sources found.</p>
            </div>
        );
    }

    return (
        <div className="py-2">
            <div className="flex w-fit gap-2 rounded-full border bg-muted px-2 py-1">
                <div className="flex items-center gap-2">
                    <p className="text-xs font-medium text-muted-foreground">
                        Sources
                    </p>
                </div>
                <div className="flex gap-1">
                    {result.map((source, index) => {
                        if (source.type === 'company') {
                            return (
                                <Tooltip key={`${index}-company`}>
                                    <TooltipTrigger asChild>
                                        <div>
                                            <DatabaseIcon className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent className="flex max-w-md flex-col gap-2 border border-border bg-background text-foreground shadow-sm">
                                        <h3 className="text-sm font-medium">
                                            {source.content.title}
                                        </h3>
                                        <p className="line-clamp-4 text-xs text-muted-foreground">
                                            {source.content.content}
                                        </p>
                                        <p className="text-xs italic">
                                            {source.content.url}
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            );
                        }

                        if (source.type === 'additional') {
                            return (
                                <Tooltip key={`${index}-additional`}>
                                    <TooltipTrigger asChild>
                                        <div>
                                            <CircleHelpIcon className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent className="flex max-w-md flex-col gap-2 border border-border bg-background text-foreground shadow-sm">
                                        <h3 className="text-sm font-medium">
                                            {source.content.question}
                                        </h3>
                                        <p className="text-xs text-muted-foreground">
                                            {source.content.answer}
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            );
                        }
                    })}
                </div>
            </div>
        </div>
    );
}
