import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Database, Table, Plus, Trash2 } from 'lucide-react';

interface DatabaseConnection {
  id: string;
  name: string;
  type: 'supabase' | 'postgresql' | 'mysql' | 'external_api';
  connectionString?: string;
  apiEndpoint?: string;
  credentials?: Record<string, string>;
}

interface DatabaseIntegrationPanelProps {
  workflowId: string;
  onConnectionsChange: (connections: DatabaseConnection[]) => void;
}

export const DatabaseIntegrationPanel: React.FC<DatabaseIntegrationPanelProps> = ({
  workflowId,
  onConnectionsChange
}) => {
  const [connections, setConnections] = useState<DatabaseConnection[]>([
    {
      id: 'default-supabase',
      name: 'Current Supabase Project',
      type: 'supabase',
      connectionString: 'Built-in connection'
    }
  ]);

  const [newConnection, setNewConnection] = useState<Partial<DatabaseConnection>>({
    name: '',
    type: 'postgresql'
  });

  const [showAddForm, setShowAddForm] = useState(false);

  const addConnection = () => {
    if (!newConnection.name) return;

    const connection: DatabaseConnection = {
      id: Date.now().toString(),
      name: newConnection.name,
      type: newConnection.type as DatabaseConnection['type'],
      connectionString: newConnection.connectionString,
      apiEndpoint: newConnection.apiEndpoint,
      credentials: newConnection.credentials
    };

    const updatedConnections = [...connections, connection];
    setConnections(updatedConnections);
    onConnectionsChange(updatedConnections);
    
    setNewConnection({ name: '', type: 'postgresql' });
    setShowAddForm(false);
  };

  const removeConnection = (id: string) => {
    if (id === 'default-supabase') return; // Don't allow removing default connection
    
    const updatedConnections = connections.filter(c => c.id !== id);
    setConnections(updatedConnections);
    onConnectionsChange(updatedConnections);
  };

  const getConnectionIcon = (type: string) => {
    switch (type) {
      case 'supabase': return <Database className="w-4 h-4 text-green-500" />;
      case 'postgresql': return <Database className="w-4 h-4 text-blue-500" />;
      case 'mysql': return <Database className="w-4 h-4 text-orange-500" />;
      case 'external_api': return <Table className="w-4 h-4 text-purple-500" />;
      default: return <Database className="w-4 h-4" />;
    }
  };

  const availableTables = [
    'profiles', 'cadets', 'tasks', 'teams', 'competitions', 
    'inventory_items', 'contacts', 'workflows', 'workflow_executions'
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Database className="w-5 h-5 mr-2" />
            Database Integrations
          </div>
          <Button 
            onClick={() => setShowAddForm(true)} 
            size="sm"
            disabled={showAddForm}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Connection
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing Connections */}
        <div className="space-y-2">
          {connections.map((connection) => (
            <div key={connection.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                {getConnectionIcon(connection.type)}
                <div>
                  <div className="font-medium">{connection.name}</div>
                  <div className="text-sm text-gray-500">
                    <Badge variant="outline">{connection.type}</Badge>
                  </div>
                </div>
              </div>
              {connection.id !== 'default-supabase' && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => removeConnection(connection.id)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Add New Connection Form */}
        {showAddForm && (
          <div className="border rounded-lg p-4 space-y-4 bg-gray-50">
            <h4 className="font-medium">Add New Database Connection</h4>
            
            <div>
              <Label htmlFor="connection-name">Connection Name</Label>
              <Input
                id="connection-name"
                value={newConnection.name || ''}
                onChange={(e) => setNewConnection(prev => ({ ...prev, name: e.target.value }))}
                placeholder="My Database"
              />
            </div>

            <div>
              <Label htmlFor="connection-type">Connection Type</Label>
              <Select 
                value={newConnection.type} 
                onValueChange={(value) => setNewConnection(prev => ({ ...prev, type: value as DatabaseConnection['type'] }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="postgresql">PostgreSQL</SelectItem>
                  <SelectItem value="mysql">MySQL</SelectItem>
                  <SelectItem value="external_api">External API</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newConnection.type === 'external_api' ? (
              <div>
                <Label htmlFor="api-endpoint">API Endpoint</Label>
                <Input
                  id="api-endpoint"
                  value={newConnection.apiEndpoint || ''}
                  onChange={(e) => setNewConnection(prev => ({ ...prev, apiEndpoint: e.target.value }))}
                  placeholder="https://api.example.com"
                />
              </div>
            ) : (
              <div>
                <Label htmlFor="connection-string">Connection String</Label>
                <Input
                  id="connection-string"
                  type="password"
                  value={newConnection.connectionString || ''}
                  onChange={(e) => setNewConnection(prev => ({ ...prev, connectionString: e.target.value }))}
                  placeholder="postgresql://user:password@host:port/database"
                />
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
              <Button onClick={addConnection}>
                Add Connection
              </Button>
            </div>
          </div>
        )}

        {/* Available Tables */}
        <div>
          <h4 className="font-medium mb-2">Available Tables (Current Project)</h4>
          <div className="flex flex-wrap gap-2">
            {availableTables.map((table) => (
              <Badge key={table} variant="secondary" className="text-xs">
                <Table className="w-3 h-3 mr-1" />
                {table}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
