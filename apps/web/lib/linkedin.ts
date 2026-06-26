const linkedinOauthTokenParams = {
    client_id: process.env.LINKEDIN_CLIENT_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/integration/confirmation`,
    client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
    grant_type: 'authorization_code',
};

import {
    LinkedInTokenResponse,
    LinkedInUserData,
    LinkedInCompany,
} from '@/types/integration';

//gets user access token
export const fetchUserToken = async (
    code: string,
): Promise<LinkedInTokenResponse> => {
    try {
        // LinkedIn requires the token request to be sent as form data, not JSON
        const formData = new URLSearchParams();
        formData.append('grant_type', 'authorization_code');
        formData.append('code', code);
        formData.append('redirect_uri', linkedinOauthTokenParams.redirect_uri);
        formData.append('client_id', linkedinOauthTokenParams.client_id);
        formData.append(
            'client_secret',
            linkedinOauthTokenParams.client_secret,
        );

        const getTokenRequest = await fetch(
            'https://www.linkedin.com/oauth/v2/accessToken',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData.toString(),
            },
        );

        if (getTokenRequest.status !== 200) {
            const errorText = await getTokenRequest.text();
            console.error('LinkedIn token request failed:', {
                status: getTokenRequest.status,
                statusText: getTokenRequest.statusText,
                error: errorText,
            });
            throw new Error(
                `Failed to fetch user token: ${getTokenRequest.status} ${getTokenRequest.statusText}`,
            );
        }

        const getTokenResponse = await getTokenRequest.json();

        // Validate that we have the required fields
        if (!getTokenResponse.access_token) {
            throw new Error('No access token received from LinkedIn');
        }

        return getTokenResponse;
    } catch (err) {
        console.error('Error in fetchUserToken:', err);
        throw new Error('Failed to fetch user token');
    }
};

//gets user's data from the access token
export const fetchUserData = async (
    accessToken: string,
): Promise<LinkedInUserData> => {
    try {
        // Add a small delay to ensure token is fully processed by LinkedIn
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Try the LinkedIn userinfo endpoint first (this is the standard OAuth endpoint)
        let getUserRequest = await fetch(
            'https://api.linkedin.com/v2/userinfo',
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'X-Restli-Protocol-Version': '2.0.0',
                },
            },
        );

        if (getUserRequest.status === 200) {
            const userData = await getUserRequest.json();
            return userData;
        }

        // If userinfo fails, try the people endpoint as fallback
        console.log('Userinfo endpoint failed, trying people endpoint...');

        getUserRequest = await fetch(
            'https://api.linkedin.com/v2/people/~:(id,firstName,lastName,profilePicture(displayImage~:playableStreams))',
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'X-Restli-Protocol-Version': '2.0.0',
                },
            },
        );

        if (getUserRequest.status === 200) {
            const peopleData = await getUserRequest.json();
            // Transform to userinfo format
            const transformedData: LinkedInUserData = {
                sub: peopleData.id,
                name: `${peopleData.firstName} ${peopleData.lastName}`,
                given_name: peopleData.firstName,
                family_name: peopleData.lastName,
                picture:
                    peopleData.profilePicture?.displayImage?.elements?.[0]
                        ?.identifiers?.[0]?.identifier,
            };

            return transformedData;
        }

        // If both endpoints fail, provide detailed error information
        const errorText = await getUserRequest.text();
        console.error('LinkedIn user data request failed:', {
            status: getUserRequest.status,
            statusText: getUserRequest.statusText,
            error: errorText,
        });

        throw new Error(
            `Failed to fetch user data: ${getUserRequest.status} ${getUserRequest.statusText} - ${errorText}`,
        );
    } catch (err) {
        console.error('Error in fetchUserData:', err);
        throw new Error('Failed to fetch user data');
    }
};

//gets user's company pages from the access token
export const fetchUserCompanies = async (
    accessToken: string,
): Promise<LinkedInCompany[]> => {
    try {
        // Try the organizational entity ACLs endpoint
        const getCompaniesRequest = await fetch(
            'https://api.linkedin.com/v2/organizationalEntityAcls?q=roleAssignee&role=ADMINISTRATOR&projection=(elements*(organizationalTarget~(id,localizedName,vanityName,logoV2)))',
            {
                headers: {
                    'Content-type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                },
            },
        );

        if (getCompaniesRequest.status !== 200) {
            const errorText = await getCompaniesRequest.text();
            console.error('LinkedIn companies request failed:', errorText);
            // If the organizational endpoint fails, return empty array (user might not have company pages)
            return [];
        }

        const getCompaniesResponse = await getCompaniesRequest.json();
        return getCompaniesResponse.elements || [];
    } catch (err) {
        console.error('Error in fetchUserCompanies:', err);
        // Return empty array instead of throwing error
        return [];
    }
};

// Posts content to LinkedIn
export const postToLinkedIn = async (
    accessToken: string,
    organizationId: string,
    content: string,
    mediaUrls?: string[],
): Promise<{ success: boolean; postId?: string; error?: string }> => {
    try {
        // If there are media URLs, create a photo/video post
        if (mediaUrls && mediaUrls.length > 0) {
            // Handle multiple images with MultiImage post
            if (mediaUrls.length > 1) {
                return await postMultipleImagesToLinkedIn(
                    accessToken,
                    organizationId,
                    content,
                    mediaUrls,
                );
            } else {
                // Single image post
                return await postSingleImageToLinkedIn(
                    accessToken,
                    organizationId,
                    content,
                    mediaUrls[0],
                );
            }
        } else {
            // Text-only post
            return await postTextToLinkedIn(
                accessToken,
                organizationId,
                content,
            );
        }
    } catch (err) {
        console.error('Error posting to LinkedIn:', err);
        return { success: false, error: 'Failed to post to LinkedIn' };
    }
};

// Upload image to LinkedIn and get Image URN
const uploadImageToLinkedIn = async (
    accessToken: string,
    organizationId: string,
    imageUrl: string,
): Promise<{ success: boolean; imageUrn?: string; error?: string }> => {
    try {
        const owner = `urn:li:organization:${organizationId}`.toString();

        // Register the image upload with LinkedIn
        const registerData = {
            registerUploadRequest: {
                owner,
                recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
                serviceRelationships: [
                    {
                        relationshipType: 'OWNER',
                        identifier: 'urn:li:userGeneratedContent',
                    },
                ],
                supportedUploadMechanism: ['SYNCHRONOUS_UPLOAD'],
            },
        };

        const registerResponse = await fetch(
            'https://api.linkedin.com/v2/assets?action=registerUpload',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                    'LinkedIn-Version': '202509',
                    'X-Restli-Protocol-Version': '2.0.0',
                },
                body: JSON.stringify(registerData),
            },
        );

        if (registerResponse.status !== 200) {
            const errorText = await registerResponse.text();
            console.error('Failed to register image upload:', errorText);
            return {
                success: false,
                error: `Failed to register image upload: ${errorText}`,
            };
        }

        const registerResult: {
            value: {
                uploadMechanism: {
                    'com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest': {
                        uploadUrl: string;
                    };
                };
                asset: string;
            };
        } = await registerResponse.json();

        const uploadUrl =
            registerResult.value.uploadMechanism[
                'com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'
            ].uploadUrl;
        const asset = registerResult.value.asset;

        // Upload the image to the provided URL
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
            return {
                success: false,
                error: 'Failed to fetch image from URL',
            };
        }

        const imageBuffer = await imageResponse.arrayBuffer();
        const uploadResponse = await fetch(uploadUrl, {
            method: 'POST',
            body: imageBuffer,
            headers: {
                'Content-Type': 'application/octet-stream',
            },
        });

        if (uploadResponse.status !== 201) {
            const errorText = await uploadResponse.text();
            console.error('Failed to upload image:', errorText);
            return {
                success: false,
                error: `Failed to upload image: ${errorText}`,
            };
        }

        const replacedAssetUrn = asset?.replace('digitalmediaAsset', 'image');

        return { success: true, imageUrn: replacedAssetUrn };
    } catch (err) {
        console.error('Error uploading image to LinkedIn:', err);
        return {
            success: false,
            error: 'Failed to upload image to LinkedIn',
        };
    }
};

// Post single image to LinkedIn
const postSingleImageToLinkedIn = async (
    accessToken: string,
    organizationId: string,
    content: string,
    mediaUrl: string,
): Promise<{ success: boolean; postId?: string; error?: string }> => {
    try {
        // First upload the image to get the Image URN
        const uploadResult = await uploadImageToLinkedIn(
            accessToken,
            organizationId,
            mediaUrl,
        );

        if (!uploadResult.success) {
            return {
                success: false,
                error: uploadResult.error,
            };
        }

        const postData = {
            author: `urn:li:organization:${organizationId}`,
            commentary: content,
            visibility: 'PUBLIC',
            distribution: {
                feedDistribution: 'MAIN_FEED',
                targetEntities: [],
                thirdPartyDistributionChannels: [],
            },
            lifecycleState: 'PUBLISHED',
            isReshareDisabledByAuthor: false,
            content: {
                media: {
                    id: uploadResult.imageUrn,
                },
            },
        };

        const postRequest = await fetch('https://api.linkedin.com/rest/posts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
                'LinkedIn-Version': '202509',
                'X-Restli-Protocol-Version': '2.0.0',
            },
            body: JSON.stringify(postData),
        });

        if (postRequest.status !== 201) {
            const errorText = await postRequest.text();
            console.error('LinkedIn single image post failed:', errorText);
            return {
                success: false,
                error: `Failed to post single image to LinkedIn: ${errorText}`,
            };
        }

        // Check if response has content before parsing JSON
        const responseText = await postRequest.text();

        if (!responseText) {
            // LinkedIn might return empty response with just headers
            const postId = postRequest.headers.get('x-restli-id');
            if (postId) {
                return { success: true, postId };
            }
            return { success: true, postId: 'unknown' };
        }

        const postResponse = JSON.parse(responseText);
        return { success: true, postId: postResponse.id || postResponse.urn };
    } catch (err) {
        console.error('Error posting single image to LinkedIn:', err);
        return {
            success: false,
            error: 'Failed to post single image to LinkedIn',
        };
    }
};

// Post multiple images to LinkedIn using MultiImage format
const postMultipleImagesToLinkedIn = async (
    accessToken: string,
    organizationId: string,
    content: string,
    mediaUrls: string[],
): Promise<{ success: boolean; postId?: string; error?: string }> => {
    try {
        // LinkedIn supports up to 20 images in a MultiImage post (minimum 2)
        const maxImages = Math.min(mediaUrls.length, 20);
        const imagesToPost = mediaUrls.slice(0, maxImages);

        if (imagesToPost.length < 2) {
            return {
                success: false,
                error: 'MultiImage posts require at least 2 images',
            };
        }

        // Upload all images first to get their URNs
        const imageUrns: string[] = [];
        for (let i = 0; i < imagesToPost.length; i++) {
            const uploadResult = await uploadImageToLinkedIn(
                accessToken,
                organizationId,
                imagesToPost[i],
            );
            if (!uploadResult.success) {
                return {
                    success: false,
                    error: `Failed to upload image ${i + 1}: ${uploadResult.error}`,
                };
            }
            imageUrns.push(uploadResult.imageUrn!);
        }

        const postData = {
            author: `urn:li:organization:${organizationId}`,
            commentary: content,
            visibility: 'PUBLIC',
            distribution: {
                feedDistribution: 'MAIN_FEED',
                targetEntities: [],
                thirdPartyDistributionChannels: [],
            },
            lifecycleState: 'PUBLISHED',
            isReshareDisabledByAuthor: false,
            content: {
                multiImage: {
                    images: imageUrns.map((urn, index) => ({
                        id: urn,
                        altText: `Image ${index + 1}`,
                    })),
                },
            },
        };

        const postRequest = await fetch('https://api.linkedin.com/rest/posts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
                'LinkedIn-Version': '202509',
                'X-Restli-Protocol-Version': '2.0.0',
            },
            body: JSON.stringify(postData),
        });

        if (postRequest.status !== 201) {
            const errorText = await postRequest.text();
            console.error('LinkedIn multiple images post failed:', errorText);
            return {
                success: false,
                error: `Failed to post multiple images to LinkedIn: ${errorText}`,
            };
        }

        // Check if response has content before parsing JSON
        const responseText = await postRequest.text();

        if (!responseText) {
            // LinkedIn might return empty response with just headers
            const postId = postRequest.headers.get('x-restli-id');
            if (postId) {
                console.log(
                    'LinkedIn multiple images post ID from header:',
                    postId,
                );
                return { success: true, postId };
            }
            return { success: true, postId: 'unknown' };
        }

        const postResponse = JSON.parse(responseText);

        return { success: true, postId: postResponse.id || postResponse.urn };
    } catch (err) {
        console.error('Error posting multiple images to LinkedIn:', err);
        return {
            success: false,
            error: 'Failed to post multiple images to LinkedIn',
        };
    }
};

// Post text-only content to LinkedIn
const postTextToLinkedIn = async (
    accessToken: string,
    organizationId: string,
    content: string,
): Promise<{ success: boolean; postId?: string; error?: string }> => {
    try {
        const postData = {
            author: `urn:li:organization:${organizationId}`,
            commentary: content,
            visibility: 'PUBLIC',
            distribution: {
                feedDistribution: 'MAIN_FEED',
                targetEntities: [],
                thirdPartyDistributionChannels: [],
            },
            lifecycleState: 'PUBLISHED',
            isReshareDisabledByAuthor: false,
        };

        const postRequest = await fetch('https://api.linkedin.com/rest/posts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
                'LinkedIn-Version': '202509',
                'X-Restli-Protocol-Version': '2.0.0',
            },
            body: JSON.stringify(postData),
        });

        if (postRequest.status !== 201) {
            const errorText = await postRequest.text();
            console.error('LinkedIn text post failed:', errorText);
            return {
                success: false,
                error: `Failed to post text to LinkedIn: ${errorText}`,
            };
        }

        // Check if response has content before parsing JSON
        const responseText = await postRequest.text();

        if (!responseText) {
            // LinkedIn might return empty response with just headers
            const postId = postRequest.headers.get('x-restli-id');

            if (postId) {
                return { success: true, postId };
            }

            return { success: true, postId: 'unknown' };
        }

        const postResponse = JSON.parse(responseText);
        return { success: true, postId: postResponse.id || postResponse.urn };
    } catch (err) {
        console.error('Error posting text to LinkedIn:', err);
        return { success: false, error: 'Failed to post text to LinkedIn' };
    }
};

// Deauthorizes LinkedIn app access
export const deauthorizeLinkedIn = async (
    accessToken: string,
): Promise<boolean> => {
    try {
        // LinkedIn OAuth 2.0 token revocation endpoint
        const revokeUrl = 'https://www.linkedin.com/oauth/v2/revoke';

        const revokeData = new URLSearchParams({
            token: accessToken,
            client_id: process.env.LINKEDIN_CLIENT_ID!,
            client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
        });

        const revokeRequest = await fetch(revokeUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: revokeData.toString(),
        });

        // LinkedIn returns 200 for successful revocation
        return revokeRequest.status === 200;
    } catch (err) {
        console.error('Error deauthorizing LinkedIn:', err);
        return false;
    }
};

export const getLinkedInPostUrl = (postId: string): string => {
    return `https://www.linkedin.com/feed/update/${postId}`;
};
