// Parts of this file were generated with AI assistance (Claude Code, Anthropic, 2026).
// Prompts used: "write some very simple tests for passwordspage.tsx"
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PasswordsPage } from './PasswordsPage';

function renderPasswordsPage(overrides = {}) {
  const props = {
    fetchPasswords: vi.fn().mockResolvedValue({ data: [], publicErrorMessage: '' }),
    decryptPasswords: vi.fn().mockResolvedValue([]),
    ...overrides,
  };

  render(<PasswordsPage {...props} />);
  return props;
}

describe('PasswordsPage', () => {
  it('renders the page heading', () => {
    renderPasswordsPage();

    expect(screen.getByText('Passwords')).toBeInTheDocument();
  });

  it('calls fetchPasswords and decryptPasswords on mount', async () => {
    const props = renderPasswordsPage();

    await vi.waitFor(() => expect(props.decryptPasswords).toHaveBeenCalledWith([]));
    expect(props.fetchPasswords).toHaveBeenCalled();
  });

  it('renders decrypted passwords once loaded', async () => {
    renderPasswordsPage({
      fetchPasswords: vi.fn().mockResolvedValue({
        data: [{ itemName: 'Email', username: 'someone', password: 'encrypted' }],
        publicErrorMessage: '',
      }),
      decryptPasswords: vi
        .fn()
        .mockResolvedValue([{ itemName: 'Email', username: 'someone', password: 'plaintext' }]),
    });

    expect(await screen.findByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Username: someone')).toBeInTheDocument();
    expect(screen.getByText('Password: plaintext')).toBeInTheDocument();
  });

  it('shows an error message when fetching passwords fails', async () => {
    const decryptPasswords = vi.fn();
    renderPasswordsPage({
      fetchPasswords: vi.fn().mockResolvedValue({ data: null, publicErrorMessage: 'Error fetching passwords.' }),
      decryptPasswords,
    });

    expect(await screen.findByText('Error: Error fetching passwords.')).toBeInTheDocument();
    expect(decryptPasswords).not.toHaveBeenCalled();
  });

  it('shows an error message when decrypting passwords fails', async () => {
    renderPasswordsPage({
      decryptPasswords: vi.fn().mockRejectedValue(new Error('boom')),
    });

    expect(await screen.findByText('Error: Unable to load your passwords.')).toBeInTheDocument();
  });
});
