/**
 * Hash a password using PBKDF2 with SHA-256
 * This is Edge Runtime compatible and provides similar security to bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));

    // Use PBKDF2 with SHA-256, 100,000 iterations for security
    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        'PBKDF2',
        false,
        ['deriveBits'],
    );

    const hash = await crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: 100000,
            hash: 'SHA-256',
        },
        key,
        256,
    );

    // Combine salt and hash, then encode as base64
    const combined = new Uint8Array(salt.length + hash.byteLength);
    combined.set(salt);
    combined.set(new Uint8Array(hash), salt.length);

    return btoa(String.fromCharCode(...combined));
}

/**
 * Compare a password with a hashed password
 */
export async function comparePassword(
    password: string,
    hashedPassword: string,
): Promise<boolean> {
    try {
        const encoder = new TextEncoder();

        // Decode the combined salt + hash
        const combined = new Uint8Array(
            atob(hashedPassword)
                .split('')
                .map((char) => char.charCodeAt(0)),
        );

        // Extract salt (first 16 bytes) and hash (remaining bytes)
        const salt = combined.slice(0, 16);
        const storedHash = combined.slice(16);

        // Hash the provided password with the same salt
        const key = await crypto.subtle.importKey(
            'raw',
            encoder.encode(password),
            'PBKDF2',
            false,
            ['deriveBits'],
        );

        const hash = await crypto.subtle.deriveBits(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: 100000,
                hash: 'SHA-256',
            },
            key,
            256,
        );

        // Compare the hashes
        const providedHash = new Uint8Array(hash);

        // Use constant-time comparison to prevent timing attacks
        if (storedHash.length !== providedHash.length) {
            return false;
        }

        let result = 0;
        for (let i = 0; i < storedHash.length; i++) {
            result |= storedHash[i] ^ providedHash[i];
        }

        return result === 0;
    } catch {
        // If there's any error (e.g., invalid hash format), return false
        return false;
    }
}
