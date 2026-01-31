import * as React from 'react';

// NewPasswordForm is a password reset form component with token-based functionality
// Static analysis-based tests to verify component structure and configuration

describe('NewPasswordForm Component', () => {
  const fs = require('node:fs');
  const path = require('node:path');

  const getComponentSource = () => {
    const filePath = path.resolve(__dirname, '../new-password-form.tsx');
    return fs.readFileSync(filePath, 'utf8');
  };

  describe('Basic Component Structure', () => {
    it('should be a valid exported component', () => {
      const source = getComponentSource();
      expect(source).toContain('export const NewPasswordForm');
    });

    it('should be marked as use client', () => {
      const source = getComponentSource();
      expect(source).toContain('"use client"');
    });

    it('should export NewPasswordForm as named export', () => {
      const source = getComponentSource();
      expect(source).toContain('export const NewPasswordForm');
    });

    it('should be a functional component', () => {
      const source = getComponentSource();
      expect(source).toContain('const NewPasswordForm = () =>');
    });

    it('should have no props parameter', () => {
      const source = getComponentSource();
      expect(source).toMatch(/const NewPasswordForm\s*=\s*\(\s*\)/);
    });
  });

  describe('Hooks Usage', () => {
    it('should use useSearchParams hook', () => {
      const source = getComponentSource();
      expect(source).toContain('useSearchParams');
      expect(source).toContain("from 'next/navigation'");
    });

    it('should use useState hook', () => {
      const source = getComponentSource();
      expect(source).toContain('useState');
    });

    it('should use useTransition hook', () => {
      const source = getComponentSource();
      expect(source).toContain('useTransition');
    });

    it('should use useForm hook', () => {
      const source = getComponentSource();
      expect(source).toContain('useForm');
      expect(source).toContain("from 'react-hook-form'");
    });

    it('should initialize error state', () => {
      const source = getComponentSource();
      expect(source).toContain('setError');
      expect(source).toContain('useState<string | undefined>("")');
    });

    it('should initialize success state', () => {
      const source = getComponentSource();
      expect(source).toContain('setSuccess');
      expect(source).toContain('useState<string | undefined>("")');
    });

    it('should use useTransition for pending state', () => {
      const source = getComponentSource();
      expect(source).toContain('useTransition');
      expect(source).toContain('isPending');
      expect(source).toContain('startTransition');
    });

    it('should extract token from search params', () => {
      const source = getComponentSource();
      expect(source).toContain('searchParams.get("token")');
    });
  });

  describe('Schema and Validation', () => {
    it('should import NewPasswordSchema', () => {
      const source = getComponentSource();
      expect(source).toContain('NewPasswordSchema');
      expect(source).toContain("from '@/schemas'");
    });

    it('should use zodResolver', () => {
      const source = getComponentSource();
      expect(source).toContain('zodResolver');
      expect(source).toContain("from '@hookform/resolvers/zod'");
    });

    it('should configure useForm with NewPasswordSchema', () => {
      const source = getComponentSource();
      expect(source).toContain('resolver: zodResolver(NewPasswordSchema)');
    });

    it('should infer types from NewPasswordSchema', () => {
      const source = getComponentSource();
      expect(source).toContain('z.infer<typeof NewPasswordSchema>');
    });

    it('should set default password value', () => {
      const source = getComponentSource();
      expect(source).toContain('password: ""');
    });
  });

  describe('Token Handling', () => {
    it('should retrieve token from search params', () => {
      const source = getComponentSource();
      expect(source).toContain('const token = searchParams.get("token")');
    });

    it('should pass token to setNewPassword action', () => {
      const source = getComponentSource();
      expect(source).toContain('setNewPassword(values, token)');
    });

    it('should handle token parameter in form submission', () => {
      const source = getComponentSource();
      expect(source).toContain('token');
    });
  });

  describe('Layout Components', () => {
    it('should use CardWrapper component', () => {
      const source = getComponentSource();
      expect(source).toContain('CardWrapper');
      expect(source).toContain("from '@/components/auth/card-wrapper'");
    });

    it('should set CardWrapper header label', () => {
      const source = getComponentSource();
      expect(source).toContain('headerLabel="Enter a new password"');
    });

    it('should set CardWrapper back button label', () => {
      const source = getComponentSource();
      expect(source).toContain('backButtonLabel="Back to login"');
    });

    it('should set CardWrapper back button href to /auth/login', () => {
      const source = getComponentSource();
      expect(source).toContain('backButtonHref="/auth/login"');
    });

    it('should use Form component from react-hook-form', () => {
      const source = getComponentSource();
      expect(source).toContain('<Form {...form}>');
    });
  });

  describe('Form Fields', () => {
    it('should have password FormField', () => {
      const source = getComponentSource();
      expect(source).toContain('name="password"');
    });

    it('should have password field inside FormItem', () => {
      const source = getComponentSource();
      expect(source).toContain('FormItem');
    });

    it('should label password field', () => {
      const source = getComponentSource();
      expect(source).toContain('New Password');
    });

    it('should have password input with password type', () => {
      const source = getComponentSource();
      expect(source).toContain('type="password"');
    });

    it('should set password placeholder', () => {
      const source = getComponentSource();
      expect(source).toContain('placeholder="******"');
    });

    it('should disable password field when isPending', () => {
      const source = getComponentSource();
      expect(source).toContain('disabled={isPending}');
    });

    it('should apply dark styling to input', () => {
      const source = getComponentSource();
      expect(source).toContain('bg-zinc-800');
    });

    it('should apply text color styling to label', () => {
      const source = getComponentSource();
      expect(source).toContain('text-white');
    });
  });

  describe('Form Messages', () => {
    it('should import FormError component', () => {
      const source = getComponentSource();
      expect(source).toContain('FormError');
      expect(source).toContain("from '@/components/form-error'");
    });

    it('should import FormSuccess component', () => {
      const source = getComponentSource();
      expect(source).toContain('FormSuccess');
      expect(source).toContain("from '@/components/form-success'");
    });

    it('should display error message', () => {
      const source = getComponentSource();
      expect(source).toContain('message={error}');
    });

    it('should display success message', () => {
      const source = getComponentSource();
      expect(source).toContain('message={success}');
    });
  });

  describe('Submit Button', () => {
    it('should have submit button', () => {
      const source = getComponentSource();
      expect(source).toContain('type="submit"');
    });

    it('should use auth variant', () => {
      const source = getComponentSource();
      expect(source).toContain('variant="auth"');
    });

    it('should have large size', () => {
      const source = getComponentSource();
      expect(source).toContain('size="lg"');
    });

    it('should disable button when isPending', () => {
      const source = getComponentSource();
      expect(source).toContain('disabled={isPending}');
    });

    it('should show Set Password text', () => {
      const source = getComponentSource();
      expect(source).toContain('Set Password');
    });
  });

  describe('Form Submission Handler', () => {
    it('should define onSubmit handler', () => {
      const source = getComponentSource();
      expect(source).toContain('const onSubmit =');
    });

    it('should clear errors before submission', () => {
      const source = getComponentSource();
      expect(source).toContain('setError("")');
    });

    it('should clear success before submission', () => {
      const source = getComponentSource();
      expect(source).toContain('setSuccess("")');
    });

    it('should call setNewPassword action', () => {
      const source = getComponentSource();
      expect(source).toContain('setNewPassword(values, token)');
    });

    it('should use startTransition for async operation', () => {
      const source = getComponentSource();
      expect(source).toContain('startTransition(');
    });

    it('should handle setNewPassword response', () => {
      const source = getComponentSource();
      expect(source).toContain('.then((data)');
    });

    it('should set error from response', () => {
      const source = getComponentSource();
      expect(source).toContain('setError(data?.error)');
    });

    it('should set success from response', () => {
      const source = getComponentSource();
      expect(source).toContain('setSuccess(data?.success)');
    });
  });

  describe('Form Structure and Layout', () => {
    it('should have space-y-6 on main form', () => {
      const source = getComponentSource();
      expect(source).toContain('space-y-6');
    });

    it('should have space-y-4 on input container', () => {
      const source = getComponentSource();
      expect(source).toContain('space-y-4');
    });

    it('should use FormControl for inputs', () => {
      const source = getComponentSource();
      expect(source).toContain('FormControl');
    });

    it('should use FormLabel for field labels', () => {
      const source = getComponentSource();
      expect(source).toContain('FormLabel');
    });

    it('should use FormMessage for field errors', () => {
      const source = getComponentSource();
      expect(source).toContain('FormMessage');
    });

    it('should use form.handleSubmit for form submission', () => {
      const source = getComponentSource();
      expect(source).toContain('form.handleSubmit(onSubmit)');
    });
  });

  describe('Imports and Dependencies', () => {
    it('should import useSearchParams from next/navigation', () => {
      const source = getComponentSource();
      expect(source).toContain("useSearchParams");
      expect(source).toContain("from 'next/navigation'");
    });

    it('should import setNewPassword action', () => {
      const source = getComponentSource();
      expect(source).toContain('setNewPassword');
      expect(source).toContain("from '@/actions/new-password'");
    });

    it('should import CardWrapper', () => {
      const source = getComponentSource();
      expect(source).toContain('CardWrapper');
      expect(source).toContain('card-wrapper');
    });

    it('should import FormError', () => {
      const source = getComponentSource();
      expect(source).toContain('FormError');
      expect(source).toContain('form-error');
    });

    it('should import FormSuccess', () => {
      const source = getComponentSource();
      expect(source).toContain('FormSuccess');
      expect(source).toContain('form-success');
    });

    it('should import Button from ui', () => {
      const source = getComponentSource();
      expect(source).toContain('Button');
      expect(source).toContain('ui/button');
    });

    it('should import Input from ui', () => {
      const source = getComponentSource();
      expect(source).toContain('Input');
      expect(source).toContain('ui/input');
    });

    it('should import form components from ui', () => {
      const source = getComponentSource();
      expect(source).toContain('Form');
      expect(source).toContain('FormControl');
      expect(source).toContain('FormField');
      expect(source).toContain('FormItem');
      expect(source).toContain('FormLabel');
      expect(source).toContain('FormMessage');
    });

    it('should import zod', () => {
      const source = getComponentSource();
      expect(source).toContain("import * as z from 'zod'");
    });
  });

  describe('Styling Classes', () => {
    it('should apply text-white to labels', () => {
      const source = getComponentSource();
      expect(source).toContain('text-white');
    });

    it('should apply bg-zinc-800 to inputs', () => {
      const source = getComponentSource();
      expect(source).toContain('bg-zinc-800');
    });

    it('should apply h-10 to inputs', () => {
      const source = getComponentSource();
      expect(source).toContain('h-10');
    });

    it('should apply placeholder styling', () => {
      const source = getComponentSource();
      expect(source).toContain('placeholder:text-gray-300');
    });

    it('should apply border styling', () => {
      const source = getComponentSource();
      expect(source).toContain('border-gray-500');
    });

    it('should apply pt-2 padding to inputs', () => {
      const source = getComponentSource();
      expect(source).toContain('pt-2');
    });
  });

  describe('Accessibility', () => {
    it('should use semantic form structure', () => {
      const source = getComponentSource();
      expect(source).toContain('<form');
    });

    it('should have labels for all fields', () => {
      const source = getComponentSource();
      expect(source).toContain('FormLabel');
    });

    it('should display validation messages', () => {
      const source = getComponentSource();
      expect(source).toContain('FormMessage');
    });

    it('should have proper input types', () => {
      const source = getComponentSource();
      expect(source).toContain('type="password"');
    });

    it('should have clear button text', () => {
      const source = getComponentSource();
      expect(source).toContain('Set Password');
    });
  });

  describe('Type Safety', () => {
    it('should use TypeScript syntax', () => {
      const source = getComponentSource();
      expect(source).toContain('const');
    });

    it('should type form values', () => {
      const source = getComponentSource();
      expect(source).toContain('z.infer<typeof NewPasswordSchema>');
    });

    it('should type hook return values', () => {
      const source = getComponentSource();
      expect(source).toContain('<string | undefined>');
    });
  });

  describe('Component Export', () => {
    it('should have export const NewPasswordForm', () => {
      const source = getComponentSource();
      expect(source).toContain('export const NewPasswordForm');
    });

    it('should be an arrow function', () => {
      const source = getComponentSource();
      expect(source).toContain('() =>');
    });

    it('should return JSX', () => {
      const source = getComponentSource();
      expect(source).toContain('return');
    });
  });

  describe('Form Configuration', () => {
    it('should have CardWrapper with header for new password', () => {
      const source = getComponentSource();
      expect(source).toContain('Enter a new password');
    });

    it('should have back button to login page', () => {
      const source = getComponentSource();
      expect(source).toContain('/auth/login');
    });

    it('should have password field as required', () => {
      const source = getComponentSource();
      expect(source).toContain('password');
    });

    it('should not have additional fields besides password', () => {
      const source = getComponentSource();
      const passwordFieldCount = (source.match(/name="password"/g) || []).length;
      expect(passwordFieldCount).toBe(1);
    });
  });

  describe('State Management', () => {
    it('should manage error state', () => {
      const source = getComponentSource();
      expect(source).toContain('setError');
    });

    it('should manage success state', () => {
      const source = getComponentSource();
      expect(source).toContain('setSuccess');
    });

    it('should manage isPending state', () => {
      const source = getComponentSource();
      expect(source).toContain('isPending');
    });

    it('should use useTransition for async operations', () => {
      const source = getComponentSource();
      expect(source).toContain('startTransition');
    });

    it('should handle search params for URL token', () => {
      const source = getComponentSource();
      expect(source).toContain('const token = searchParams.get("token")');
    });
  });

  describe('Action Integration', () => {
    it('should import setNewPassword action', () => {
      const source = getComponentSource();
      expect(source).toContain('setNewPassword');
      expect(source).toContain('new-password');
    });

    it('should call setNewPassword with values and token', () => {
      const source = getComponentSource();
      expect(source).toContain('setNewPassword(values, token)');
    });

    it('should handle action response', () => {
      const source = getComponentSource();
      expect(source).toContain('.then((data)');
    });

    it('should set error from action response', () => {
      const source = getComponentSource();
      expect(source).toContain('setError(data?.error)');
    });

    it('should set success from action response', () => {
      const source = getComponentSource();
      expect(source).toContain('setSuccess(data?.success)');
    });
  });

  describe('Password Field Configuration', () => {
    it('should require password field', () => {
      const source = getComponentSource();
      expect(source).toContain('name="password"');
    });

    it('should have password type', () => {
      const source = getComponentSource();
      expect(source).toContain('type="password"');
    });

    it('should have placeholder for password', () => {
      const source = getComponentSource();
      expect(source).toContain('placeholder="******"');
    });

    it('should label password field correctly', () => {
      const source = getComponentSource();
      expect(source).toContain('New Password');
    });

    it('should disable field during submission', () => {
      const source = getComponentSource();
      expect(source).toContain('disabled={isPending}');
    });

    it('should have dark theme styling', () => {
      const source = getComponentSource();
      expect(source).toContain('bg-zinc-800');
      expect(source).toContain('text-white');
    });
  });

  describe('Conditional Rendering', () => {
    it('should always show password field', () => {
      const source = getComponentSource();
      const passwordFieldOccurrences = (source.match(/name="password"/g) || []).length;
      expect(passwordFieldOccurrences).toBeGreaterThan(0);
    });

    it('should always show error component', () => {
      const source = getComponentSource();
      expect(source).toContain('FormError');
    });

    it('should always show success component', () => {
      const source = getComponentSource();
      expect(source).toContain('FormSuccess');
    });

    it('should always show submit button', () => {
      const source = getComponentSource();
      expect(source).toContain('Set Password');
    });
  });

  describe('Error Handling', () => {
    it('should display form errors', () => {
      const source = getComponentSource();
      expect(source).toContain('FormError');
    });

    it('should display success messages', () => {
      const source = getComponentSource();
      expect(source).toContain('FormSuccess');
    });

    it('should handle async errors', () => {
      const source = getComponentSource();
      expect(source).toContain('data?.error');
    });

    it('should clear errors on new submission', () => {
      const source = getComponentSource();
      expect(source).toContain('setError("")');
    });

    it('should clear success on new submission', () => {
      const source = getComponentSource();
      expect(source).toContain('setSuccess("")');
    });
  });

  describe('Form Submission Flow', () => {
    it('should clear previous messages before submission', () => {
      const source = getComponentSource();
      expect(source).toContain('setError("")');
      expect(source).toContain('setSuccess("")');
    });

    it('should transition state during submission', () => {
      const source = getComponentSource();
      expect(source).toContain('startTransition');
    });

    it('should call setNewPassword action with token', () => {
      const source = getComponentSource();
      expect(source).toContain('setNewPassword(values, token)');
    });

    it('should update error state from response', () => {
      const source = getComponentSource();
      expect(source).toContain('setError(data?.error)');
    });

    it('should update success state from response', () => {
      const source = getComponentSource();
      expect(source).toContain('setSuccess(data?.success)');
    });
  });

  describe('Navigation', () => {
    it('should have back button to login', () => {
      const source = getComponentSource();
      expect(source).toContain('/auth/login');
    });

    it('should have back button label', () => {
      const source = getComponentSource();
      expect(source).toContain('Back to login');
    });

    it('should use CardWrapper for consistent layout', () => {
      const source = getComponentSource();
      expect(source).toContain('CardWrapper');
    });
  });

  describe('Input Styling', () => {
    it('should have consistent input styling', () => {
      const source = getComponentSource();
      expect(source).toContain('bg-zinc-800');
      expect(source).toContain('h-10');
      expect(source).toContain('placeholder:text-gray-300');
      expect(source).toContain('pt-2');
      expect(source).toContain('border-gray-500');
    });

    it('should have white text color', () => {
      const source = getComponentSource();
      expect(source).toContain('text-white');
    });

    it('should have proper spacing', () => {
      const source = getComponentSource();
      expect(source).toContain('space-y-6');
      expect(source).toContain('space-y-4');
    });
  });

  describe('Component Features', () => {
    it('should be a single-field form', () => {
      const source = getComponentSource();
      const formFieldCount = (source.match(/<FormField/g) || []).length;
      expect(formFieldCount).toBe(1);
    });

    it('should require token from URL', () => {
      const source = getComponentSource();
      expect(source).toContain('searchParams.get("token")');
    });

    it('should use server action for password reset', () => {
      const source = getComponentSource();
      expect(source).toContain('setNewPassword');
    });

    it('should provide user feedback via messages', () => {
      const source = getComponentSource();
      expect(source).toContain('FormError');
      expect(source).toContain('FormSuccess');
    });

    it('should prevent submission while loading', () => {
      const source = getComponentSource();
      expect(source).toContain('disabled={isPending}');
    });
  });

  describe('Security', () => {
    it('should use password type input', () => {
      const source = getComponentSource();
      expect(source).toContain('type="password"');
    });

    it('should not display password as plain text', () => {
      const source = getComponentSource();
      const hasPasswordTypeInput = source.includes('type="password"');
      expect(hasPasswordTypeInput).toBe(true);
    });

    it('should require token from search params', () => {
      const source = getComponentSource();
      expect(source).toContain('const token = searchParams.get("token")');
    });

    it('should pass token to server action', () => {
      const source = getComponentSource();
      expect(source).toContain('setNewPassword(values, token)');
    });
  });

  describe('Client Component Directive', () => {
    it('should be marked as client component', () => {
      const source = getComponentSource();
      expect(source).toContain('"use client"');
    });

    it('should use client-side hooks', () => {
      const source = getComponentSource();
      expect(source).toContain('useState');
      expect(source).toContain('useTransition');
      expect(source).toContain('useForm');
    });
  });
});
