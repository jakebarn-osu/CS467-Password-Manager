// Parts of this file were generated with AI assistance (Claude Code, Anthropic, 2026).
// Prompts used: "write some very simple tests for passwordspage.tsx"
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PasswordsPage } from './PasswordsPage';

const STUB_KEY = {} as CryptoKey;

function renderPasswordsPage(overrides = {}) {
  const props = {
    fetchVaultItems: vi.fn().mockResolvedValue({ data: [], publicErrorMessage: '' }),
    decryptVaultItem: vi.fn(),
    encryptionKey: STUB_KEY,
    fetchMe: vi
      .fn()
      .mockResolvedValue({ data: { id: 'user-1', email: 'user@example.com', mfaEnabled: false }, publicErrorMessage: '' }),
    ...overrides,
  };

  render(<PasswordsPage {...props} />);
  return props;
}

describe('PasswordsPage', () => {
  it('renders the page heading', async () => {
    const props = renderPasswordsPage();

    expect(screen.getByText('Passwords')).toBeInTheDocument();
    await waitFor(() => expect(props.fetchVaultItems).toHaveBeenCalled());
  });

  it('calls fetchVaultItems on mount', async () => {
    const props = renderPasswordsPage();

    await waitFor(() => expect(props.fetchVaultItems).toHaveBeenCalled());
    expect(props.decryptVaultItem).not.toHaveBeenCalled();
  });

  it('shows a no passwords message when there are no passwords', async () => {
    renderPasswordsPage();

    expect(await screen.findByText('No passwords found.')).toBeInTheDocument();
  });

  it('renders decrypted passwords once loaded', async () => {
    renderPasswordsPage({
      fetchVaultItems: vi.fn().mockResolvedValue({
        data: [{ id: 'item-1', encryptedData: 'encrypted-blob', createdAt: '', updatedAt: '' }],
        publicErrorMessage: '',
      }),
      decryptVaultItem: vi
        .fn()
        .mockResolvedValue({ siteName: 'Email', username: 'someone', password: 'plaintext' }),
    });

    expect(await screen.findByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Username: someone')).toBeInTheDocument();
    expect(screen.getByText('Password: plaintext')).toBeInTheDocument();
    expect(screen.queryByText('No passwords found.')).not.toBeInTheDocument();
  });

  it('shows an error message when fetching vault items fails', async () => {
    const decryptVaultItem = vi.fn();
    renderPasswordsPage({
      fetchVaultItems: vi
        .fn()
        .mockResolvedValue({ data: null, publicErrorMessage: 'Error fetching passwords.' }),
      decryptVaultItem,
    });

    expect(await screen.findByText('Error: Error fetching passwords.')).toBeInTheDocument();
    expect(decryptVaultItem).not.toHaveBeenCalled();
    expect(screen.queryByText('No passwords found.')).not.toBeInTheDocument();
  });

  it('shows an error message when decrypting a vault item fails', async () => {
    renderPasswordsPage({
      fetchVaultItems: vi.fn().mockResolvedValue({
        data: [{ id: 'item-1', encryptedData: 'encrypted-blob', createdAt: '', updatedAt: '' }],
        publicErrorMessage: '',
      }),
      decryptVaultItem: vi.fn().mockRejectedValue(new Error('boom')),
    });

    expect(await screen.findByText('Error: Unable to load your passwords.')).toBeInTheDocument();
  });

  it('shows who is logged in when an auth token is present', async () => {
    renderPasswordsPage();

    expect(await screen.findByText('Logged in as user@example.com')).toBeInTheDocument();
  });

  it('does not show a logged in message when there is no auth token', async () => {
    renderPasswordsPage({
      fetchMe: vi.fn().mockResolvedValue({ data: null, publicErrorMessage: 'Error fetching account details.' }),
    });

    await waitFor(() => expect(screen.queryByText(/Logged in as/)).not.toBeInTheDocument());
  });
});
