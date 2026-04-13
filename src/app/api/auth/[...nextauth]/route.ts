import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET as string;
// In-memory user store (replace with a database in production)
const users = [
  {
    id: "1",
    email: "maihakrestoindien@gmail.com",
    password: "$2b$10$icp63UgbcWyz.4E/RXm7RuNfHNJhoi.f1ikbIojR9wq4wVzdT4lq.",
    name: "Restaurant Admin",
    role: "admin",
  },
];

const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = users.find((u) => u.email === credentials.email);
        if (!user) {
          return null;
        }

        const isPasswordValid = await compare(credentials.password, user.password);
        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async session({ session, token }: any) {
      if (session?.user) {
        session.user.role = token.role;
        session.user.id = token.id;
      }
      session.accessToken = token.accessToken;
      return session;
    },
    async jwt({ token, user }: any) {
      if (user) {
        const accessToken = jwt.sign(
          {
            id: user.id,
            email: user.email,
            role: user.role,
          },
          JWT_SECRET,
          {
            expiresIn: "1h", // token valid for 1 hour
          }
        );
        token.accessToken = accessToken;
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
  },
  secret: NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
