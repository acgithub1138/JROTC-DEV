import React from 'react';
import ReactQuill from 'react-quill';
import { Label } from '@/components/ui/label';
import 'react-quill/dist/quill.snow.css';

interface RichTextBodyFieldProps {
  value: string;
  onChange: (value: string) => void;
  quillRef: React.RefObject<ReactQuill>;
}

const modules = {
  toolbar: [
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'indent': '-1'}, { 'indent': '+1' }],
    ['link'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'align': [] }],
    ['clean']
  ],
};

const formats = [
  'header', 'bold', 'italic', 'underline', 'strike',
  'list', 'bullet', 'indent', 'link', 'color', 'background', 'align'
];

export const RichTextBodyField: React.FC<RichTextBodyFieldProps> = ({
  value,
  onChange,
  quillRef,
}) => {
  return (
    <div className="space-y-2">
      <Label>Email Body</Label>
      <div className="border rounded-md">
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={value}
          onChange={onChange}
          modules={modules}
          formats={formats}
          style={{ minHeight: '200px' }}
        />
      </div>
    </div>
  );
};