import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createContext, useContext, ReactNode } from 'react';
import { composeProviders } from './composeProviders';

// Test contexts
const ContextA = createContext<string | undefined>(undefined);
const ContextB = createContext<number | undefined>(undefined);
const ContextC = createContext<boolean | undefined>(undefined);

const ProviderA = ({ children }: { children: ReactNode }) => (
  <ContextA.Provider value="A">{children}</ContextA.Provider>
);

const ProviderB = ({ children }: { children: ReactNode }) => (
  <ContextB.Provider value={42}>{children}</ContextB.Provider>
);

const ProviderC = ({ children }: { children: ReactNode }) => (
  <ContextC.Provider value={true}>{children}</ContextC.Provider>
);

describe('composeProviders', () => {
  it('should compose multiple providers in correct nesting order', () => {
    const Composed = composeProviders([ProviderA, ProviderB, ProviderC]);

    function TestComponent() {
      const a = useContext(ContextA);
      const b = useContext(ContextB);
      const c = useContext(ContextC);
      return <div data-testid="result">{`A=${a}, B=${b}, C=${c}`}</div>;
    }

    render(
      <Composed>
        <TestComponent />
      </Composed>,
    );

    expect(screen.getByTestId('result')).toHaveTextContent('A=A, B=42, C=true');
  });

  it('should handle empty providers array', () => {
    const Composed = composeProviders([]);
    render(
      <Composed>
        <div data-testid="child">Test</div>
      </Composed>,
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('should handle single provider', () => {
    const Composed = composeProviders([ProviderA]);

    function TestComponent() {
      const a = useContext(ContextA);
      return <div data-testid="result">{`A=${a}`}</div>;
    }

    render(
      <Composed>
        <TestComponent />
      </Composed>,
    );

    expect(screen.getByTestId('result')).toHaveTextContent('A=A');
  });

  it('should maintain provider order (first is outermost)', () => {
    // Create providers that track nesting order
    const orderTracker: string[] = [];

    const OuterProvider = ({ children }: { children: ReactNode }) => {
      orderTracker.push('outer-render');
      return <>{children}</>;
    };

    const InnerProvider = ({ children }: { children: ReactNode }) => {
      orderTracker.push('inner-render');
      return <>{children}</>;
    };

    const Composed = composeProviders([OuterProvider, InnerProvider]);

    render(
      <Composed>
        <div>Test</div>
      </Composed>,
    );

    // Outer provider should render first (it's the outermost)
    expect(orderTracker).toEqual(['outer-render', 'inner-render']);
  });

  it('should allow inner providers to access outer provider context', () => {
    // Inner provider that depends on outer provider's context
    const DependentProvider = ({ children }: { children: ReactNode }) => {
      const a = useContext(ContextA);
      // If this renders, it means ContextA is available
      return (
        <ContextB.Provider value={a === 'A' ? 100 : 0}>
          {children}
        </ContextB.Provider>
      );
    };

    // ProviderA is outer, DependentProvider is inner and uses ContextA
    const Composed = composeProviders([ProviderA, DependentProvider]);

    function TestComponent() {
      const b = useContext(ContextB);
      return <div data-testid="result">{`B=${b}`}</div>;
    }

    render(
      <Composed>
        <TestComponent />
      </Composed>,
    );

    // DependentProvider should have access to ContextA and set ContextB to 100
    expect(screen.getByTestId('result')).toHaveTextContent('B=100');
  });
});
