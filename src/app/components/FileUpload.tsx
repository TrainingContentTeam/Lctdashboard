import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Upload, FileText, CheckCircle, X } from 'lucide-react';
import type { UnifiedCourseData } from '../utils/csvProcessor';

interface FileUploadProps {
  onFilesUploaded: (data: UnifiedCourseData[]) => void;
}

export function FileUpload({ onFilesUploaded }: FileUploadProps) {
  const [legacyFile, setLegacyFile] = useState<File | null>(null);
  const [modernFile, setModernFile] = useState<File | null>(null);
  const [timeSpentFile, setTimeSpentFile] = useState<File | null>(null);

  const handleFileChange = (type: 'legacy' | 'modern' | 'timeSpent', file: File | null) => {
    switch (type) {
      case 'legacy':
        setLegacyFile(file);
        break;
      case 'modern':
        setModernFile(file);
        break;
      case 'timeSpent':
        setTimeSpentFile(file);
        break;
    }
  };

  const handleProcess = () => {
    if (!legacyFile || !modernFile || !timeSpentFile) return;
    
    // Call the parent handler that will process files
    onFilesUploaded({ legacy: legacyFile, modern: modernFile, timeSpent: timeSpentFile } as any);
  };

  const allFilesUploaded = legacyFile && modernFile && timeSpentFile;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FileUploadCard
          title="Legacy Course Data"
          description="2022-2025 completed courses"
          file={legacyFile}
          onFileChange={(file) => handleFileChange('legacy', file)}
          onClear={() => handleFileChange('legacy', null)}
        />
        <FileUploadCard
          title="Modern Course Data"
          description="2026+ courses"
          file={modernFile}
          onFileChange={(file) => handleFileChange('modern', file)}
          onClear={() => handleFileChange('modern', null)}
        />
        <FileUploadCard
          title="Time Spent Category Data"
          description="Granular time entries"
          file={timeSpentFile}
          onFileChange={(file) => handleFileChange('timeSpent', file)}
          onClear={() => handleFileChange('timeSpent', null)}
        />
      </div>

      {allFilesUploaded && (
        <div className="flex justify-center">
          <Button onClick={handleProcess} size="lg" className="gap-2">
            <Upload className="size-4" />
            Process Files
          </Button>
        </div>
      )}
    </div>
  );
}

interface FileUploadCardProps {
  title: string;
  description: string;
  file: File | null;
  onFileChange: (file: File | null) => void;
  onClear: () => void;
}

function FileUploadCard({ title, description, file, onFileChange, onClear }: FileUploadCardProps) {
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      onFileChange(selectedFile);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <p className="text-sm text-gray-600">{description}</p>
      </CardHeader>
      <CardContent>
        {!file ? (
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <Upload className="size-8 text-gray-400 mb-2" />
            <span className="text-sm text-gray-600">Click to upload CSV</span>
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileSelect}
            />
          </label>
        ) : (
          <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <CheckCircle className="size-5 text-green-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-green-900 truncate">{file.name}</p>
                <p className="text-xs text-green-700">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                onClear();
              }}
              className="ml-2 flex-shrink-0"
            >
              <X className="size-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
