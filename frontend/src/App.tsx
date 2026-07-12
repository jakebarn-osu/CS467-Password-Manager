import { useState } from 'react';
import './App.css';
import { LoginPage } from './pages/LoginPage';
import {
  // fetchPasswords,
  // fetchUserSalt,
  // login,
  // registerNewEmail,
  // setNewUserAuthKey,
  type EncryptedPassword,
  type ServerResponse,
} from './serverAPI';
import { PasswordsPage, type Password } from './pages/PasswordsPage';
import { RegisterPage } from './pages/RegisterPage';

// Stubbed encryption library
// TODO: get real method when its ready
const testGenerateAuthKey = (_masterPassword: string): Promise<string> => {
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

// Stubbed server API
const testFetchPasswords = (): Promise<ServerResponse<EncryptedPassword[]>> => {
  return Promise.resolve({
    data: [
      {
        itemName: 'ENC-PW1',
        username: 'ENC-jake',
        password: 'ENC-12345',
      },
      {
        itemName: 'ENC-PW2',
        username: 'ENC-jake',
        password: 'ENC-54321',
      },
    ],
    publicErrorMessage: '',
  });
};

const testFetchUserSalt = (): Promise<ServerResponse<string>> => {
  return Promise.resolve({
    data: 'USER_SALT',
    publicErrorMessage: '',
  });
};

const testLogin = (): Promise<ServerResponse<boolean>> => {
  return Promise.resolve({
    data: true,
    publicErrorMessage: '',
  });
};

const testRegisterNewEmail = (): Promise<ServerResponse<string>> => {
  return Promise.resolve({
    data: 'TEST_SALT',
    publicErrorMessage: '',
  });
};

const testSetNewUserAuthKey = (_email: string, _ak: string): Promise<ServerResponse<boolean>> => {
  return Promise.resolve({
    data: true,
    publicErrorMessage: '',
  });
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
          fetchUserSalt={testFetchUserSalt}
          generateAuthKey={testGenerateAuthKey}
          login={testLogin}
          redirect={redirect}
        />
      );
    case '/register':
      return (
        <RegisterPage
          generateAuthKey={testGenerateAuthKey}
          registerNewEmail={testRegisterNewEmail}
          setNewUserAuthKey={testSetNewUserAuthKey}
          redirect={redirect}
        />
      );
    case '/passwords':
      return (
        <PasswordsPage
          fetchPasswords={testFetchPasswords}
          decryptPasswords={testDecryptPasswords}
        />
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
