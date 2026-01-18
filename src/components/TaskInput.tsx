import { useState, useEffect, useRef } from 'react';
import { Send, Loader2, Mic, MicOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TaskInputProps {
  onSubmit: (input: string) => void;
  isLoading: boolean;
}

// Check if Web Speech API is supported
const isSpeechSupported = () => {
  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
};

export const TaskInput = ({ onSubmit, isLoading }: TaskInputProps) => {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    setSpeechSupported(isSpeechSupported());
    
    if (isSpeechSupported()) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-IN'; // English (India) for better IST context

      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('');
        setInput(transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          toast({
            title: 'Microphone Access Denied',
            description: 'Please allow microphone access in your browser settings.',
            variant: 'destructive',
          });
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [toast]);

  const handleSubmit = () => {
    if (input.trim() && !isLoading) {
      onSubmit(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const toggleListening = () => {
    if (!speechSupported) {
      toast({
        title: 'Not Supported',
        description: 'Voice input is not supported in this browser.',
        variant: 'destructive',
      });
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
        toast({
          title: '🎤 Listening...',
          description: 'Speak your task now',
          duration: 2000,
        });
      } catch (error) {
        console.error('Failed to start speech recognition:', error);
      }
    }
  };

  return (
    <div className="fixed bottom-20 left-0 right-0 px-4 pb-2 bg-gradient-to-t from-background via-background to-transparent pt-8">
      <div className="flex items-center gap-2 max-w-lg mx-auto">
        {speechSupported && (
          <button
            onClick={toggleListening}
            disabled={isLoading}
            className={`p-3 rounded-full transition-all ${
              isListening 
                ? 'bg-destructive text-destructive-foreground animate-pulse' 
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
            aria-label={isListening ? 'Stop listening' : 'Start voice input'}
          >
            {isListening ? (
              <MicOff className="w-5 h-5" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </button>
        )}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isListening ? "Listening..." : "Type or speak a task..."}
          className="input-chat flex-1 min-h-[52px] text-base"
          disabled={isLoading}
        />
        <button
          onClick={handleSubmit}
          disabled={!input.trim() || isLoading}
          className="btn-send disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Send task"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
};