import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Upload, 
  Search, 
  FileText, 
  Calendar, 
  MessageSquare, 
  Star,
  MapPin,
  Briefcase,
  Clock,
  TrendingUp,
  User,
  Settings,
  Bell
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/layout/navbar";
import JobCard from "@/components/job/job-card";
import FileUpload from "@/components/ui/file-upload";
import { useFileUpload } from "@/hooks/use-file-upload";
import { Link } from "wouter";
import type { Job, Application } from "@shared/schema";

export default function JobSeekerDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch user profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["/api/me"],
    queryFn: () => api.get("/api/me"),
    enabled: !!user,
  });

  // Fetch job recommendations
  const { data: recommendations, isLoading: loadingRecommendations } = useQuery({
    queryKey: ["/api/jobs/recommendations"],
    queryFn: () => api.get("/api/jobs/recommendations"),
    enabled: !!user,
  });

  // Fetch applications
  const { data: applications } = useQuery({
    queryKey: ["/api/applications/me"],
    queryFn: () => api.get("/api/applications/me"),
    enabled: !!user,
  });

  // Fetch interviews
  const { data: interviews } = useQuery({
    queryKey: ["/api/interviews/me"],
    queryFn: () => api.get("/api/interviews/me"),
    enabled: !!user,
  });

  // File upload hook for resume
  const {
    file: resumeFile,
    uploadProgress,
    uploadStatus,
    error: uploadError,
    selectFile,
    removeFile,
    uploadFile,
  } = useFileUpload({
    uploadUrl: "/api/me/resume",
    acceptedFileTypes: ['.pdf', '.docx'],
    maxFileSize: 5 * 1024 * 1024,
    onUploadComplete: () => {
      toast({
        title: "Resume uploaded successfully",
        description: "Your resume has been processed and skills extracted.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
    },
    onUploadError: (error) => {
      toast({
        title: "Upload failed",
        description: error,
        variant: "destructive",
      });
    },
  });

  // Job search mutation
  const searchJobsMutation = useMutation({
    mutationFn: (query: string) => api.get(`/api/jobs/search?q=${encodeURIComponent(query)}`),
  });

  // Apply to job mutation
  const applyMutation = useMutation({
    mutationFn: (jobId: string) => api.post(`/api/jobs/${jobId}/apply`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications/me"] });
      toast({
        title: "Application submitted",
        description: "Your application has been sent successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Application failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleResumeSelect = (file: File) => {
    selectFile(file);
  };

  const handleResumeUpload = () => {
    uploadFile();
  };

  const handleJobSearch = () => {
    if (searchQuery.trim()) {
      searchJobsMutation.mutate(searchQuery);
    }
  };

  const handleApply = (jobId: string) => {
    applyMutation.mutate(jobId);
  };

  if (!user) return null;

  const profileCompleteness = profile?.resume_file_path ? 95 : 65;
  const appliedJobIds = new Set(applications?.map((app: Application) => app.job_id) || []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Profile Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="mr-2 h-5 w-5" />
                  Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="font-medium" data-testid="text-profile-name">
                    {profile?.full_name || user.full_name}
                  </div>
                  <div className="text-sm text-gray-500" data-testid="text-profile-headline">
                    {profile?.headline || "Add a professional headline"}
                  </div>
                </div>

                {profile?.location && (
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="mr-1 h-4 w-4" />
                    <span data-testid="text-profile-location">{profile.location}</span>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Profile Completion</span>
                    <Badge variant="secondary" data-testid="badge-profile-completion">
                      {profileCompleteness}%
                    </Badge>
                  </div>
                  <Progress value={profileCompleteness} className="h-2" />
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-2">Resume</h4>
                  {profile?.resume_file_path ? (
                    <div className="text-sm text-green-600 flex items-center">
                      <FileText className="mr-1 h-4 w-4" />
                      <span data-testid="text-resume-status">Resume uploaded</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <FileUpload
                        onFileSelect={handleResumeSelect}
                        onFileRemove={removeFile}
                        currentFile={resumeFile}
                        uploadProgress={uploadProgress}
                        uploadStatus={uploadStatus}
                        error={uploadError}
                      />
                      {resumeFile && uploadStatus === 'idle' && (
                        <Button
                          onClick={handleResumeUpload}
                          className="w-full"
                          data-testid="button-upload-resume"
                        >
                          Upload Resume
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {profile?.skills && profile.skills.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Skills</h4>
                    <div className="flex flex-wrap gap-1">
                      {profile.skills.slice(0, 6).map((skill: string, index: number) => (
                        <Badge key={index} variant="secondary" className="text-xs" data-testid={`badge-skill-${index}`}>
                          {skill}
                        </Badge>
                      ))}
                      {profile.skills.length > 6 && (
                        <Badge variant="outline" className="text-xs">
                          +{profile.skills.length - 6} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <Link href="/profile/edit">
                    <Button variant="outline" className="w-full" data-testid="button-edit-profile">
                      <Settings className="mr-2 h-4 w-4" />
                      Edit Profile
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Applications</span>
                  <Badge variant="secondary" data-testid="stat-applications">
                    {applications?.length || 0}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Interviews</span>
                  <Badge variant="secondary" data-testid="stat-interviews">
                    {interviews?.length || 0}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Profile Views</span>
                  <Badge variant="secondary">12</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="dashboard" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="dashboard" data-testid="tab-dashboard">Dashboard</TabsTrigger>
                <TabsTrigger value="search" data-testid="tab-search">Job Search</TabsTrigger>
                <TabsTrigger value="applications" data-testid="tab-applications">Applications</TabsTrigger>
                <TabsTrigger value="interviews" data-testid="tab-interviews">Interviews</TabsTrigger>
              </TabsList>

              <TabsContent value="dashboard" className="space-y-6">
                {/* Welcome Message */}
                <Card>
                  <CardHeader>
                    <CardTitle>Welcome back, {profile?.full_name?.split(' ')[0] || user.full_name.split(' ')[0]}!</CardTitle>
                    <CardDescription>
                      Here's what's happening with your job search
                    </CardDescription>
                  </CardHeader>
                </Card>

                {/* Job Recommendations */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <TrendingUp className="mr-2 h-5 w-5" />
                      AI Job Recommendations
                    </CardTitle>
                    <CardDescription>
                      Personalized job matches based on your profile and preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingRecommendations ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-2 text-sm text-gray-600">Loading recommendations...</p>
                      </div>
                    ) : recommendations?.length > 0 ? (
                      <div className="space-y-4">
                        {recommendations?.slice(0, 3).map((job: Job & { matchScore?: number }) => (
                          <JobCard
                            key={job.id}
                            job={job}
                            onApply={handleApply}
                            showMatchScore={true}
                            applied={appliedJobIds.has(job.id)}
                            userRole="seeker"
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <TrendingUp className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <p>Complete your profile to get personalized job recommendations</p>
                        {!profile?.resume_file_path && (
                          <p className="text-sm mt-2">Upload your resume to get started</p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {applications?.slice(0, 3).map((application: Application & { job?: Job }) => (
                        <div key={application.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <div className="flex-shrink-0">
                            <Badge
                              variant={application.status === 'applied' ? 'secondary' : 'default'}
                              className="text-xs"
                            >
                              {application.status}
                            </Badge>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              Applied to {application.job?.title || 'Job'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(application.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                      
                      {(!applications || applications.length === 0) && (
                        <div className="text-center py-6 text-gray-500">
                          <p>No recent activity</p>
                          <p className="text-sm mt-1">Start applying to jobs to see your activity here</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="search" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Search className="mr-2 h-5 w-5" />
                      Search Jobs
                    </CardTitle>
                    <CardDescription>
                      Find opportunities using our AI-powered semantic search
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2 mb-6">
                      <Input
                        placeholder="Search for jobs, skills, or companies..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && handleJobSearch()}
                        data-testid="input-job-search"
                      />
                      <Button
                        onClick={handleJobSearch}
                        disabled={searchJobsMutation.isPending}
                        data-testid="button-search-jobs"
                      >
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>

                    {searchJobsMutation.data && (
                      <div className="space-y-4">
                        {searchJobsMutation.data.map((job: Job & { matchScore?: number }) => (
                          <JobCard
                            key={job.id}
                            job={job}
                            onApply={handleApply}
                            showMatchScore={true}
                            applied={appliedJobIds.has(job.id)}
                            userRole="seeker"
                          />
                        ))}
                      </div>
                    )}

                    {searchJobsMutation.isPending && (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-2 text-sm text-gray-600">Searching for jobs...</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="applications" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <FileText className="mr-2 h-5 w-5" />
                      My Applications
                    </CardTitle>
                    <CardDescription>
                      Track the status of your job applications
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {applications?.length > 0 ? (
                      <div className="space-y-4">
                        {applications.map((application: Application & { job?: Job }) => (
                          <div key={application.id} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="font-semibold">
                                  {application.job?.title || "Job Title"}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  {application.job?.company || "Company"}
                                </p>
                              </div>
                              <Badge
                                variant={
                                  application.status === "offered"
                                    ? "default"
                                    : application.status === "rejected"
                                    ? "destructive"
                                    : "secondary"
                                }
                                data-testid={`badge-status-${application.id}`}
                              >
                                {application.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                              <span className="flex items-center">
                                <Clock className="mr-1 h-3 w-3" />
                                Applied {new Date(application.created_at).toLocaleDateString()}
                              </span>
                              {application.scores && (
                                <span className="flex items-center">
                                  <Star className="mr-1 h-3 w-3" />
                                  Match: {Math.round(application.scores.final * 100)}%
                                </span>
                              )}
                            </div>
                            <div className="flex justify-end">
                              <Button variant="outline" size="sm">
                                <MessageSquare className="mr-2 h-4 w-4" />
                                Message
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <p>No applications yet</p>
                        <p className="text-sm mt-1">Start applying to jobs to track them here</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="interviews" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Calendar className="mr-2 h-5 w-5" />
                      Interview Schedule
                    </CardTitle>
                    <CardDescription>
                      Manage your upcoming interviews
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {interviews?.length > 0 ? (
                      <div className="space-y-4">
                        {interviews.map((interview: any) => (
                          <div key={interview.id} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="font-semibold">
                                  {interview.job?.title || "Interview"}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  with {interview.recruiter?.full_name}
                                </p>
                              </div>
                              <Badge className="interview-scheduled">
                                {interview.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                              <span className="flex items-center">
                                <Calendar className="mr-1 h-3 w-3" />
                                {new Date(interview.start_time).toLocaleDateString()}
                              </span>
                              <span className="flex items-center">
                                <Clock className="mr-1 h-3 w-3" />
                                {new Date(interview.start_time).toLocaleTimeString([], { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </span>
                            </div>
                            {interview.meeting_link && (
                              <div className="flex justify-end">
                                <Button size="sm" asChild>
                                  <a href={interview.meeting_link} target="_blank" rel="noopener noreferrer">
                                    Join Meeting
                                  </a>
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <p>No interviews scheduled</p>
                        <p className="text-sm mt-1">Interview invitations will appear here</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
