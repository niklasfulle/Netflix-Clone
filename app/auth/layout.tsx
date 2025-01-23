import Image from 'next/image';
import Link from 'next/link';

import Footer from '@/components/Footer';

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <div className="h-full flex items-center justify-center relative bg-black md:bg-[url('/images/hero.jpg')] bg-no-repeat bg-center bg-fixed bg-cover z-0">
        <div className="absolute w-full h-full bg-zinc-900 lg:bg-black lg:bg-opacity-50 -z-10">
          <nav className="px-12 py-5 flex flex-row justify-center lg:block">
            <Link href={"/"}>
              <Image
                src="/images/Logo.png"
                alt="Logo"
                className="h-12"
                width={100}
                height={100}
              />
            </Link>
          </nav>
        </div>
        {children}
      </div>
      <Footer />
    </>
  );
};

export default AuthLayout;
