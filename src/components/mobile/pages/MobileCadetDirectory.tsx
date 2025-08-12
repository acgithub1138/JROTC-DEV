import React, { useState } from 'react';
import { 
  Search, 
  Phone, 
  Mail, 
  User,
  MapPin,
  Star
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';

interface MobileCadet {
  id: string;
  firstName: string;
  lastName: string;
  rank: string;
  company: string;
  phone: string;
  email: string;
  status: 'active' | 'inactive' | 'graduated';
  avatar?: string;
  isLeader: boolean;
}

const mockCadets: MobileCadet[] = [
  {
    id: '1',
    firstName: 'Sarah',
    lastName: 'Johnson',
    rank: 'Cadet Captain',
    company: 'Alpha Company',
    phone: '(555) 123-4567',
    email: 'sarah.johnson@email.com',
    status: 'active',
    isLeader: true
  },
  {
    id: '2',
    firstName: 'Michael',
    lastName: 'Smith',
    rank: 'Cadet Lieutenant',
    company: 'Bravo Company',
    phone: '(555) 234-5678',
    email: 'michael.smith@email.com',
    status: 'active',
    isLeader: true
  },
  {
    id: '3',
    firstName: 'Ashley',
    lastName: 'Williams',
    rank: 'Cadet Sergeant',
    company: 'Alpha Company',
    phone: '(555) 345-6789',
    email: 'ashley.williams@email.com',
    status: 'active',
    isLeader: false
  },
];

const statusColors = {
  active: 'bg-green-600 text-white',
  inactive: 'bg-orange-500 text-white',
  graduated: 'bg-blue-600 text-white'
};

export const MobileCadetDirectory: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredCadets = mockCadets.filter(cadet =>
    `${cadet.firstName} ${cadet.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cadet.rank.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cadet.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`;
  };

  const handleCall = (phone: string, e: React.MouseEvent) => {
    e.stopPropagation();
    window.location.href = `tel:${phone}`;
  };

  const handleEmail = (email: string, e: React.MouseEvent) => {
    e.stopPropagation();
    window.location.href = `mailto:${email}`;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search Bar */}
      <div className="p-4 border-b border-border bg-card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search cadets, ranks, companies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="p-4 border-b border-border bg-muted/30">
        <div className="flex justify-around text-center">
          <div>
            <p className="text-lg font-bold text-foreground">127</p>
            <p className="text-xs text-muted-foreground">Total Cadets</p>
          </div>
          <div>
            <p className="text-lg font-bold text-green-600">118</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </div>
          <div>
            <p className="text-lg font-bold text-blue-600">15</p>
            <p className="text-xs text-muted-foreground">Leaders</p>
          </div>
        </div>
      </div>

      {/* Cadet List */}
      <div className="flex-1 p-4 space-y-3 overflow-y-auto">
        {filteredCadets.map((cadet) => (
          <Card 
            key={cadet.id} 
            className="bg-card border-border cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => navigate(`/mobile/cadets/${cadet.id}`)}
          >
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={cadet.avatar} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getInitials(cadet.firstName, cadet.lastName)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium text-foreground text-sm truncate">
                      {cadet.lastName}, {cadet.firstName}
                      {cadet.isLeader && <Star className="inline ml-1 h-3 w-3 text-yellow-500" />}
                    </h3>
                    <Badge className={statusColors[cadet.status]} variant="secondary">
                      {cadet.status}
                    </Badge>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mb-1">{cadet.rank}</p>
                  <p className="text-xs text-muted-foreground mb-2">{cadet.company}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-1 h-8 w-8"
                        onClick={(e) => handleCall(cadet.phone, e)}
                      >
                        <Phone className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-1 h-8 w-8"
                        onClick={(e) => handleEmail(cadet.email, e)}
                      >
                        <Mail className="h-4 w-4 text-blue-600" />
                      </Button>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/mobile/cadets/${cadet.id}`);
                      }}
                    >
                      View Profile
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {filteredCadets.length === 0 && searchTerm && (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No cadets found matching "{searchTerm}"</p>
          </div>
        </div>
      )}
    </div>
  );
};