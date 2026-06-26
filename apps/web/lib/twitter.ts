const BasicAuthToken = Buffer.from(
    `${process.env.TWITTER_CLIENT_ID!}:${process.env.TWITTER_CLIENT_SECRET!}`,
    'utf8',
).toString('base64');

const twitterOauthTokenParams = {
    client_id: process.env.TWITTER_CLIENT_ID!,
    //👇🏻 according to the code_challenge provided on the client
    code_verifier: '8KxxO-RPl0bLSxX5AWwgdiFbMnry_VOKzFeIlVA7NoA',
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/integration/confirmation`,
    grant_type: 'authorization_code',
};

import { TwitterTokenResponse, TwitterUserData } from '@/types/integration';

//gets user access token
export const fetchUserToken = async (
    code: string,
): Promise<TwitterTokenResponse> => {
    try {
        const formatData = new URLSearchParams({
            ...twitterOauthTokenParams,
            code,
        });
        const getTokenRequest = await fetch(
            'https://api.twitter.com/2/oauth2/token',
            {
                method: 'POST',
                body: formatData.toString(),
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Authorization: `Basic ${BasicAuthToken}`,
                },
            },
        );

        if (getTokenRequest.status !== 200) {
            throw new Error('Failed to fetch user token');
        }

        const getTokenResponse = await getTokenRequest.json();
        return getTokenResponse;
    } catch (err) {
        console.error(err);

        throw new Error('Failed to fetch user token');
    }
};

//gets user's data from the access token
export const fetchUserData = async (
    accessToken: string,
): Promise<TwitterUserData> => {
    try {
        const getUserRequest = await fetch(
            'https://api.twitter.com/2/users/me?user.fields=profile_image_url,username,name,id',
            {
                headers: {
                    'Content-type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                },
            },
        );

        if (getUserRequest.status !== 200) {
            throw new Error('Failed to fetch user data');
        }

        const getUserProfile = await getUserRequest.json();
        return getUserProfile;
    } catch (err) {
        console.error(err);

        throw new Error('Failed to fetch user data');
    }
};

// Deauthorizes Twitter app access
export const deauthorizeTwitter = async (
    accessToken: string,
): Promise<boolean> => {
    try {
        // Twitter OAuth 2.0 token revocation endpoint
        const revokeUrl = 'https://api.twitter.com/2/oauth2/revoke';

        const revokeData = new URLSearchParams({
            token: accessToken,
            token_type_hint: 'access_token',
        });

        const revokeRequest = await fetch(revokeUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization: `Basic ${BasicAuthToken}`,
            },
            body: revokeData.toString(),
        });

        // Twitter returns 200 for successful revocation
        return revokeRequest.status === 200;
    } catch (err) {
        console.error('Error deauthorizing Twitter:', err);
        return false;
    }
};

export const getTwitterPostUrl = (postId: string): string => {
    return `https://twitter.com/i/web/status/${postId}`;
};
