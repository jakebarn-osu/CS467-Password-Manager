import { useState } from 'react';
import type { VaultItemSecret } from '@app/crypto';

export function PasswordItem({ password }: { password: VaultItemSecret }) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(password.password);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="password-item">
      <h5>{password.siteName}</h5>
      <p>Username: {password.username}</p>
      <p>Password: {revealed ? password.password : '••••••••'}</p>
      <div>
        <button type="button" onClick={() => setRevealed((prev) => !prev)}>
          {revealed ? 'Hide' : 'Reveal'}
        </button>
        <button type="button" onClick={handleCopy}>
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  );
}
