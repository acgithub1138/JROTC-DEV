import React from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Users, Mail } from 'lucide-react';

interface ImportResults {
  success: number;
  failed: number;
  errors: string[];
  parentAccountsCreated: number;
}

interface ContactImportResultsProps {
  results: ImportResults;
  onClose: () => void;
}

export const ContactImportResults: React.FC<ContactImportResultsProps> = ({ results, onClose }) => {
  return (
    <div className="py-8 px-4">
      <div className="text-center mb-6">
        {results.failed === 0 ? (
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        ) : (
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        )}
        <h3 className="text-2xl font-bold mb-2">Import Complete</h3>
        <p className="text-muted-foreground">
          {results.success} contacts imported successfully
          {results.failed > 0 && `, ${results.failed} failed`}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-green-700">{results.success}</p>
          <p className="text-sm text-green-600">Successful</p>
        </div>

        {results.parentAccountsCreated > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-700">{results.parentAccountsCreated}</p>
            <p className="text-sm text-blue-600">Parent Accounts</p>
          </div>
        )}

        {results.failed > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-red-700">{results.failed}</p>
            <p className="text-sm text-red-600">Failed</p>
          </div>
        )}
      </div>

      {results.parentAccountsCreated > 0 && (
        <Alert className="mb-6 bg-blue-50 border-blue-200">
          <Mail className="w-4 h-4" />
          <AlertDescription>
            Welcome emails with login credentials have been sent to {results.parentAccountsCreated} parent(s).
            They will receive their temporary password via email.
          </AlertDescription>
        </Alert>
      )}

      {results.errors.length > 0 && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            <p className="font-semibold mb-2">Errors:</p>
            <ul className="list-disc list-inside text-sm">
              {results.errors.slice(0, 10).map((error, index) => (
                <li key={index}>{error}</li>
              ))}
              {results.errors.length > 10 && (
                <li>... and {results.errors.length - 10} more errors</li>
              )}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-center">
        <Button onClick={onClose} size="lg">
          Back to Contacts
        </Button>
      </div>
    </div>
  );
};
