import { useState } from 'react';
import { generateSaltString } from '@app/crypto';

import './App.css';
import { LoginPage } from './pages/LoginPage';
import {
  fetchPasswords,
  fetchUserSalt,
  login,
  registerNewEmail,
  type EncryptedPassword,
} from './serverAPI';
import { PasswordsPage, type Password } from './pages/PasswordsPage';
import { RegisterPage } from './pages/RegisterPage';

// TODO: get real method when its ready
const testGenerateAuthKey = (_masterPassword: string, _salt: string): Promise<string> => {
  return Promise.resolve('TEST_AUTH_KEY');
};

const testDecryptPasswords = (_pws: EncryptedPassword[]): Promise<Password[]> => {
  return Promise.resolve([
    {
      itemName: 'PW1',
      username: 'jake',
      password: '12345',
    },
    {
      itemName: 'PW2',
      username: 'jake',
      password: '54321',
    },
  ]);
};

function App() {
  return (
    <section id="center">
      <Routes />
    </section>
  );
}

function Routes() {
  const [path, setPath] = useState(window.location.pathname);

  const redirect = (newPath: string) => {
    window.location.pathname = newPath;
    setPath(newPath);
  };

  switch (path) {
    case '/login':
      return (
        <LoginPage
          fetchUserSalt={fetchUserSalt}
          generateAuthKey={testGenerateAuthKey}
          login={login}
          redirect={redirect}
        />
      );
    case '/register':
      return (
        <RegisterPage
          generateSalt={generateSaltString}
          generateAuthKey={testGenerateAuthKey}
          registerNewUser={registerNewEmail}
          redirect={redirect}
        />
      );
    case '/passwords':
      return (
        <PasswordsPage fetchPasswords={fetchPasswords} decryptPasswords={testDecryptPasswords} />
      );
    default:
      return <PageNotFound />;
  }
}

function PageNotFound() {
  return (
    <div>
      <h2>Page Not Found</h2>
    </div>
  );
}

export default App;
