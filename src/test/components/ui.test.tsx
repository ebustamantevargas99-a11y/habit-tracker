import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

import { Button }      from '@/components/ui/button';
import { Card }        from '@/components/ui/card';
import { Badge }       from '@/components/ui/badge';
import { Modal }       from '@/components/ui/modal';
import { Tabs }        from '@/components/ui/tabs';
import { Input }       from '@/components/ui/input';
import { ProgressBar } from '@/components/ui/progress-bar';
import { StatCard }    from '@/components/ui/stat-card';
import { EmptyState }  from '@/components/ui/empty-state';

// ─── Button ───────────────────────────────────────────────────────────────────

describe('<Button />', () => {
  it('renders children', () => {
    render(<Button>Save</Button>);
    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click me</Button>);
    fireEvent.click(screen.getByText('Click me'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('does not call onClick when disabled', () => {
    const onClick = vi.fn();
    render(<Button disabled onClick={onClick}>Disabled</Button>);
    fireEvent.click(screen.getByText('Disabled'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('applies primary variant classes by default', () => {
    render(<Button>Primary</Button>);
    expect(screen.getByText('Primary')).toHaveClass('bg-accent');
  });

  it('applies danger variant classes', () => {
    render(<Button variant="danger">Delete</Button>);
    expect(screen.getByText('Delete')).toHaveClass('bg-danger');
  });

  it('shows loading spinner when loading=true and disables button', () => {
    render(<Button loading>Loading</Button>);
    const btn = screen.getByText('Loading').closest('button');
    expect(btn).toBeDisabled();
  });
});

// ─── Card ─────────────────────────────────────────────────────────────────────

describe('<Card />', () => {
  it('renders children', () => {
    render(<Card>Content</Card>);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('applies warm variant class by default', () => {
    const { container } = render(<Card>x</Card>);
    expect(container.firstChild).toHaveClass('card-warm');
  });

  it('applies default variant class when variant="default"', () => {
    const { container } = render(<Card variant="default">x</Card>);
    expect(container.firstChild).toHaveClass('card');
  });

  it('applies custom className', () => {
    const { container } = render(<Card className="custom-class">x</Card>);
    expect(container.firstChild).toHaveClass('custom-class');
  });
});

// ─── Badge ────────────────────────────────────────────────────────────────────

describe('<Badge />', () => {
  it('renders text', () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('applies success variant', () => {
    render(<Badge variant="success">Done</Badge>);
    expect(screen.getByText('Done')).toHaveClass('bg-success-light');
  });

  it('applies danger variant', () => {
    render(<Badge variant="danger">Error</Badge>);
    expect(screen.getByText('Error')).toHaveClass('bg-danger-light');
  });

  it('applies neutral variant by default', () => {
    render(<Badge>Neutral</Badge>);
    expect(screen.getByText('Neutral')).toHaveClass('bg-brand-cream');
  });
});

// ─── Modal ────────────────────────────────────────────────────────────────────

describe('<Modal />', () => {
  it('does not render when isOpen = false', () => {
    render(<Modal isOpen={false} onClose={vi.fn()}>Content</Modal>);
    expect(screen.queryByText('Content')).not.toBeInTheDocument();
  });

  it('renders when isOpen = true', () => {
    render(<Modal isOpen={true} onClose={vi.fn()}>Content</Modal>);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('renders title when provided', () => {
    render(<Modal isOpen={true} onClose={vi.fn()} title="My Title">Content</Modal>);
    expect(screen.getByText('My Title')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<Modal isOpen={true} onClose={onClose} title="T">Body</Modal>);
    fireEvent.click(screen.getByLabelText('Cerrar'));
    expect(onClose).toHaveBeenCalledOnce();
  });
});

// ─── Tabs ─────────────────────────────────────────────────────────────────────

describe('<Tabs />', () => {
  const TABS = [
    { id: 'a', label: 'Tab A' },
    { id: 'b', label: 'Tab B' },
    { id: 'c', label: 'Tab C' },
  ];

  it('renders all tab labels', () => {
    render(<Tabs tabs={TABS} activeTab="a" onChange={vi.fn()} />);
    expect(screen.getByText('Tab A')).toBeInTheDocument();
    expect(screen.getByText('Tab B')).toBeInTheDocument();
  });

  it('active tab has active class', () => {
    render(<Tabs tabs={TABS} activeTab="b" onChange={vi.fn()} />);
    expect(screen.getByText('Tab B')).toHaveClass('tab-item-active');
  });

  it('inactive tabs have base class', () => {
    render(<Tabs tabs={TABS} activeTab="a" onChange={vi.fn()} />);
    expect(screen.getByText('Tab B')).toHaveClass('tab-item');
  });

  it('calls onChange with correct id when tab clicked', () => {
    const onChange = vi.fn();
    render(<Tabs tabs={TABS} activeTab="a" onChange={onChange} />);
    fireEvent.click(screen.getByText('Tab C'));
    expect(onChange).toHaveBeenCalledWith('c');
  });
});

// ─── Input ────────────────────────────────────────────────────────────────────

describe('<Input />', () => {
  it('renders with label', () => {
    render(<Input label="Email" />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('shows error message', () => {
    render(<Input label="Email" error="Required" />);
    expect(screen.getByText('Required')).toBeInTheDocument();
  });

  it('applies error styling when error provided', () => {
    render(<Input label="Email" error="Bad" />);
    expect(screen.getByLabelText('Email')).toHaveClass('border-danger');
  });

  it('calls onChange when typing', () => {
    const onChange = vi.fn();
    render(<Input label="Name" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'test' } });
    expect(onChange).toHaveBeenCalled();
  });
});

// ─── ProgressBar ─────────────────────────────────────────────────────────────

describe('<ProgressBar />', () => {
  it('renders without label by default', () => {
    const { container } = render(<ProgressBar value={50} />);
    expect(container.querySelector('.progress-track')).toBeInTheDocument();
    expect(screen.queryByText('%')).not.toBeInTheDocument();
  });

  it('shows label when showLabel = true', () => {
    render(<ProgressBar value={75} showLabel />);
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('clamps value above max to 100%', () => {
    render(<ProgressBar value={150} max={100} showLabel />);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('clamps negative value to 0%', () => {
    render(<ProgressBar value={-10} showLabel />);
    expect(screen.getByText('0%')).toBeInTheDocument();
  });
});

// ─── StatCard ─────────────────────────────────────────────────────────────────

describe('<StatCard />', () => {
  it('renders label and value', () => {
    render(<StatCard label="Score" value={42} />);
    expect(screen.getByText('Score')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('renders unit when provided', () => {
    render(<StatCard label="Weight" value={80} unit="kg" />);
    expect(screen.getByText('kg')).toBeInTheDocument();
  });

  it('shows trend label when trend + trendLabel provided', () => {
    render(<StatCard label="Revenue" value="$1k" trend="up" trendLabel="+12%" />);
    expect(screen.getByText('+12%')).toBeInTheDocument();
  });
});

// ─── EmptyState ───────────────────────────────────────────────────────────────

describe('<EmptyState />', () => {
  it('renders title', () => {
    render(<EmptyState title="Nothing here" />);
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(<EmptyState title="Empty" description="Add items to get started" />);
    expect(screen.getByText('Add items to get started')).toBeInTheDocument();
  });

  it('renders action button when provided', () => {
    const action = <button>Add Item</button>;
    render(<EmptyState title="Empty" action={action} />);
    expect(screen.getByText('Add Item')).toBeInTheDocument();
  });

  it('does not render description if not provided', () => {
    render(<EmptyState title="Title only" />);
    // title renders as <p>, but description paragraph should not appear
    const paragraphs = screen.queryAllByRole('paragraph');
    expect(paragraphs).toHaveLength(1); // only the title <p>
  });
});
