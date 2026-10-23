import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LocationForm } from './LocationForm';

describe('LocationForm', () => {
  const emptyLocation = { label: '', coordinates: null, confirmed: false };
  const validLocationA = { label: 'Whitefield', coordinates: { lat: 12.9698, lng: 77.75 }, confirmed: true };
  const validLocationB = { label: 'Koramangala', coordinates: { lat: 12.9352, lng: 77.6245 }, confirmed: true };
  const validDestination = { label: 'Nandi Hills', coordinates: { lat: 13.3702, lng: 77.6835 }, confirmed: true };

  it('disables submit button when inputs are incomplete', () => {
    render(
      <LocationForm
        riderA={validLocationA}
        onRiderAChange={vi.fn()}
        riderB={emptyLocation}
        onRiderBChange={vi.fn()}
        destination={validDestination}
        onDestinationChange={vi.fn()}
        activePinTarget={null}
        onTogglePin={vi.fn()}
        maxDetourMinutes={15}
        onMaxDetourChange={vi.fn()}
        isLoading={false}
        onSubmit={vi.fn()}
      />,
    );

    const submitBtn = screen.getByRole('button', { name: /find meeting point/i });
    expect(submitBtn).toBeDisabled();
  });

  it('enables submit button when all three locations are confirmed', () => {
    const onSubmit = vi.fn();
    render(
      <LocationForm
        riderA={validLocationA}
        onRiderAChange={vi.fn()}
        riderB={validLocationB}
        onRiderBChange={vi.fn()}
        destination={validDestination}
        onDestinationChange={vi.fn()}
        activePinTarget={null}
        onTogglePin={vi.fn()}
        maxDetourMinutes={15}
        onMaxDetourChange={vi.fn()}
        isLoading={false}
        onSubmit={onSubmit}
      />,
    );

    const submitBtn = screen.getByRole('button', { name: /find meeting point/i });
    expect(submitBtn).toBeEnabled();

    fireEvent.click(submitBtn);
    expect(onSubmit).toHaveBeenCalled();
  });

  it('updates detour allowance slider', () => {
    const onMaxDetourChange = vi.fn();
    render(
      <LocationForm
        riderA={validLocationA}
        onRiderAChange={vi.fn()}
        riderB={validLocationB}
        onRiderBChange={vi.fn()}
        destination={validDestination}
        onDestinationChange={vi.fn()}
        activePinTarget={null}
        onTogglePin={vi.fn()}
        maxDetourMinutes={15}
        onMaxDetourChange={onMaxDetourChange}
        isLoading={false}
        onSubmit={vi.fn()}
      />,
    );

    const slider = screen.getByLabelText(/max added detour per rider/i);
    fireEvent.change(slider, { target: { value: '25' } });
    expect(onMaxDetourChange).toHaveBeenCalledWith(25);
  });
});
