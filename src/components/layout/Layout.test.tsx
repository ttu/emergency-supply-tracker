import { render, screen } from '@testing-library/react';
import { Layout } from './Layout';
import { Header } from './Header';
import { Footer } from './Footer';

describe('Footer', () => {
  it('should render footer element', () => {
    render(<Footer />);
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('should render copyright when provided', () => {
    render(<Footer copyright="© 2024 Test" />);
    expect(screen.getByText('© 2024 Test')).toBeInTheDocument();
  });

  it('should render links when provided', () => {
    render(<Footer links={<a href="/about">About</a>} />);
    expect(screen.getByRole('link', { name: 'About' })).toBeInTheDocument();
  });

  it('should render both copyright and links', () => {
    render(
      <Footer
        copyright="© 2024 Test"
        links={
          <>
            <a href="/about">About</a>
            <a href="/privacy">Privacy</a>
          </>
        }
      />,
    );
    expect(screen.getByText('© 2024 Test')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'About' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Privacy' })).toBeInTheDocument();
  });

  it('should not render copyright div when copyright is not provided', () => {
    const { container } = render(<Footer links={<a href="/about">About</a>} />);
    expect(container.querySelector('.copyright')).not.toBeInTheDocument();
  });

  it('should not render links div when links are not provided', () => {
    const { container } = render(<Footer copyright="© 2024 Test" />);
    expect(container.querySelector('.links')).not.toBeInTheDocument();
  });
});

describe('Header', () => {
  it('should render header element', () => {
    render(<Header />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('should render logo when provided', () => {
    render(<Header logo={<span>Logo</span>} />);
    expect(screen.getByText('Logo')).toBeInTheDocument();
  });

  it('should render navigation when provided', () => {
    render(<Header navigation={<a href="/home">Home</a>} />);
    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
  });

  it('should render actions when provided', () => {
    render(<Header actions={<button>Login</button>} />);
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
  });

  it('should render all props together', () => {
    render(
      <Header
        logo={<span>Logo</span>}
        navigation={<a href="/home">Home</a>}
        actions={<button>Login</button>}
      />,
    );
    expect(screen.getByText('Logo')).toBeInTheDocument();
    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
  });

  it('should not render logo div when logo is not provided', () => {
    const { container } = render(
      <Header navigation={<a href="/home">Home</a>} />,
    );
    expect(container.querySelector('.logo')).not.toBeInTheDocument();
  });

  it('should not render navigation when not provided', () => {
    const { container } = render(<Header logo={<span>Logo</span>} />);
    expect(container.querySelector('nav')).not.toBeInTheDocument();
  });

  it('should not render actions div when actions are not provided', () => {
    const { container } = render(<Header logo={<span>Logo</span>} />);
    expect(container.querySelector('.actions')).not.toBeInTheDocument();
  });
});

describe('Layout', () => {
  it('should render children in main element', () => {
    render(<Layout>Content</Layout>);
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('should render header when header props are provided', () => {
    render(<Layout header={{ logo: <span>Logo</span> }}>Content</Layout>);
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByText('Logo')).toBeInTheDocument();
  });

  it('should render footer when footer props are provided', () => {
    render(<Layout footer={{ copyright: '© 2024 Test' }}>Content</Layout>);
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    expect(screen.getByText('© 2024 Test')).toBeInTheDocument();
  });

  it('should render both header and footer', () => {
    render(
      <Layout
        header={{ logo: <span>Logo</span> }}
        footer={{ copyright: '© 2024 Test' }}
      >
        Content
      </Layout>,
    );
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('should not render header when header prop is not provided', () => {
    render(<Layout>Content</Layout>);
    expect(screen.queryByRole('banner')).not.toBeInTheDocument();
  });

  it('should not render footer when footer prop is not provided', () => {
    render(<Layout>Content</Layout>);
    expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <Layout className="custom-class">Content</Layout>,
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('should combine default layout class with custom className', () => {
    const { container } = render(
      <Layout className="custom-class">Content</Layout>,
    );
    const layoutDiv = container.firstChild as HTMLElement;
    expect(layoutDiv.className).toContain('layout');
    expect(layoutDiv.className).toContain('custom-class');
  });
});
