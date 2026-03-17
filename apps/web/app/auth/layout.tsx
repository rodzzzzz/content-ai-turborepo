import MagicBg from '@/components/magic-bg';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Content AI | Authentication',
  description: 'Login or sign up to Content AI',
};

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="relative flex h-screen items-center justify-center">
      <MagicBg className="hidden md:block" />
      {children}
    </div>
  );
};

export default AuthLayout;
