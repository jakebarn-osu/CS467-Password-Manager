// Parts of this file were generated with AI assistance (Claude Code, Anthropic, 2026).
// Prompts used: "write some very simple tests for registerpage.tsx"
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { RegisterPage } from './RegisterPage';

function renderRegisterPage(overrides = {}) {
  const props = {
    generateAuthKey: vi.fn().mockResolvedValue('some-auth-key'),
    registerNewEmail: vi.fn().mockResolvedValue({ data: 'some-salt', publicErrorMessage: '' }),
    setNewUserAuthKey: vi.fn().mockResolvedValue({ data: true, publicErrorMessage: '' }),
    redirect: vi.fn(),
    ...overrides,
  };

  render(<RegisterPage {...props} />);
  return props;
}

describe('RegisterPage', () => {
  it('renders the email step first', () => {
    renderRegisterPage();

    expect(screen.getByText('Register your Email Address')).toBeInTheDocument();
  });

  it('registers the email and advances to the password step on submit', async () => {
    const props = renderRegisterPage();

    fireEvent.input(screen.getByRole('textbox'), { target: { value: 'user@example.com' } });
    fireEvent.click(screen.getByText('Submit'));

    expect(await screen.findByText('Enter your new Master Password')).toBeInTheDocument();
    expect(props.registerNewEmail).toHaveBeenCalledWith('user@example.com');
  });

  it('does not register when the email field is empty', () => {
    const props = renderRegisterPage();

    fireEvent.click(screen.getByText('Submit'));

    expect(props.registerNewEmail).not.toHaveBeenCalled();
    expect(screen.getByText('Register your Email Address')).toBeInTheDocument();
  });

  it('shows an error message when registering the email fails', async () => {
    renderRegisterPage({
      registerNewEmail: vi
        .fn()
        .mockResolvedValue({ data: '', publicErrorMessage: 'Email already registered.' }),
    });

    fireEvent.input(screen.getByRole('textbox'), { target: { value: 'user@example.com' } });
    fireEvent.click(screen.getByText('Submit'));

    expect(await screen.findByText('Error: Email already registered.')).toBeInTheDocument();
    expect(screen.queryByText('Enter your new Master Password')).not.toBeInTheDocument();
  });

  it('generates an auth key and redirects after entering the master password', async () => {
    const props = renderRegisterPage();

    fireEvent.input(screen.getByRole('textbox'), { target: { value: 'user@example.com' } });
    fireEvent.click(screen.getByText('Submit'));
    await screen.findByText('Enter your new Master Password');

    fireEvent.input(document.querySelector('input[type="password"]')!, {
      target: { value: 'super-secret' },
    });
    fireEvent.click(screen.getByText('Submit'));

    await vi.waitFor(() => expect(props.redirect).toHaveBeenCalledWith('/login'));
    expect(props.generateAuthKey).toHaveBeenCalledWith('some-salt', 'super-secret');
    expect(props.setNewUserAuthKey).toHaveBeenCalledWith('user@example.com', 'some-auth-key');
  });

  it('shows an error message when setting the auth key fails', async () => {
    const props = renderRegisterPage({
      setNewUserAuthKey: vi
        .fn()
        .mockResolvedValue({ data: false, publicErrorMessage: 'Error setting up your account.' }),
    });

    fireEvent.input(screen.getByRole('textbox'), { target: { value: 'user@example.com' } });
    fireEvent.click(screen.getByText('Submit'));
    await screen.findByText('Enter your new Master Password');

    fireEvent.input(document.querySelector('input[type="password"]')!, {
      target: { value: 'super-secret' },
    });
    fireEvent.click(screen.getByText('Submit'));

    expect(await screen.findByText('Error: Error setting up your account.')).toBeInTheDocument();
    expect(props.redirect).not.toHaveBeenCalled();
  });

  it('shows a generic error message if registration throws', async () => {
    const props = renderRegisterPage({
      generateAuthKey: vi.fn().mockRejectedValue(new Error('boom')),
    });

    fireEvent.input(screen.getByRole('textbox'), { target: { value: 'user@example.com' } });
    fireEvent.click(screen.getByText('Submit'));
    await screen.findByText('Enter your new Master Password');

    fireEvent.input(document.querySelector('input[type="password"]')!, {
      target: { value: 'super-secret' },
    });
    fireEvent.click(screen.getByText('Submit'));

    expect(await screen.findByText('Error: Error setting up your account.')).toBeInTheDocument();
    expect(props.redirect).not.toHaveBeenCalled();
  });
});
