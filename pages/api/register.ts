import bcrypt from "bcrypt"
import { NextApiRequest, NextApiResponse } from "next"
import prismadb from "@/lib/prismadb"
import { z } from 'zod';

const registerUserSchema = z.object({
  name: z.string().regex(/^[a-zA-Z0-9]{3,15}$/g, 'Invalid username'),
  email: z.string().email('Invalid email'),
  password: z.string().min(5, 'Password should be minimum 5 characters'),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).end()
  }

  try {
    if (!req.body.email || !req.body.name || !req.body.password) {
      return res.status(400).json({ error: "Username, Email and password required", success: false })
    }

    const { email, name, password } = registerUserSchema.parse(req.body)

    const existingUser = await prismadb.user.findUnique({
      where: {
        email
      }
    })

    if (existingUser) {
      return res.status(422).json({ error: "Email taken", success: false })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await prismadb.user.create({
      data: {
        email,
        name,
        hashedPassword,
        role: "user",
        image: "",
        emailVerified: new Date()
      }
    })

    prismadb.$disconnect()
    return res.status(200).json(user)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message, success: false })
    }
  }
}