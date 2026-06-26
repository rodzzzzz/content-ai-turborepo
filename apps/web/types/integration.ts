// Facebook API Types
export interface FacebookPage {
    id: string;
    name: string;
    access_token: string;
    picture?: {
        data?: {
            url?: string;
        };
    };
}

export interface FacebookUserData {
    id: string;
    name: string;
    email?: string;
    picture?: {
        data?: {
            url?: string;
        };
    };
}

export interface FacebookTokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
}

// LinkedIn API Types
export interface LinkedInCompany {
    'organizationalTarget~': {
        id: string;
        localizedName: string;
        vanityName?: string;
        logoV2?: {
            original: string;
            cropped: string;
        };
    };
}

export interface LinkedInUserData {
    sub: string;
    name: string;
    given_name?: string;
    family_name?: string;
    picture?: string;
    email?: string;
    id_token?: string;
    token_type?: string;
}

export interface LinkedInTokenResponse {
    access_token: string;
    expires_in: number;
    scope: string;
}

// Twitter API Types
export interface TwitterUserData {
    data: {
        id: string;
        name: string;
        username: string;
        profile_image_url?: string;
    };
}

export interface TwitterTokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    scope: string;
    refresh_token?: string;
}

// Generic Account Types
export interface Account {
    id: string;
    name: string;
    type: 'personal' | 'page' | 'company';
    picture?: string;
    access_token?: string;
    profile_picture?: string;
    username?: string;
}

export interface IntegrationUserData {
    id: string;
    name: string;
    email?: string;
    picture?:
        | string
        | {
              data?: {
                  url?: string;
              };
          };
    access_token: string;
    profile_picture?: string;
    username?: string;
}

// Integrated Account Response Type
export interface IntegratedAccount {
    id: string;
    provider: string;
    account_name: string | null;
    account_type: string | null;
    page_name: string | null;
    providerAccountId: string;
    profile_picture: string | null;
    username: string | null;
    expiresAt?: number | null;
    isExpired?: boolean;
    isExpiringSoon?: boolean;
    daysUntilExpiration?: number | null;
}

// API Response Types
export interface AccountsResponse {
    accounts: Account[];
}

export interface IntegrationError {
    error: string;
    message?: string;
}
