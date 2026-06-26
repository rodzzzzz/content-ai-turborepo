'use client';

import { DEFAULT_LOGOUT_REDIRECT } from '@/routes';

async function fetchCsrfToken() {
    const response = await fetch('/api/auth/csrf');
    const data = await response.json();
    return data.csrfToken;
}

async function manualSignOut() {
    const csrfToken = await fetchCsrfToken();

    const formData = new URLSearchParams();
    formData.append('csrfToken', csrfToken);
    formData.append('json', 'true');

    const response = await fetch('/api/auth/signout', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
    });

    if (response.ok) {
        // Additional post processing after signout and the session is cleared...

        window.location.href = DEFAULT_LOGOUT_REDIRECT;
    } else {
        console.error('Failed to sign out');
    }
}

export const logout = () => {
    manualSignOut();

    // signOut({ redirectTo: DEFAULT_LOGOUT_REDIRECT });
};
