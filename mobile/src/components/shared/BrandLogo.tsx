import { Image, View, useColorScheme } from 'react-native';

interface BrandLogoProps {
  className?: string;
}

const logoLight = require('../../assets/logos/logo-light.png');
const logoDark = require('../../assets/logos/logo-dark.png');

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
