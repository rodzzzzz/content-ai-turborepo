'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useIntegratedAccounts } from '@/contexts/integration-context';
import { Skeleton } from '@/components/ui/skeleton';

interface PlatformSelectorProps {
    onSelect: (platform: string) => void;
    selectedPlatform: string | null;
}

export function PlatformSelector({
    onSelect,
    selectedPlatform,
}: PlatformSelectorProps) {
    const platforms = [
        {
            id: 'FACEBOOK',
            name: 'Facebook',
            icon: 'facebook.svg',
            color: 'bg-[#1877F2]/5',
            textColor: 'text-[#1877F2]',
            borderColor: 'border-[#1877F2]',
        },
        {
            id: 'LINKEDIN',
            name: 'LinkedIn',
            icon: 'linkedin.svg',
            color: 'bg-[#0A66C2]/10',
            textColor: 'text-[#0A66C2]',
            borderColor: 'border-[#0A66C2]',
        },
    ];

    const { data: integratedAccounts, isLoading } = useIntegratedAccounts();

    return (
        <div className="flex h-full flex-col gap-6">
            <div>
                <h2 className="text-2xl font-bold">Select a Platform</h2>
                <p className="mt-1 text-muted-foreground">
                    Choose the platform where you want to publish your content
                </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {isLoading
                    ? Array.from({ length: 3 }).map((_, idx) => (
                          <Card key={idx} className="border">
                              <CardContent className="flex items-center p-6">
                                  <Skeleton className="h-10 w-10 rounded-full" />
                                  <div className="ml-4 flex-1 space-y-2">
                                      <Skeleton className="h-4 w-24" />
                                      <Skeleton className="h-3 w-32" />
                                  </div>
                              </CardContent>
                          </Card>
                      ))
                    : platforms.map((platform) => {
                          const isDisabled = !integratedAccounts!.some(
                              (account) =>
                                  account.provider.toUpperCase() ===
                                  platform.id,
                          );
                          return (
                              <Card
                                  key={platform.id}
                                  className={cn(
                                      'cursor-pointer transition-all hover:shadow-md',
                                      isDisabled
                                          ? 'pointer-events-none opacity-50'
                                          : selectedPlatform === platform.id
                                            ? `${platform.borderColor} ${platform.color}`
                                            : 'border',
                                  )}
                                  onClick={() => onSelect(platform.id)}
                              >
                                  <CardContent className="flex items-center p-6">
                                      <Image
                                          src={`/${platform.icon}`}
                                          alt={platform.name}
                                          width={40}
                                          height={40}
                                      />
                                      <div className="ml-4">
                                          <h3 className="font-medium">
                                              {platform.name}
                                          </h3>
                                          <p className="text-sm text-muted-foreground">
                                              Create content for {platform.name}
                                          </p>
                                      </div>
                                      {isDisabled && (
                                          <Badge
                                              variant="secondary"
                                              className="ml-auto"
                                          >
                                              Disconnected
                                          </Badge>
                                      )}
                                  </CardContent>
                              </Card>
                          );
                      })}
            </div>

            {selectedPlatform && (
                <div className="mt-auto flex justify-end">
                    <Button onClick={() => onSelect(selectedPlatform)}>
                        Continue
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                </div>
            )}
        </div>
    );
}
