'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import {
    Loader2,
    ChevronDown,
    Search,
    ChevronUp,
    CheckCircle2Icon,
    ArrowUpRightIcon,
    FileTextIcon,
    Trash2Icon,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { format } from 'date-fns';
import ExtractionDeleteDialog from './extraction-delete-dialog';
import ExtractDialog from './extract-dialog';
import ContentDialog from './content-dialog';
import { WebsiteExtractionSkeleton } from './website-extraction-skeleton';
import {
    useWebsiteExtractions,
    useCachedCrawlData,
} from '@/hooks/use-knowledge-query';
import {
    useCrawlWebsite,
    useExtractContent,
} from '@/hooks/use-knowledge-mutations';
import ExtractionRefreshButton from './extraction-refresh-button';
import { useQueryClient } from '@tanstack/react-query';
import { deleteCachedCrawlData } from '@/actions/website-extraction';
import { Separator } from '@/components/ui/separator';

type UrlMode = 'exact' | 'path' | 'domain';

export default function WebsiteExtraction() {
    const queryClient = useQueryClient();

    const [urlMode, setUrlMode] = useState<UrlMode>('exact');
    const [websiteUrl, setWebsiteUrl] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [selectedLinks, setSelectedLinks] = useState<string[]>([]);
    const [isCancelling, setIsCancelling] = useState(false);

    // Query hooks
    const { data: extractedLinks = [], isLoading: isExtractedLinksLoading } =
        useWebsiteExtractions();
    const { data: cachedData, isLoading: isCachedDataLoading } =
        useCachedCrawlData();

    // Mutation hooks
    const { mutateAsync: crawlWebsite, isPending: isCrawling } =
        useCrawlWebsite();
    const { mutate: extractContent } = useExtractContent();

    const isLoading = isExtractedLinksLoading || isCachedDataLoading;
    const hasCrawledUrls = Boolean(cachedData?.crawledUrls?.length);

    // Initialize from cached data if available
    useEffect(() => {
        if (cachedData) {
            setWebsiteUrl(cachedData.url);
            setUrlMode(cachedData.mode as UrlMode);
        }
    }, [cachedData]);

    const urlModeLabels = {
        exact: 'Exact URL',
        path: 'All URLs with the path',
        domain: 'All URLs in this domain',
    };

    const handleCrawl = async () => {
        if (!websiteUrl) {
            toast({
                description: 'Please enter a website URL',
                variant: 'destructive',
            });
            return;
        }

        if (
            urlMode === 'exact' &&
            extractedLinks.some((link) => link.url === websiteUrl)
        ) {
            toast({
                description: 'Website already crawled',
            });
            return;
        }

        const result = await crawlWebsite({ url: websiteUrl, mode: urlMode });

        if (result.success && result.data?.length === 1) {
            if (
                extractedLinks.some((link) => link.url === result.data[0].url)
            ) {
                toast({
                    description: 'Website already crawled',
                });
                return;
            }

            extractContent([result.data[0].url as string]);
        }
    };

    const handleViewAllPages = () => {
        if (hasCrawledUrls) {
            setIsDialogOpen(true);
        }
    };

    const handleCancel = async () => {
        setIsCancelling(true);

        const result = await deleteCachedCrawlData();

        if (result.success) {
            setWebsiteUrl('');
            setUrlMode('exact');
            queryClient.setQueryData(['cachedCrawlData'], null);
        }

        setIsCancelling(false);
    };

    const handleExtract = async (urlsToExtract: string[]) => {
        toast({
            title: 'Extracting content...',
            description: 'Please wait while we extract the content.',
        });

        setIsDialogOpen(false);
        extractContent(urlsToExtract);
    };

    const handleSelectAll = () => {
        if (selectedLinks.length === extractedLinks.length) {
            setSelectedLinks([]);
        } else {
            setSelectedLinks(extractedLinks.map((link) => link.id));
        }
    };

    const handleToggleLink = (linkId: string) => {
        setSelectedLinks((prev) =>
            prev.includes(linkId)
                ? prev.filter((id) => id !== linkId)
                : [...prev, linkId],
        );
    };

    if (isLoading) {
        return <WebsiteExtractionSkeleton />;
    }

    return (
        <Card className="border-0 lg:border">
            <CardHeader className="p-0 pb-6 lg:p-6">
                <CardTitle>Company Information</CardTitle>
                <CardDescription>
                    Train the bot to handle company information using your
                    website.
                </CardDescription>
            </CardHeader>

            <Separator className="hidden lg:block" />

            <CardContent className="p-0 lg:p-6">
                <div className="flex flex-col gap-2">
                    <div>
                        <Label className="mb-1.5 block text-sm font-medium">
                            Enter domain *
                        </Label>
                        <div className="flex items-center gap-2">
                            <div className="inline-flex w-full border-collapse">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="justify-between rounded-r-none border-r-0"
                                            disabled={
                                                isCrawling || hasCrawledUrls
                                            }
                                        >
                                            <span className="w-[100px] truncate text-left">
                                                {urlModeLabels[urlMode]}
                                            </span>
                                            <ChevronDown className="h-4 w-4 flex-shrink-0 opacity-50" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start">
                                        <DropdownMenuItem
                                            onClick={() => setUrlMode('exact')}
                                        >
                                            Exact URL
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => setUrlMode('path')}
                                        >
                                            All URLs with the path
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => setUrlMode('domain')}
                                        >
                                            All URLs in this domain
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <Input
                                    placeholder="Please Input"
                                    type="url"
                                    className="rounded-l-none"
                                    value={websiteUrl}
                                    onChange={(e) =>
                                        setWebsiteUrl(e.target.value)
                                    }
                                    disabled={isCrawling || hasCrawledUrls}
                                />
                            </div>

                            <Button
                                onClick={handleCrawl}
                                disabled={isCrawling || hasCrawledUrls}
                            >
                                {isCrawling ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Getting Data...
                                    </>
                                ) : (
                                    'Get Data'
                                )}
                            </Button>
                        </div>
                    </div>

                    {hasCrawledUrls && (
                        <div className="flex items-center gap-2 rounded-md border px-4 py-3">
                            <div>
                                <div className="flex items-center gap-1">
                                    <h3 className="text-sm font-medium">
                                        {websiteUrl}
                                    </h3>
                                    <CheckCircle2Icon className="h-4 w-4 rounded-full bg-green-500 text-white" />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {cachedData?.crawledUrls?.length ?? 0} pages
                                    found
                                </p>
                            </div>

                            <Button
                                variant="link"
                                className="ml-auto mr-1 h-fit p-0 text-destructive"
                                onClick={handleCancel}
                                disabled={isCancelling}
                            >
                                {isCancelling ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Cancelling...
                                    </>
                                ) : (
                                    'Cancel'
                                )}
                            </Button>
                            <Button
                                variant="link"
                                className="h-fit gap-1 p-0"
                                onClick={handleViewAllPages}
                                disabled={isCancelling}
                            >
                                View all pages
                                <ArrowUpRightIcon className="h-4 w-4" />
                            </Button>
                        </div>
                    )}

                    <div className="mt-4 rounded-md border">
                        <div
                            className={cn(
                                'flex items-center justify-between border-b px-4 py-3',
                                isCollapsed && 'border-b-0',
                            )}
                        >
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-medium">
                                    Uploaded Links
                                </h3>
                                <Badge variant="secondary">
                                    {extractedLinks.length} links
                                </Badge>
                            </div>

                            <div className="flex items-center gap-2">
                                {selectedLinks.length > 0 && (
                                    <ExtractionDeleteDialog
                                        selectedLinks={selectedLinks}
                                        setSelectedLinks={setSelectedLinks}
                                    >
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            className="h-8"
                                        >
                                            Delete Selected (
                                            {selectedLinks.length})
                                        </Button>
                                    </ExtractionDeleteDialog>
                                )}

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsCollapsed(!isCollapsed)}
                                >
                                    {isCollapsed ? (
                                        <ChevronDown className="h-4 w-4" />
                                    ) : (
                                        <ChevronUp className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        </div>

                        {!isCollapsed && (
                            <div className="relative">
                                {extractedLinks.length > 0 ? (
                                    <div>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-[30px] pl-4">
                                                        <Checkbox
                                                            checked={
                                                                selectedLinks.length ===
                                                                extractedLinks.length
                                                            }
                                                            onCheckedChange={
                                                                handleSelectAll
                                                            }
                                                        />
                                                    </TableHead>
                                                    <TableHead>Path</TableHead>
                                                    <TableHead>
                                                        Refreshed at
                                                    </TableHead>
                                                    <TableHead>
                                                        Action
                                                    </TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {extractedLinks.map((link) => (
                                                    <TableRow key={link.id}>
                                                        <TableCell className="pl-4">
                                                            <Checkbox
                                                                checked={selectedLinks.includes(
                                                                    link.id,
                                                                )}
                                                                onCheckedChange={() =>
                                                                    handleToggleLink(
                                                                        link.id,
                                                                    )
                                                                }
                                                            />
                                                        </TableCell>
                                                        <TableCell className="max-w-[200px] overflow-auto">
                                                            <h3 className="truncate text-xs font-medium">
                                                                {link.title}
                                                            </h3>
                                                            <p className="truncate text-xs text-muted-foreground">
                                                                {link.url}
                                                            </p>
                                                        </TableCell>
                                                        <TableCell>
                                                            {link.refreshedAt
                                                                ? format(
                                                                      new Date(
                                                                          link.refreshedAt,
                                                                      ),
                                                                      'PP p',
                                                                  )
                                                                : '-'}
                                                        </TableCell>
                                                        <TableCell>
                                                            <ContentDialog
                                                                selectedLinkId={
                                                                    link.id
                                                                }
                                                                content={
                                                                    link.content
                                                                }
                                                                title={
                                                                    link.title
                                                                }
                                                                url={link.url}
                                                            >
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                >
                                                                    <FileTextIcon className="h-4 w-4" />
                                                                </Button>
                                                            </ContentDialog>
                                                            <ExtractionRefreshButton
                                                                linkId={link.id}
                                                                extractedLinks={
                                                                    extractedLinks
                                                                }
                                                            />
                                                            <ExtractionDeleteDialog
                                                                selectedLinks={[
                                                                    link.id,
                                                                ]}
                                                                setSelectedLinks={() => []}
                                                            >
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                                >
                                                                    <Trash2Icon className="h-4 w-4" />
                                                                </Button>
                                                            </ExtractionDeleteDialog>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <div className="rounded-full bg-muted p-3">
                                            <Search className="h-6 w-6 text-muted-foreground" />
                                        </div>
                                        <h3 className="mt-4 text-sm font-medium">
                                            No Data
                                        </h3>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            No links have been extracted yet.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>

            <ExtractDialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                urls={
                    cachedData?.crawledUrls?.map((item) => ({
                        title: item.title || '',
                        url: item.url || '',
                    })) ?? []
                }
                onConfirm={handleExtract}
                trainedUrls={extractedLinks.map((link) => link.url)}
            />
        </Card>
    );
}
