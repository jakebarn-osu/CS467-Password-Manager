// Parts of this file were generated with AI assistance (Claude Code, Anthropic, 2026).
// Prompts used: "write some very simple tests for loginpage.tsx"
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LoginPage } from './LoginPage';

function renderLoginPage(overrides = {}) {
  const props = {
    fetchUserSalt: vi.fn().mockResolvedValue({ data: 'some-salt', publicErrorMessage: '' }),
    generateAuthKey: vi.fn().mockResolvedValue('some-auth-key'),
    login: vi.fn().mockResolvedValue({ data: true, publicErrorMessage: '' }),
    redirect: vi.fn(),
    ...overrides,
  };

  render(<LoginPage {...props} />);
  return props;
}

describe('LoginPage', () => {
  it('renders the email step first', () => {
    renderLoginPage();

    expect(screen.getByText('Enter your Email Address')).toBeInTheDocument();
  });

  it('fetches the salt and advances to the password step on submit', async () => {
    const props = renderLoginPage();

    fireEvent.input(screen.getByRole('textbox'), { target: { value: 'user@example.com' } });
    fireEvent.click(screen.getByText('Submit'));

    expect(await screen.findByText('Enter your Master Password')).toBeInTheDocument();
    expect(props.fetchUserSalt).toHaveBeenCalledWith('user@example.com');
  });

  it('does not fetch the salt when the email field is empty', () => {
    const props = renderLoginPage();

    fireEvent.click(screen.getByText('Submit'));

    expect(props.fetchUserSalt).not.toHaveBeenCalled();
    expect(screen.getByText('Enter your Email Address')).toBeInTheDocument();
  });

  it('shows an error message when fetching the salt fails', async () => {
    renderLoginPage({
      fetchUserSalt: vi
        .fn()
        .mockResolvedValue({ data: '', publicErrorMessage: 'Error logging in.' }),
    });

    fireEvent.input(screen.getByRole('textbox'), { target: { value: 'user@example.com' } });
    fireEvent.click(screen.getByText('Submit'));

    expect(await screen.findByText('Error: Error logging in.')).toBeInTheDocument();
    expect(screen.queryByText('Enter your Master Password')).not.toBeInTheDocument();
  });

  it('logs in and redirects after entering the master password', async () => {
    const props = renderLoginPage();

    fireEvent.input(screen.getByRole('textbox'), { target: { value: 'user@example.com' } });
    fireEvent.click(screen.getByText('Submit'));
    await screen.findByText('Enter your Master Password');

    fireEvent.input(document.querySelector('input[type="password"]')!, {
      target: { value: 'super-secret' },
    });
    fireEvent.click(screen.getByText('Submit'));

    await vi.waitFor(() => expect(props.redirect).toHaveBeenCalledWith('/passwords'));
    expect(props.generateAuthKey).toHaveBeenCalledWith('some-salt', 'super-secret');
    expect(props.login).toHaveBeenCalledWith('some-auth-key');
  });

  it('shows a generic error message if login throws', async () => {
    const props = renderLoginPage({
      generateAuthKey: vi.fn().mockRejectedValue(new Error('boom')),
    });

    fireEvent.input(screen.getByRole('textbox'), { target: { value: 'user@example.com' } });
    fireEvent.click(screen.getByText('Submit'));
    await screen.findByText('Enter your Master Password');

    fireEvent.input(document.querySelector('input[type="password"]')!, {
      target: { value: 'super-secret' },
    });
    fireEvent.click(screen.getByText('Submit'));

    expect(await screen.findByText('Error: Error logging in.')).toBeInTheDocument();
    expect(props.redirect).not.toHaveBeenCalled();
  });
});
