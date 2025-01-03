import { prisma } from '../lib/prisma'
import { compare, hash } from 'bcryptjs'
import { sign, verify } from 'jsonwebtoken'
import { User } from '@prisma/client'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export class AuthService {
  static async createUser(email: string, password: string, name: string) {
    const hashedPassword = await hash(password, 10)
    
    return prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    })
  }

  static async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) throw new Error('User not found')

    const isValid = await compare(password, user.password)
    if (!isValid) throw new Error('Invalid password')

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    })

    return {
      user,
      token: this.generateToken(user),
    }
  }

  static generateToken(user: User) {
    return sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    )
  }

  static verifyToken(token: string) {
    try {
      return verify(token, JWT_SECRET) as {
        userId: string
        email: string
        role: string
      }
    } catch (error) {
      throw new Error('Invalid token')
    }
  }

  static async getUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        sessions: {
          include: {
            files: true,
            results: true,
          },
        },
      },
    })
  }

  static async updateUser(id: string, data: Partial<User>) {
    if (data.password) {
      data.password = await hash(data.password, 10)
    }

    return prisma.user.update({
      where: { id },
      data,
    })
  }
} 