// Parts of this file were generated with AI assistance (Claude Code, Anthropic, 2026).
// Prompts used: "write some very simple tests for registerpage.tsx"
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { RegisterPage } from './RegisterPage';

const SOME_SALT = new Uint8Array([1, 2, 3]);
const SOME_AUTH_KEY = new Uint8Array([4, 5, 6]);

function renderRegisterPage(overrides = {}) {
  const props = {
    generateSalt: vi.fn().mockReturnValue(SOME_SALT),
    deriveKeys: vi.fn().mockResolvedValue({ authKey: SOME_AUTH_KEY, encryptionKey: {} }),
    registerNewUser: vi.fn().mockResolvedValue({ data: 'some-salt', publicErrorMessage: '' }),
    redirect: vi.fn(),
    ...overrides,
  };

  render(<RegisterPage {...props} />);
  return props;
}

function fillOutForm(email: string, password: string) {
  fireEvent.input(screen.getByRole('textbox'), { target: { value: email } });
  fireEvent.input(document.querySelector('input[type="password"]')!, {
    target: { value: password },
  });
}

describe('RegisterPage', () => {
  it('renders the registration form', () => {
    renderRegisterPage();

    expect(screen.getByText('Enter your email address')).toBeInTheDocument();
    expect(screen.getByText('Enter your new Master Password')).toBeInTheDocument();
  });

  it('does not register when the email or password field is empty', () => {
    const props = renderRegisterPage();

    fireEvent.click(screen.getByText('Submit'));

    expect(props.registerNewUser).not.toHaveBeenCalled();
  });

  it('generates a salt and auth key and registers the user on submit', async () => {
    const props = renderRegisterPage();

    fillOutForm('user@example.com', 'super-secret');
    fireEvent.click(screen.getByText('Submit'));

    await vi.waitFor(() => expect(props.redirect).toHaveBeenCalledWith('/login'));
    expect(props.generateSalt).toHaveBeenCalled();
    expect(props.deriveKeys).toHaveBeenCalledWith('super-secret', SOME_SALT);
    expect(props.registerNewUser).toHaveBeenCalledWith(
      'user@example.com',
      SOME_AUTH_KEY,
      SOME_SALT,
    );
  });

  it('shows an error message when registering the user fails', async () => {
    const props = renderRegisterPage({
      registerNewUser: vi
        .fn()
        .mockResolvedValue({ data: null, publicErrorMessage: 'Email already registered.' }),
    });

    fillOutForm('user@example.com', 'super-secret');
    fireEvent.click(screen.getByText('Submit'));

    expect(await screen.findByText('Error: Email already registered.')).toBeInTheDocument();
    expect(props.redirect).not.toHaveBeenCalled();
  });

  it('shows a generic error message if registration throws', async () => {
    const props = renderRegisterPage({
      deriveKeys: vi.fn().mockRejectedValue(new Error('boom')),
    });

    fillOutForm('user@example.com', 'super-secret');
    fireEvent.click(screen.getByText('Submit'));

    expect(await screen.findByText('Error: Error setting up your account.')).toBeInTheDocument();
    expect(props.redirect).not.toHaveBeenCalled();
  });
});
