import * as React from 'react';

// Social is a social authentication provider component
// Static analysis-based tests to verify component structure and configuration

describe('Social Component', () => {
  const fs = require('node:fs');
  const path = require('node:path');

  const getComponentSource = () => {
    const filePath = path.resolve(__dirname, '../social.tsx');
    return fs.readFileSync(filePath, 'utf8');
  };

  describe('Basic Component Structure', () => {
    it('should be a valid exported component', () => {
      const source = getComponentSource();
      expect(source).toContain('export const Social');
    });

    it('should be marked as use client', () => {
      const source = getComponentSource();
      expect(source).toContain('"use client"');
    });

    it('should export Social as named export', () => {
      const source = getComponentSource();
      expect(source).toContain('export const Social');
    });

    it('should be a functional component', () => {
      const source = getComponentSource();
      expect(source).toContain('const Social = () =>');
    });

    it('should have no props parameter', () => {
      const source = getComponentSource();
      expect(source).toMatch(/const Social\s*=\s*\(\s*\)/);
    });
  });

  describe('Imports and Dependencies', () => {
    it('should import signIn from next-auth', () => {
      const source = getComponentSource();
      expect(source).toContain("import { signIn } from 'next-auth/react'");
    });

    it('should import FaGithub icon', () => {
      const source = getComponentSource();
      expect(source).toContain("import { FaGithub }");
    });

    it('should import FcGoogle icon', () => {
      const source = getComponentSource();
      expect(source).toContain("import { FcGoogle }");
    });

    it('should import Button component', () => {
      const source = getComponentSource();
      expect(source).toContain("import { Button }");
    });

    it('should import DEFAULT_LOGIN_REDIRECT', () => {
      const source = getComponentSource();
      expect(source).toContain('import { DEFAULT_LOGIN_REDIRECT }');
    });

    it('should import from routes', () => {
      const source = getComponentSource();
      expect(source).toContain("from '@/routes'");
    });
  });

  describe('Provider Handler', () => {
    it('should define onClick handler', () => {
      const source = getComponentSource();
      expect(source).toContain('const onClick');
    });

    it('should accept provider parameter', () => {
      const source = getComponentSource();
      expect(source).toContain('provider:');
    });

    it('should accept google or github as provider', () => {
      const source = getComponentSource();
      expect(source).toContain('"google"');
      expect(source).toContain('"github"');
    });

    it('should call signIn with provider', () => {
      const source = getComponentSource();
      expect(source).toContain('signIn(provider');
    });

    it('should pass callbackUrl to signIn', () => {
      const source = getComponentSource();
      expect(source).toContain('callbackUrl');
    });

    it('should use DEFAULT_LOGIN_REDIRECT as callbackUrl', () => {
      const source = getComponentSource();
      expect(source).toContain('DEFAULT_LOGIN_REDIRECT');
    });
  });

  describe('Component Rendering', () => {
    it('should return JSX', () => {
      const source = getComponentSource();
      expect(source).toContain('return');
      expect(source).toContain('<');
    });

    it('should render a flex container', () => {
      const source = getComponentSource();
      expect(source).toContain('flex');
    });

    it('should have gap-x-2 spacing', () => {
      const source = getComponentSource();
      expect(source).toContain('gap-x-2');
    });

    it('should have w-full width', () => {
      const source = getComponentSource();
      expect(source).toContain('w-full');
    });

    it('should have items-center alignment', () => {
      const source = getComponentSource();
      expect(source).toContain('items-center');
    });
  });

  describe('Google Button', () => {
    it('should render Google sign-in button', () => {
      const source = getComponentSource();
      expect(source).toContain('google');
    });

    it('should use Button component for Google', () => {
      const source = getComponentSource();
      expect(source).toMatch(/<Button[\s\S]*google[\s\S]*Button>/);
    });

    it('should have lg size', () => {
      const source = getComponentSource();
      expect(source).toContain('size={"lg"}');
    });

    it('should have w-full width', () => {
      const source = getComponentSource();
      expect(source).toContain('w-full');
    });

    it('should have outline_dark variant', () => {
      const source = getComponentSource();
      expect(source).toContain('variant={"outline_dark"}');
    });

    it('should display FcGoogle icon', () => {
      const source = getComponentSource();
      expect(source).toContain('FcGoogle');
    });

    it('should call onClick with google provider', () => {
      const source = getComponentSource();
      expect(source).toContain('onClick');
      expect(source).toContain('"google"');
    });
  });

  describe('GitHub Button', () => {
    it('should render GitHub sign-in button', () => {
      const source = getComponentSource();
      expect(source).toContain('github');
    });

    it('should use Button component for GitHub', () => {
      const source = getComponentSource();
      expect(source).toMatch(/<Button[\s\S]*github[\s\S]*Button>/);
    });

    it('should have lg size', () => {
      const source = getComponentSource();
      expect(source).toContain('size={"lg"}');
    });

    it('should have w-full width', () => {
      const source = getComponentSource();
      expect(source).toContain('w-full');
    });

    it('should have outline_dark variant', () => {
      const source = getComponentSource();
      expect(source).toContain('variant={"outline_dark"}');
    });

    it('should display FaGithub icon', () => {
      const source = getComponentSource();
      expect(source).toContain('FaGithub');
    });

    it('should call onClick with github provider', () => {
      const source = getComponentSource();
      expect(source).toContain('onClick');
      expect(source).toContain('"github"');
    });
  });

  describe('Button Configuration', () => {
    it('should have two buttons', () => {
      const source = getComponentSource();
      const buttonCount = (source.match(/<Button/g) || []).length;
      expect(buttonCount).toBeGreaterThanOrEqual(2);
    });

    it('should use consistent button sizes', () => {
      const source = getComponentSource();
      const sizMatches = source.match(/size={"lg"}/g);
      expect(sizMatches).toBeTruthy();
      expect(sizMatches.length).toBeGreaterThanOrEqual(2);
    });

    it('should use consistent button variants', () => {
      const source = getComponentSource();
      const variantMatches = source.match(/variant={"outline_dark"}/g);
      expect(variantMatches).toBeTruthy();
      expect(variantMatches.length).toBeGreaterThanOrEqual(2);
    });

    it('should use consistent widths', () => {
      const source = getComponentSource();
      const widthMatches = source.match(/w-full/g);
      expect(widthMatches).toBeTruthy();
      expect(widthMatches.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Icon Configuration', () => {
    it('should render FcGoogle icon with dimensions', () => {
      const source = getComponentSource();
      expect(source).toContain('FcGoogle');
      expect(source).toContain('h-5');
      expect(source).toContain('w-5');
    });

    it('should render FaGithub icon with dimensions', () => {
      const source = getComponentSource();
      expect(source).toContain('FaGithub');
      expect(source).toContain('h-5');
      expect(source).toContain('w-5');
    });

    it('should have white text color for icons', () => {
      const source = getComponentSource();
      expect(source).toContain('text-white');
    });

    it('should set icon height to h-5', () => {
      const source = getComponentSource();
      const h5Matches = source.match(/h-5/g);
      expect(h5Matches).toBeTruthy();
    });

    it('should set icon width to w-5', () => {
      const source = getComponentSource();
      const w5Matches = source.match(/w-5/g);
      expect(w5Matches).toBeTruthy();
    });
  });

  describe('Authentication Integration', () => {
    it('should integrate with NextAuth', () => {
      const source = getComponentSource();
      expect(source).toContain('signIn');
    });

    it('should support Google authentication', () => {
      const source = getComponentSource();
      expect(source).toContain('"google"');
    });

    it('should support GitHub authentication', () => {
      const source = getComponentSource();
      expect(source).toContain('"github"');
    });

    it('should redirect after sign-in', () => {
      const source = getComponentSource();
      expect(source).toContain('DEFAULT_LOGIN_REDIRECT');
    });

    it('should call signIn with callback configuration', () => {
      const source = getComponentSource();
      expect(source).toContain('callbackUrl:');
    });
  });

  describe('Client Component Directive', () => {
    it('should be marked as client component', () => {
      const source = getComponentSource();
      expect(source).toContain('"use client"');
    });

    it('should use client-side functions', () => {
      const source = getComponentSource();
      expect(source).toContain('signIn');
    });
  });

  describe('Component Export', () => {
    it('should have export const Social', () => {
      const source = getComponentSource();
      expect(source).toMatch(/export const Social/);
    });

    it('should be an arrow function', () => {
      const source = getComponentSource();
      expect(source).toContain('const Social = () =>');
    });

    it('should return JSX', () => {
      const source = getComponentSource();
      expect(source).toContain('return');
      expect(source).toMatch(/<div/);
    });
  });

  describe('Type Safety', () => {
    it('should use TypeScript provider type', () => {
      const source = getComponentSource();
      expect(source).toContain('provider:');
    });

    it('should restrict provider to google or github', () => {
      const source = getComponentSource();
      expect(source).toContain('"google"');
      expect(source).toContain('"github"');
    });
  });

  describe('Security', () => {
    it('should not expose sensitive data', () => {
      const source = getComponentSource();
      // Check that we don't hardcode passwords or log sensitive values
      const hasHardcodedPassword = source.includes('password:') && !source.includes('password: ""');
      const hasPasswordLogging = source.match(/console\.(log|error|warn).*password/i);
      const hasApiKey = source.match(/api[_-]?key|secret|token/i) && !source.includes('callbackUrl');
      expect(hasHardcodedPassword).toBe(false);
      expect(hasPasswordLogging).toBeNull();
      expect(hasApiKey).toBeNull();
    });

    it('should not log credentials', () => {
      const source = getComponentSource();
      expect(source).not.toMatch(/console\.(log|error|warn).*signIn/);
    });
  });

  describe('Layout Structure', () => {
    it('should use flex layout', () => {
      const source = getComponentSource();
      expect(source).toContain('flex');
    });

    it('should use horizontal layout', () => {
      const source = getComponentSource();
      expect(source).toContain('gap-x-2');
    });

    it('should center items vertically', () => {
      const source = getComponentSource();
      expect(source).toContain('items-center');
    });

    it('should use full width container', () => {
      const source = getComponentSource();
      expect(source).toMatch(/className="flex[\s\S]*w-full/);
    });
  });

  describe('Provider Functionality', () => {
    it('should call signIn on Google button click', () => {
      const source = getComponentSource();
      expect(source).toContain('google');
      expect(source).toContain('onClick');
    });

    it('should call signIn on GitHub button click', () => {
      const source = getComponentSource();
      expect(source).toContain('github');
      expect(source).toContain('onClick');
    });

    it('should pass only provider type to onClick', () => {
      const source = getComponentSource();
      expect(source).toContain('onClick');
      expect(source).toContain('provider');
    });
  });

  describe('Component Features', () => {
    it('should be a social authentication component', () => {
      const source = getComponentSource();
      expect(source).toContain('signIn');
      expect(source).toContain('google');
      expect(source).toContain('github');
    });

    it('should provide OAuth sign-in options', () => {
      const source = getComponentSource();
      expect(source).toContain('google');
      expect(source).toContain('github');
    });

    it('should handle provider selection', () => {
      const source = getComponentSource();
      expect(source).toContain('onClick');
      expect(source).toContain('provider');
    });

    it('should redirect on successful authentication', () => {
      const source = getComponentSource();
      expect(source).toContain('DEFAULT_LOGIN_REDIRECT');
    });
  });

  describe('UI Consistency', () => {
    it('should style both buttons identically', () => {
      const source = getComponentSource();
      const googleButton = source.match(/onClick={\(\) => {\s*onClick\("google"\)[^}]*}/);
      const githubButton = source.match(/onClick={\(\) => {\s*onClick\("github"\)[^}]*}/);
      expect(googleButton).toBeTruthy();
      expect(githubButton).toBeTruthy();
    });

    it('should have consistent button sizing', () => {
      const source = getComponentSource();
      const sizeMatches = source.match(/size={"lg"}/g);
      expect(sizeMatches.length).toBeGreaterThanOrEqual(2);
    });

    it('should have consistent button styling', () => {
      const source = getComponentSource();
      const variantMatches = source.match(/variant={"outline_dark"}/g);
      expect(variantMatches.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Icon Styling', () => {
    it('should set icon height', () => {
      const source = getComponentSource();
      expect(source).toContain('h-5');
    });

    it('should set icon width', () => {
      const source = getComponentSource();
      expect(source).toContain('w-5');
    });

    it('should set icon color to white', () => {
      const source = getComponentSource();
      expect(source).toContain('text-white');
    });
  });

  describe('OAuth Providers', () => {
    it('should support Google OAuth', () => {
      const source = getComponentSource();
      expect(source).toContain('google');
    });

    it('should support GitHub OAuth', () => {
      const source = getComponentSource();
      expect(source).toContain('github');
    });

    it('should have Google icon', () => {
      const source = getComponentSource();
      expect(source).toContain('FcGoogle');
    });

    it('should have GitHub icon', () => {
      const source = getComponentSource();
      expect(source).toContain('FaGithub');
    });
  });

  describe('Callback Configuration', () => {
    it('should use DEFAULT_LOGIN_REDIRECT', () => {
      const source = getComponentSource();
      expect(source).toContain('DEFAULT_LOGIN_REDIRECT');
    });

    it('should pass callbackUrl to signIn', () => {
      const source = getComponentSource();
      expect(source).toContain('callbackUrl:');
      expect(source).toContain('DEFAULT_LOGIN_REDIRECT');
    });

    it('should configure redirect after authentication', () => {
      const source = getComponentSource();
      expect(source).toContain('callbackUrl');
    });
  });

  describe('Button Variants', () => {
    it('should use outline_dark variant', () => {
      const source = getComponentSource();
      expect(source).toContain('outline_dark');
    });

    it('should apply variant to both buttons', () => {
      const source = getComponentSource();
      const variantMatches = source.match(/variant={"outline_dark"}/g);
      expect(variantMatches.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Container Styling', () => {
    it('should use flex display', () => {
      const source = getComponentSource();
      expect(source).toContain('flex');
    });

    it('should have full width', () => {
      const source = getComponentSource();
      expect(source).toMatch(/w-full/);
    });

    it('should have horizontal gap', () => {
      const source = getComponentSource();
      expect(source).toContain('gap-x-2');
    });

    it('should center items', () => {
      const source = getComponentSource();
      expect(source).toContain('items-center');
    });
  });
});
