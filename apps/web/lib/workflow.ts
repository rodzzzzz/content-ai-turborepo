import { Client } from '@upstash/workflow';

// Initialize the client
export const workflow = new Client({
    baseUrl: process.env.QSTASH_URL!,
    token: process.env.QSTASH_TOKEN!,
});
