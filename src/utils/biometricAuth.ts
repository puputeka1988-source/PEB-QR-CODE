/**
 * WebAuthn & Device Biometric / Screen Lock Helper Utilities
 * Compatible with modern browsers supporting Web Authentication API (navigator.credentials).
 */

export interface BiometricCredential {
  id: string; // Base64 encoded credential ID
  rawId: string;
  type: string;
  createdAt: number;
  deviceName?: string;
}

// Convert ArrayBuffer to Base64URL string
export function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Convert Base64URL string to ArrayBuffer
export function base64ToBuffer(base64: string): ArrayBuffer {
  const str = base64.replace(/-/g, '+').replace(/_/g, '/');
  const padLen = (4 - (str.length % 4)) % 4;
  const padded = str + '='.repeat(padLen);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Generate random cryptographic challenge
export function generateRandomChallenge(length = 32): Uint8Array {
  const challenge = new Uint8Array(length);
  window.crypto.getRandomValues(challenge);
  return challenge;
}

/**
 * Check if WebAuthn / Platform Authenticator (Fingerprint/FaceID/Windows Hello/Screen Lock) is supported
 */
export async function isBiometricAvailable(): Promise<boolean> {
  try {
    if (!window.PublicKeyCredential) {
      return false;
    }
    if (typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function') {
      const available = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      return available;
    }
    return true;
  } catch (e) {
    console.warn('WebAuthn biometric support check failed:', e);
    return false;
  }
}

/**
 * Register biometric / platform authenticator for the current device
 */
export async function registerBiometric(username: string, displayName = 'Admin Presensi'): Promise<{ success: boolean; credential?: BiometricCredential; error?: string }> {
  try {
    if (!window.PublicKeyCredential) {
      return { success: false, error: 'Browser ini belum mendukung Web Authentication (WebAuthn).' };
    }

    const userIdBytes = new Uint8Array(16);
    window.crypto.getRandomValues(userIdBytes);
    const challenge = generateRandomChallenge(32);

    const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
      challenge,
      rp: {
        name: 'QR-Presensi Digital',
        id: window.location.hostname || undefined
      },
      user: {
        id: userIdBytes,
        name: username,
        displayName: displayName
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' }, // ES256
        { alg: -257, type: 'public-key' } // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform', // Fingerprint, Face ID, Screen Lock, Windows Hello
        userVerification: 'preferred',
        requireResidentKey: false
      },
      timeout: 60000,
      attestation: 'none'
    };

    const credential = (await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions
    })) as PublicKeyCredential | null;

    if (!credential) {
      return { success: false, error: 'Pendaftaran biometrik dibatalkan.' };
    }

    const credId = bufferToBase64(credential.rawId);
    const userAgent = navigator.userAgent;
    let deviceName = 'Perangkat Ini';
    if (/android/i.test(userAgent)) deviceName = 'Perangkat Android (Sidik Jari / Kunci Layar)';
    else if (/iphone|ipad|ipod/i.test(userAgent)) deviceName = 'Perangkat Apple (Touch ID / Face ID)';
    else if (/windows/i.test(userAgent)) deviceName = 'Komputer Windows (Windows Hello)';
    else if (/macintosh/i.test(userAgent)) deviceName = 'Mac (Touch ID / Apple)';

    const result: BiometricCredential = {
      id: credId,
      rawId: credId,
      type: credential.type,
      createdAt: Date.now(),
      deviceName
    };

    return { success: true, credential: result };
  } catch (err: any) {
    console.error('Biometric registration error:', err);
    if (err.name === 'NotAllowedError') {
      return { success: false, error: 'Pendaftaran biometrik dibatalkan atau waktu habis.' };
    }
    if (err.name === 'InvalidStateError') {
      return { success: false, error: 'Perangkat biometrik ini sudah terdaftar sebelumnya.' };
    }
    return { success: false, error: err.message || 'Gagal mendaftarkan biometrik perangkat.' };
  }
}

/**
 * Authenticate with registered biometric credential
 */
export async function authenticateBiometric(allowedCredentialId?: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!window.PublicKeyCredential) {
      return { success: false, error: 'Web Authentication tidak didukung di perangkat ini.' };
    }

    const challenge = generateRandomChallenge(32);

    const allowCredentials: PublicKeyCredentialDescriptor[] = [];
    if (allowedCredentialId) {
      try {
        allowCredentials.push({
          id: base64ToBuffer(allowedCredentialId),
          type: 'public-key',
          transports: ['internal']
        });
      } catch (e) {
        console.warn('Could not parse allowed credential ID buffer:', e);
      }
    }

    const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
      challenge,
      timeout: 60000,
      rpId: window.location.hostname || undefined,
      userVerification: 'preferred',
      allowCredentials: allowCredentials.length > 0 ? allowCredentials : undefined
    };

    const assertion = await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions
    });

    if (assertion) {
      return { success: true };
    }

    return { success: false, error: 'Verifikasi biometrik tidak valid.' };
  } catch (err: any) {
    console.error('Biometric verification error:', err);
    if (err.name === 'NotAllowedError') {
      return { success: false, error: 'Verifikasi biometrik dibatalkan atau tidak cocok.' };
    }
    return { success: false, error: err.message || 'Verifikasi biometrik gagal.' };
  }
}
