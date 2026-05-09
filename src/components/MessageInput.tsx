import { cn } from '@/lib/utils';
import { ArrowUp, Paperclip, LoaderCircle, File, Trash } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import { useChat } from '@/lib/hooks/useChat';
import FocusSelector from './FocusSelector';
import ModelPicker from './ModelPicker';
import DeepResearchToggle from './DeepResearchToggle';
import { toast } from 'sonner';

const MessageInput = () => {
  const { loading, sendMessage, files, setFiles, fileIds, setFileIds } =
    useChat();

  const [message, setMessage] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInputFocused =
        activeElement?.tagName === 'INPUT' ||
        activeElement?.tagName === 'TEXTAREA' ||
        activeElement?.hasAttribute('contenteditable');

      if (e.key === '/' && !isInputFocused) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles?.length) return;

    setUploadLoading(true);
    try {
      const data = new FormData();
      for (let i = 0; i < selectedFiles.length; i++) {
        data.append('files', selectedFiles[i]);
      }

      const embeddingModelProvider = localStorage.getItem(
        'embeddingModelProviderId',
      );
      const embeddingModel = localStorage.getItem('embeddingModelKey');

      if (!embeddingModelProvider || !embeddingModel) {
        throw new Error('Please select an embedding model before uploading.');
      }

      data.append('embedding_model_provider_id', embeddingModelProvider);
      data.append('embedding_model_key', embeddingModel);

      const res = await fetch('/api/uploads', {
        method: 'POST',
        body: data,
      });

      const resData = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error(resData.message || 'Failed to upload file(s).');
      if (!Array.isArray(resData.files))
        throw new Error('Invalid upload response.');

      setFiles([...files, ...resData.files]);
      setFileIds([...fileIds, ...resData.files.map((f: any) => f.fileId)]);
    } catch (err: any) {
      toast(err?.message || 'Failed to upload file(s).');
    } finally {
      setUploadLoading(false);
      e.target.value = '';
    }
  };

  return (
    <form
      onSubmit={(e) => {
        if (loading) return;
        e.preventDefault();
        if (!message.trim()) return;
        sendMessage(message);
        setMessage('');
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !e.shiftKey && !loading && message.trim()) {
          e.preventDefault();
          sendMessage(message);
          setMessage('');
        }
      }}
      className="relative bg-light-secondary dark:bg-dark-secondary rounded-2xl border border-light-200 dark:border-dark-200 shadow-sm shadow-light-200/10 dark:shadow-black/20 transition-all duration-200 focus-within:border-light-300 dark:focus-within:border-dark-300 overflow-hidden"
    >
      <div className="flex items-center px-4 pt-3 pb-2">
        <TextareaAutosize
          ref={inputRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="flex-1 bg-transparent placeholder:text-sm text-sm text-black dark:text-white placeholder:text-black/40 dark:placeholder:text-white/40 resize-none focus:outline-none max-h-24 lg:max-h-36 xl:max-h-48"
          placeholder="Ask a follow-up..."
        />
        <div className="flex items-center gap-1 ml-2">
          {uploadLoading ? (
            <div className="p-2 text-black/50 dark:text-white/50">
              <LoaderCircle size={16} className="animate-spin text-sky-500" />
            </div>
          ) : (
            <>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".pdf,.docx,.txt"
                multiple
                hidden
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-lg text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white hover:bg-light-200 dark:hover:bg-dark-200 transition-all duration-200"
                title="Attach file"
              >
                <Paperclip size={16} />
              </button>
            </>
          )}
          <button
            disabled={message.trim().length === 0 || loading}
            className={cn(
              'rounded-full p-2 transition-all duration-200',
              message.trim().length > 0 && !loading
                ? 'bg-sky-500 text-white hover:bg-sky-600 shadow-sm shadow-sky-500/20'
                : 'bg-light-200 dark:bg-dark-200 text-black/30 dark:text-white/30',
            )}
          >
            <ArrowUp size={17} />
          </button>
        </div>
      </div>

      {files.length > 0 && (
        <div className="flex items-center gap-2 px-4 pb-2 flex-wrap">
          {files.map((file, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 px-2 py-1 bg-light-100 dark:bg-dark-100 rounded-md text-xs text-black/70 dark:text-white/70 border border-light-200 dark:border-dark-200"
            >
              <File size={12} />
              <span className="max-w-[120px] truncate">{file.fileName}</span>
            </div>
          ))}
          <button
            type="button"
            onClick={() => {
              setFiles([]);
              setFileIds([]);
            }}
            className="p-1 rounded-md text-black/50 dark:text-white/50 hover:text-red-500 hover:bg-light-200 dark:hover:bg-dark-200 transition-all duration-200"
            title="Clear files"
          >
            <Trash size={12} />
          </button>
        </div>
      )}

      <div className="flex items-center justify-between px-3 py-2 border-t border-light-200/50 dark:border-dark-200/50">
        <div className="flex items-center gap-1 overflow-x-auto">
          <FocusSelector />
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <DeepResearchToggle />
          <ModelPicker compact />
        </div>
      </div>
    </form>
  );
};

export default MessageInput;
