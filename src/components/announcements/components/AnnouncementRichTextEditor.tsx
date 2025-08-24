import React from 'react';
import ReactQuill from 'react-quill';
import { Label } from '@/components/ui/label';
import 'react-quill/dist/quill.snow.css';

interface AnnouncementRichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
}

const modules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
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

export const AnnouncementRichTextEditor: React.FC<AnnouncementRichTextEditorProps> = ({
  value,
  onChange,
  label = "Content",
  placeholder = "Write your announcement content here..."
}) => {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="border rounded-md">
        <ReactQuill
          theme="snow"
          value={value}
          onChange={onChange}
          modules={modules}
          formats={formats}
          placeholder={placeholder}
          style={{ minHeight: '200px' }}
        />
      </div>
    </div>
  );
};