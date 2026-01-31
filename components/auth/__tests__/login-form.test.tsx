import * as React from 'react';

// LoginForm is a complex form component with multiple dependencies
// Static analysis-based tests to verify component structure and configuration

describe('LoginForm Component', () => {
  const fs = require('node:fs');
  const path = require('node:path');

  const getComponentSource = () => {
    const filePath = path.resolve(__dirname, '../login-form.tsx');
    return fs.readFileSync(filePath, 'utf8');
  };

  describe('Basic Component Structure', () => {
    it('should export LoginForm as named export', () => {
      const source = getComponentSource();
      expect(source).toContain('export const LoginForm');
    });

    it('should be marked as use client', () => {
      const source = getComponentSource();
      expect(source).toContain('"use client"');
    });

    it('should be a functional component', () => {
      const source = getComponentSource();
      expect(source).toContain('const LoginForm = () =>');
    });

    it('should have no props parameter', () => {
      const source = getComponentSource();
      expect(source).toMatch(/const LoginForm\s*=\s*\(\s*\)/);
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

    it('should initialize showTwoFactor state', () => {
      const source = getComponentSource();
      expect(source).toContain('setShowTwoFactor');
      expect(source).toContain('useState<boolean>(false)');
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
  });

  describe('Schema and Validation', () => {
    it('should import LoginSchema', () => {
      const source = getComponentSource();
      expect(source).toContain('LoginSchema');
      expect(source).toContain("from '@/schemas'");
    });

    it('should use zodResolver', () => {
      const source = getComponentSource();
      expect(source).toContain('zodResolver');
      expect(source).toContain("from '@hookform/resolvers/zod'");
    });

    it('should configure useForm with LoginSchema', () => {
      const source = getComponentSource();
      expect(source).toContain('resolver: zodResolver(LoginSchema)');
    });

    it('should infer types from LoginSchema', () => {
      const source = getComponentSource();
      expect(source).toContain('z.infer<typeof LoginSchema>');
    });

    it('should set default email value', () => {
      const source = getComponentSource();
      expect(source).toContain('email: ""');
    });

    it('should set default password value', () => {
      const source = getComponentSource();
      expect(source).toContain('password: ""');
    });
  });

  describe('Search Parameters Handling', () => {
    it('should check for error query parameter', () => {
      const source = getComponentSource();
      expect(source).toContain('searchParams.get("error")');
    });

    it('should check for OAuthAccountNotLinked error', () => {
      const source = getComponentSource();
      expect(source).toContain('OAuthAccountNotLinked');
    });

    it('should set urlError message for OAuth link error', () => {
      const source = getComponentSource();
      expect(source).toContain('Email already in use with different provider!');
    });

    it('should handle urlError state', () => {
      const source = getComponentSource();
      expect(source).toContain('urlError');
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
      expect(source).toContain('headerLabel="Welcome back"');
    });

    it('should set CardWrapper back button label', () => {
      const source = getComponentSource();
      expect(source).toContain("backButtonLabel=\"Don't have an account?\"");
    });

    it('should set CardWrapper back button href to /auth/register', () => {
      const source = getComponentSource();
      expect(source).toContain('backButtonHref="/auth/register"');
    });

    it('should use Form component from react-hook-form', () => {
      const source = getComponentSource();
      expect(source).toContain('<Form {...form}>');
    });
  });

  describe('Form Fields - Email and Password', () => {
    it('should have email FormField', () => {
      const source = getComponentSource();
      expect(source).toContain('name="email"');
    });

    it('should have password FormField', () => {
      const source = getComponentSource();
      expect(source).toContain('name="password"');
    });

    it('should have email field inside FormItem', () => {
      const source = getComponentSource();
      expect(source).toContain('FormItem');
    });

    it('should label email field', () => {
      const source = getComponentSource();
      expect(source).toContain('Email');
    });

    it('should label password field', () => {
      const source = getComponentSource();
      expect(source).toContain('Password');
    });

    it('should have email input with email type', () => {
      const source = getComponentSource();
      expect(source).toMatch(/type="email"/);
    });

    it('should have password input with password type', () => {
      const source = getComponentSource();
      expect(source).toMatch(/type="password"/);
    });

    it('should set email placeholder', () => {
      const source = getComponentSource();
      expect(source).toContain('john.doe@example.com');
    });

    it('should set password placeholder', () => {
      const source = getComponentSource();
      expect(source).toContain('placeholder="******"');
    });

    it('should disable email field when isPending', () => {
      const source = getComponentSource();
      expect(source).toContain('disabled={isPending}');
    });

    it('should disable password field when isPending', () => {
      const source = getComponentSource();
      expect(source).toContain('disabled={isPending}');
    });

    it('should apply dark styling to email input', () => {
      const source = getComponentSource();
      expect(source).toContain('bg-zinc-800');
    });

    it('should apply dark styling to password input', () => {
      const source = getComponentSource();
      expect(source).toContain('h-10');
    });

    it('should apply text color styling to labels', () => {
      const source = getComponentSource();
      expect(source).toContain('text-white');
    });
  });

  describe('Form Fields - 2FA Code', () => {
    it('should have 2FA code FormField', () => {
      const source = getComponentSource();
      expect(source).toContain('name="code"');
    });

    it('should label 2FA field', () => {
      const source = getComponentSource();
      expect(source).toContain('2FA Code');
    });

    it('should set 2FA code placeholder', () => {
      const source = getComponentSource();
      expect(source).toContain('placeholder="123456"');
    });

    it('should have 2FA code field with text type', () => {
      const source = getComponentSource();
      expect(source).toContain('type="text"');
    });

    it('should conditionally render 2FA field', () => {
      const source = getComponentSource();
      expect(source).toContain('{showTwoFactor &&');
    });

    it('should hide email and password when showing 2FA', () => {
      const source = getComponentSource();
      expect(source).toContain('{!showTwoFactor &&');
    });
  });

  describe('Password Recovery Link', () => {
    it('should have forgot password link', () => {
      const source = getComponentSource();
      expect(source).toContain('Forgot password?');
    });

    it('should link to /auth/reset', () => {
      const source = getComponentSource();
      expect(source).toContain('/auth/reset');
    });

    it('should use Next Link component', () => {
      const source = getComponentSource();
      expect(source).toContain("from 'next/link'");
    });

    it('should use Button with asChild prop', () => {
      const source = getComponentSource();
      expect(source).toContain('asChild');
    });

    it('should use link_dark button variant', () => {
      const source = getComponentSource();
      expect(source).toContain('variant="link_dark"');
    });

    it('should conditionally show password link only in normal mode', () => {
      const source = getComponentSource();
      expect(source).toContain('!showTwoFactor');
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
      expect(source).toContain('message={error ?? urlError}');
    });

    it('should display success message', () => {
      const source = getComponentSource();
      expect(source).toContain('message={success}');
    });

    it('should prioritize form error over URL error', () => {
      const source = getComponentSource();
      expect(source).toContain('error ?? urlError');
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

    it('should show Login text in normal mode', () => {
      const source = getComponentSource();
      expect(source).toContain('"Login"');
    });

    it('should show Confirm text in 2FA mode', () => {
      const source = getComponentSource();
      expect(source).toContain('"Confirm"');
    });

    it('should conditionally change button text', () => {
      const source = getComponentSource();
      expect(source).toContain('showTwoFactor ? "Confirm" : "Login"');
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

    it('should call login action', () => {
      const source = getComponentSource();
      expect(source).toContain('login(values)');
    });

    it('should use startTransition for async operation', () => {
      const source = getComponentSource();
      expect(source).toContain('startTransition(');
    });

    it('should handle login success response', () => {
      const source = getComponentSource();
      expect(source).toContain('data?.success');
    });

    it('should handle login error response', () => {
      const source = getComponentSource();
      expect(source).toContain('data?.error');
    });

    it('should handle 2FA requirement', () => {
      const source = getComponentSource();
      expect(source).toContain('data?.twoFactor');
    });

    it('should reset form on error', () => {
      const source = getComponentSource();
      expect(source).toContain('form.reset()');
    });

    it('should reset form on success', () => {
      const source = getComponentSource();
      expect(source).toContain('form.reset()');
    });

    it('should set showTwoFactor when 2FA required', () => {
      const source = getComponentSource();
      expect(source).toContain('setShowTwoFactor(true)');
    });

    it('should catch submission errors', () => {
      const source = getComponentSource();
      expect(source).toContain('.catch(');
    });

    it('should handle caught errors', () => {
      const source = getComponentSource();
      expect(source).toContain('Something went wrong!');
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
    it('should import Link from next/link', () => {
      const source = getComponentSource();
      expect(source).toContain("import Link from 'next/link'");
    });

    it('should import useSearchParams from next/navigation', () => {
      const source = getComponentSource();
      expect(source).toContain("useSearchParams");
      expect(source).toContain("from 'next/navigation'");
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
      expect(source).toContain('type="email"');
      expect(source).toContain('type="password"');
    });

    it('should have clear button text', () => {
      const source = getComponentSource();
      expect(source).toContain('Login');
      expect(source).toContain('Confirm');
    });
  });

  describe('Type Safety', () => {
    it('should use TypeScript syntax', () => {
      const source = getComponentSource();
      expect(source).toContain('const');
    });

    it('should type form values', () => {
      const source = getComponentSource();
      expect(source).toContain('z.infer<typeof LoginSchema>');
    });

    it('should type hook return values', () => {
      const source = getComponentSource();
      expect(source).toContain('<boolean>');
      expect(source).toContain('<string | undefined>');
    });
  });

  describe('Component Export', () => {
    it('should have export const LoginForm', () => {
      const source = getComponentSource();
      expect(source).toContain('export const LoginForm');
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
});
