// App.tsx
import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import AudioRecorderDemo from '@/components/AudioRecorderDemo'; // Adjust the path if needed

const App: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <AudioRecorderDemo />
    </SafeAreaView>
  );
};

export default App;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
