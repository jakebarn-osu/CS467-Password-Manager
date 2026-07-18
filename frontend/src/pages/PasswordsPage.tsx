import { useEffect, useState } from 'react';
import type { ServerResponse } from '../serverAPI';
import type { VaultItem } from '@app/shared';
import type { VaultItemSecret } from '@app/crypto';

export type Password = VaultItemSecret & { id: string };

export function PasswordsPage({
  fetchVaultItems,
  decryptVaultItem,
  encryptionKey,
}: {
  fetchVaultItems: () => Promise<ServerResponse<VaultItem[] | null>>;
  decryptVaultItem: (payload: string, key: CryptoKey) => Promise<VaultItemSecret>;
  encryptionKey: CryptoKey;
}) {
  const [passwords, setPasswords] = useState<Password[] | null>(null);
  const [passwordsError, setPasswordsError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetchVaultItems();
      if (response.publicErrorMessage) {
        setPasswordsError(response.publicErrorMessage);
        return;
      }

      const vaultItems = response.data;
      if (!vaultItems) {
        setPasswordsError('Error fetching passwords');
        return;
      }

      try {
        const passwords = await Promise.all(
          vaultItems.map(async (item) => ({
            id: item.id,
            ...(await decryptVaultItem(item.encryptedData, encryptionKey)),
          })),
        );
        setPasswords(passwords);
      } catch {
        setPasswordsError('Unable to load your passwords.');
      }
    };

    fetchData();
  }, []);

  return (
    <div>
      <h2>Passwords</h2>
      <section className="basic-flex">
        {passwordsError && (
          <section>
            <h2>Error: {passwordsError}</h2>
          </section>
        )}

        {passwords &&
          !passwordsError &&
          passwords.length > 0 &&
          passwords.map((p) => {
            return (
              <div className="password-item" key={p.id}>
                <h5>{p.siteName}</h5>
                <p>Username: {p.username}</p>
                <p>Password: {p.password}</p>
              </div>
            );
          })}
      </section>

      {passwords && !passwordsError && passwords.length === 0 && <div>No passwords found.</div>}

      <section>Create New Password Entry:</section>
      {/* TODO new password form. */}
    </div>
  );
}
