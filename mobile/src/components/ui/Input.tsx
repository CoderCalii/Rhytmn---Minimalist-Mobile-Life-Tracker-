import { TextInput } from 'react-native';
import type { TextInputProps } from 'react-native';

type InputProps = TextInputProps;

export function Input(props: InputProps) {
  return <TextInput {...props} />;
}
