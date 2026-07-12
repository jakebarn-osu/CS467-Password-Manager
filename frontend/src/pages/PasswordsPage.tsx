import { useEffect, useState } from 'react';
import type { EncryptedPassword, ServerResponse } from '../serverAPI';

export type Password = {
  itemName: string;
  username: string;
  password: string;
};

export function PasswordsPage({
  fetchPasswords,
  decryptPasswords,
}: {
  fetchPasswords: () => Promise<ServerResponse<EncryptedPassword[] | null>>;
  decryptPasswords: (encrypted: EncryptedPassword[]) => Promise<Password[]>;
}) {
  const [passwords, setPasswords] = useState<Password[] | null>(null);
  const [passwordsError, setPasswordsError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetchPasswords();
      if (response.publicErrorMessage) {
        setPasswordsError(response.publicErrorMessage);
        return;
      }

      const encryptedPasswords = response.data;
      if (!response.data) {
        setPasswordsError('Error fetching passwords');
        return;
      }

      try {
        const passwords = await decryptPasswords(encryptedPasswords ?? []);
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

        {passwords && !passwordsError ? (
          passwords.map((p) => {
            return (
              <div className="password-item">
                <h5>{p.itemName}</h5>
                <p>Username: {p.username}</p>
                <p>Password: {p.password}</p>
              </div>
            );
          })
        ) : (
          <div>No passwords found.</div>
        )}
      </section>

      <section>Create New Password Entry:</section>
      {/* TODO new password form. */}
    </div>
  );
}
