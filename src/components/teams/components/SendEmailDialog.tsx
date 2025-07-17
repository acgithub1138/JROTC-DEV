import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { TeamWithMembers } from '../types';
import { useSchoolUsers } from '@/hooks/useSchoolUsers';

interface SendEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team: TeamWithMembers | null;
}

export const SendEmailDialog = ({ open, onOpenChange, team }: SendEmailDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const { users } = useSchoolUsers(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!team || !userProfile?.school_id) return;

    setLoading(true);
    
    try {
      // Get team lead and member emails
      const recipients: string[] = [];
      
      // Add team lead email if exists
      if (team.team_lead?.email) {
        recipients.push(team.team_lead.email);
      }
      
      // Add team member emails
      const memberEmails = team.team_members
        .map(member => {
          const user = users.find(u => u.id === member.cadet_id);
          return user?.email;
        })
        .filter(email => email && !recipients.includes(email)); // Remove duplicates
      
      recipients.push(...memberEmails as string[]);

      if (recipients.length === 0) {
        toast({
          title: "No Recipients",
          description: "No email addresses found for team members",
          variant: "destructive"
        });
        return;
      }

      // Send one email to all recipients (comma-separated in TO field)
      const { error } = await supabase
        .from('email_queue')
        .insert({
          recipient_email: recipients.join(', '),
          subject: subject,
          body: body,
          school_id: userProfile.school_id,
          scheduled_at: new Date().toISOString(),
          status: 'pending'
        });
      
      if (error) throw error;

      toast({
        title: "Success",
        description: `Email queued for ${recipients.length} recipient(s) in Team: ${team.name}`,
        duration: 5000
      });

      // Reset form and close dialog
      setSubject('');
      setBody('');
      onOpenChange(false);

    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: "Error",
        description: "Failed to send email",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getRecipientPreview = () => {
    if (!team) return '';
    
    const recipients: string[] = [];
    
    if (team.team_lead?.email) {
      recipients.push(`${team.team_lead.first_name} ${team.team_lead.last_name} (Team Lead)`);
    }
    
    const memberNames = team.team_members
      .map(member => {
        const user = users.find(u => u.id === member.cadet_id);
        return user ? `${user.first_name} ${user.last_name}` : null;
      })
      .filter(name => name);
    
    recipients.push(...memberNames as string[]);
    
    return recipients.join(', ');
  };

  if (!team) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Send Email to Team: {team.name}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-gray-700">Recipients</Label>
            <div className="mt-1 p-3 bg-gray-50 rounded-md text-sm text-gray-600">
              {getRecipientPreview() || 'No recipients found'}
            </div>
          </div>

          <div>
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter email subject"
              required
            />
          </div>

          <div>
            <Label htmlFor="body">Message Body *</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Enter your message here..."
              rows={10}
              className="resize-none"
              required
            />
            <div className="text-xs text-gray-500 mt-1">
              You can use HTML tags for formatting (e.g., &lt;b&gt;bold&lt;/b&gt;, &lt;br&gt; for line breaks)
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !subject.trim() || !body.trim()}
            >
              {loading ? 'Sending...' : 'Send Email'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};