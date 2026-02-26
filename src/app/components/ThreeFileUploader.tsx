import { Upload, FileSpreadsheet, X, CheckCircle2 } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { useState } from 'react';

interface ThreeFileUploaderProps {
  onLegacyUpload: (file: File) => void;
  onModernUpload: (file: File) => void;
  onTimeSpentUpload: (file: File) => void;
  legacyFile: File | null;
  modernFile: File | null;
  timeSpentFile: File | null;
  onClearLegacy: () => void;
  onClearModern: () => void;
  onClearTimeSpent: () => void;
}

export function ThreeFileUploader({
  onLegacyUpload,
  onModernUpload,
  onTimeSpentUpload,
  legacyFile,
  modernFile,
  timeSpentFile,
  onClearLegacy,
  onClearModern,
  onClearTimeSpent
}: ThreeFileUploaderProps) {
  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    callback: (file: File) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      callback(file);
    }
  };

  const FileUploadBox = ({
    title,
    description,
    file,
    onUpload,
    onClear,
    color
  }: {
    title: string;
    description: string;
    file: File | null;
    onUpload: (file: File) => void;
    onClear: () => void;
    color: string;
  }) => {
    const [isDragging, setIsDragging] = useState(false);
    
    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
    };
    
    const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
    };
    
    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      
      const droppedFile = e.dataTransfer.files?.[0];
      if (droppedFile) {
        // Validate file type
        const validExtensions = ['.csv', '.xlsx', '.xls'];
        const fileExtension = '.' + droppedFile.name.split('.').pop()?.toLowerCase();
        
        if (validExtensions.includes(fileExtension)) {
          onUpload(droppedFile);
        } else {
          alert('Please upload a valid CSV or Excel file (.csv, .xlsx, .xls)');
        }
      }
    };
    
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileSpreadsheet className={`w-5 h-5 ${color}`} />
          <div>
            <h3 className="font-semibold">{title}</h3>
            <p className="text-xs text-gray-500">{description}</p>
          </div>
        </div>
        
        {!file ? (
          <label 
            className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
              isDragging 
                ? 'bg-blue-50 border-blue-400 border-solid' 
                : 'hover:bg-gray-50 border-gray-300'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className={`w-8 h-8 mb-2 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
              <p className="mb-1 text-sm text-gray-600">
                <span className="font-semibold">
                  {isDragging ? 'Drop file here' : 'Click to upload or drag & drop'}
                </span>
              </p>
              <p className="text-xs text-gray-500">CSV, XLSX, XLS files</p>
            </div>
            <input
              type="file"
              className="hidden"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => handleFileChange(e, onUpload)}
            />
          </label>
        ) : (
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-900">{file.name}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
      </Card>
    );
  };

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <FileUploadBox
        title="Legacy Course Data"
        description="2022-2025 completed courses"
        file={legacyFile}
        onUpload={onLegacyUpload}
        onClear={onClearLegacy}
        color="text-blue-600"
      />
      
      <FileUploadBox
        title="Modern Course Data"
        description="2026+ completed courses"
        file={modernFile}
        onUpload={onModernUpload}
        onClear={onClearModern}
        color="text-purple-600"
      />
      
      <FileUploadBox
        title="Time Spent Category Data"
        description="Granular time entries"
        file={timeSpentFile}
        onUpload={onTimeSpentUpload}
        onClear={onClearTimeSpent}
        color="text-green-600"
      />
    </div>
  );
}