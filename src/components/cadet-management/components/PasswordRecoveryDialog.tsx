import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  findCadetsWithMissingPasswords, 
  fixAllCadetsWithMissingPasswords,
  fixCadetPassword,
  type CadetPasswordIssue 
} from "../utils/passwordRecovery";

interface PasswordRecoveryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PasswordRecoveryDialog({ open, onOpenChange }: PasswordRecoveryDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [cadetsWithIssues, setCadetsWithIssues] = useState<CadetPasswordIssue[]>([]);
  const [fixResults, setFixResults] = useState<{ fixed: number; failed: number; errors: string[] } | null>(null);
  const { toast } = useToast();

  const handleScanForIssues = async () => {
    setIsLoading(true);
    setFixResults(null);
    
    try {
      const issues = await findCadetsWithMissingPasswords();
      setCadetsWithIssues(issues);
      
      if (issues.length === 0) {
        toast({
          title: "No Issues Found",
          description: "All cadets have proper password configurations.",
        });
      } else {
        toast({
          title: "Issues Found",
          description: `Found ${issues.length} cadets with missing passwords.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Scan Failed",
        description: error instanceof Error ? error.message : "Failed to scan for password issues",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFixSingleCadet = async (cadet: CadetPasswordIssue) => {
    try {
      await fixCadetPassword(cadet);
      
      // Remove from issues list
      setCadetsWithIssues(prev => prev.filter(c => c.id !== cadet.id));
      
      toast({
        title: "Password Fixed",
        description: `Fixed password for ${cadet.first_name} ${cadet.last_name}`,
      });
    } catch (error) {
      toast({
        title: "Fix Failed",
        description: error instanceof Error ? error.message : "Failed to fix password",
        variant: "destructive",
      });
    }
  };

  const handleFixAllCadets = async () => {
    setIsFixing(true);
    
    try {
      const results = await fixAllCadetsWithMissingPasswords();
      setFixResults(results);
      
      if (results.failed === 0) {
        toast({
          title: "All Passwords Fixed",
          description: `Successfully fixed ${results.fixed} cadet passwords.`,
        });
        setCadetsWithIssues([]);
      } else {
        toast({
          title: "Partial Success",
          description: `Fixed ${results.fixed} passwords, ${results.failed} failed.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Bulk Fix Failed",
        description: error instanceof Error ? error.message : "Failed to fix passwords",
        variant: "destructive",
      });
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Password Recovery Tool
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button 
              onClick={handleScanForIssues} 
              disabled={isLoading || isFixing}
              variant="outline"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Scan for Issues
            </Button>
            
            {cadetsWithIssues.length > 0 && (
              <Button 
                onClick={handleFixAllCadets} 
                disabled={isLoading || isFixing}
                className="bg-red-600 hover:bg-red-700"
              >
                {isFixing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Fix All ({cadetsWithIssues.length})
              </Button>
            )}
          </div>

          {/* Results Summary */}
          {fixResults && (
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-sm">Fix Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Fixed: {fixResults.fixed}</span>
                </div>
                {fixResults.failed > 0 && (
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm">Failed: {fixResults.failed}</span>
                  </div>
                )}
                {fixResults.errors.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Errors:</p>
                    <ScrollArea className="h-20">
                      {fixResults.errors.map((error, index) => (
                        <p key={index} className="text-xs text-red-600">{error}</p>
                      ))}
                    </ScrollArea>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Issues List */}
          {cadetsWithIssues.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">
                  Cadets with Missing Passwords ({cadetsWithIssues.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-60">
                  <div className="space-y-2">
                    {cadetsWithIssues.map((cadet) => (
                      <div key={cadet.id} className="flex items-center justify-between p-2 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            {cadet.last_name}, {cadet.first_name}
                          </p>
                          <p className="text-xs text-muted-foreground">{cadet.email}</p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge variant={cadet.has_metadata_password ? "secondary" : "destructive"}>
                            {cadet.has_metadata_password ? "Has Backup" : "No Backup"}
                          </Badge>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleFixSingleCadet(cadet)}
                            disabled={isLoading || isFixing}
                          >
                            Fix
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* No Issues State */}
          {!isLoading && cadetsWithIssues.length === 0 && !fixResults && (
            <div className="text-center py-8 text-muted-foreground">
              <p>Click "Scan for Issues" to check for cadets with missing passwords.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}