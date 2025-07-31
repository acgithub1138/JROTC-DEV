import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Plus, Edit2, Save, X, Lightbulb, Globe, Sparkles } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';

export interface CriteriaMapping {
  id: string;
  displayName: string;
  originalCriteria: string[];
}

interface SimilarMapping {
  id: string;
  display_name: string;
  original_criteria: string[];
  usage_count: number;
  similarity_score: number;
}

interface AdvancedCriteriaMappingProps {
  availableCriteria: string[];
  mappings: CriteriaMapping[];
  onMappingsChange: (mappings: CriteriaMapping[]) => void;
  selectedEvent: string | null;
  findSimilarMappings?: (criteriaText: string) => Promise<SimilarMapping[]>;
  isLoading?: boolean;
}

export const AdvancedCriteriaMapping: React.FC<AdvancedCriteriaMappingProps> = ({
  availableCriteria,
  mappings,
  onMappingsChange,
  selectedEvent,
  findSimilarMappings,
  isLoading
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingMapping, setEditingMapping] = useState<string | null>(null);
  const [newMappingName, setNewMappingName] = useState('');
  const [selectedCriteria, setSelectedCriteria] = useState<string[]>([]);
  const [editingName, setEditingName] = useState('');
  const [suggestions, setSuggestions] = useState<SimilarMapping[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [allSuggestions, setAllSuggestions] = useState<Array<{criteria: string, suggestions: SimilarMapping[]}>>([]);
  const [showAllSuggestions, setShowAllSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Get criteria that are not yet mapped
  const unmappedCriteria = availableCriteria.filter(criteria => 
    !mappings.some(mapping => mapping.originalCriteria.includes(criteria))
  );

  const handleCreateMapping = () => {
    if (newMappingName.trim() && selectedCriteria.length > 0) {
      const newMapping: CriteriaMapping = {
        id: Date.now().toString(),
        displayName: newMappingName.trim(),
        originalCriteria: [...selectedCriteria]
      };
      
      onMappingsChange([...mappings, newMapping]);
      setNewMappingName('');
      setSelectedCriteria([]);
    }
  };

  const handleDeleteMapping = (mappingId: string) => {
    onMappingsChange(mappings.filter(m => m.id !== mappingId));
  };

  const handleEditMapping = (mappingId: string) => {
    const mapping = mappings.find(m => m.id === mappingId);
    if (mapping) {
      setEditingMapping(mappingId);
      setEditingName(mapping.displayName);
    }
  };

  const handleSaveEdit = (mappingId: string) => {
    if (editingName.trim()) {
      onMappingsChange(mappings.map(m => 
        m.id === mappingId 
          ? { ...m, displayName: editingName.trim() }
          : m
      ));
      setEditingMapping(null);
      setEditingName('');
    }
  };

  const handleCancelEdit = () => {
    setEditingMapping(null);
    setEditingName('');
  };

  const handleCriteriaToggle = async (criteria: string) => {
    setSelectedCriteria(prev => {
      const newSelected = prev.includes(criteria) 
        ? prev.filter(c => c !== criteria)
        : [...prev, criteria];
      
      // If this is the first criteria being selected and display name is empty, set it
      if (!prev.includes(criteria) && !newMappingName.trim()) {
        setNewMappingName(criteria);
        // Find similar mappings for suggestions
        if (findSimilarMappings) {
          findSimilarMappings(criteria).then(similarMappings => {
            setSuggestions(similarMappings.filter(s => s.similarity_score > 0.1));
            setShowSuggestions(similarMappings.length > 0);
          });
        }
      }
      
      return newSelected;
    });
  };

  const handleUseSuggestion = (suggestion: SimilarMapping) => {
    setNewMappingName(suggestion.display_name);
    setShowSuggestions(false);
  };

  const handleGetAllSuggestions = async () => {
    console.log('Getting suggestions for criteria:', {
      unmappedCriteria,
      availableCriteria,
      selectedEvent,
      findSimilarMappings: !!findSimilarMappings
    });
    
    if (!findSimilarMappings) {
      console.error('findSimilarMappings function not available');
      return;
    }
    
    if (unmappedCriteria.length === 0) {
      console.log('No unmapped criteria found');
      return;
    }
    
    if (!selectedEvent) {
      console.error('No selected event');
      return;
    }
    
    setLoadingSuggestions(true);
    try {
      const allSuggestionsData = await Promise.all(
        unmappedCriteria.map(async (criteria) => {
          console.log('Finding suggestions for criteria:', criteria);
          const suggestions = await findSimilarMappings(criteria);
          console.log('Suggestions found for', criteria, ':', suggestions);
          return {
            criteria,
            suggestions: suggestions.filter(s => s.similarity_score > 0.1).slice(0, 3)
          };
        })
      );
      
      console.log('All suggestions data:', allSuggestionsData);
      const filteredSuggestions = allSuggestionsData.filter(item => item.suggestions.length > 0);
      console.log('Filtered suggestions:', filteredSuggestions);
      
      setAllSuggestions(filteredSuggestions);
      setShowAllSuggestions(true);
    } catch (error) {
      console.error('Failed to load suggestions:', error);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleAcceptSuggestion = (criteria: string, suggestion: SimilarMapping) => {
    const newMapping: CriteriaMapping = {
      id: Date.now().toString(),
      displayName: suggestion.display_name,
      originalCriteria: [criteria]
    };
    
    onMappingsChange([...mappings, newMapping]);
    
    // Remove this criteria from all suggestions
    setAllSuggestions(prev => 
      prev.filter(item => item.criteria !== criteria)
    );
  };

  const handleRejectSuggestion = (criteria: string) => {
    setAllSuggestions(prev => 
      prev.filter(item => item.criteria !== criteria)
    );
  };

  if (!selectedEvent || availableCriteria.length === 0) {
    return null;
  }

  return (
    <Card className="w-full">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Advanced Criteria Mapping</CardTitle>
              <div className="flex items-center gap-2">
                {mappings.length > 0 && (
                  <Badge variant="secondary">{mappings.length} mappings</Badge>
                )}
                <Button variant="ghost" size="sm">
                  {isOpen ? 'Hide' : 'Show'}
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Group similar criteria together (e.g., "6. Routine Marching" + "6. Routine Marching/Movement")
            </p>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-6">
            {/* Create New Mapping */}
            {unmappedCriteria.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-medium">Create New Mapping:</h4>
                
                <div className="space-y-3">
                  <div className="flex gap-2 items-end">
                    <div className="w-1/4">
                      <Label htmlFor="mapping-name">Display Name</Label>
                      <Input
                        id="mapping-name"
                        value={newMappingName}
                        onChange={(e) => setNewMappingName(e.target.value)}
                        placeholder="e.g., Routine Marching"
                      />
                    </div>
                    <Button 
                      onClick={handleCreateMapping}
                      disabled={!newMappingName.trim() || selectedCriteria.length === 0}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Mapping
                    </Button>
                  </div>

                  {/* Smart Suggestions */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="bg-muted/30 border rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Lightbulb className="h-4 w-4 text-orange-500" />
                        <span className="text-sm font-medium">Smart Suggestions</span>
                        <Globe className="h-3 w-3 text-muted-foreground" />
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        Other schools have used these names for similar criteria:
                      </p>
                      <div className="space-y-1">
                        {suggestions.slice(0, 3).map((suggestion) => (
                          <div key={suggestion.id} className="flex items-center justify-between">
                            <span className="text-sm">{suggestion.display_name}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {suggestion.usage_count} schools
                              </Badge>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUseSuggestion(suggestion)}
                                className="h-6 px-2 text-xs"
                              >
                                Use
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowSuggestions(false)}
                        className="w-full mt-2 h-6 text-xs"
                      >
                        Dismiss suggestions
                      </Button>
                    </div>
                  )}

                  <div>
                    <Label>Select Criteria to Group:</Label>
                    <div className="grid grid-cols-1 gap-2 mt-2 max-h-40 overflow-y-auto">
                      {unmappedCriteria.map((criteria) => (
                        <div key={criteria} className="flex items-center space-x-2">
                          <Checkbox
                            id={`criteria-${criteria}`}
                            checked={selectedCriteria.includes(criteria)}
                            onCheckedChange={() => handleCriteriaToggle(criteria)}
                          />
                          <Label 
                            htmlFor={`criteria-${criteria}`} 
                            className="text-sm cursor-pointer flex-1"
                          >
                            {criteria}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* See Suggested Mappings Button */}
            {unmappedCriteria.length > 0 && findSimilarMappings && (
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-medium flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-blue-500" />
                      AI-Powered Suggestions
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      See what other schools have named similar criteria
                    </p>
                  </div>
                  <Button 
                    onClick={handleGetAllSuggestions}
                    disabled={loadingSuggestions}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Globe className="h-4 w-4" />
                    {loadingSuggestions ? 'Loading...' : 'See Suggested Mappings'}
                  </Button>
                </div>

                {/* All Suggestions Display */}
                {showAllSuggestions && allSuggestions.length > 0 && (
                  <div className="space-y-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <h5 className="font-medium text-blue-900">Smart Mapping Suggestions</h5>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAllSuggestions(false)}
                        className="text-blue-700 hover:text-blue-900"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      {allSuggestions.map((item) => (
                        <div key={item.criteria} className="bg-white rounded-lg border p-3">
                          <div className="font-medium text-sm mb-2 text-gray-900">
                            "{item.criteria}"
                          </div>
                          <div className="space-y-2">
                            {item.suggestions.map((suggestion, index) => (
                              <div key={suggestion.id} className="flex items-center justify-between bg-gray-50 rounded p-2">
                                <div className="flex-1">
                                  <div className="font-medium text-sm text-gray-900">
                                    {suggestion.display_name}
                                  </div>
                                  <div className="text-xs text-gray-600">
                                    Used by {suggestion.usage_count} schools
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge 
                                    variant="outline" 
                                    className="text-xs bg-green-50 text-green-700 border-green-200"
                                  >
                                    {Math.round(suggestion.similarity_score * 100)}% match
                                  </Badge>
                                  <Button
                                    size="sm"
                                    onClick={() => handleAcceptSuggestion(item.criteria, suggestion)}
                                    className="h-7 px-3 text-xs bg-green-600 hover:bg-green-700"
                                  >
                                    Accept
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRejectSuggestion(item.criteria)}
                              className="text-xs text-gray-600 hover:text-gray-800"
                            >
                              No suggestions work - I'll create my own
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {showAllSuggestions && allSuggestions.length === 0 && (
                  <div className="text-center text-muted-foreground py-8 bg-gray-50 rounded-lg border-2 border-dashed">
                    <Lightbulb className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="font-medium">No suggestions found</p>
                    <p className="text-sm">These criteria appear to be unique to your competition.</p>
                  </div>
                )}
              </div>
            )}

            {/* Current Mappings */}
            {mappings.length > 0 && (
              <div className="space-y-3 border-t pt-4">
                <h4 className="font-medium">Current Mappings:</h4>
                {mappings.map((mapping) => (
                  <div key={mapping.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      {editingMapping === mapping.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="max-w-xs"
                            placeholder="Display name"
                            autoFocus
                          />
                          <Button size="sm" onClick={() => handleSaveEdit(mapping.id)}>
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div>
                          <div className="font-medium">{mapping.displayName}</div>
                          <div className="text-sm text-muted-foreground mt-1">
                            Maps: {mapping.originalCriteria.join(', ')}
                          </div>
                        </div>
                      )}
                    </div>
                    {editingMapping !== mapping.id && (
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleEditMapping(mapping.id)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDeleteMapping(mapping.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {unmappedCriteria.length === 0 && mappings.length > 0 && (
              <div className="text-center text-muted-foreground py-4">
                All criteria have been mapped!
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};