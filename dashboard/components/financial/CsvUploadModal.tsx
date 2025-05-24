import React, { useCallback, useState } from "react";
import { Upload, X, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDropzone } from "react-dropzone";

type FileWithPreview = {
  file: File;
  preview: string;
  type: "users" | "funds" | "transactions" | "categories";
};

type CsvUploadModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (files: Record<string, File>) => void;
  isLoading: boolean;
};

export function CsvUploadModal({
  isOpen,
  onClose,
  onUpload,
  isLoading,
}: CsvUploadModalProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map((file) => {
      // Simple type detection based on filename
      let type: FileWithPreview["type"] = "transactions";
      const lowerName = file.name.toLowerCase();

      if (lowerName.includes("user")) type = "users";
      else if (lowerName.includes("fund")) type = "funds";
      else if (lowerName.includes("categor")) type = "categories";

      return {
        file,
        preview: URL.createObjectURL(file),
        type,
      };
    });

    setFiles((prev) => {
      // Filter out any existing files of the same type
      const filteredPrev = prev.filter(
        (f) => !newFiles.some((nf) => nf.type === f.type)
      );
      return [...filteredPrev, ...newFiles];
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "text/plain": [".csv"],
    },
    multiple: true,
  });

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const handleUpload = () => {
    const filesMap = files.reduce(
      (acc, file) => ({
        ...acc,
        [file.type]: file.file,
      }),
      {} as Record<string, File>
    );

    onUpload(filesMap);
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case "users":
        return "Users";
      case "funds":
        return "Funds";
      case "transactions":
        return "Transactions";
      case "categories":
        return "Categories";
      default:
        return type;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Upload CSV Files</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Please upload the following CSV files: Users, Funds, Transactions,
            and Categories
          </p>
        </div>

        <div className="p-6 overflow-y-auto flex-grow">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-blue-400"
            }`}
          >
            <input {...getInputProps()} />
            <div className="space-y-2">
              <Upload className="h-10 w-10 mx-auto text-gray-400" />
              <p className="text-sm text-gray-600">
                {isDragActive
                  ? "Drop the files here..."
                  : "Drag & drop CSV files here, or click to select files"}
              </p>
              <p className="text-xs text-gray-500">Supported formats: .csv</p>
            </div>
          </div>

          {files.length > 0 && (
            <div className="mt-6 space-y-3">
              <h3 className="text-sm font-medium text-gray-700">
                Files to upload:
              </h3>
              <div className="space-y-2">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-md border"
                  >
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {file.file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {getTypeName(file.type)} •{" "}
                          {(file.file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(index);
                      }}
                      className="text-gray-400 hover:text-red-500"
                      disabled={isLoading}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-gray-50 border-t flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={files.length === 0 || isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              "Upload Files"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
