export type ServerResponse<T> = {
  data: T;
  publicErrorMessage: string;
};

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

export async function registerNewEmail(email: string): Promise<ServerResponse<UserSalt>> {
  const url = '/register';

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      console.error(response);
      return {
        data: '',
        publicErrorMessage: 'Error registering.',
      };
    }

    const responseBody = await response.json();
    if (!responseBody.salt) {
      console.error(response);
      return {
        data: '',
        publicErrorMessage: 'Error registering.',
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
      publicErrorMessage: 'Error registering.',
    };
  }
}

export async function setNewUserAuthKey(
  email: string,
  authKey: string,
): Promise<ServerResponse<boolean>> {
  const url = '/setAuthKey';

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, authKey }),
    });

    if (!response.ok) {
      console.error(response);
      return {
        data: false,
        publicErrorMessage: 'Error registering.',
      };
    }

    const responseBody = await response.json();
    if (!responseBody.success) {
      console.error(response);
      return {
        data: false,
        publicErrorMessage: 'Error registering.',
      };
    }

    return {
      data: responseBody.salt,
      publicErrorMessage: '',
    };
  } catch (error) {
    console.error(error);
    return {
      data: false,
      publicErrorMessage: 'Error registering.',
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
