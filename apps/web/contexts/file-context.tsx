'use client';

import type React from 'react';
import {
    createContext,
    Dispatch,
    SetStateAction,
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react';
import { FolderType } from '@/components/media/media';
import { File as FileType } from '@prisma/client';
import { getInfiniteFiles, getFolders } from '@/actions/file';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface OpenFolderDialogDataType {
    folderId: string | null;
    folderName?: string | null;
}

interface OpenFileDialogDataType {
    files: {
        id: string;
        key: string;
        name: string;
        fileSize: number;
        fileType: string;
    }[];
    fileName?: string | null;
    movableToHome?: boolean;
}
type OpenDialogType =
    | 'FOLDER_CREATE'
    | 'FOLDER_UPDATE'
    | 'FOLDER_DELETE'
    | 'FILE_DELETE'
    | 'FILE_RENAME'
    | 'FILE_MOVE'
    | null;

interface FileContextType {
    folders: FolderType[];
    isLoadingFolders: boolean;
    openDialog: OpenDialogType;
    setOpenDialog: Dispatch<SetStateAction<OpenDialogType>>;
    dialogFolderData: OpenFolderDialogDataType;
    setDialogFolderData: Dispatch<SetStateAction<OpenFolderDialogDataType>>;
    dialogFileData: OpenFileDialogDataType;
    setDialogFileData: Dispatch<SetStateAction<OpenFileDialogDataType>>;
    invalidateFileQueries: () => void;
}

const FileContext = createContext<FileContextType | undefined>(undefined);

export function FileProvider({ children }: { children: React.ReactNode }) {
    const queryClient = useQueryClient();

    const [openDialog, setOpenDialog] = useState<OpenDialogType>(null);
    const [dialogFolderData, setDialogFolderData] =
        useState<OpenFolderDialogDataType>({
            folderId: null,
            folderName: null,
        });
    const [dialogFileData, setDialogFileData] =
        useState<OpenFileDialogDataType>({
            files: [],
            fileName: null,
        });

    // Use React Query to fetch folders
    const { data: foldersData, isLoading: isLoadingFolders } = useQuery({
        queryKey: ['folders'],
        queryFn: async () => {
            const response = await getFolders();
            if (response.success) {
                return response.folders;
            }
            throw new Error('Failed to fetch folders');
        },
    });

    const folders = foldersData || [];

    // Function to invalidate file-related queries - more targeted approach
    const invalidateFileQueries = () => {
        // Only invalidate active queries that need to be refreshed
        // This is more efficient than invalidating all file queries
        queryClient.invalidateQueries({
            queryKey: ['files'],
            refetchType: 'active', // Only refetch active queries
            exact: false, // Include all file-related queries
        });

        // Same for folders
        queryClient.invalidateQueries({
            queryKey: ['folders'],
            refetchType: 'active',
            exact: false,
        });
    };

    return (
        <FileContext.Provider
            value={{
                folders,
                isLoadingFolders,
                openDialog,
                setOpenDialog,
                dialogFolderData,
                setDialogFolderData,
                dialogFileData,
                setDialogFileData,
                invalidateFileQueries,
            }}
        >
            {children}
        </FileContext.Provider>
    );
}

export function useFiles() {
    const context = useContext(FileContext);

    if (!context) {
        throw new Error('useFiles must be used within a FileProvider');
    }

    return context;
}
