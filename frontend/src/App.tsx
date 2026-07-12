import { useState } from 'react';
import './App.css';
import { LoginPage } from './pages/LoginPage';
import { fetchUserSalt, login } from './serverAPI';
import { PasswordsPage } from './pages/PasswordsPage';

// TODO: get real method when its ready
const testGenerateAuthKey = (_masterPassword: string): Promise<string> => {
  return Promise.resolve('TEST_AUTH_KEY');
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
    case '/passwords':
      return <PasswordsPage />;
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
