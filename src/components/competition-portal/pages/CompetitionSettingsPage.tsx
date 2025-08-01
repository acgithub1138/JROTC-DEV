import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Settings, Bell, Database, Users, Shield, Calendar } from 'lucide-react';

export const CompetitionSettingsPage = () => {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Competition Settings</h1>
          <p className="text-muted-foreground">
            Configure competition portal settings and preferences
          </p>
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            Data Management
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Permissions
          </TabsTrigger>
          <TabsTrigger value="scheduling" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Scheduling
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Portal Configuration</CardTitle>
              <CardDescription>
                Basic settings for the competition portal
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="portal-name">Portal Name</Label>
                <Input 
                  id="portal-name" 
                  placeholder="Enter portal name" 
                  defaultValue="CCC Competition Portal"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="portal-description">Portal Description</Label>
                <Textarea 
                  id="portal-description" 
                  placeholder="Enter portal description"
                  defaultValue="Manage and organize JROTC competitions and events"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Public Registration</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow external schools to register for competitions
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-approve Registrations</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically approve school registration requests
                  </p>
                </div>
                <Switch />
              </div>

              <div className="pt-4">
                <Button>Save Changes</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Competition Defaults</CardTitle>
              <CardDescription>
                Default settings for new competitions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="default-duration">Default Competition Duration (days)</Label>
                <Input 
                  id="default-duration" 
                  type="number" 
                  placeholder="1" 
                  defaultValue="1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="registration-deadline">Registration Deadline (days before event)</Label>
                <Input 
                  id="registration-deadline" 
                  type="number" 
                  placeholder="7" 
                  defaultValue="7"
                />
              </div>

              <div className="pt-4">
                <Button>Save Defaults</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>
                Configure when to send email notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>New Competition Created</Label>
                  <p className="text-sm text-muted-foreground">
                    Notify schools when new competitions are available
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Registration Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Send reminders before registration deadlines
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Event Updates</Label>
                  <p className="text-sm text-muted-foreground">
                    Notify participants of schedule changes
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Score Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Send notifications when scores are published
                  </p>
                </div>
                <Switch />
              </div>

              <div className="pt-4">
                <Button>Save Notification Settings</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Management */}
        <TabsContent value="data" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Data Retention</CardTitle>
              <CardDescription>
                Manage how long data is stored in the system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="competition-retention">Competition Data Retention (months)</Label>
                <Input 
                  id="competition-retention" 
                  type="number" 
                  placeholder="12" 
                  defaultValue="24"
                />
                <p className="text-sm text-muted-foreground">
                  How long to keep completed competition data
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="score-retention">Score Data Retention (months)</Label>
                <Input 
                  id="score-retention" 
                  type="number" 
                  placeholder="12" 
                  defaultValue="36"
                />
                <p className="text-sm text-muted-foreground">
                  How long to keep historical scores and rankings
                </p>
              </div>

              <div className="pt-4 space-x-2">
                <Button>Save Settings</Button>
                <Button variant="outline">Export Data</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Backup & Recovery</CardTitle>
              <CardDescription>
                System backup and data recovery options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Automatic Backups</h4>
                    <p className="text-sm text-muted-foreground">Daily backups at 2:00 AM EST</p>
                  </div>
                  <Badge variant="default">Active</Badge>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Last Backup</h4>
                    <p className="text-sm text-muted-foreground">Today at 2:00 AM EST</p>
                  </div>
                  <Badge variant="outline">Successful</Badge>
                </div>
              </div>

              <div className="pt-4">
                <Button variant="outline">Download Backup</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Permissions */}
        <TabsContent value="permissions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Role Permissions</CardTitle>
              <CardDescription>
                Configure what each role can do in the competition portal
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {[
                  { role: 'Admin', permissions: ['Full Access'], color: 'destructive' },
                  { role: 'Instructor', permissions: ['Create Competitions', 'Manage Events', 'View Reports'], color: 'default' },
                  { role: 'Command Staff', permissions: ['Create Competitions', 'Manage Teams'], color: 'default' },
                  { role: 'Cadet', permissions: ['View Competitions', 'Register for Events'], color: 'secondary' }
                ].map((item) => (
                  <div key={item.role} className="flex items-start justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <h4 className="font-medium flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        {item.role}
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {item.permissions.map((permission) => (
                          <Badge key={permission} variant={item.color as any} className="text-xs">
                            {permission}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button variant="outline" size="sm">Edit</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scheduling */}
        <TabsContent value="scheduling" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Schedule Settings</CardTitle>
              <CardDescription>
                Configure scheduling preferences and constraints
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="event-duration">Default Event Duration (minutes)</Label>
                <Input 
                  id="event-duration" 
                  type="number" 
                  placeholder="60" 
                  defaultValue="90"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="break-duration">Break Between Events (minutes)</Label>
                <Input 
                  id="break-duration" 
                  type="number" 
                  placeholder="15" 
                  defaultValue="15"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="start-time">Competition Start Time</Label>
                <Input 
                  id="start-time" 
                  type="time" 
                  defaultValue="08:00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end-time">Competition End Time</Label>
                <Input 
                  id="end-time" 
                  type="time" 
                  defaultValue="17:00"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Weekend Competitions</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow competitions to be scheduled on weekends
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="pt-4">
                <Button>Save Schedule Settings</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};