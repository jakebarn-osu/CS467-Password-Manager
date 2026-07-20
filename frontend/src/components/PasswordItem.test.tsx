import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PasswordItem } from './PasswordItem';

const password = { siteName: 'Email', username: 'someone', password: 'super-secret' };

beforeEach(() => {
  Object.assign(navigator, {
    clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
  });
});

describe('PasswordItem', () => {
  it('renders the site name and username', () => {
    render(<PasswordItem password={password} />);

    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Username: someone')).toBeInTheDocument();
  });

  it('hides the password by default', () => {
    render(<PasswordItem password={password} />);

    expect(screen.queryByText(/super-secret/)).not.toBeInTheDocument();
    expect(screen.getByText('Reveal')).toBeInTheDocument();
  });

  it('reveals the password when the show button is clicked', () => {
    render(<PasswordItem password={password} />);

    fireEvent.click(screen.getByText('Reveal'));

    expect(screen.getByText(/super-secret/)).toBeInTheDocument();
    expect(screen.getByText('Hide')).toBeInTheDocument();
  });

  it('hides the password again when clicked a second time', () => {
    render(<PasswordItem password={password} />);

    fireEvent.click(screen.getByText('Reveal'));
    fireEvent.click(screen.getByText('Hide'));

    expect(screen.queryByText(/super-secret/)).not.toBeInTheDocument();
    expect(screen.getByText('Reveal')).toBeInTheDocument();
  });

  it('copies the password to the clipboard when the copy button is clicked', async () => {
    render(<PasswordItem password={password} />);

    fireEvent.click(screen.getByText('Copy'));

    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledWith('super-secret'));
    expect(await screen.findByText('Copied!')).toBeInTheDocument();
  });
});
