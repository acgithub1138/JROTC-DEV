
import React, { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { format } from 'date-fns';
import { EmailViewDialog } from '@/components/email-management/dialogs/EmailViewDialog';
import { useEmailQueue } from '@/hooks/email/useEmailQueue';

interface TaskCommentsSectionProps {
  comments: any[];
  isAddingComment: boolean;
  onAddComment: (comment: string) => void;
  newComment?: string;
  onNewCommentChange?: (comment: string) => void;
}

export const TaskCommentsSection: React.FC<TaskCommentsSectionProps> = ({
  comments,
  isAddingComment,
  onAddComment,
  newComment: externalNewComment,
  onNewCommentChange
}) => {
  const [internalNewComment, setInternalNewComment] = useState('');
  
  // Use external comment state if provided, otherwise use internal state
  const newComment = externalNewComment !== undefined ? externalNewComment : internalNewComment;
  const setNewComment = onNewCommentChange || setInternalNewComment;
  const [commentsSortOrder, setCommentsSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const { queueItems } = useEmailQueue();

  const handleAddComment = () => {
    console.log('🔍 TaskCommentsSection handleAddComment called with newComment:', newComment);
    console.log('🔍 newComment trimmed:', newComment.trim());
    
    if (newComment.trim()) {
      onAddComment(newComment.trim());
      setNewComment('');
    }
  };

  const toggleSortOrder = () => {
    setCommentsSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const handleEmailPreviewClick = (emailId: string) => {
    setSelectedEmailId(emailId);
    setShowEmailPreview(true);
  };

  const renderCommentText = (text: string) => {
    // Check if the comment contains an email preview link
    const emailLinkMatch = text.match(/\[Preview Email\]\(([^)]+)\)/);
    
    if (emailLinkMatch) {
      const emailId = emailLinkMatch[1];
      const textBeforeLink = text.substring(0, emailLinkMatch.index);
      
      return (
        <span>
          {textBeforeLink}
          <button
            onClick={() => handleEmailPreviewClick(emailId)}
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Preview Email
          </button>
        </span>
      );
    }
    
    return text;
  };

  const selectedEmail = selectedEmailId ? queueItems.find(item => item.id === selectedEmailId) : null;

  const sortedComments = [...comments].sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return commentsSortOrder === 'asc' ? dateA - dateB : dateB - dateA;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Activity & Comments</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={toggleSortOrder}
          className="flex items-center gap-2"
        >
          {commentsSortOrder === 'asc' ? (
            <>
              <ArrowUp className="w-4 h-4" />
              Old to New
            </>
          ) : (
            <>
              <ArrowDown className="w-4 h-4" />
              New to Old
            </>
          )}
        </Button>
      </div>
      
      {/* Add Comment */}
      <div className="mb-6">
        <Textarea
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e) => {
            console.log('🔍 Comment textarea onChange:', e.target.value);
            setNewComment(e.target.value);
          }}
          rows={3}
        />
        <div className="flex justify-end mt-2">
          <Button
            onClick={handleAddComment}
            disabled={!newComment.trim() || isAddingComment}
            size="sm"
          >
            Add Comment
          </Button>
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-4 max-h-64 overflow-y-auto">
        {sortedComments.map((comment) => (
          <div key={comment.id} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">
                  {comment.user_profile.first_name} {comment.user_profile.last_name}
                </span>
                {comment.is_system_comment && (
                  <Badge variant="secondary" className="text-xs">System</Badge>
                )}
              </div>
              <span className="text-xs text-gray-500">
                {format(new Date(comment.created_at), 'MMM d, yyyy HH:mm')}
              </span>
            </div>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {renderCommentText(comment.comment_text)}
            </p>
          </div>
        ))}
        
        {comments.length === 0 && (
          <p className="text-center text-gray-500 py-8">
            No comments yet. Be the first to add one!
          </p>
        )}
      </div>

      {/* Email Preview Dialog */}
      {selectedEmail && (
        <EmailViewDialog
          open={showEmailPreview}
          onOpenChange={setShowEmailPreview}
          email={selectedEmail}
        />
      )}
    </div>
  );
};
