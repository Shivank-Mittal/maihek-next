import { NextRequest } from "next/server";
import { compare } from "bcryptjs";
import jwt from "jsonwebtoken";
import ApiResponse from "@/lib/response";

const users = [
  {
    id: "1",
    email: "maihakrestoindien@gmail.com",
    password: "$2b$10$icp63UgbcWyz.4E/RXm7RuNfHNJhoi.f1ikbIojR9wq4wVzdT4lq.",
    role: "admin",
  },
];

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return ApiResponse.badRequest("Email and password required");
  }

  const user = users.find((u) => u.email === email);
  if (!user) return ApiResponse.unauthorized("Invalid credentials");

  const valid = await compare(password, user.password);
  if (!valid) return ApiResponse.unauthorized("Invalid credentials");

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET as string,
    { expiresIn: "30d" }
  );

  return ApiResponse.ok({ token });
}
