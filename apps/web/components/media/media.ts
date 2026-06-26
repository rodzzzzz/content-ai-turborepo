import { Folder } from '@prisma/client';

export interface FolderType extends Folder {
    _count: {
        files: number;
    };
}
