import logoLight from '../assets/logos/R_black in white.png';
import logoDark from '../assets/logos/R_white in blac.png';

interface BrandLogoProps {
  className?: string;
}

const BrandLogo = ({ className = '' }: BrandLogoProps) => (
  <div className={`relative ${className}`}>
    <img
      src={logoLight}
      alt="Rhythm logo"
      className="h-full w-full object-contain dark:hidden"
    />
    <img
      src={logoDark}
      alt="Rhythm logo"
      className="hidden h-full w-full object-contain dark:block"
    />
  </div>
);

export default BrandLogo;
