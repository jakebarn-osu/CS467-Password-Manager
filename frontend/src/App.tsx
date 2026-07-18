import { useState } from 'react';
import { deriveKeys, generateSalt, type VaultItemSecret } from '@app/crypto';

import './App.css';
import { LoginPage } from './pages/LoginPage';
import { fetchMe, fetchVaultItems, fetchUserSalt, login, registerNewEmail } from './serverAPI';
import { PasswordsPage } from './pages/PasswordsPage';
import { RegisterPage } from './pages/RegisterPage';

const testDecryptVaultItem = (_payload: string, _key: CryptoKey): Promise<VaultItemSecret> => {
  return Promise.resolve({
    siteName: 'Example Site',
    username: 'jake',
    password: '12345',
  });
};

const testEncryptionKey = {} as CryptoKey;

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
          deriveKeys={deriveKeys}
          login={login}
          redirect={redirect}
        />
      );
    case '/register':
      return (
        <RegisterPage
          generateSalt={generateSalt}
          deriveKeys={deriveKeys}
          registerNewUser={registerNewEmail}
          redirect={redirect}
        />
      );
    case '/passwords':
      return (
        <PasswordsPage
          fetchVaultItems={fetchVaultItems}
          decryptVaultItem={testDecryptVaultItem}
          encryptionKey={testEncryptionKey}
          fetchMe={fetchMe}
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
