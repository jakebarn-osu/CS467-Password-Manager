import { useEffect, useState } from 'react';
import { deriveKeys, generateSalt, type DerivedKeys, type VaultItemSecret } from '@app/crypto';

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

function App() {
  return (
    <section id="center">
      <Routes />
    </section>
  );
}

function Routes() {
  const [path, setPath] = useState(window.location.pathname);
  const [keys, setKeys] = useState<DerivedKeys | null>();

  const redirect = (newPath: string) => {
    window.history.pushState(null, '', newPath);
    setPath(newPath);
  };

  useEffect(() => {
    const handlePopState = () => setPath(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleDeriveKeys = async (password: string, salt: Uint8Array): Promise<DerivedKeys> => {
    const derived = await deriveKeys(password, salt);
    setKeys(derived);
    return derived;
  };

  switch (path) {
    case '/login':
      return (
        <LoginPage
          fetchUserSalt={fetchUserSalt}
          deriveKeys={handleDeriveKeys}
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
          encryptionKey={keys?.encryptionKey}
          fetchMe={fetchMe}
          redirect={redirect}
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
