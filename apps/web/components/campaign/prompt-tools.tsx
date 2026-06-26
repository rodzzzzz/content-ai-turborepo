import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { DatabaseIcon, Settings2Icon } from 'lucide-react';
import { Switch } from '../ui/switch';
import { PromptImprover } from './prompt-improver';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

interface PromptToolsProps {
    input: string;
    setInput: (value: string) => void;
    gatherCompanyKnowledge: boolean;
    setGatherCompanyKnowledge: (value: boolean) => void;
    deepResearch: boolean;
    disabled?: boolean;
}

export function PromptTools({
    input,
    setInput,
    gatherCompanyKnowledge,
    setGatherCompanyKnowledge,
    deepResearch,
    disabled = false,
}: PromptToolsProps) {
    return (
        <Popover>
            <Tooltip>
                <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            disabled={disabled}
                        >
                            <Settings2Icon className="h-4 w-4" />
                        </Button>
                    </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent side="left">
                    <p>Prompt Tools</p>
                </TooltipContent>
            </Tooltip>
            <PopoverContent align="end" side="top" className="p-2">
                <div className="flex flex-col">
                    <Label
                        htmlFor="gather-company-knowledge"
                        className="flex items-center justify-between rounded-md p-2 hover:bg-accent"
                    >
                        <div className="flex items-center gap-2 text-xs">
                            <DatabaseIcon className="h-4 w-4 stroke-blue-500" />
                            Gather Company Knowledge
                        </div>
                        <Switch
                            id="gather-company-knowledge"
                            className="h-4 w-8"
                            thumbClassName="h-3 w-3 [state=checked]:translate-x-3"
                            checked={gatherCompanyKnowledge}
                            onCheckedChange={setGatherCompanyKnowledge}
                            disabled={disabled}
                        />
                    </Label>

                    <PromptImprover
                        currentInput={input}
                        onImprovedPrompt={(improvedPrompt) => {
                            setInput(improvedPrompt);
                        }}
                        disabled={disabled || deepResearch}
                    />
                </div>
            </PopoverContent>
        </Popover>
    );
}
