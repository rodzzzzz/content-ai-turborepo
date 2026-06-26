/**
 * Revoke OAuth tokens on provider APIs (ported from apps/web/lib/deauthorize.ts).
 */

function getFacebookBasicAuth(): string {
  const id = process.env.FACEBOOK_CLIENT_ID ?? '';
  const secret = process.env.FACEBOOK_CLIENT_SECRET ?? '';
  return Buffer.from(`${id}:${secret}`, 'utf8').toString('base64');
}

function getTwitterBasicAuth(): string {
  const id = process.env.TWITTER_CLIENT_ID ?? '';
  const secret = process.env.TWITTER_CLIENT_SECRET ?? '';
  return Buffer.from(`${id}:${secret}`, 'utf8').toString('base64');
}

async function deauthorizeFacebook(accessToken: string): Promise<boolean> {
  try {
    const deauthorizeUrl = `https://graph.facebook.com/v23.0/me/permissions?access_token=${accessToken}`;
    const deauthorizeRequest = await fetch(deauthorizeUrl, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
    return (
      deauthorizeRequest.status >= 200 && deauthorizeRequest.status < 300
    );
  } catch (err) {
    console.error('Error deauthorizing Facebook:', err);
    return false;
  }
}

async function deauthorizeTwitter(accessToken: string): Promise<boolean> {
  try {
    const revokeUrl = 'https://api.twitter.com/2/oauth2/revoke';
    const revokeData = new URLSearchParams({
      token: accessToken,
      token_type_hint: 'access_token',
    });
    const revokeRequest = await fetch(revokeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${getTwitterBasicAuth()}`,
      },
      body: revokeData.toString(),
    });
    return revokeRequest.status === 200;
  } catch (err) {
    console.error('Error deauthorizing Twitter:', err);
    return false;
  }
}

async function deauthorizeLinkedIn(accessToken: string): Promise<boolean> {
  try {
    const revokeUrl = 'https://www.linkedin.com/oauth/v2/revoke';
    const revokeData = new URLSearchParams({
      token: accessToken,
      client_id: process.env.LINKEDIN_CLIENT_ID ?? '',
      client_secret: process.env.LINKEDIN_CLIENT_SECRET ?? '',
    });
    const revokeRequest = await fetch(revokeUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: revokeData.toString(),
    });
    return revokeRequest.status === 200;
  } catch (err) {
    console.error('Error deauthorizing LinkedIn:', err);
    return false;
  }
}

export interface DeauthorizationResult {
  success: boolean;
  message: string;
  platform: string;
}

export async function deauthorizePlatform(
  provider: string,
  accessToken: string,
): Promise<DeauthorizationResult> {
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
        success = await deauthorizeFacebook(accessToken);
        message = success
          ? 'Instagram account deauthorized successfully'
          : 'Failed to deauthorize Instagram account';
        break;

      case 'pinterest':
        try {
          const revokeUrl = 'https://api.pinterest.com/v5/oauth/token';
          const revokeData = new URLSearchParams({
            grant_type: 'revoke_token',
            token: accessToken,
          });
          const revokeRequest = await fetch(revokeUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
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

    return { success, message, platform: provider };
  } catch (error) {
    console.error(`Error in deauthorizePlatform for ${provider}:`, error);
    return {
      success: false,
      message: `Failed to deauthorize ${provider} account`,
      platform: provider,
    };
  }
}
