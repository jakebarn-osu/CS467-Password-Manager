import { useEffect, useState } from 'react';
import type { ServerResponse } from '../serverAPI';
import type { MeResponse, VaultItem } from '@app/shared';
import type { VaultItemSecret } from '@app/crypto';

export type Password = VaultItemSecret;

export function PasswordsPage({
  fetchVaultItems,
  decryptVaultItem,
  encryptionKey,
  fetchMe,
  redirect,
}: {
  fetchVaultItems: () => Promise<ServerResponse<VaultItem[] | null>>;
  decryptVaultItem: (payload: string, key: CryptoKey) => Promise<VaultItemSecret>;
  encryptionKey: CryptoKey | undefined;
  fetchMe: () => Promise<ServerResponse<MeResponse | null>>;
  redirect: (route: string) => void;
}) {
  const [passwords, setPasswords] = useState<Password[] | null>(null);
  const [passwordsError, setPasswordsError] = useState('');
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await fetchMe();
      const email = data?.email ?? '';
      setUserEmail(email);

      if (!email || !encryptionKey) {
        redirect('/login');
        return;
      }

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
      {userEmail && <p>Logged in as {userEmail}</p>}
      <section className="basic-flex">
        {passwordsError && (
          <section>
            <h2>Error: {passwordsError}</h2>
          </section>
        )}

        {passwords &&
          !passwordsError &&
          passwords.length > 0 &&
          passwords.map((p, i) => {
            return (
              <div className="password-item" key={i}>
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
