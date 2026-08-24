import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../src/components/atoms/Button';

test('Button exposes its busy state and prevents duplicate actions', async () => {
  const user = userEvent.setup();
  const onClick = vi.fn();
  const { rerender } = render(<Button onClick={onClick}>Enregistrer</Button>);

  await user.click(screen.getByRole('button', { name: 'Enregistrer' }));
  expect(onClick).toHaveBeenCalledOnce();

  rerender(
    <Button loading onClick={onClick}>
      Enregistrer
    </Button>,
  );
  const busyButton = screen.getByRole('button');
  expect(busyButton).toBeDisabled();
  expect(busyButton).toHaveAttribute('aria-busy', 'true');
  await user.click(busyButton);
  expect(onClick).toHaveBeenCalledOnce();
});
