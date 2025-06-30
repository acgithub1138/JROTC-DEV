
import React, { useMemo } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './quill-custom.css';
import { Label } from '@/components/ui/label';

interface RichTextBodyFieldProps {
  value: string;
  onChange: (value: string) => void;
  quillRef?: React.RefObject<ReactQuill>;
}

export const RichTextBodyField: React.FC<RichTextBodyFieldProps> = ({
  value,
  onChange,
  quillRef,
}) => {
  const modules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'align': [] }],
      ['link'],
      ['clean']
    ],
  }), []);

  const formats = [
    'header', 'bold', 'italic', 'underline',
    'list', 'bullet', 'align', 'link'
  ];

  return (
    <div className="space-y-2">
      <Label htmlFor="body">Email Body</Label>
      <div className="rounded-md">
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={value}
          onChange={onChange}
          modules={modules}
          formats={formats}
          placeholder="Enter email body (use {{variable}} for dynamic content)"
        />
      </div>
    </div>
  );
};
