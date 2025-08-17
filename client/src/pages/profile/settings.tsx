import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Settings, Bell, Eye, Lock, Mail } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function SettingsPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState({
    email: true,
    applications: true,
    interviews: true,
    recommendations: false,
  });
  const [privacy, setPrivacy] = useState({
    profileVisible: true,
    contactInfo: false,
  });

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => setLocation(user.role === "seeker" ? "/dashboard/job-seeker" : "/dashboard/recruiter")}
            className="mb-4"
            data-testid="back-button"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Settings className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-600">Manage your account preferences and privacy settings</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="mr-2 h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>
                Control how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications">Email Notifications</Label>
                  <p className="text-sm text-gray-500">Receive notifications via email</p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={notifications.email}
                  onCheckedChange={(checked) => 
                    setNotifications(prev => ({ ...prev, email: checked }))
                  }
                  data-testid="switch-email-notifications"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="application-updates">Application Updates</Label>
                  <p className="text-sm text-gray-500">Get notified about application status changes</p>
                </div>
                <Switch
                  id="application-updates"
                  checked={notifications.applications}
                  onCheckedChange={(checked) => 
                    setNotifications(prev => ({ ...prev, applications: checked }))
                  }
                  data-testid="switch-application-updates"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="interview-reminders">Interview Reminders</Label>
                  <p className="text-sm text-gray-500">Receive reminders for upcoming interviews</p>
                </div>
                <Switch
                  id="interview-reminders"
                  checked={notifications.interviews}
                  onCheckedChange={(checked) => 
                    setNotifications(prev => ({ ...prev, interviews: checked }))
                  }
                  data-testid="switch-interview-reminders"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="job-recommendations">Job Recommendations</Label>
                  <p className="text-sm text-gray-500">Get AI-powered job recommendations</p>
                </div>
                <Switch
                  id="job-recommendations"
                  checked={notifications.recommendations}
                  onCheckedChange={(checked) => 
                    setNotifications(prev => ({ ...prev, recommendations: checked }))
                  }
                  data-testid="switch-job-recommendations"
                />
              </div>
            </CardContent>
          </Card>

          {/* Privacy Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Eye className="mr-2 h-5 w-5" />
                Privacy
              </CardTitle>
              <CardDescription>
                Control who can see your profile and information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="profile-visible">Profile Visibility</Label>
                  <p className="text-sm text-gray-500">Make your profile visible to recruiters</p>
                </div>
                <Switch
                  id="profile-visible"
                  checked={privacy.profileVisible}
                  onCheckedChange={(checked) => 
                    setPrivacy(prev => ({ ...prev, profileVisible: checked }))
                  }
                  data-testid="switch-profile-visible"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="contact-info">Contact Information</Label>
                  <p className="text-sm text-gray-500">Allow recruiters to see your contact details</p>
                </div>
                <Switch
                  id="contact-info"
                  checked={privacy.contactInfo}
                  onCheckedChange={(checked) => 
                    setPrivacy(prev => ({ ...prev, contactInfo: checked }))
                  }
                  data-testid="switch-contact-info"
                />
              </div>
            </CardContent>
          </Card>

          {/* Account Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lock className="mr-2 h-5 w-5" />
                Account
              </CardTitle>
              <CardDescription>
                Manage your account security and data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full justify-start" data-testid="button-change-password">
                <Lock className="mr-2 h-4 w-4" />
                Change Password
              </Button>
              
              <Button variant="outline" className="w-full justify-start" data-testid="button-change-email">
                <Mail className="mr-2 h-4 w-4" />
                Change Email
              </Button>
              
              <Button variant="destructive" className="w-full justify-start" data-testid="button-delete-account">
                Delete Account
              </Button>
            </CardContent>
          </Card>

          {/* Save Changes */}
          <div className="flex justify-end space-x-4">
            <Button
              variant="outline"
              onClick={() => setLocation(user.role === "seeker" ? "/dashboard/job-seeker" : "/dashboard/recruiter")}
              data-testid="cancel-button"
            >
              Cancel
            </Button>
            <Button data-testid="save-settings-button">
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}