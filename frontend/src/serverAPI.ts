import { bytesToBase64 } from '@app/crypto';
import { type RegisterRequest, type RegisterResponse } from '@app/shared';

export type ServerResponse<T> = {
  data: T;
  publicErrorMessage: string;
};

const DEFAULT_SERVER_ERROR = 'Unable to reach the server. Please try again later.';

type UserSalt = string;

export async function fetchUserSalt(email: string): Promise<ServerResponse<UserSalt>> {
  const url = `/salt?email=${email}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      console.error(response);
      return {
        data: '',
        publicErrorMessage: 'Error logging in.',
      };
    }

    const responseBody = await response.json();
    if (!responseBody.salt) {
      console.error(response);
      return {
        data: '',
        publicErrorMessage: 'Error logging in.',
      };
    }

    return {
      data: responseBody.salt,
      publicErrorMessage: '',
    };
  } catch (error) {
    console.error(error);
    return {
      data: '',
      publicErrorMessage: 'Error logging in.',
    };
  }
}

const DEFAULT_REGISTER_ERROR = 'Error registering.';

export async function registerNewEmail(
  email: string,
  authKey: Uint8Array,
  salt: Uint8Array,
): Promise<ServerResponse<RegisterResponse | null>> {
  const url = '/api/v1/auth/register';

  const body: RegisterRequest = {
    email,
    authKey: bytesToBase64(authKey),
    salt: bytesToBase64(salt),
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.error(response);

      let publicMessage = DEFAULT_REGISTER_ERROR;

      if (response.status == 409) {
        publicMessage = 'This email address is already registered.';
      } else if (response.status >= 500 && response.status < 600)
        publicMessage = DEFAULT_SERVER_ERROR;

      return {
        data: null,
        publicErrorMessage: publicMessage,
      };
    }

    const responseBody = await response.json();
    if (!responseBody.id || !responseBody.email) {
      console.error('Invalid response: ', response);
      return {
        data: null,
        publicErrorMessage: DEFAULT_REGISTER_ERROR,
      };
    }

    return {
      data: responseBody,
      publicErrorMessage: '',
    };
  } catch (error) {
    console.error(error);
    return {
      data: null,
      publicErrorMessage: DEFAULT_REGISTER_ERROR,
    };
  }
}

export async function login(authKey: string): Promise<ServerResponse<boolean>> {
  const url = '/login';

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ authKey }),
    });

    if (!response.ok || !response.headers.get('Set-Cookie')) {
      console.error(response);
      return {
        data: false,
        publicErrorMessage: 'Error logging in.',
      };
    }

    return {
      data: true,
      publicErrorMessage: '',
    };
  } catch (error) {
    console.error(error);
    return {
      data: false,
      publicErrorMessage: 'Error logging in.',
    };
  }
}

export type EncryptedPassword = {
  itemName: string;
  username: string;
  password: string;
};

export async function fetchPasswords(): Promise<ServerResponse<EncryptedPassword[] | null>> {
  const url = `/passwords`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      console.error(response);
      return {
        data: null,
        publicErrorMessage: 'Error fetching passwords.',
      };
    }

    const responseBody = await response.json();
    if (!responseBody.passwords) {
      console.error(response);
      return {
        data: null,
        publicErrorMessage: 'Error fetching passwords.',
      };
    }

    return {
      data: responseBody.passwords,
      publicErrorMessage: '',
    };
  } catch (error) {
    console.error(error);
    return {
      data: null,
      publicErrorMessage: 'Error fetching passwords.',
    };
  }
}
