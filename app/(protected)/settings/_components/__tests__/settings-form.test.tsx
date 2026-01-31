import * as React from "react";

// SettingsForm is a complex form component with multiple dependencies
// Static analysis-based tests to verify component structure and configuration

describe("SettingsForm Component", () => {
  const fs = require("node:fs");
  const path = require("node:path");

  const getComponentSource = () => {
    const filePath = path.resolve(__dirname, "../settings-form.tsx");
    return fs.readFileSync(filePath, "utf8");
  };

  describe("Basic Component Structure", () => {
    it("should export SettingsForm as named export", () => {
      const source = getComponentSource();
      expect(source).toContain("export const SettingsForm");
    });

    it("should be marked as use client", () => {
      const source = getComponentSource();
      expect(source).toContain('"use client"');
    });

    it("should accept user prop", () => {
      const source = getComponentSource();
      expect(source).toContain("{ user }");
      expect(source).toContain("SettingsFormProps");
    });

    it("should have SettingsFormProps interface", () => {
      const source = getComponentSource();
      expect(source).toContain("interface SettingsFormProps");
      expect(source).toContain("user: Record<string, any>");
    });
  });

  describe("Hooks Usage", () => {
    it("should use useSession hook", () => {
      const source = getComponentSource();
      expect(source).toContain("useSession");
      expect(source).toContain("from 'next-auth/react'");
    });

    it("should use useTransition hook", () => {
      const source = getComponentSource();
      expect(source).toContain("useTransition");
    });

    it("should use useForm hook", () => {
      const source = getComponentSource();
      expect(source).toContain("useForm");
      expect(source).toContain("from 'react-hook-form'");
    });

    it("should use useCurrentProfil hook", () => {
      const source = getComponentSource();
      expect(source).toContain("useCurrentProfil");
    });

    it("should use useRouter hook", () => {
      const source = getComponentSource();
      expect(source).toContain("useRouter");
      expect(source).toContain("from 'next/navigation'");
    });

    it("should get update function from useSession", () => {
      const source = getComponentSource();
      expect(source).toContain("const { update } = useSession()");
    });
  });

  describe("Form Configuration", () => {
    it("should use SettingsSchema for validation", () => {
      const source = getComponentSource();
      expect(source).toContain("SettingsSchema");
      expect(source).toContain("from '@/schemas'");
    });

    it("should use zodResolver", () => {
      const source = getComponentSource();
      expect(source).toContain("zodResolver");
      expect(source).toContain("from '@hookform/resolvers/zod'");
    });

    it("should configure form with default values", () => {
      const source = getComponentSource();
      expect(source).toContain("defaultValues:");
      expect(source).toContain("name:");
      expect(source).toContain("email:");
      expect(source).toContain("password:");
      expect(source).toContain("newPassword:");
      expect(source).toContain("role:");
      expect(source).toContain("isTwoFactorEnabled:");
    });
  });

  describe("Form Fields", () => {
    it("should have name field", () => {
      const source = getComponentSource();
      expect(source).toContain('name="name"');
      expect(source).toContain("<FormLabel>Name</FormLabel>");
    });

    it("should have email field", () => {
      const source = getComponentSource();
      expect(source).toContain('name="email"');
      expect(source).toContain("<FormLabel>Email</FormLabel>");
    });

    it("should have password field", () => {
      const source = getComponentSource();
      expect(source).toContain('name="password"');
      expect(source).toContain("<FormLabel>Password</FormLabel>");
    });

    it("should have new password field", () => {
      const source = getComponentSource();
      expect(source).toContain('name="newPassword"');
      expect(source).toContain("<FormLabel>New Password</FormLabel>");
    });

    it("should have role field", () => {
      const source = getComponentSource();
      expect(source).toContain('name="role"');
      expect(source).toContain("<FormLabel>Role</FormLabel>");
    });

    it("should have two-factor authentication field", () => {
      const source = getComponentSource();
      expect(source).toContain('name="isTwoFactorEnabled"');
      expect(source).toContain("Two Factor Authentication");
    });
  });

  describe("Conditional Rendering", () => {
    it("should conditionally render email field for non-OAuth users", () => {
      const source = getComponentSource();
      expect(source).toContain("user.data?.user.isOAuth === false");
      expect(source).toMatch(/isOAuth === false[\s\S]*?name="email"/);
    });

    it("should conditionally render password fields for non-OAuth users", () => {
      const source = getComponentSource();
      expect(source).toMatch(/isOAuth === false[\s\S]*?name="password"/);
      expect(source).toMatch(/isOAuth === false[\s\S]*?name="newPassword"/);
    });

    it("should conditionally render role field for admin users", () => {
      const source = getComponentSource();
      expect(source).toContain("user.data?.user.role == UserRole.ADMIN");
      expect(source).toMatch(/UserRole.ADMIN[\s\S]*?name="role"/);
    });

    it("should conditionally render two-factor for non-OAuth users", () => {
      const source = getComponentSource();
      expect(source).toMatch(/isOAuth === false[\s\S]*?isTwoFactorEnabled/);
    });
  });

  describe("Profile Handling", () => {
    it("should return null when user is undefined", () => {
      const source = getComponentSource();
      expect(source).toContain("if (user == undefined");
      expect(source).toContain("return null");
    });

    it("should return null when profile is undefined", () => {
      const source = getComponentSource();
      expect(source).toContain("if (user == undefined || profil == undefined)");
      expect(source).toContain("return null");
    });

    it("should redirect to profiles when profile is empty", () => {
      const source = getComponentSource();
      expect(source).toContain("if (isEmpty(profil))");
      expect(source).toContain('router.push("profiles")');
    });

    it("should import isEmpty from lodash", () => {
      const source = getComponentSource();
      expect(source).toContain("from 'lodash'");
      expect(source).toContain("isEmpty");
    });
  });

  describe("Form Submission", () => {
    it("should have onSubmit handler", () => {
      const source = getComponentSource();
      expect(source).toContain("const onSubmit =");
    });

    it("should call settings action", () => {
      const source = getComponentSource();
      expect(source).toContain("settings(valuse)");
      expect(source).toContain("from '@/actions/settings'");
    });

    it("should use startTransition for form submission", () => {
      const source = getComponentSource();
      expect(source).toMatch(/onSubmit[\s\S]*?startTransition/);
    });

    it("should handle success response", () => {
      const source = getComponentSource();
      expect(source).toContain("if (data?.success)");
      expect(source).toContain("toast.success(data?.success)");
    });

    it("should handle error response", () => {
      const source = getComponentSource();
      expect(source).toContain("if (data?.error)");
      expect(source).toContain("toast.error(data?.error)");
    });

    it("should handle exceptions", () => {
      const source = getComponentSource();
      expect(source).toContain('.catch(() => toast.error("Something went wrong!")');
    });

    it("should update session on success", () => {
      const source = getComponentSource();
      expect(source).toMatch(/success[\s\S]*?update\(\)/);
    });
  });

  describe("UI Components", () => {
    it("should use Form component", () => {
      const source = getComponentSource();
      expect(source).toContain("<Form");
      expect(source).toContain("from '@/components/ui/form'");
    });

    it("should use FormField component", () => {
      const source = getComponentSource();
      expect(source).toContain("<FormField");
    });

    it("should use Input component", () => {
      const source = getComponentSource();
      expect(source).toContain("<Input");
      expect(source).toContain("from '@/components/ui/input'");
    });

    it("should use Select component", () => {
      const source = getComponentSource();
      expect(source).toContain("<Select");
      expect(source).toContain("from '@/components/ui/select'");
    });

    it("should use Switch component", () => {
      const source = getComponentSource();
      expect(source).toContain("<Switch");
      expect(source).toContain("from '@/components/ui/switch'");
    });

    it("should use Button component", () => {
      const source = getComponentSource();
      expect(source).toContain("<Button");
      expect(source).toContain("from '@/components/ui/button'");
    });
  });

  describe("Field Configuration", () => {
    it("should set name field as readOnly", () => {
      const source = getComponentSource();
      expect(source).toMatch(/name="name"[\s\S]*?readOnly/);
    });

    it("should set email field as readOnly", () => {
      const source = getComponentSource();
      expect(source).toMatch(/name="email"[\s\S]*?readOnly/);
    });

    it("should set password field type to password", () => {
      const source = getComponentSource();
      expect(source).toMatch(/name="password"[\s\S]*?type="password"/);
    });

    it("should set new password field type to password", () => {
      const source = getComponentSource();
      expect(source).toMatch(/name="newPassword"[\s\S]*?type="password"/);
    });

    it("should disable fields when pending", () => {
      const source = getComponentSource();
      expect(source).toContain("disabled={isPending}");
    });
  });

  describe("Role Selection", () => {
    it("should have Admin role option", () => {
      const source = getComponentSource();
      expect(source).toContain('value={UserRole.ADMIN}>Admin');
    });

    it("should have User role option", () => {
      const source = getComponentSource();
      expect(source).toContain('value={UserRole.USER}>User');
    });

    it("should import UserRole from Prisma", () => {
      const source = getComponentSource();
      expect(source).toContain("from '@prisma/client'");
      expect(source).toContain("UserRole");
    });
  });

  describe("Styling", () => {
    it("should apply styling classes to inputs", () => {
      const source = getComponentSource();
      expect(source).toContain("bg-zinc-800");
      expect(source).toContain("text-white");
      expect(source).toContain("border-gray-500");
    });

    it("should apply styling to button", () => {
      const source = getComponentSource();
      expect(source).toContain('variant="auth"');
      expect(source).toContain('size="lg"');
      expect(source).toContain("max-w-24");
    });

    it("should have form spacing", () => {
      const source = getComponentSource();
      expect(source).toContain("space-y-6");
      expect(source).toContain("space-y-4");
    });
  });

  describe("Two-Factor Authentication", () => {
    it("should have description for two-factor", () => {
      const source = getComponentSource();
      expect(source).toContain("Enable two factor authentication for your account");
    });

    it("should use Switch for two-factor", () => {
      const source = getComponentSource();
      expect(source).toMatch(/isTwoFactorEnabled[\s\S]*?<Switch/);
    });

    it("should bind Switch to field value", () => {
      const source = getComponentSource();
      expect(source).toContain("checked={field.value}");
      expect(source).toContain("onCheckedChange={field.onChange}");
    });
  });

  describe("Imports", () => {
    it("should import toast from react-hot-toast", () => {
      const source = getComponentSource();
      expect(source).toContain("from 'react-hot-toast'");
      expect(source).toContain("import toast");
    });

    it("should import z from zod", () => {
      const source = getComponentSource();
      expect(source).toContain("from 'zod'");
      expect(source).toContain("import * as z");
    });

    it("should import zodResolver", () => {
      const source = getComponentSource();
      expect(source).toContain("@hookform/resolvers/zod");
      expect(source).toContain("zodResolver");
    });
  });

  describe("Button Configuration", () => {
    it("should have Save button text", () => {
      const source = getComponentSource();
      expect(source).toContain("Save");
      expect(source).toContain("</Button>");
    });

    it("should disable button when pending", () => {
      const source = getComponentSource();
      expect(source).toMatch(/<Button[\s\S]*?disabled={isPending}/);
    });
  });

  describe("Form Layout", () => {
    it("should center button in container", () => {
      const source = getComponentSource();
      expect(source).toContain("flex flex-row justify-center");
    });

    it("should wrap form in Form component", () => {
      const source = getComponentSource();
      expect(source).toContain("<Form {...form}>");
    });

    it("should use form.handleSubmit for onSubmit", () => {
      const source = getComponentSource();
      expect(source).toContain("onSubmit={form.handleSubmit(onSubmit)}");
    });
  });
});
