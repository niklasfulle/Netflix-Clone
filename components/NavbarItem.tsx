import Link from 'next/link';
import React from 'react';

interface NavbarItemProps {
  label: string;
  href: string;
}

const NavbarItem: React.FC<NavbarItemProps> = ({ label, href }) => {
  return (
    <Link href={href}>
      <div className="text-white transition cursor-pointer hover:text-gray-300">
        {label}
      </div>
    </Link>
  );
};

export default NavbarItem;
