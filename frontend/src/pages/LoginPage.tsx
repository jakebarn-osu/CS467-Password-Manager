import { useState } from 'react';
import { type ServerResponse } from '../serverAPI';
import type { LoginResponse, SaltResponse } from '@app/shared';

// Login is a four step process.
//   1. A user enters their email and we fetch the salt associated with that email.
//   2. A user enters their master password. We use this and the salt from step 1
//      to generate an auth key.
//   3. We send the auth key to the server for validation. If it is valid, the server
//      sets a bearer token in a secure cookie that authorizes future requests.
//   4. We redirect the user to the passwords page.
export function LoginPage({
  fetchUserSalt,
  generateAuthKey,
  login,
  redirect,
}: {
  fetchUserSalt: (email: string) => Promise<ServerResponse<SaltResponse | null>>;
  generateAuthKey: (masterPassword: string, salt: string) => Promise<string>;
  login: (email: string, authKey: string) => Promise<ServerResponse<LoginResponse | null>>;
  redirect: (newPath: string) => void;
}) {
  const [formEmail, setFormEmail] = useState('');
  const [userSalt, setUserSalt] = useState('');
  const [fetchUserSaltError, setFetchUserSaltError] = useState('');

  const [formPassword, setFormPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const handleFetchUserSalt = async (ev: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    ev.preventDefault();

    // TODO: add client side email format validations
    if (!formEmail) {
      return;
    }

    setUserSalt('');
    setFetchUserSaltError('');

    const { data, publicErrorMessage } = await fetchUserSalt(formEmail);
    setFetchUserSaltError(publicErrorMessage);
    if (!data) {
      return;
    }
    setUserSalt(data.salt);
  };

  const handleGenerateAuthKeyAndLogin = async (
    ev: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => {
    ev.preventDefault();

    // TODO: add client side password validation
    if (!formPassword) {
      return;
    }

    try {
      const key = await generateAuthKey(userSalt, formPassword);
      const { data, publicErrorMessage } = await login(formEmail, key);
      if (!data) {
        setLoginError(publicErrorMessage);
        return;
      }

      // TODO: store in sessionStorage for now, not secure. We probably want to
      // move to a cookie.
      sessionStorage.setItem('token', data.token);

      redirect('/passwords');
    } catch (e) {
      console.error(e);
      setLoginError('Error logging in.');
    }
  };

  return (
    <div>
      <h2>Login Page</h2>

      {!userSalt ? (
        <>
          <h3>Enter your Email Address</h3>
          <form>
            <input
              type="text"
              onInput={(ev) => {
                setFormEmail(ev.currentTarget.value);
              }}
              value={formEmail}
            />
            <button onClick={handleFetchUserSalt}>Submit</button>
          </form>

          {fetchUserSaltError && (
            <div>
              <p>Error: {fetchUserSaltError}</p>
            </div>
          )}
        </>
      ) : (
        <>
          <h3>Enter your Master Password</h3>
          <form>
            <input
              type="password"
              onInput={(ev) => setFormPassword(ev.currentTarget.value)}
              value={formPassword}
            />
            <button onClick={handleGenerateAuthKeyAndLogin}>Submit</button>
          </form>

          {loginError && (
            <div>
              <p>Error: {loginError}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
