const BasicAuthToken = Buffer.from(
    `${process.env.FACEBOOK_CLIENT_ID!}:${process.env.FACEBOOK_CLIENT_SECRET!}`,
    'utf8',
).toString('base64');

const facebookOauthTokenParams = {
    client_id: process.env.FACEBOOK_CLIENT_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/integration/confirmation`,
    client_secret: process.env.FACEBOOK_CLIENT_SECRET!,
    grant_type: 'authorization_code',
};

import {
    FacebookTokenResponse,
    FacebookUserData,
    FacebookPage,
} from '@/types/integration';

//gets user access token
export const fetchUserToken = async (
    code: string,
): Promise<FacebookTokenResponse> => {
    try {
        const params = new URLSearchParams({
            ...facebookOauthTokenParams,
            code,
        });

        const getTokenRequest = await fetch(
            `https://graph.facebook.com/v23.0/oauth/access_token?${params.toString()}`,
            {
                method: 'GET',
                headers: {
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
): Promise<FacebookUserData> => {
    try {
        const getUserRequest = await fetch(
            'https://graph.facebook.com/v23.0/me?fields=id,name,email,picture',
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

//gets user's pages from the access token
export const fetchUserPages = async (
    accessToken: string,
): Promise<FacebookPage[]> => {
    try {
        const getPagesRequest = await fetch(
            'https://graph.facebook.com/v23.0/me/accounts?fields=id,name,access_token,picture',
            {
                headers: {
                    'Content-type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                },
            },
        );

        if (getPagesRequest.status !== 200) {
            const errorText = await getPagesRequest.text();
            console.error('Facebook pages request failed:', errorText);
            throw new Error(
                `Failed to fetch user pages: ${getPagesRequest.status} - ${errorText}`,
            );
        }

        const getPagesResponse = await getPagesRequest.json();
        return getPagesResponse.data || [];
    } catch (err) {
        console.error('Error in fetchUserPages:', err);
        throw new Error('Failed to fetch user pages');
    }
};

// Posts content to Facebook page
export const postToFacebook = async (
    pageAccessToken: string,
    pageId: string,
    content: string,
    mediaUrls?: string[],
): Promise<{ success: boolean; postId?: string; error?: string }> => {
    try {
        // If there are media URLs, create a photo/video post
        if (mediaUrls && mediaUrls.length > 0) {
            // Handle multiple images with carousel post
            if (mediaUrls.length > 1) {
                return await postMultipleImagesToFacebook(
                    pageAccessToken,
                    pageId,
                    content,
                    mediaUrls,
                );
            } else {
                // Single image post
                return await postSingleImageToFacebook(
                    pageAccessToken,
                    pageId,
                    content,
                    mediaUrls[0],
                );
            }
        } else {
            // Text-only post
            return await postTextToFacebook(pageAccessToken, pageId, content);
        }
    } catch (err) {
        console.error('Error posting to Facebook:', err);
        return { success: false, error: 'Failed to post to Facebook' };
    }
};

// Post single image to Facebook
const postSingleImageToFacebook = async (
    pageAccessToken: string,
    pageId: string,
    content: string,
    mediaUrl: string,
): Promise<{ success: boolean; postId?: string; error?: string }> => {
    try {
        const postData = {
            message: content,
            url: mediaUrl,
        };

        const postRequest = await fetch(
            `https://graph.facebook.com/v23.0/${pageId}/photos`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...postData,
                    access_token: pageAccessToken,
                }),
            },
        );

        if (postRequest.status !== 200) {
            const errorText = await postRequest.text();
            console.error('Facebook single image post failed:', errorText);
            return {
                success: false,
                error: `Failed to post single image to Facebook: ${errorText}`,
            };
        }

        const postResponse = await postRequest.json();
        return { success: true, postId: postResponse.id };
    } catch (err) {
        console.error('Error posting single image to Facebook:', err);
        return {
            success: false,
            error: 'Failed to post single image to Facebook',
        };
    }
};

// Post carousel (multiple images) to Facebook
const postMultipleImagesToFacebook = async (
    pageAccessToken: string,
    pageId: string,
    content: string,
    mediaUrls: string[],
): Promise<{ success: boolean; postId?: string; error?: string }> => {
    try {
        // Facebook supports up to 10 images in a carousel
        const maxImages = Math.min(mediaUrls.length, 10);
        const imagesToPost = mediaUrls.slice(0, maxImages);

        // Step 1: Upload each photo as unpublished
        const uploadedPhotoIds: string[] = [];

        for (let i = 0; i < imagesToPost.length; i++) {
            const photoUrl = imagesToPost[i];

            const uploadResponse = await fetch(
                `https://graph.facebook.com/v23.0/${pageId}/photos`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        url: photoUrl,
                        published: false,
                        access_token: pageAccessToken,
                    }),
                },
            );

            if (uploadResponse.status !== 200) {
                const errorText = await uploadResponse.text();
                console.error(`Failed to upload photo ${i + 1}:`, errorText);
                return {
                    success: false,
                    error: `Failed to upload photo ${i + 1}: ${errorText}`,
                };
            }

            const uploadResult = await uploadResponse.json();

            uploadedPhotoIds.push(uploadResult.id!);
        }

        // Step 2: Create a post with the uploaded photos
        const attachedMedia = uploadedPhotoIds.map((photoId) => ({
            media_fbid: photoId,
        }));

        const postData = {
            message: content,
            attached_media: attachedMedia,
        };

        const postRequest = await fetch(
            `https://graph.facebook.com/v23.0/${pageId}/feed`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...postData,
                    access_token: pageAccessToken,
                }),
            },
        );

        if (postRequest.status !== 200) {
            const errorText = await postRequest.text();
            console.error('Facebook multiple images post failed:', errorText);
            return {
                success: false,
                error: `Failed to post multiple images to Facebook: ${errorText}`,
            };
        }

        const postResponse = await postRequest.json();
        return { success: true, postId: postResponse.id };
    } catch (err) {
        console.error('Error posting multiple images to Facebook:', err);
        return {
            success: false,
            error: 'Failed to post multiple images to Facebook',
        };
    }
};

// Post text-only content to Facebook
const postTextToFacebook = async (
    pageAccessToken: string,
    pageId: string,
    content: string,
): Promise<{ success: boolean; postId?: string; error?: string }> => {
    try {
        const postData = {
            message: content,
        };

        const postRequest = await fetch(
            `https://graph.facebook.com/v23.0/${pageId}/feed`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...postData,
                    access_token: pageAccessToken,
                }),
            },
        );

        if (postRequest.status !== 200) {
            const errorText = await postRequest.text();
            console.error('Facebook text post failed:', errorText);
            return {
                success: false,
                error: `Failed to post text to Facebook: ${errorText}`,
            };
        }

        const postResponse = await postRequest.json();
        return { success: true, postId: postResponse.id };
    } catch (err) {
        console.error('Error posting text to Facebook:', err);
        return { success: false, error: 'Failed to post text to Facebook' };
    }
};

// Deauthorizes Facebook app access
export const deauthorizeFacebook = async (
    accessToken: string,
): Promise<boolean> => {
    try {
        // Facebook doesn't have a direct token revocation endpoint
        // Instead, we need to call the deauthorize callback URL
        // This is the recommended way to deauthorize Facebook apps

        const deauthorizeUrl = `https://graph.facebook.com/v23.0/me/permissions?access_token=${accessToken}`;

        const deauthorizeRequest = await fetch(deauthorizeUrl, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Facebook returns 200 even if the token is already invalid
        // So we consider it successful if we get any response
        return (
            deauthorizeRequest.status >= 200 && deauthorizeRequest.status < 300
        );
    } catch (err) {
        console.error('Error deauthorizing Facebook:', err);
        return false;
    }
};

export const getFacebookPostUrl = (postId: string): string => {
    return `https://www.facebook.com/${postId}`;
};
