import { generateReactHelpers } from '@uploadthing/react';

import type { OurFileRouter } from '@/app/api/uploadthing/core';

// Create and export the helper hooks for the router
export const { useUploadThing } = generateReactHelpers<OurFileRouter>();
