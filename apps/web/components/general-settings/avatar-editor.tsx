'use client';

import { useCallback, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Cropper, { Area, Point } from 'react-easy-crop';

import getCroppedImg, { readFile, resizeBlob } from '@/lib/crop';
import { useUploadThing } from '@/lib/uploadthing';
import { toast } from '@/hooks/use-toast';
import { Camera, ImageIcon, ImageUp, Loader2 } from 'lucide-react';
import {
    Sheet,
    SheetHeader,
    SheetContent,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-provider';
interface AvatarEditorProps {
    value: string;
    name: string;
}

export function AvatarEditor({ value, name }: AvatarEditorProps) {
    const { refetch } = useAuth();
    const router = useRouter();

    const [avatar, setAvatar] = useState<string | undefined>(undefined);
    const [openEditor, setOpenEditor] = useState(false);
    const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(
        null,
    );
    const [isUploading, setIsUploading] = useState(false);

    const { startUpload } = useUploadThing('avatarUploader', {
        onClientUploadComplete: (res) => {
            setIsUploading(false);

            void refetch();

            router.refresh();

            toast({
                description: 'Image uploaded successfully',
            });
        },
        onUploadError: () => {
            setIsUploading(false);

            toast({
                title: 'Your image cannot be uploaded',
                description: 'Please try again later',
                variant: 'destructive',
            });

            return;
        },
    });

    const handleImageUpload = async (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const { files } = event.target;

        const file = files && files[0];

        if (file) {
            const imageData = await readFile(file);

            setAvatar(imageData);
            setOpenEditor(true);
        }
    };

    const onCropComplete = useCallback(
        (croppedArea: Area, croppedAreaPixels: Area) => {
            setCroppedAreaPixels(croppedAreaPixels);
        },
        [],
    );

    const showCroppedImage = useCallback(async () => {
        setIsUploading(true);
        try {
            const croppedImage = await getCroppedImg(
                avatar!,
                croppedAreaPixels!,
            );

            const formData = new FormData(); //this will submit as a "multipart/form-data" request
            formData.append(
                'avatar',
                await fetch(croppedImage!)
                    .then((r) => r.blob())
                    .then(async (blobFile: Blob) => {
                        const resized = await resizeBlob(blobFile!);
                        return new File(
                            [resized as BlobPart],
                            `${name.toLowerCase()}-avatar.webp`,
                            {
                                type: 'image/webp',
                            },
                        );
                    }),
            );

            const res = await startUpload([formData.get('avatar') as File]);

            if (res) {
                reset(croppedImage!);
            }
        } catch (error) {
            console.error(error);

            setIsUploading(false);

            return toast({
                title: 'Something went wrong',
                description: 'Please try again later',
                variant: 'destructive',
            });
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [croppedAreaPixels, avatar]);

    function reset(croppedImage: string) {
        URL.revokeObjectURL(croppedImage);
        setAvatar(undefined);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setCroppedAreaPixels(null);

        setIsUploading(false);
        setOpenEditor(false);
    }

    return (
        <div className="h-[150px] w-[150px] lg:h-[200px] lg:w-[200px]">
            <input
                id="profile-picture"
                type="file"
                name="cover"
                onChange={handleImageUpload}
                accept="img/*"
                className="hidden"
            />
            <label
                htmlFor="profile-picture"
                className="relative grid h-full w-full cursor-pointer place-content-center"
            >
                {value ? (
                    <Image
                        className="relative h-full w-full rounded-lg border border-border"
                        src={value}
                        alt={`${name}-avatar`}
                        width={400}
                        height={400}
                    />
                ) : (
                    <div className="relative flex h-[150px] w-[150px] items-center justify-center rounded-lg bg-muted lg:h-[200px] lg:w-[200px]">
                        <ImageUp className="h-16 w-16 stroke-1 text-muted-foreground" />
                    </div>
                )}
                <span className="absolute left-0 top-0 flex h-full w-full flex-col items-center justify-center gap-1 rounded-lg bg-gradient-to-t from-accent/100 via-accent/70 to-accent/20 text-sm font-medium text-muted-foreground transition-all duration-300 lg:opacity-0 lg:hover:opacity-100">
                    <Camera className="hidden h-8 w-8 lg:block" />
                    <span>Change photo</span>
                </span>
            </label>
            <Sheet open={openEditor} onOpenChange={setOpenEditor}>
                <SheetContent side="bottom">
                    <SheetHeader>
                        <SheetTitle>Change your profile picture</SheetTitle>
                        <SheetDescription>
                            Crop your new profile picture.
                        </SheetDescription>
                    </SheetHeader>
                    <div className="mx-auto flex w-full max-w-[300px] flex-col gap-8">
                        <div className="relative block h-[300px] w-full">
                            <Cropper
                                image={avatar}
                                crop={crop}
                                zoom={zoom}
                                zoomSpeed={4}
                                minZoom={1}
                                maxZoom={3}
                                zoomWithScroll={false}
                                cropShape="round"
                                showGrid={false}
                                aspect={1}
                                restrictPosition
                                onCropChange={setCrop}
                                onCropComplete={onCropComplete}
                                onZoomChange={setZoom}
                                style={{
                                    containerStyle: {
                                        width: 300,
                                        height: 300,
                                        marginLeft: 'auto',
                                        marginRight: 'auto',
                                        borderRadius: 50,
                                    },
                                }}
                            />
                        </div>
                        <div className="inline-flex w-full items-center gap-5">
                            <ImageIcon className="h-6 w-6" />
                            <Slider
                                value={[zoom]}
                                min={1}
                                max={3}
                                step={0.1}
                                aria-labelledby="zoom"
                                onValueChange={(zoom) => setZoom(zoom[0])}
                            />
                            <ImageIcon className="h-8 w-8" />
                        </div>
                        <Button
                            className=""
                            onClick={showCroppedImage}
                            disabled={isUploading}
                        >
                            {isUploading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <span>Save</span>
                            )}
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}
