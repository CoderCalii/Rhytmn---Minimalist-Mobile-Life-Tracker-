import { Image, View, useColorScheme } from 'react-native';
import logoLight from '../../assets/logos/logo-light.png';
import logoDark from '../../assets/logos/logo-dark.png';

interface BrandLogoProps {
  className?: string;
}

const BrandLogo = ({ className = '' }: BrandLogoProps) => {
  const scheme = useColorScheme();
  const source = scheme === 'dark' ? logoDark : logoLight;

  return (
    <View className={className}>
      <Image source={source} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
    </View>
  );
};

export default BrandLogo;
