import { useState } from 'react';
import { Modal, Pressable, Text, TextInput, View } from 'react-native';
import { FileText, Tag, X } from 'lucide-react-native';
import { sanitizeText } from '../../../utils/sanitize';

interface CaptureModalProps {
  onClose: () => void;
  onSave: (title: string, body: string, category: string) => void;
}

const CaptureModal = ({ onClose, onSave }: CaptureModalProps) => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('Idea');

  const categories = ['Idea', 'Meeting', 'Personal', 'Urgent'];

  return (
    <Modal transparent visible animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-white">
        <View className="p-6 flex-row justify-between items-center border-b border-gray-50">
          <Pressable onPress={onClose} className="p-2 rounded-full">
            <X size={20} color="#0f172a" />
          </Pressable>
          <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest">Quick Note</Text>
          <Pressable
            onPress={() => {
              const safeTitle = sanitizeText(title).trim() || 'Untitled Note';
              const safeBody = sanitizeText(body).trim();
              const safeCategory = sanitizeText(category).trim();
              onSave(safeTitle, safeBody, safeCategory);
              onClose();
            }}
            disabled={!body}
            className="px-4 py-2"
          >
            <Text className="text-xs font-bold text-black uppercase tracking-widest">Save</Text>
          </Pressable>
        </View>

        <View className="flex-1 px-6 pt-8">
          <TextInput
            placeholder="Title"
            className="w-full text-3xl font-bold mb-4"
            value={title}
            onChangeText={(value) => setTitle(sanitizeText(value))}
          />

          <View className="flex-row items-center mb-8">
            <Tag size={14} color="#d1d5db" />
            <View className="flex-row flex-wrap ml-2">
              {categories.map((cat) => (
                <Pressable
                  key={cat}
                  onPress={() => setCategory(cat)}
                  className={`px-3 py-1 rounded-full mr-2 mb-2 ${
                    category === cat ? 'bg-black' : 'bg-gray-50'
                  }`}
                >
                  <Text className={`text-[10px] font-bold uppercase tracking-wider ${
                    category === cat ? 'text-white' : 'text-gray-400'
                  }`}>
                    {cat}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <TextInput
            placeholder="Start writing..."
            className="w-full text-lg font-medium"
            multiline
            value={body}
            onChangeText={(value) => setBody(sanitizeText(value))}
          />
        </View>

        <View className="p-6 bg-gray-50 flex-row items-center">
          <View className="p-2 bg-white rounded-lg border border-gray-100">
            <FileText size={18} color="#9ca3af" />
          </View>
          <View className="ml-4">
            <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Saved to</Text>
            <Text className="text-xs font-bold text-black">My System / Notes</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default CaptureModal;
