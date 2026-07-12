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
