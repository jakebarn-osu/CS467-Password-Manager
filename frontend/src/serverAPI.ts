import {
  type LoginRequest,
  type LoginResponse,
  type RegisterRequest,
  type RegisterResponse,
  type SaltResponse,
} from '@app/shared';
import { bytesToBase64 } from '@app/crypto';

export type ServerResponse<T> = {
  data: T;
  publicErrorMessage: string;
};

const DEFAULT_SERVER_ERROR = 'Unable to reach the server. Please try again later.';

const DEFAULT_LOGIN_ERROR = 'Error logging in.';

export async function fetchUserSalt(email: string): Promise<ServerResponse<SaltResponse | null>> {
  const url = `/api/v1/auth/salt?email=${email}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      let publicMessage = DEFAULT_LOGIN_ERROR;

      if (response.status >= 500 && response.status < 600) {
        publicMessage = DEFAULT_SERVER_ERROR;
      }

      return {
        data: null,
        publicErrorMessage: publicMessage,
      };
    }

    const responseBody = await response.json();
    if (!responseBody.salt) {
      console.error(response);
      return {
        data: null,
        publicErrorMessage: DEFAULT_LOGIN_ERROR,
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
      publicErrorMessage: DEFAULT_LOGIN_ERROR,
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
      } else if (response.status >= 500 && response.status < 600) {
        publicMessage = DEFAULT_SERVER_ERROR;
      }

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

export async function login(
  email: string,
  authKey: string,
): Promise<ServerResponse<LoginResponse | null>> {
  const url = '/api/v1/auth/login';

  const body: LoginRequest = {
    email,
    authKey,
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
      let publicMessage = DEFAULT_LOGIN_ERROR;

      if (response.status >= 500 && response.status < 600) {
        publicMessage = DEFAULT_SERVER_ERROR;
      }

      return {
        data: null,
        publicErrorMessage: publicMessage,
      };
    }

    const responseJson = await response.json();

    return {
      data: responseJson,
      publicErrorMessage: '',
    };
  } catch (error) {
    console.error(error);
    return {
      data: null,
      publicErrorMessage: DEFAULT_LOGIN_ERROR,
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
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    });

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
