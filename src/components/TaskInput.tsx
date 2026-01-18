import { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';

interface TaskInputProps {
  onSubmit: (input: string) => void;
  isLoading: boolean;
}

export const TaskInput = ({ onSubmit, isLoading }: TaskInputProps) => {
  const [input, setInput] = useState('');

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

  return (
    <div className="fixed bottom-20 left-0 right-0 px-4 pb-2 bg-gradient-to-t from-background via-background to-transparent pt-8">
      <div className="flex items-center gap-3 max-w-lg mx-auto">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a task... e.g., Meeting tomorrow at 3pm"
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
