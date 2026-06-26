'use client';

import type React from 'react';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Upload,
    X,
    CheckCircle2,
    AlertCircle,
    UploadIcon,
    Loader2,
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
    DialogTrigger,
} from '../ui/dialog';
import { useUploadThing } from '@/lib/uploadthing';
import { useFiles } from '@/contexts/file-context';
import Image from 'next/image';
import { updateFileFolders } from '@/actions/file';

export default function FileUpload() {
    const { invalidateFileQueries } = useFiles();

    const [open, setOpen] = useState(false);
    const [uploadFiles, setUploadFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadStatus, setUploadStatus] = useState<
        'idle' | 'uploading' | 'success' | 'error'
    >('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Get the current folder ID from the URL when dialog opens
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            // Check if we can get the current folder ID from the URL query params
            const urlParams = new URLSearchParams(window.location.search);
            const folderParam = urlParams.get('folder');
            setCurrentFolderId(folderParam);
        }
    }, [open]);

    useEffect(() => {
        if (!open) {
            resetUpload();
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const { startUpload } = useUploadThing('postMediaUploader', {
        onClientUploadComplete: async (res) => {
            setUploadStatus('success');

            // Get the uploaded files data
            const uploadedFiles = res.map((file) => file.serverData);
            const newFileIds = uploadedFiles.map((file) => file.id);

            // Update the files in the database to associate with the folder if needed
            if (currentFolderId && newFileIds.length > 0) {
                await updateFileFolders(newFileIds, currentFolderId);
            }

            // Invalidate queries to refresh data
            invalidateFileQueries();
        },
        onUploadProgress: (progress) => {
            setUploadProgress(progress);
        },
        onUploadError: (error) => {
            setUploadStatus('error');
            setErrorMessage(error.message);
        },
    });

    // Handle file selection
    const handleFileChange = useCallback((selectedFiles: FileList | null) => {
        if (!selectedFiles) return;

        setErrorMessage('');
        const newFiles: File[] = [];
        const newPreviews: string[] = [];

        Array.from(selectedFiles).forEach((file) => {
            // Check if file is an image
            if (!file.type.startsWith('image/')) {
                setErrorMessage('Only image files are allowed');
                return;
            }

            // Create preview URL
            const previewUrl = URL.createObjectURL(file);
            newFiles.push(file);
            newPreviews.push(previewUrl);
        });

        setUploadFiles((prev) => [...prev, ...newFiles]);
        setPreviews((prev) => [...prev, ...newPreviews]);
    }, []);

    // Handle file input change
    const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleFileChange(e.target.files);
    };

    // Handle drag events
    const onDragEnter = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const onDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const onDragOver = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            if (!isDragging) {
                setIsDragging(true);
            }
        },
        [isDragging],
    );

    const onDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(false);

            const { files } = e.dataTransfer;
            handleFileChange(files);
        },
        [handleFileChange],
    );

    // Trigger file input click
    const openFileDialog = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    // Remove a file
    const removeFile = (index: number) => {
        const newFiles = [...uploadFiles];
        const newPreviews = [...previews];

        // Revoke object URL to avoid memory leaks
        URL.revokeObjectURL(newPreviews[index]);

        newFiles.splice(index, 1);
        newPreviews.splice(index, 1);

        setUploadFiles(newFiles);
        setPreviews(newPreviews);
    };

    const onUpload = async () => {
        if (uploadFiles.length === 0) {
            setErrorMessage('Please select at least one image to upload');
            return;
        }

        setUploadStatus('uploading');
        setUploadProgress(0);

        try {
            // Upload files without folder metadata (will be set client-side after upload)
            await startUpload(
                uploadFiles,
                {
                    folderId: currentFolderId || undefined,
                } as never,
            );
        } catch (error) {
            console.error(error);

            setUploadStatus('error');
            setErrorMessage('Upload failed. Please try again.');
        }
    };

    // Reset the component
    const resetUpload = () => {
        // Clean up previews to avoid memory leaks
        previews.forEach((preview) => URL.revokeObjectURL(preview));

        setUploadFiles([]);
        setPreviews([]);
        setUploadProgress(0);
        setUploadStatus('idle');
        setErrorMessage('');
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <UploadIcon className="h-4 w-4" />
                    <p className="hidden md:block">Upload Files</p>
                </Button>
            </DialogTrigger>
            <DialogTitle className="sr-only">Upload Files</DialogTitle>
            <DialogDescription className="sr-only">
                Upload files to your media library
            </DialogDescription>
            <DialogContent className="max-h-screen [&>button]:hidden">
                <div className="mx-auto w-full">
                    <div className="flex flex-col gap-4">
                        {/* Drag and drop area */}
                        <div
                            className={`rounded-md border-2 border-dashed bg-muted-foreground/10 p-6 transition-colors ${
                                isDragging
                                    ? 'border-primary bg-muted-foreground/20'
                                    : 'border-muted-foreground/25 hover:border-muted-foreground'
                            }`}
                            onDragEnter={onDragEnter}
                            onDragLeave={onDragLeave}
                            onDragOver={onDragOver}
                            onDrop={onDrop}
                            onClick={openFileDialog}
                            tabIndex={0}
                            role="button"
                            aria-label="Click or drag and drop to upload images"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    openFileDialog();
                                }
                            }}
                        >
                            <div className="flex flex-col items-center justify-center space-y-2 text-center">
                                <div className="rounded-full bg-primary/10 p-3">
                                    <Upload className="h-6 w-6 text-primary" />
                                </div>
                                <h3 className="text-lg font-medium">
                                    Upload Images
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    Drag and drop your images here or click to
                                    browse
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Supported formats: JPG, PNG, GIF, WebP
                                </p>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={onFileInputChange}
                                className="sr-only"
                                aria-label="Upload images"
                            />
                        </div>

                        {/* Error message */}
                        {errorMessage && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                    {errorMessage}
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* File previews */}
                        {previews.length > 0 && (
                            <div className="w-full space-y-2">
                                <h4 className="text-sm font-medium">
                                    Selected Images ({uploadFiles.length})
                                </h4>
                                <div className="shadcn-scrollbar max-h-[400px] w-full overflow-auto pr-1">
                                    <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-3">
                                        {previews.map((preview, index) => (
                                            <div
                                                key={index}
                                                className="group relative aspect-square overflow-hidden rounded-md border"
                                            >
                                                <Image
                                                    src={
                                                        preview ||
                                                        '/placeholder.svg'
                                                    }
                                                    alt={`Preview ${index + 1}`}
                                                    className="h-full w-full object-cover"
                                                    width={200}
                                                    height={200}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeFile(index);
                                                    }}
                                                    className="absolute right-1 top-1 rounded-full bg-destructive/80 p-1 text-destructive-foreground hover:bg-destructive focus:outline-none focus:ring-2 focus:ring-primary"
                                                    aria-label={`Remove image ${index + 1}`}
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Upload progress */}
                        {uploadStatus === 'uploading' && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">
                                        Uploading...
                                    </span>
                                    <span className="text-sm">
                                        {uploadProgress}%
                                    </span>
                                </div>
                                <Progress
                                    value={uploadProgress}
                                    className="h-2"
                                />
                            </div>
                        )}

                        {/* Success message */}
                        {uploadStatus === 'success' && (
                            <Alert variant="success">
                                <CheckCircle2 className="h-4 w-4" />
                                <AlertDescription>
                                    All images were uploaded successfully!
                                </AlertDescription>
                            </Alert>
                        )}

                        <div className="flex flex-col gap-2">
                            {/* Action buttons */}
                            <div className="flex gap-2">
                                {uploadStatus === 'idle' && (
                                    <Button
                                        onClick={onUpload}
                                        disabled={uploadFiles.length === 0}
                                        className="flex-1"
                                    >
                                        {`Upload ${
                                            uploadFiles.length > 0
                                                ? `(${uploadFiles.length})`
                                                : ''
                                        }`}
                                    </Button>
                                )}

                                {uploadStatus === 'uploading' && (
                                    <Button disabled className="flex-1">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Uploading...
                                    </Button>
                                )}

                                {(uploadStatus === 'success' ||
                                    uploadStatus === 'error') && (
                                    <Button
                                        onClick={resetUpload}
                                        className="flex-1"
                                    >
                                        Upload More
                                    </Button>
                                )}

                                {uploadFiles.length > 0 &&
                                    uploadStatus === 'idle' && (
                                        <Button
                                            variant="outline-destructive"
                                            onClick={resetUpload}
                                        >
                                            Clear
                                        </Button>
                                    )}
                            </div>

                            <Button
                                variant="outline"
                                className="w-full"
                                disabled={uploadStatus === 'uploading'}
                                onClick={() => setOpen(false)}
                            >
                                {uploadStatus === 'success'
                                    ? 'Close'
                                    : 'Cancel'}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
