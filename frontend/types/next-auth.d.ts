import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      accessToken: string;
      branchId?: string;
      phone?: string;
    } & DefaultSession["user"];
  }

  interface User {
    role: string;
    accessToken: string;
    branchId?: string;
    phone?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    accessToken: string;
    branchId?: string;
    phone?: string;
  }
}