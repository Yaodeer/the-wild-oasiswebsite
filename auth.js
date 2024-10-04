// import NextAuth from 'next-auth';
// import Google from 'next-auth/providers/google';

// import NextAuth from 'next-auth';
// import Google from 'next-auth/providers/google';
import NextAuth from 'next-auth';
//import github from 'next-auth/providers/github';
import Github from 'next-auth/providers/github';
import { createGuest, getGuest } from './app/_lib/data-service';

const authConfig = {
  providers: [
    Github({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
      authorizationUrl: `https://github.com/login/oauth/authorize?scope=read:user,user:email`,
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      return url.startsWith(baseUrl) ? url : baseUrl;
    },
    authorized({ auth, request }) {
      return !!auth?.user;
    },
    async signIn({ user, account, profile }) {
      try {
        const existingGuest = await getGuest(user.email);
        //  console.log(user);

        if (!existingGuest) {
          const createResponse = await createGuest({
            email: user.email,
            fullName: user.name,
          });
          //  console.log('Create guest response:', createResponse); // 打印创建用户的返回结果
        }
        return true;
      } catch {
        //  console.error('Sign in error:', error);
        return false;
      }
    },
    async session({ session, user }) {
      const guest = await getGuest(session.user.email);
      session.user.guestId = guest.id;
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  httpOptions: {
    timeout: 30000, // 设置超时时间为10秒
  },

  useSecureCookies: process.env.NODE_ENV === 'production',
};

export const {
  auth,
  signIn,
  signOut,
  handlers: { GET, POST },
} = NextAuth(authConfig);
