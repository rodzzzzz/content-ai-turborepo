import { deauthorizeFacebook } from './facebook';
import { deauthorizeTwitter } from './twitter';
import { deauthorizeLinkedIn } from './linkedin';
import { Provider } from '@/constants/providers';

export interface DeauthorizationResult {
    success: boolean;
    message: string;
    platform: string;
}

/**
 * Deauthorizes a social media platform integration
 * @param provider - The social media platform provider
 * @param accessToken - The access token to revoke
 * @returns Promise<DeauthorizationResult>
 */
export const deauthorizePlatform = async (
    provider: Provider['provider'],
    accessToken: string,
): Promise<DeauthorizationResult> => {
    try {
        let success = false;
        let message = '';

        switch (provider) {
            case 'facebook':
                success = await deauthorizeFacebook(accessToken);
                message = success
                    ? 'Facebook account deauthorized successfully'
                    : 'Failed to deauthorize Facebook account';
                break;

            case 'twitter':
                success = await deauthorizeTwitter(accessToken);
                message = success
                    ? 'Twitter account deauthorized successfully'
                    : 'Failed to deauthorize Twitter account';
                break;

            case 'linkedin':
                success = await deauthorizeLinkedIn(accessToken);
                message = success
                    ? 'LinkedIn account deauthorized successfully'
                    : 'Failed to deauthorize LinkedIn account';
                break;

            case 'instagram':
                // Instagram uses Facebook's OAuth, so we use the same deauthorization
                success = await deauthorizeFacebook(accessToken);
                message = success
                    ? 'Instagram account deauthorized successfully'
                    : 'Failed to deauthorize Instagram account';
                break;

            case 'pinterest':
                // Pinterest OAuth 2.0 revocation endpoint
                try {
                    const revokeUrl =
                        'https://api.pinterest.com/v5/oauth/token';
                    const revokeData = new URLSearchParams({
                        grant_type: 'revoke_token',
                        token: accessToken,
                    });

                    const revokeRequest = await fetch(revokeUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                        },
                        body: revokeData.toString(),
                    });

                    success = revokeRequest.status === 200;
                    message = success
                        ? 'Pinterest account deauthorized successfully'
                        : 'Failed to deauthorize Pinterest account';
                } catch (err) {
                    console.error('Error deauthorizing Pinterest:', err);
                    success = false;
                    message = 'Failed to deauthorize Pinterest account';
                }
                break;

            default:
                message = `Unsupported platform: ${provider}`;
                success = false;
        }

        return {
            success,
            message,
            platform: provider,
        };
    } catch (error) {
        console.error(`Error in deauthorizePlatform for ${provider}:`, error);
        return {
            success: false,
            message: `Failed to deauthorize ${provider} account`,
            platform: provider,
        };
    }
};
