import fs from 'node:fs';
import path from 'node:path';

describe('UserInfo Component', () => {
  const filePath = path.join(process.cwd(), 'components/auth/user-info.tsx');
  const fileContent = fs.readFileSync(filePath, 'utf-8');

  describe('Basic Component Structure', () => {
    it('should be a valid exported component', () => {
      expect(fileContent).toContain('export const UserInfo');
    });

    it('should export UserInfo as named export', () => {
      expect(fileContent).toMatch(/export const UserInfo/);
    });

    it('should be a functional component', () => {
      expect(fileContent).toMatch(/export const UserInfo = \(/);
    });

    it('should accept UserInfoProps parameter', () => {
      expect(fileContent).toContain('UserInfoProps');
    });

    it('should destructure user and label from props', () => {
      expect(fileContent).toMatch(/\{ user, label \}/);
    });
  });

  describe('Props Interface', () => {
    it('should have UserInfoProps interface', () => {
      expect(fileContent).toContain('interface UserInfoProps');
    });

    it('should have optional user prop', () => {
      expect(fileContent).toMatch(/user\?: ExtendedUser/);
    });

    it('should have label prop as string', () => {
      expect(fileContent).toContain('label: string');
    });

    it('should import ExtendedUser type', () => {
      expect(fileContent).toContain('ExtendedUser');
      expect(fileContent).toContain("from '@/next-auth'");
    });
  });

  describe('Imports and Dependencies', () => {
    it('should import Badge component', () => {
      expect(fileContent).toContain('from \'@/components/ui/badge\'');
      expect(fileContent).toContain('Badge');
    });

    it('should import Card components', () => {
      expect(fileContent).toContain('from \'@/components/ui/card\'');
      expect(fileContent).toContain('Card');
      expect(fileContent).toContain('CardContent');
      expect(fileContent).toContain('CardHeader');
    });

    it('should import ExtendedUser from next-auth', () => {
      expect(fileContent).toContain("from '@/next-auth'");
      expect(fileContent).toContain('ExtendedUser');
    });
  });

  describe('Component Rendering', () => {
    it('should return JSX', () => {
      expect(fileContent).toContain('<Card');
    });

    it('should render Card component', () => {
      expect(fileContent).toMatch(/<Card[^>]*className="w-\[600px\]/);
    });

    it('should set Card width to 600px', () => {
      expect(fileContent).toContain('w-[600px]');
    });

    it('should apply shadow to Card', () => {
      expect(fileContent).toContain('shadow-md');
    });

    it('should render CardHeader', () => {
      expect(fileContent).toContain('<CardHeader>');
    });

    it('should render CardContent', () => {
      expect(fileContent).toContain('<CardContent');
    });
  });

  describe('Card Header', () => {
    it('should display label in header', () => {
      expect(fileContent).toMatch(/<CardHeader>[\s\S]*\{label\}[\s\S]*<\/CardHeader>/);
    });

    it('should style label as text-2xl', () => {
      expect(fileContent).toContain('text-2xl');
    });

    it('should make label font-semibold', () => {
      expect(fileContent).toContain('font-semibold');
    });

    it('should center align label', () => {
      expect(fileContent).toContain('text-center');
    });
  });

  describe('Card Content', () => {
    it('should have space-y-4 spacing', () => {
      expect(fileContent).toContain('space-y-4');
    });

    it('should display ID field', () => {
      expect(fileContent).toContain('ID');
      expect(fileContent).toMatch(/ID[\s\S]*\{user\?.id\}/);
    });

    it('should display Name field', () => {
      expect(fileContent).toContain('Name');
      expect(fileContent).toMatch(/Name[\s\S]*\{user\?.name\}/);
    });

    it('should display Email field', () => {
      expect(fileContent).toContain('Email');
      expect(fileContent).toMatch(/Email[\s\S]*\{user\?.email\}/);
    });

    it('should display Role field', () => {
      expect(fileContent).toContain('Role');
      expect(fileContent).toMatch(/Role[\s\S]*\{user\?.role\}/);
    });

    it('should display Two Factor Authentication field', () => {
      expect(fileContent).toContain('Two Factor Authentication');
    });
  });

  describe('Field Styling', () => {
    it('should use flex layout for fields', () => {
      expect(fileContent).toContain('flex flex-row');
    });

    it('should center items vertically', () => {
      expect(fileContent).toContain('items-center');
    });

    it('should justify between field items', () => {
      expect(fileContent).toContain('justify-between');
    });

    it('should apply rounded-lg border style', () => {
      expect(fileContent).toContain('rounded-lg border');
    });

    it('should apply padding to fields', () => {
      expect(fileContent).toContain('p-3');
    });

    it('should apply shadow-sm to fields', () => {
      expect(fileContent).toContain('shadow-sm');
    });

    it('should make labels font-medium', () => {
      expect(fileContent).toContain('font-medium');
    });

    it('should make labels text-sm', () => {
      expect(fileContent).toContain('text-sm');
    });
  });

  describe('Data Display', () => {
    it('should use optional chaining for user data', () => {
      expect(fileContent).toMatch(/user\?\./g);
    });

    it('should use font-mono for data values', () => {
      expect(fileContent).toContain('font-mono');
    });

    it('should apply max-width to values', () => {
      expect(fileContent).toContain('max-w-[180px]');
    });

    it('should truncate overflow text', () => {
      expect(fileContent).toContain('truncate');
    });

    it('should style value backgrounds', () => {
      expect(fileContent).toContain('bg-slate-100');
    });

    it('should add padding to values', () => {
      expect(fileContent).toMatch(/p-1[\s\S]*bg-slate-100/);
    });
  });

  describe('Two Factor Authentication Badge', () => {
    it('should render Badge component for 2FA', () => {
      expect(fileContent).toContain('<Badge');
    });

    it('should conditionally set variant based on 2FA status', () => {
      expect(fileContent).toMatch(/variant=\{user\?.isTwoFactorEnabled\s?\?\s?"success"\s?:\s?"destructive"\}/);
    });

    it('should display ON when 2FA is enabled', () => {
      expect(fileContent).toContain('user?.isTwoFactorEnabled ? "ON" : "OFF"');
    });

    it('should display OFF when 2FA is disabled', () => {
      expect(fileContent).toContain('"ON" : "OFF"');
    });

    it('should use success variant when enabled', () => {
      expect(fileContent).toContain('"success"');
    });

    it('should use destructive variant when disabled', () => {
      expect(fileContent).toContain('"destructive"');
    });
  });

  describe('Type Safety', () => {
    it('should have TypeScript props interface', () => {
      expect(fileContent).toContain('interface UserInfoProps');
    });

    it('should use ExtendedUser type for user prop', () => {
      expect(fileContent).toContain('user?: ExtendedUser');
    });

    it('should type label as string', () => {
      expect(fileContent).toContain('label: string');
    });

    it('should destructure props with proper types', () => {
      expect(fileContent).toMatch(/\{ user, label \}: UserInfoProps/);
    });
  });

  describe('Security', () => {
    it('should not expose sensitive data', () => {
      const source = fileContent;
      // Check that we don't hardcode passwords or log sensitive values
      const hasHardcodedPassword = source.includes('password:') && !source.includes('password: ""');
      const hasPasswordLogging = source.match(/console\.(log|error|warn).*password/i);
      const hasApiKey = source.match(/api[_-]?key|secret|token/i) && !source.includes('callbackUrl');
      expect(hasHardcodedPassword).toBe(false);
      expect(hasPasswordLogging).toBeNull();
      expect(hasApiKey).toBeNull();
    });

    it('should not log user data', () => {
      expect(fileContent).not.toMatch(/console\.(log|error|warn).*user/i);
    });

    it('should not hardcode user credentials', () => {
      expect(fileContent).not.toMatch(/user:\s*["'][^"']*["']/i);
    });

    it('should use optional chaining for safe data access', () => {
      expect(fileContent).toMatch(/user\?\./);
    });
  });

  describe('Component Composition', () => {
    it('should compose with Card components', () => {
      expect(fileContent).toContain('Card');
      expect(fileContent).toContain('CardHeader');
      expect(fileContent).toContain('CardContent');
    });

    it('should compose with Badge component', () => {
      expect(fileContent).toContain('Badge');
    });

    it('should be a presentational component', () => {
      expect(fileContent).toMatch(/export const UserInfo/);
    });

    it('should accept user data as prop', () => {
      expect(fileContent).toContain('{ user, label }');
    });
  });

  describe('Data Fields', () => {
    it('should display 5 main data fields', () => {
      const idField = fileContent.includes('ID');
      const nameField = fileContent.includes('Name');
      const emailField = fileContent.includes('Email');
      const roleField = fileContent.includes('Role');
      const twoFAField = fileContent.includes('Two Factor Authentication');
      expect([idField, nameField, emailField, roleField, twoFAField].filter(Boolean)).toHaveLength(5);
    });

    it('should display user.id', () => {
      expect(fileContent).toMatch(/\{user\?.id\}/);
    });

    it('should display user.name', () => {
      expect(fileContent).toMatch(/\{user\?.name\}/);
    });

    it('should display user.email', () => {
      expect(fileContent).toMatch(/\{user\?.email\}/);
    });

    it('should display user.role', () => {
      expect(fileContent).toMatch(/\{user\?.role\}/);
    });

    it('should display user.isTwoFactorEnabled', () => {
      expect(fileContent).toMatch(/user\?.isTwoFactorEnabled/);
    });
  });

  describe('Layout Structure', () => {
    it('should have main Card container', () => {
      expect(fileContent).toContain('<Card');
    });

    it('should have header section', () => {
      expect(fileContent).toMatch(/<CardHeader>[\s\S]*<\/CardHeader>/);
    });

    it('should have content section', () => {
      expect(fileContent).toMatch(/<CardContent[\s\S]*>[\s\S]*<\/CardContent>/);
    });

    it('should properly close Card', () => {
      expect(fileContent).toContain('</Card>');
    });

    it('should use semantic Card structure', () => {
      expect(fileContent).toMatch(/<Card[\s\S]*<CardHeader[\s\S]*<CardContent[\s\S]*<\/Card>/);
    });
  });

  describe('Styling and CSS Classes', () => {
    it('should use Tailwind CSS classes', () => {
      expect(fileContent).toMatch(/className="[^"]*(?:w-\[|shadow|flex|text-|bg-|border|rounded|p-|items-|justify-)[^"]*"/);
    });

    it('should use consistent spacing', () => {
      expect(fileContent).toContain('p-3');
      expect(fileContent).toContain('p-1');
    });

    it('should use consistent colors', () => {
      expect(fileContent).toContain('bg-slate-100');
    });

    it('should use responsive sizing', () => {
      expect(fileContent).toContain('max-w-[180px]');
    });
  });

  describe('User Data Handling', () => {
    it('should handle optional user object', () => {
      expect(fileContent).toContain('user?');
    });

    it('should safely access user properties', () => {
      expect(fileContent).toMatch(/user\?.id/);
      expect(fileContent).toMatch(/user\?.name/);
      expect(fileContent).toMatch(/user\?.email/);
    });

    it('should display user ID', () => {
      expect(fileContent).toContain('user?.id');
    });

    it('should display user name', () => {
      expect(fileContent).toContain('user?.name');
    });

    it('should display user email', () => {
      expect(fileContent).toContain('user?.email');
    });

    it('should display user role', () => {
      expect(fileContent).toContain('user?.role');
    });
  });

  describe('Badge Integration', () => {
    it('should conditionally style Badge', () => {
      expect(fileContent).toMatch(/variant=\{/);
    });

    it('should use success variant for enabled 2FA', () => {
      expect(fileContent).toContain('"success"');
    });

    it('should use destructive variant for disabled 2FA', () => {
      expect(fileContent).toContain('"destructive"');
    });

    it('should render Badge with text content', () => {
      expect(fileContent).toMatch(/<Badge[\s\S]*?>\s*\{[\s\S]*?\}\s*<\/Badge>/);
    });
  });

  describe('Accessibility', () => {
    it('should use semantic HTML structure', () => {
      expect(fileContent).toContain('<Card');
      expect(fileContent).toContain('<CardHeader');
      expect(fileContent).toContain('CardContent');
    });

    it('should use descriptive labels', () => {
      expect(fileContent).toContain('ID');
      expect(fileContent).toContain('Name');
      expect(fileContent).toContain('Email');
      expect(fileContent).toContain('Role');
    });

    it('should display user role information', () => {
      expect(fileContent).toContain('Role');
      expect(fileContent).toContain('user?.role');
    });
  });

  describe('Component Export', () => {
    it('should have export const UserInfo', () => {
      expect(fileContent).toContain('export const UserInfo');
    });

    it('should be an arrow function', () => {
      expect(fileContent).toMatch(/export const UserInfo = \(/);
    });

    it('should return JSX', () => {
      expect(fileContent).toContain('return');
      expect(fileContent).toContain('<Card');
    });
  });

  describe('Props Usage', () => {
    it('should accept user prop', () => {
      expect(fileContent).toContain('user');
    });

    it('should accept label prop', () => {
      expect(fileContent).toContain('label');
    });

    it('should use label in header', () => {
      expect(fileContent).toMatch(/\{label\}/);
    });

    it('should use user data in content', () => {
      expect(fileContent).toMatch(/user\?/);
    });
  });

  describe('Information Display', () => {
    it('should display user identification info', () => {
      expect(fileContent).toContain('ID');
      expect(fileContent).toContain('user?.id');
    });

    it('should display user profile info', () => {
      expect(fileContent).toContain('Name');
      expect(fileContent).toContain('Email');
    });

    it('should display user access info', () => {
      expect(fileContent).toContain('Role');
    });

    it('should display user security info', () => {
      expect(fileContent).toContain('Two Factor Authentication');
      expect(fileContent).toContain('isTwoFactorEnabled');
    });
  });

  describe('Markup Structure', () => {
    it('should have proper JSX structure', () => {
      expect(fileContent).toContain('<Card');
      expect(fileContent).toContain('</Card>');
    });

    it('should properly close all components', () => {
      expect(fileContent).toMatch(/<Card[\s\S]*<\/Card>/);
      expect(fileContent).toMatch(/<CardHeader[\s\S]*<\/CardHeader>/);
      expect(fileContent).toMatch(/<CardContent[\s\S]*<\/CardContent>/);
    });

    it('should have valid nesting', () => {
      expect(fileContent).toMatch(/<Card[\s\S]*<CardHeader[\s\S]*<\/CardHeader>[\s\S]*CardContent[\s\S]*<\/CardContent>[\s\S]*<\/Card>/);
    });
  });

  describe('UI Consistency', () => {
    it('should use consistent card styling', () => {
      expect(fileContent).toContain('w-[600px]');
      expect(fileContent).toContain('shadow-md');
    });

    it('should use consistent field styling', () => {
      expect(fileContent).toContain('rounded-lg border');
      expect(fileContent).toContain('p-3');
      expect(fileContent).toContain('shadow-sm');
    });

    it('should use consistent text styling', () => {
      expect(fileContent).toContain('text-sm');
      expect(fileContent).toContain('font-mono');
    });

    it('should use consistent spacing system', () => {
      expect(fileContent).toContain('space-y-4');
    });
  });
});
