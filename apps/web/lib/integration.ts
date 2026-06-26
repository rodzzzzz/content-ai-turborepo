export const getTwitterOauthUrl = (callbackUrl: string) => {
    const rootUrl = 'https://twitter.com/i/oauth2/authorize';
    const options = {
        redirect_uri: callbackUrl,
        client_id: process.env.TWITTER_CLIENT_ID!,
        state: 'state',
        response_type: 'code',
        code_challenge: 'y_SfRG4BmOES02uqWeIkIgLQAlTBggyf_G7uKT51ku8',
        code_challenge_method: 'S256',
        //👇🏻 required scope for authentication and posting tweets
        scope: [
            'users.read',
            'tweet.read',
            'tweet.write',
            'offline.access',
        ].join(' '),
    };
    const qs = new URLSearchParams(options).toString();

    return `${rootUrl}?${qs}`;
};

export const getFacebookOauthUrl = (callbackUrl: string) => {
    const rootUrl = 'https://www.facebook.com/v23.0/dialog/oauth';
    const options = {
        redirect_uri: callbackUrl,
        client_id: process.env.FACEBOOK_CLIENT_ID!,
        state: 'state',
        response_type: 'code',
        scope: 'public_profile,pages_show_list,pages_read_engagement,pages_manage_posts,read_insights',
    };

    const qs = new URLSearchParams(options).toString();
    return `${rootUrl}?${qs}`;
};

export const getInstagramOauthUrl = (callbackUrl: string) => {
    const rootUrl = 'https://api.instagram.com/oauth/authorize';
    const options = {
        client_id: process.env.INSTAGRAM_CLIENT_ID!,
        redirect_uri: callbackUrl,
        scope: 'instagram_business_basic',
        response_type: 'code',
    };

    const qs = new URLSearchParams(options).toString();
    return `${rootUrl}?${qs}`;
};

export const getLinkedinOauthUrl = (callbackUrl: string) => {
    const rootUrl = 'https://www.linkedin.com/oauth/v2/authorization';
    const options = {
        client_id: process.env.LINKEDIN_CLIENT_ID!,
        redirect_uri: callbackUrl,
        response_type: 'code',
        scope: [
            'openid',
            'profile',
            'email',
            'r_organization_social',
            'w_organization_social',
            'rw_organization_admin',
        ].join(' '),
    };

    const qs = new URLSearchParams(options).toString();
    return `${rootUrl}?${qs}`;
};
