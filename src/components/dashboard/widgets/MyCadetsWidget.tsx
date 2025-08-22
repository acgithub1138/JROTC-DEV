import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Clock, AlertTriangle, CheckSquare } from 'lucide-react';
import { useParentCadets } from '@/hooks/useParentCadets';
import { useAuth } from '@/contexts/AuthContext';

export const MyCadetsWidget = () => {
  const { userProfile } = useAuth();
  const { cadets, isLoading, error } = useParentCadets();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="w-5 h-5 mr-2 text-primary" />
            My Cadets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 rounded-lg">
                <div className="w-2 h-2 bg-muted rounded-full mt-2 flex-shrink-0 animate-pulse"></div>
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse"></div>
                  <div className="h-3 bg-muted rounded animate-pulse w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="w-5 h-5 mr-2 text-primary" />
            My Cadets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50 text-destructive" />
            <p className="text-sm">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Users className="w-5 h-5 mr-2 text-primary" />
            My Cadets
          </div>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <span>{cadets.length} cadets</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {cadets.length > 0 ? (
            cadets.map((cadet) => (
              <div key={cadet.id} className="flex items-start space-x-3 p-3 hover:bg-muted/50 transition-colors rounded-lg">
                <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0 bg-blue-500"></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-foreground text-sm truncate">
                      {cadet.name}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                      Cadet ID: {cadet.cadet_id}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No cadets found</p>
              <p className="text-xs mt-1">Contact records may not be properly linked</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};