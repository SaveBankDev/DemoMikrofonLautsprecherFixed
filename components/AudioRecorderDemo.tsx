// AudioRecorderDemo.tsx
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Button } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const AudioRecorderDemo: React.FC = () => {
    // State variables with types
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [recordedURI, setRecordedURI] = useState<string | null>(null);
    const [isRecording, setIsRecording] = useState<boolean>(false);

    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    /*  May be needed in the future for cleanup
    useEffect(() => {
        return () => {
            if (recording) {
                recording.stopAndUnloadAsync();
            }

            if (sound) {
                sound.unloadAsync();
            }

            Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
                playsInSilentModeIOS: false,
            });
        };
    }, [recording, sound]);
    */

    // Start recording audio
    const startRecording = async () => {
        try {
            // Request microphone permissions
            const { status } = await Audio.requestPermissionsAsync();
            if (status !== 'granted') {
                console.error('Permission to access microphone not granted');
                return;
            }

            // Configure audio mode to allow recording even in silent mode
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            // Create a new recording instance and prepare to record with high quality settings
            const newRecording = new Audio.Recording();
            await newRecording.prepareToRecordAsync(
                {
                    android: {
                        extension: '.wav',
                        outputFormat: 0,
                        audioEncoder: 0,
                        sampleRate: 48000, // High-quality sample rate
                        numberOfChannels: 2, // Stereo
                        bitRate: 128000, // Higher bit rate for uncompressed audio
                    },
                    ios: {
                        extension: '.wav',
                        audioQuality: 127, // Corresponds to MAX
                        outputFormat: "lpcm",
                        bitDepthHint: 32,
                        sampleRate: 48000,
                        numberOfChannels: 2,
                        bitRate: 128000,
                        bitRateStrategy: 0, // Corresponds to CONSTANT
                        linearPCMBitDepth: 32,
                        linearPCMIsBigEndian: false,
                        linearPCMIsFloat: false,
                    },
                    web: {
                        mimeType: 'audio/wav',
                        bitsPerSecond: 128000,
                    },
                }
            );
            await newRecording.startAsync(); // Begin recording

            // Update state
            setRecording(newRecording);
            setIsRecording(true);
            console.log('Recording started');
        } catch (error) {
            console.error('Failed to start recording', error);
            setError("Failed to start recording");
        }
    };

    // Stop recording audio
    const stopRecording = async () => {
        try {
            if (!recording) return;
            // Stop recording and unload the audio file
            await recording.stopAndUnloadAsync();
            // Retrieve the URI of the recorded audio
            const uri = recording.getURI();
            console.log('Recording stopped and stored at:', uri);
            setRecordedURI(uri);
            setRecording(null);
            setIsRecording(false);
            // Reset audio mode
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
                playsInSilentModeIOS: false,
            });
        } catch (error) {
            console.error('Failed to stop recording', error);
            setError("Failed to stop recording");
        }
    };

    // Play the recorded audio
    const playRecording = async () => {
        try {
            if (!recordedURI) {
                setError("No recording to play");
                return;
            }

            // Unload previous sound if it exists
            if (sound) {
                await sound.unloadAsync();
            }
            // Create a sound object from the recorded file's URI
            const { sound: newSound } = await Audio.Sound.createAsync({ uri: recordedURI });
            setSound(newSound);

            // Set up playback finished callback
            newSound.setOnPlaybackStatusUpdate((status) => {
                if (status.isLoaded && status.didJustFinish) {
                    setIsPlaying(false);
                }
            });

            // Boost the volume to maximum (1.0)
            await newSound.setVolumeAsync(1.0);

            setIsPlaying(true);

            await newSound.playAsync();
            console.log('Playback started');
        } catch (error) {
            console.error('Failed to play recorded audio', error);
            setError("Failed to play recording");
        }
    };

    const stopPlayback = async () => {
        if (sound) {
            await sound.stopAsync();
            setIsPlaying(false);
        }
    };

    const shareRecording = async () => {
        if (!recordedURI) {
            setError("No recording to share");
            return;
        }

        try {
            // First check if sharing is available
            const isSharingAvailable = await Sharing.isAvailableAsync();
            if (!isSharingAvailable) {
                setError("Sharing is not available on this device");
                return;
            }

            // Log file info before sharing
            const fileInfo = await FileSystem.getInfoAsync(recordedURI);
            console.log("Original recording file info:", fileInfo);

            // Share directly from the original location
            await Sharing.shareAsync(recordedURI, {
                mimeType: 'audio/m4a',
                dialogTitle: 'Share your audio recording',
                UTI: 'public.audio' // This is for iOS
            });
        } catch (error) {
            console.error("Error sharing recording:", error);
            setError("Failed to share recording");
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Expo Audio Recorder Demo</Text>

            <Button
                title={isRecording ? 'Stop Recording' : 'Start Recording'}
                onPress={isRecording ? stopRecording : startRecording}
            />

            <View style={{ marginVertical: 10 }} />

            {recordedURI && (
                <>
                    <Button
                        title={isPlaying ? "Stop Playing" : "Play Recording"}
                        onPress={isPlaying ? stopPlayback : playRecording}
                        disabled={!recordedURI}
                    />

                    <View style={{ marginVertical: 10 }} />

                    <Button
                        title="Share Recording"
                        onPress={shareRecording}
                    />

                    <Text style={styles.info}>Recording available</Text>
                </>
            )}

            {error && (
                <Text style={styles.errorText}>{error}</Text>
            )}
        </View>
    );
};

export default AudioRecorderDemo;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 20,
        marginBottom: 20,
    },
    info: {
        marginTop: 20,
        textAlign: 'center',
    },
    errorText: {
        color: 'red',
        marginTop: 10,
    },
});
