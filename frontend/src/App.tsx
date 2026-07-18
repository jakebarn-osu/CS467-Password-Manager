import { useEffect, useState } from 'react';
import {
  deriveKeys,
  decryptVaultItem,
  generateSalt,
  type DerivedKeys,
  type VaultItemSecret,
} from '@app/crypto';

import './App.css';
import { LoginPage } from './pages/LoginPage';
import {
  createVaultItem,
  fetchMe,
  fetchVaultItems,
  fetchUserSalt,
  login,
  registerNewEmail,
} from './serverAPI';
import { PasswordsPage } from './pages/PasswordsPage';
import { RegisterPage } from './pages/RegisterPage';

// TODO: replace with crypto's encryptVaultItem once it's implemented (Phase 2).
const testEncryptVaultItem = (_item: VaultItemSecret, _key: CryptoKey): Promise<string> => {
  return Promise.resolve('ENCRYPTED-BLOB');
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
          decryptVaultItem={decryptVaultItem}
          encryptVaultItem={testEncryptVaultItem}
          createVaultItem={createVaultItem}
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
