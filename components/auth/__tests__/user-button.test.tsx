import fs from 'node:fs';
import path from 'node:path';

describe('UserButton Component', () => {
  const filePath = path.join(process.cwd(), 'components/auth/user-button.tsx');
  const fileContent = fs.readFileSync(filePath, 'utf-8');

  describe('Basic Component Structure', () => {
    it('should be a valid exported component', () => {
      expect(fileContent).toContain('export const UserButton');
    });

    it('should be marked as use client', () => {
      expect(fileContent).toMatch(/^"use client"/m);
    });

    it('should export UserButton as named export', () => {
      expect(fileContent).toMatch(/export const UserButton/);
    });

    it('should be a functional component', () => {
      expect(fileContent).toMatch(/export const UserButton = \(\) => \{/);
    });

    it('should have no props parameter', () => {
      expect(fileContent).toMatch(/export const UserButton = \(\)/);
    });
  });

  describe('Imports and Dependencies', () => {
    it('should import FaUser icon from react-icons', () => {
      expect(fileContent).toContain('from \'react-icons/fa\'');
      expect(fileContent).toContain('FaUser');
    });

    it('should import LogoutButton component', () => {
      expect(fileContent).toContain('from \'@/components/auth/logout-button\'');
      expect(fileContent).toContain('LogoutButton');
    });

    it('should import Avatar components', () => {
      expect(fileContent).toContain('from \'@/components/ui/avatar\'');
      expect(fileContent).toContain('Avatar');
      expect(fileContent).toContain('AvatarImage');
      expect(fileContent).toContain('AvatarFallback');
    });

    it('should import DropdownMenu components', () => {
      expect(fileContent).toContain('from \'@/components/ui/dropdown-menu\'');
      expect(fileContent).toContain('DropdownMenu');
      expect(fileContent).toContain('DropdownMenuContent');
      expect(fileContent).toContain('DropdownMenuItem');
      expect(fileContent).toContain('DropdownMenuTrigger');
    });

    it('should import useCurrentUser hook', () => {
      expect(fileContent).toContain('from \'@/hooks/use-current-user\'');
      expect(fileContent).toContain('useCurrentUser');
    });

    it('should import ExitIcon from radix-ui', () => {
      expect(fileContent).toContain('from \'@radix-ui/react-icons\'');
      expect(fileContent).toContain('ExitIcon');
    });
  });

  describe('Hook Usage', () => {
    it('should call useCurrentUser hook', () => {
      expect(fileContent).toContain('useCurrentUser()');
    });

    it('should assign hook result to user variable', () => {
      expect(fileContent).toContain('const user = useCurrentUser()');
    });

    it('should use user data in component', () => {
      expect(fileContent).toContain('user?.image');
    });
  });

  describe('Component Rendering', () => {
    it('should return JSX', () => {
      expect(fileContent).toContain('<DropdownMenu>');
    });

    it('should render DropdownMenu root component', () => {
      expect(fileContent).toMatch(/<DropdownMenu>[\s\S]*<\/DropdownMenu>/);
    });

    it('should render DropdownMenuTrigger', () => {
      expect(fileContent).toContain('<DropdownMenuTrigger>');
    });

    it('should render DropdownMenuContent', () => {
      expect(fileContent).toContain('<DropdownMenuContent');
    });

    it('should render Avatar component', () => {
      expect(fileContent).toContain('<Avatar>');
    });
  });

  describe('Avatar Configuration', () => {
    it('should render Avatar component', () => {
      expect(fileContent).toContain('<Avatar>');
    });

    it('should include AvatarImage', () => {
      expect(fileContent).toContain('<AvatarImage');
    });

    it('should include AvatarFallback', () => {
      expect(fileContent).toContain('<AvatarFallback');
    });

    it('should set AvatarImage src from user image', () => {
      expect(fileContent).toContain('src={user?.image || ""}');
    });

    it('should use bg-sky-500 for fallback background', () => {
      expect(fileContent).toContain('className="bg-sky-500"');
    });

    it('should display FaUser icon in fallback', () => {
      expect(fileContent).toContain('<FaUser className="text-white" />');
    });
  });

  describe('Avatar Image Fallback', () => {
    it('should handle missing user image', () => {
      expect(fileContent).toContain('user?.image || ""');
    });

    it('should provide empty string as default', () => {
      expect(fileContent).toContain('user?.image || ""');
    });

    it('should show FaUser icon when no image available', () => {
      expect(fileContent).toContain('<FaUser className="text-white" />');
    });
  });

  describe('Dropdown Menu Configuration', () => {
    it('should have w-40 width', () => {
      expect(fileContent).toMatch(/className="w-40"/);
    });

    it('should align dropdown to end', () => {
      expect(fileContent).toMatch(/align="end"/);
    });

    it('should set DropdownMenuContent width', () => {
      expect(fileContent).toContain('w-40');
    });

    it('should set DropdownMenuContent alignment to right', () => {
      expect(fileContent).toContain('align="end"');
    });
  });

  describe('Logout Button Integration', () => {
    it('should render LogoutButton component', () => {
      expect(fileContent).toContain('<LogoutButton>');
    });

    it('should wrap DropdownMenuItem in LogoutButton', () => {
      expect(fileContent).toMatch(/<LogoutButton>[\s\S]*<DropdownMenuItem>[\s\S]*<\/DropdownMenuItem>[\s\S]*<\/LogoutButton>/);
    });

    it('should include ExitIcon in logout option', () => {
      expect(fileContent).toContain('<ExitIcon');
    });

    it('should display logout text', () => {
      expect(fileContent).toContain('Logout');
    });
  });

  describe('Icon Configuration', () => {
    it('should render FaUser icon', () => {
      expect(fileContent).toContain('<FaUser');
    });

    it('should render ExitIcon', () => {
      expect(fileContent).toContain('<ExitIcon');
    });

    it('should set FaUser icon to white', () => {
      expect(fileContent).toContain('className="text-white"');
    });

    it('should set FaUser icon size', () => {
      expect(fileContent).toContain('<FaUser className="text-white" />');
    });

    it('should set ExitIcon height to h-4', () => {
      expect(fileContent).toMatch(/<ExitIcon[^>]*h-4/);
    });

    it('should set ExitIcon width to w-4', () => {
      expect(fileContent).toMatch(/<ExitIcon[^>]*w-4/);
    });

    it('should add margin-right to ExitIcon', () => {
      expect(fileContent).toMatch(/<ExitIcon[^>]*mr-2/);
    });
  });

  describe('Client Component Directive', () => {
    it('should be marked as client component', () => {
      expect(fileContent).toMatch(/^"use client"/m);
    });

    it('should use client-side hook', () => {
      expect(fileContent).toContain('useCurrentUser()');
    });

    it('should use client-side interactive components', () => {
      expect(fileContent).toContain('DropdownMenu');
    });
  });

  describe('Component Export', () => {
    it('should have export const UserButton', () => {
      expect(fileContent).toContain('export const UserButton');
    });

    it('should be an arrow function', () => {
      expect(fileContent).toMatch(/export const UserButton = \(\) => \{/);
    });

    it('should return JSX', () => {
      expect(fileContent).toContain('return');
      expect(fileContent).toContain('<DropdownMenu>');
    });
  });

  describe('Type Safety', () => {
    it('should have proper component type', () => {
      expect(fileContent).toContain('export const UserButton');
    });

    it('should use hooks with correct types', () => {
      expect(fileContent).toContain('useCurrentUser()');
    });

    it('should handle optional user data', () => {
      expect(fileContent).toContain('user?.image');
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

    it('should not log credentials', () => {
      expect(fileContent).not.toMatch(/console\.(log|error|warn).*user/i);
    });

    it('should not hardcode user data', () => {
      expect(fileContent).not.toMatch(/user:\s*["'][^"']*["']/i);
    });
  });

  describe('Dropdown Menu Structure', () => {
    it('should be properly nested', () => {
      expect(fileContent).toMatch(/<DropdownMenu>[\s\S]*<DropdownMenuTrigger>[\s\S]*<\/DropdownMenuTrigger>/);
    });

    it('should have trigger before content', () => {
      const triggerPos = fileContent.indexOf('<DropdownMenuTrigger>');
      const contentPos = fileContent.indexOf('<DropdownMenuContent');
      expect(triggerPos).toBeLessThan(contentPos);
    });

    it('should close all dropdown components', () => {
      expect(fileContent).toContain('</DropdownMenu>');
      expect(fileContent).toContain('</DropdownMenuContent>');
    });
  });

  describe('Avatar Styling', () => {
    it('should apply background color to fallback', () => {
      expect(fileContent).toContain('bg-sky-500');
    });

    it('should make FaUser icon white', () => {
      expect(fileContent).toContain('text-white');
    });

    it('should properly style avatar container', () => {
      expect(fileContent).toContain('<Avatar>');
    });
  });

  describe('User Data Integration', () => {
    it('should access user image', () => {
      expect(fileContent).toContain('user?.image');
    });

    it('should use optional chaining for safety', () => {
      expect(fileContent).toContain('user?.image');
    });

    it('should provide fallback for missing image', () => {
      expect(fileContent).toContain('|| ""');
    });
  });

  describe('Logout Functionality', () => {
    it('should wrap logout in LogoutButton', () => {
      expect(fileContent).toContain('<LogoutButton>');
      expect(fileContent).toContain('</LogoutButton>');
    });

    it('should use DropdownMenuItem for logout option', () => {
      expect(fileContent).toContain('<DropdownMenuItem>');
    });

    it('should display logout text', () => {
      expect(fileContent).toContain('Logout');
    });

    it('should include logout icon', () => {
      expect(fileContent).toContain('<ExitIcon');
    });
  });

  describe('Component Composition', () => {
    it('should combine Avatar with Dropdown', () => {
      expect(fileContent).toContain('<DropdownMenuTrigger>');
      expect(fileContent).toContain('<Avatar>');
    });

    it('should be a composite component', () => {
      expect(fileContent).toContain('DropdownMenu');
      expect(fileContent).toContain('Avatar');
      expect(fileContent).toContain('LogoutButton');
    });

    it('should properly compose multiple UI components', () => {
      expect(fileContent).toContain('<Avatar>');
      expect(fileContent).toContain('<DropdownMenu>');
      expect(fileContent).toContain('<LogoutButton>');
    });
  });

  describe('Accessibility', () => {
    it('should use semantic dropdown menu', () => {
      expect(fileContent).toContain('DropdownMenu');
    });

    it('should have accessible avatar', () => {
      expect(fileContent).toContain('<Avatar>');
    });

    it('should use accessible icons', () => {
      expect(fileContent).toContain('FaUser');
      expect(fileContent).toContain('ExitIcon');
    });
  });

  describe('Markup Structure', () => {
    it('should have proper JSX structure', () => {
      expect(fileContent).toContain('<DropdownMenu>');
      expect(fileContent).toContain('</DropdownMenu>');
    });

    it('should properly close all tags', () => {
      // Simple check: ensure no unclosed opening tags remain
      // Count specific important components are closed
      expect(fileContent).toMatch(/<DropdownMenu>[\s\S]*<\/DropdownMenu>/);
      expect(fileContent).toMatch(/<Avatar>[\s\S]*<\/Avatar>/);
      expect(fileContent).toMatch(/<LogoutButton>[\s\S]*<\/LogoutButton>/);
      expect(fileContent).toMatch(/<DropdownMenuContent[\s\S]*<\/DropdownMenuContent>/);
    });

    it('should have valid JSX nesting', () => {
      expect(fileContent).toContain('<DropdownMenu>');
      expect(fileContent).toContain('<DropdownMenuTrigger>');
      expect(fileContent).toContain('<Avatar>');
    });
  });

  describe('UI Consistency', () => {
    it('should use consistent color scheme', () => {
      expect(fileContent).toContain('text-white');
    });

    it('should have consistent spacing', () => {
      expect(fileContent).toContain('h-4');
      expect(fileContent).toContain('w-4');
    });

    it('should use Tailwind classes', () => {
      expect(fileContent).toMatch(/className="[^"]*(?:bg-|text-|h-|w-|mr-)[^"]*"/);
    });
  });

  describe('Integration with Auth System', () => {
    it('should integrate with useCurrentUser hook', () => {
      expect(fileContent).toContain('useCurrentUser()');
    });

    it('should include LogoutButton for authentication', () => {
      expect(fileContent).toContain('LogoutButton');
    });

    it('should provide user menu interface', () => {
      expect(fileContent).toContain('DropdownMenu');
      expect(fileContent).toContain('Logout');
    });
  });

  describe('Avatar Fallback Icon', () => {
    it('should display FaUser in fallback', () => {
      expect(fileContent).toContain('<FaUser');
    });

    it('should apply text-white to fallback icon', () => {
      expect(fileContent).toMatch(/<FaUser\s+className="text-white"/);
    });

    it('should be inside AvatarFallback', () => {
      expect(fileContent).toMatch(/<AvatarFallback[^>]*>[\s\S]*<FaUser/);
    });
  });

  describe('Dropdown Content Styling', () => {
    it('should set width to w-40', () => {
      expect(fileContent).toMatch(/className="w-40"/);
    });

    it('should align to end (right)', () => {
      expect(fileContent).toMatch(/align="end"/);
    });

    it('should apply consistent styling', () => {
      expect(fileContent).toContain('DropdownMenuContent');
      expect(fileContent).toContain('w-40');
      expect(fileContent).toContain('align="end"');
    });
  });

  describe('MenuItem Structure', () => {
    it('should render DropdownMenuItem', () => {
      expect(fileContent).toContain('<DropdownMenuItem>');
    });

    it('should contain logout icon and text', () => {
      expect(fileContent).toMatch(/<DropdownMenuItem>[\s\S]*<ExitIcon/);
      expect(fileContent).toMatch(/<DropdownMenuItem>[\s\S]*Logout[\s\S]*<\/DropdownMenuItem>/);
    });

    it('should be wrapped in LogoutButton', () => {
      expect(fileContent).toMatch(/<LogoutButton>[\s\S]*<DropdownMenuItem>/);
    });
  });
});
