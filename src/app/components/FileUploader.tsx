import { Upload, FileSpreadsheet, X } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';

interface FileUploaderProps {
  onTimeEntriesUpload: (file: File) => void;
  onProjectDetailsUpload: (file: File) => void;
  timeEntriesFile: File | null;
  projectDetailsFile: File | null;
  onClearTimeEntries: () => void;
  onClearProjectDetails: () => void;
}

export function FileUploader({
  onTimeEntriesUpload,
  onProjectDetailsUpload,
  timeEntriesFile,
  projectDetailsFile,
  onClearTimeEntries,
  onClearProjectDetails
}: FileUploaderProps) {
  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    callback: (file: File) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      callback(file);
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileSpreadsheet className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold">Time Entries</h3>
        </div>
        
        {!timeEntriesFile ? (
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="w-8 h-8 mb-2 text-gray-400" />
              <p className="mb-1 text-sm text-gray-600">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500">.xlsx, .xls files</p>
            </div>
            <input
              type="file"
              className="hidden"
              accept=".xlsx,.xls"
              onChange={(e) => handleFileChange(e, onTimeEntriesUpload)}
            />
          </label>
        ) : (
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-900">{timeEntriesFile.name}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearTimeEntries}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileSpreadsheet className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold">Project Details</h3>
        </div>
        
        {!projectDetailsFile ? (
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="w-8 h-8 mb-2 text-gray-400" />
              <p className="mb-1 text-sm text-gray-600">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500">.xlsx, .xls files</p>
            </div>
            <input
              type="file"
              className="hidden"
              accept=".xlsx,.xls"
              onChange={(e) => handleFileChange(e, onProjectDetailsUpload)}
            />
          </label>
        ) : (
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-900">{projectDetailsFile.name}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearProjectDetails}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
