import { useState, useRef, useCallback } from 'react';
import { useFormContext } from 'react-hook-form';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UploadCloud, X, GripVertical } from 'lucide-react';
import { showError } from '@/utils/toast';

const MAX_FILES = 10;
const MAX_TOTAL_SIZE_MB = 200;
const MAX_TOTAL_SIZE_BYTES = MAX_TOTAL_SIZE_MB * 1024 * 1024;

interface ImageUploaderProps {
  name: string;
}

export function ImageUploader({ name }: ImageUploaderProps) {
  const { setValue } = useFormContext();
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const updateFormValue = (updatedFiles: File[]) => {
    const dataTransfer = new DataTransfer();
    updatedFiles.forEach(file => dataTransfer.items.add(file));
    setValue(name, dataTransfer.files, { shouldValidate: true });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(event.target.files || []);
    if (newFiles.length === 0) return;

    const allFiles = [...files, ...newFiles];

    if (allFiles.length > MAX_FILES) {
      showError(`Bạn chỉ có thể tải lên tối đa ${MAX_FILES} tệp.`);
      return;
    }

    const totalSize = allFiles.reduce((acc, file) => acc + file.size, 0);
    if (totalSize > MAX_TOTAL_SIZE_BYTES) {
      showError(`Tổng dung lượng không được vượt quá ${MAX_TOTAL_SIZE_MB}MB.`);
      return;
    }

    setFiles(allFiles);
    const newPreviews = allFiles.map(file => URL.createObjectURL(file));
    setPreviews(newPreviews);
    updateFormValue(allFiles);
  };

  const handleRemove = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    const updatedPreviews = previews.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    setPreviews(updatedPreviews);
    updateFormValue(updatedFiles);
  };

  const handleDragSort = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    
    const newFiles = [...files];
    const draggedItemContent = newFiles.splice(dragItem.current, 1)[0];
    newFiles.splice(dragOverItem.current, 0, draggedItemContent);
    
    setFiles(newFiles);
    const newPreviews = newFiles.map(file => URL.createObjectURL(file));
    setPreviews(newPreviews);
    updateFormValue(newFiles);

    dragItem.current = null;
    dragOverItem.current = null;
  };

  return (
    <div className="space-y-4">
      <Card className="border-2 border-dashed">
        <CardContent className="p-6 text-center">
          <label htmlFor="file-upload" className="cursor-pointer">
            <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-muted-foreground">
              Kéo và thả hoặc <span className="font-semibold text-primary">nhấp để tải lên</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Tối đa {MAX_FILES} tệp, tổng dung lượng không quá {MAX_TOTAL_SIZE_MB}MB
            </p>
            <Input id="file-upload" type="file" multiple accept="image/*,video/*" className="sr-only" onChange={handleFileChange} />
          </label>
        </CardContent>
      </Card>

      {previews.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {previews.map((preview, index) => (
            <div
              key={index}
              className="relative group aspect-square"
              draggable
              onDragStart={() => (dragItem.current = index)}
              onDragEnter={() => (dragOverItem.current = index)}
              onDragEnd={handleDragSort}
              onDragOver={(e) => e.preventDefault()}
            >
              <div className="absolute top-1 left-1 z-10 bg-black/50 p-1 rounded-full text-white cursor-grab active:cursor-grabbing">
                <GripVertical className="h-4 w-4" />
              </div>
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleRemove(index)}
              >
                <X className="h-4 w-4" />
              </Button>
              {files[index].type.startsWith('video') ? (
                <video src={preview} className="h-full w-full object-cover rounded-md" muted loop />
              ) : (
                <img src={preview} alt={`Preview ${index}`} className="h-full w-full object-cover rounded-md" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}