import { useState } from 'react';
import { type ServerResponse } from '../serverAPI';
import type { LoginResponse, SaltResponse } from '@app/shared';
import { base64ToBytes, bytesToBase64, type DerivedKeys } from '@app/crypto';

// Login is a four step process.
//   1. A user enters their email and we fetch the salt associated with that email.
//   2. A user enters their master password. We use this and the salt from step 1
//      to derive an auth key.
//   3. We send the auth key to the server for validation. If it is valid, the server
//      sets a bearer token in a secure cookie that authorizes future requests.
//   4. We redirect the user to the passwords page.
export function LoginPage({
  fetchUserSalt,
  deriveKeys,
  login,
  redirect,
}: {
  fetchUserSalt: (email: string) => Promise<ServerResponse<SaltResponse | null>>;
  deriveKeys: (masterPassword: string, salt: Uint8Array) => Promise<DerivedKeys>;
  login: (email: string, authKey: string) => Promise<ServerResponse<LoginResponse | null>>;
  redirect: (newPath: string) => void;
}) {
  const [formEmail, setFormEmail] = useState('');
  const [userSalt, setUserSalt] = useState<Uint8Array | null>(null);
  const [fetchUserSaltError, setFetchUserSaltError] = useState('');

  const [formPassword, setFormPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const handleFetchUserSalt = async (ev: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    ev.preventDefault();

    // TODO: add client side email format validations
    if (!formEmail) {
      return;
    }

    setUserSalt(null);
    setFetchUserSaltError('');

    const { data, publicErrorMessage } = await fetchUserSalt(formEmail);
    setFetchUserSaltError(publicErrorMessage);
    if (!data) {
      return;
    }
    setUserSalt(base64ToBytes(data.salt));
  };

  const handleGenerateAuthKeyAndLogin = async (
    ev: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => {
    ev.preventDefault();

    // TODO: add client side password validation
    if (!formPassword || !userSalt) {
      return;
    }

    try {
      const { authKey } = await deriveKeys(formPassword, userSalt);
      const { data, publicErrorMessage } = await login(formEmail, bytesToBase64(authKey));
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
