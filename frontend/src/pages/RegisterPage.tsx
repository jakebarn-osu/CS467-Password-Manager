// Registration happens in two steps.
// 1. The user submits their email address. If the address is valid and not already
//    registered, the server creates an entry and generates a salt for that email.
// 2. The user enters the desired master password, which is combined with the
//    salt received from the server to generate the auth key.
// 3. The auth key is submitted to the server so it can be hashed and stored
//    an used for future authentication.
// TODO: The server might need to return some sort of token as part of this process
//  so a different user cannot set the password for a different user.
import { useState } from 'react';
import type { ServerResponse } from '../serverAPI';

// registration they are redirected to the login page.
export function RegisterPage({
  generateAuthKey,
  registerNewEmail,
  setNewUserAuthKey,
  redirect,
}: {
  generateAuthKey: (masterPassword: string, salt: string) => Promise<string>;
  registerNewEmail: (email: string) => Promise<ServerResponse<string>>;
  setNewUserAuthKey: (email: string, authKey: string) => Promise<ServerResponse<boolean>>;
  redirect: (newPath: string) => void;
}) {
  const [formEmail, setFormEmail] = useState('');
  const [registerEmailError, setRegisterEmailError] = useState('');

  const [userSalt, setUserSalt] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [authKeyError, setAuthKeyError] = useState('');

  const handleRegisterNewEmail = async (ev: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    ev.preventDefault();

    // TODO: add client side email validation
    if (!formEmail) {
      return;
    }

    try {
      const { data: salt, publicErrorMessage } = await registerNewEmail(formEmail);
      if (publicErrorMessage) {
        setRegisterEmailError(publicErrorMessage);
        return;
      }

      setUserSalt(salt);
    } catch (e) {
      console.error(e);
      setRegisterEmailError('Error setting up your account.');
    }
  };

  const handleGenerateAuthKeyAndRegister = async (
    ev: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => {
    ev.preventDefault();

    if (!userSalt) {
      return;
    }

    try {
      const key = await generateAuthKey(userSalt, formPassword);
      const { data: success, publicErrorMessage } = await setNewUserAuthKey(formEmail, key);
      if (!success) {
        setAuthKeyError(publicErrorMessage);
        return;
      }

      redirect('/login');
    } catch (e) {
      console.error(e);
      setAuthKeyError('Error setting up your account.');
    }
  };

  return (
    <div>
      <h2>Register Page</h2>

      {!userSalt ? (
        <>
          <h3>Register your Email Address</h3>
          <form>
            <input
              type="text"
              onInput={(ev) => {
                setFormEmail(ev.currentTarget.value);
              }}
              value={formEmail}
            />
            <button onClick={handleRegisterNewEmail}>Submit</button>
          </form>

          {registerEmailError && (
            <div>
              <p>Error: {registerEmailError}</p>
            </div>
          )}
        </>
      ) : (
        <>
          <h3>Enter your new Master Password</h3>
          <form>
            <input
              type="password"
              onInput={(ev) => setFormPassword(ev.currentTarget.value)}
              value={formPassword}
            />
            <button onClick={handleGenerateAuthKeyAndRegister}>Submit</button>
          </form>

          {authKeyError && (
            <div>
              <p>Error: {authKeyError}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
