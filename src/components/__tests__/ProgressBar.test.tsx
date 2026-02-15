import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProgressBar } from '../ProgressBar';

describe('ProgressBar', () => {
  it('should render indeterminate mode when progress is 0', () => {
    const { container } = render(<ProgressBar progress={0} label="Loading..." />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    // Should NOT show percentage in indeterminate mode
    expect(screen.queryByText('0%')).not.toBeInTheDocument();

    // Check for pulsing animation class
    const progressElement = container.querySelector('.animate-pulse');
    expect(progressElement).toBeInTheDocument();
  });

  it('should render determinate mode with percentage when progress > 0', () => {
    render(<ProgressBar progress={0.45} label="Loading model..." />);

    expect(screen.getByText('Loading model...')).toBeInTheDocument();
    expect(screen.getByText('45%')).toBeInTheDocument();
  });

  it('should show full width at 100% progress', () => {
    const { container } = render(<ProgressBar progress={1.0} label="Complete" />);

    expect(screen.getByText('100%')).toBeInTheDocument();

    // Check that the progress bar has 100% width
    const progressBar = container.querySelector('[style*="width: 100%"]');
    expect(progressBar).toBeInTheDocument();
  });

  it('should render without label when label not provided', () => {
    const { container } = render(<ProgressBar progress={0.5} />);

    // Should still show percentage
    expect(screen.getByText('50%')).toBeInTheDocument();

    // No label text container
    const labelContainer = container.querySelector('.text-xs');
    expect(labelContainer).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <ProgressBar progress={0.5} className="my-custom-class" />
    );

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass('my-custom-class');
  });

  it('should round percentage correctly', () => {
    render(<ProgressBar progress={0.456} />);
    expect(screen.getByText('46%')).toBeInTheDocument();

    render(<ProgressBar progress={0.454} />);
    expect(screen.getByText('45%')).toBeInTheDocument();
  });

  it('should show shimmer effect in determinate mode', () => {
    const { container } = render(<ProgressBar progress={0.5} />);

    const shimmer = container.querySelector('.animate-shimmer');
    expect(shimmer).toBeInTheDocument();
  });

  it('should handle edge cases: very small progress', () => {
    render(<ProgressBar progress={0.01} />);
    expect(screen.getByText('1%')).toBeInTheDocument();
  });

  it('should handle edge cases: progress close to 1', () => {
    render(<ProgressBar progress={0.99} />);
    expect(screen.getByText('99%')).toBeInTheDocument();
  });
});
