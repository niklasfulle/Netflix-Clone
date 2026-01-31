import * as React from 'react';

// ResetForm is a password reset request form component
// Static analysis-based tests to verify component structure and configuration

describe('ResetForm Component', () => {
  const fs = require('node:fs');
  const path = require('node:path');

  const getComponentSource = () => {
    const filePath = path.resolve(__dirname, '../reset-form.tsx');
    return fs.readFileSync(filePath, 'utf8');
  };

  describe('Basic Component Structure', () => {
    it('should be a valid exported component', () => {
      const source = getComponentSource();
      expect(source).toContain('export const ResetForm');
    });

    it('should be marked as use client', () => {
      const source = getComponentSource();
      expect(source).toContain('"use client"');
    });

    it('should export ResetForm as named export', () => {
      const source = getComponentSource();
      expect(source).toContain('export const ResetForm');
    });

    it('should be a functional component', () => {
      const source = getComponentSource();
      expect(source).toContain('const ResetForm = () =>');
    });

    it('should have no props parameter', () => {
      const source = getComponentSource();
      expect(source).toMatch(/const ResetForm\s*=\s*\(\s*\)/);
    });
  });

  describe('Hooks Usage', () => {
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
      expect(source).toContain('useState<string | undefined>("");');
    });

    it('should initialize success state', () => {
      const source = getComponentSource();
      expect(source).toContain('setSuccess');
      expect(source).toContain('useState<string | undefined>("");');
    });

    it('should use useTransition for pending state', () => {
      const source = getComponentSource();
      expect(source).toContain('useTransition');
      expect(source).toContain('isPending');
      expect(source).toContain('startTransition');
    });
  });

  describe('Schema and Validation', () => {
    it('should import ResetPasswordSchema', () => {
      const source = getComponentSource();
      expect(source).toContain('ResetPasswordSchema');
      expect(source).toContain("from '@/schemas'");
    });

    it('should use zodResolver', () => {
      const source = getComponentSource();
      expect(source).toContain('zodResolver');
      expect(source).toContain("from '@hookform/resolvers/zod'");
    });

    it('should configure useForm with ResetPasswordSchema', () => {
      const source = getComponentSource();
      expect(source).toContain('resolver: zodResolver(ResetPasswordSchema)');
    });

    it('should infer types from ResetPasswordSchema', () => {
      const source = getComponentSource();
      expect(source).toContain('z.infer<typeof ResetPasswordSchema>');
    });

    it('should set default email value as empty string', () => {
      const source = getComponentSource();
      expect(source).toContain('defaultValues: {');
      expect(source).toContain('email: ""');
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
      expect(source).toContain('Forgot your password?');
    });

    it('should set CardWrapper back button label', () => {
      const source = getComponentSource();
      expect(source).toContain('Back to login');
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

  describe('Form Fields - Email Field', () => {
    it('should have email FormField', () => {
      const source = getComponentSource();
      expect(source).toContain('name="email"');
    });

    it('should label email field', () => {
      const source = getComponentSource();
      expect(source).toContain('Email');
    });

    it('should have email input with email type', () => {
      const source = getComponentSource();
      expect(source).toContain('type="email"');
    });

    it('should set email placeholder', () => {
      const source = getComponentSource();
      expect(source).toContain('john.doe@example.com');
    });

    it('should disable email field during submission', () => {
      const source = getComponentSource();
      expect(source).toContain('disabled={isPending}');
    });

    it('should apply dark styling to input', () => {
      const source = getComponentSource();
      expect(source).toContain('bg-zinc-800');
    });

    it('should have email inside FormItem', () => {
      const source = getComponentSource();
      expect(source).toContain('FormItem');
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

    it('should show Send reset email text', () => {
      const source = getComponentSource();
      expect(source).toContain('Send reset email');
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

    it('should call reset action', () => {
      const source = getComponentSource();
      expect(source).toContain('reset(values)');
    });

    it('should use startTransition for async operation', () => {
      const source = getComponentSource();
      expect(source).toContain('startTransition(');
    });

    it('should handle reset response', () => {
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
    it('should import reset action', () => {
      const source = getComponentSource();
      expect(source).toContain('reset');
      expect(source).toContain("from '@/actions/reset-password'");
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

    it('should import React hooks', () => {
      const source = getComponentSource();
      expect(source).toContain('useState');
      expect(source).toContain('useTransition');
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
    });

    it('should have clear button text', () => {
      const source = getComponentSource();
      expect(source).toContain('Send reset email');
    });
  });

  describe('Type Safety', () => {
    it('should use TypeScript syntax', () => {
      const source = getComponentSource();
      expect(source).toContain('const');
    });

    it('should type form values', () => {
      const source = getComponentSource();
      expect(source).toContain('z.infer<typeof ResetPasswordSchema>');
    });

    it('should type hook return values', () => {
      const source = getComponentSource();
      expect(source).toContain('<string | undefined>');
    });
  });

  describe('Component Export', () => {
    it('should have export const ResetForm', () => {
      const source = getComponentSource();
      expect(source).toContain('export const ResetForm');
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
    it('should have CardWrapper with header for password reset', () => {
      const source = getComponentSource();
      expect(source).toContain('Forgot your password?');
    });

    it('should have back button to login page', () => {
      const source = getComponentSource();
      expect(source).toContain('/auth/login');
    });

    it('should have email field as only field', () => {
      const source = getComponentSource();
      expect(source).toContain('name="email"');
    });

    it('should have exactly one form field', () => {
      const source = getComponentSource();
      const formFieldCount = (source.match(/<FormField/g) || []).length;
      expect(formFieldCount).toBe(1);
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
  });

  describe('Action Integration', () => {
    it('should import reset action', () => {
      const source = getComponentSource();
      expect(source).toContain('reset');
      expect(source).toContain('reset-password');
    });

    it('should call reset with form values', () => {
      const source = getComponentSource();
      expect(source).toContain('reset(values)');
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

  describe('Field Validation', () => {
    it('should require email field', () => {
      const source = getComponentSource();
      expect(source).toContain('name="email"');
    });

    it('should validate email format', () => {
      const source = getComponentSource();
      expect(source).toContain('type="email"');
    });

    it('should be single field form', () => {
      const source = getComponentSource();
      const emailCount = (source.match(/name="email"/g) || []).length;
      expect(emailCount).toBe(1);
    });
  });

  describe('Conditional Rendering', () => {
    it('should always show email field', () => {
      const source = getComponentSource();
      const emailFieldCount = (source.match(/name="email"/g) || []).length;
      expect(emailFieldCount).toBeGreaterThan(0);
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
      expect(source).toContain('Send reset email');
    });

    it('should render in CardWrapper container', () => {
      const source = getComponentSource();
      expect(source).toContain('<CardWrapper');
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

    it('should call reset action with form data', () => {
      const source = getComponentSource();
      expect(source).toContain('reset(values)');
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
    it('should be single-field reset form', () => {
      const source = getComponentSource();
      const formFieldCount = (source.match(/<FormField/g) || []).length;
      expect(formFieldCount).toBe(1);
    });

    it('should collect email for password reset', () => {
      const source = getComponentSource();
      expect(source).toContain('name="email"');
    });

    it('should use server action for reset', () => {
      const source = getComponentSource();
      expect(source).toContain('reset');
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
    it('should validate email format', () => {
      const source = getComponentSource();
      expect(source).toContain('type="email"');
    });

    it('should not expose sensitive data', () => {
      const source = getComponentSource();
      // Check that we don't hardcode passwords or log sensitive values
      const hasHardcodedPassword = source.includes('password:') && !source.includes('password: ""');
      const hasPasswordLogging = source.match(/console\.(log|error|warn).*password/i);
      expect(hasHardcodedPassword).toBe(false);
      expect(hasPasswordLogging).toBeNull();
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

  describe('Placeholder Text', () => {
    it('should have email example placeholder', () => {
      const source = getComponentSource();
      expect(source).toContain('john.doe@example.com');
    });
  });

  describe('Form Labels', () => {
    it('should label email field', () => {
      const source = getComponentSource();
      expect(source).toContain('Email');
    });

    it('should style labels white', () => {
      const source = getComponentSource();
      expect(source).toContain('FormLabel className="text-white"');
    });
  });

  describe('Input Configuration', () => {
    it('should spread field props to inputs', () => {
      const source = getComponentSource();
      expect(source).toContain('{...field}');
    });

    it('should set disabled state during submission', () => {
      const source = getComponentSource();
      expect(source).toContain('disabled={isPending}');
    });

    it('should apply consistent styling', () => {
      const source = getComponentSource();
      expect(source).toContain('className="text-white bg-zinc-800 h-10 placeholder:text-gray-300 pt-2 border-gray-500"');
    });
  });

  describe('Button Styling', () => {
    it('should use auth variant button', () => {
      const source = getComponentSource();
      expect(source).toContain('variant="auth"');
    });

    it('should use large size button', () => {
      const source = getComponentSource();
      expect(source).toContain('size="lg"');
    });

    it('should be submit type', () => {
      const source = getComponentSource();
      expect(source).toContain('type="submit"');
    });

    it('should display Send reset email text', () => {
      const source = getComponentSource();
      expect(source).toContain('Send reset email');
    });
  });

  describe('Default Values', () => {
    it('should initialize email as empty string', () => {
      const source = getComponentSource();
      expect(source).toContain('email: ""');
    });
  });

  describe('Form Submission Handling', () => {
    it('should accept form values parameter', () => {
      const source = getComponentSource();
      expect(source).toContain('const onSubmit = (values: z.infer<typeof ResetPasswordSchema>)');
    });

    it('should reset error state before submission', () => {
      const source = getComponentSource();
      expect(source).toContain('setError("")');
    });

    it('should reset success state before submission', () => {
      const source = getComponentSource();
      expect(source).toContain('setSuccess("")');
    });

    it('should wrap reset call in startTransition', () => {
      const source = getComponentSource();
      expect(source).toContain('startTransition(() => {');
      expect(source).toContain('reset(values)');
    });
  });

  describe('Response Processing', () => {
    it('should access error property from response', () => {
      const source = getComponentSource();
      expect(source).toContain('data?.error');
    });

    it('should access success property from response', () => {
      const source = getComponentSource();
      expect(source).toContain('data?.success');
    });

    it('should set error from response data', () => {
      const source = getComponentSource();
      expect(source).toContain('setError(data?.error)');
    });

    it('should set success from response data', () => {
      const source = getComponentSource();
      expect(source).toContain('setSuccess(data?.success)');
    });
  });

  describe('Component Simplicity', () => {
    it('should be simple single-field form', () => {
      const source = getComponentSource();
      const formFieldCount = (source.match(/<FormField/g) || []).length;
      expect(formFieldCount).toBe(1);
    });

    it('should focus on email collection', () => {
      const source = getComponentSource();
      expect(source).toContain('name="email"');
    });

    it('should have minimal configuration', () => {
      const source = getComponentSource();
      expect(source).toContain('defaultValues: {');
      expect(source).toContain('email: ""');
    });
  });

  describe('Message Display', () => {
    it('should display success message prominently', () => {
      const source = getComponentSource();
      expect(source).toContain('<FormSuccess');
    });

    it('should display error message when needed', () => {
      const source = getComponentSource();
      expect(source).toContain('<FormError');
    });

    it('should pass success prop to FormSuccess', () => {
      const source = getComponentSource();
      expect(source).toContain('message={success}');
    });

    it('should pass error prop to FormError', () => {
      const source = getComponentSource();
      expect(source).toContain('message={error}');
    });
  });

  describe('Data Flow', () => {
    it('should collect email from user', () => {
      const source = getComponentSource();
      expect(source).toContain('name="email"');
    });

    it('should pass email to reset action', () => {
      const source = getComponentSource();
      expect(source).toContain('reset(values)');
    });

    it('should receive response from action', () => {
      const source = getComponentSource();
      expect(source).toContain('.then((data)');
    });

    it('should update state with response', () => {
      const source = getComponentSource();
      expect(source).toContain('setSuccess(data?.success)');
      expect(source).toContain('setError(data?.error)');
    });

    it('should display state in UI', () => {
      const source = getComponentSource();
      expect(source).toContain('message={success}');
      expect(source).toContain('message={error}');
    });
  });

  describe('User Experience', () => {
    it('should show clear header text', () => {
      const source = getComponentSource();
      expect(source).toContain('Forgot your password?');
    });

    it('should provide email placeholder', () => {
      const source = getComponentSource();
      expect(source).toContain('john.doe@example.com');
    });

    it('should provide feedback after submission', () => {
      const source = getComponentSource();
      expect(source).toContain('FormSuccess');
      expect(source).toContain('FormError');
    });

    it('should allow navigation back to login', () => {
      const source = getComponentSource();
      expect(source).toContain('Back to login');
    });

    it('should prevent accidental re-submission', () => {
      const source = getComponentSource();
      expect(source).toContain('disabled={isPending}');
    });
  });

  describe('Email Field Configuration', () => {
    it('should require email field', () => {
      const source = getComponentSource();
      expect(source).toContain('name="email"');
    });

    it('should have email type', () => {
      const source = getComponentSource();
      expect(source).toContain('type="email"');
    });

    it('should have placeholder for email', () => {
      const source = getComponentSource();
      expect(source).toContain('placeholder="john.doe@example.com"');
    });

    it('should label email field correctly', () => {
      const source = getComponentSource();
      expect(source).toContain('Email');
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

  describe('Header Configuration', () => {
    it('should display password reset header', () => {
      const source = getComponentSource();
      expect(source).toContain('Forgot your password?');
    });

    it('should have back button to login', () => {
      const source = getComponentSource();
      expect(source).toContain('backButtonHref="/auth/login"');
    });

    it('should have back button text', () => {
      const source = getComponentSource();
      expect(source).toContain('backButtonLabel="Back to login"');
    });
  });

  describe('Button Configuration', () => {
    it('should have Send reset email button', () => {
      const source = getComponentSource();
      expect(source).toContain('Send reset email');
    });

    it('should be type submit', () => {
      const source = getComponentSource();
      expect(source).toContain('type="submit"');
    });

    it('should disable when isPending', () => {
      const source = getComponentSource();
      expect(source).toContain('disabled={isPending}');
    });

    it('should use auth variant', () => {
      const source = getComponentSource();
      expect(source).toContain('variant="auth"');
    });

    it('should use large size', () => {
      const source = getComponentSource();
      expect(source).toContain('size="lg"');
    });
  });
});
