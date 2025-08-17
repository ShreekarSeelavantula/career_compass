import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, 
  Search, 
  Users, 
  Calendar, 
  MessageSquare, 
  Star,
  MapPin,
  Briefcase,
  Clock,
  TrendingUp,
  BarChart3,
  User
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import type { Job, Application, User as UserType } from "@shared/schema";

export default function RecruiterDashboard() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateJobOpen, setIsCreateJobOpen] = useState(false);

  // Fetch recruiter's jobs
  const { data: jobs, isLoading: loadingJobs } = useQuery({
    queryKey: ["/api/jobs/mine"],
    enabled: !!user,
  });

  // Fetch applications for recruiter's jobs
  const { data: applications } = useQuery({
    queryKey: ["/api/applications/jobs"],
    enabled: !!user,
  });

  // Create job mutation
  const createJobMutation = useMutation({
    mutationFn: async (jobData: any) => {
      const response = await apiRequest("POST", "/api/jobs", jobData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs/mine"] });
      setIsCreateJobOpen(false);
    },
  });

  // Search candidates mutation
  const searchCandidatesMutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await apiRequest("GET", `/api/candidates/search?q=${encodeURIComponent(query)}`);
      return response.json();
    },
  });

  const handleCreateJob = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const jobData = {
      title: formData.get("title"),
      description: formData.get("description"),
      company: formData.get("company"),
      location: formData.get("location"),
      employment_type: formData.get("employment_type"),
      skills_required: (formData.get("skills_required") as string)
        .split(",")
        .map(s => s.trim())
        .filter(Boolean),
      min_exp: formData.get("min_exp") ? Number(formData.get("min_exp")) : undefined,
    };
    createJobMutation.mutate(jobData);
  };

  const handleCandidateSearch = () => {
    if (searchQuery.trim()) {
      searchCandidatesMutation.mutate(searchQuery);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary">AI Talent Match</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                <span className="font-medium" data-testid="text-user-name">{user.full_name}</span>
              </div>
              <Button variant="outline" onClick={logout} data-testid="button-logout">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Jobs</p>
                  <p className="text-2xl font-bold" data-testid="stat-active-jobs">
                    {jobs?.filter((j: Job) => j.status === "open").length || 0}
                  </p>
                </div>
                <Briefcase className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Applications</p>
                  <p className="text-2xl font-bold" data-testid="stat-total-applications">
                    {applications?.length || 0}
                  </p>
                </div>
                <Users className="h-8 w-8 text-accent" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Interviews</p>
                  <p className="text-2xl font-bold" data-testid="stat-interviews">0</p>
                </div>
                <Calendar className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Success Rate</p>
                  <p className="text-2xl font-bold" data-testid="stat-success-rate">--</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="jobs" className="space-y-6">
          <div className="flex justify-between items-center">
            <TabsList className="grid w-full max-w-md grid-cols-4">
              <TabsTrigger value="jobs" data-testid="tab-jobs">Jobs</TabsTrigger>
              <TabsTrigger value="candidates" data-testid="tab-candidates">Candidates</TabsTrigger>
              <TabsTrigger value="applications" data-testid="tab-applications">Applications</TabsTrigger>
              <TabsTrigger value="interviews" data-testid="tab-interviews">Interviews</TabsTrigger>
            </TabsList>
            
            <Dialog open={isCreateJobOpen} onOpenChange={setIsCreateJobOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-job">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Job
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Job</DialogTitle>
                  <DialogDescription>
                    Add a new job posting to find the perfect candidates
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateJob} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="title">Job Title</Label>
                      <Input id="title" name="title" placeholder="e.g. Senior Frontend Developer" required data-testid="input-job-title" />
                    </div>
                    <div>
                      <Label htmlFor="company">Company</Label>
                      <Input id="company" name="company" placeholder="Company Name" required data-testid="input-company" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="description">Job Description</Label>
                    <Textarea id="description" name="description" placeholder="Describe the role, responsibilities, and requirements..." required data-testid="textarea-description" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input id="location" name="location" placeholder="e.g. San Francisco, CA" data-testid="input-location" />
                    </div>
                    <div>
                      <Label htmlFor="employment_type">Employment Type</Label>
                      <Select name="employment_type">
                        <SelectTrigger data-testid="select-employment-type">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="full-time">Full-time</SelectItem>
                          <SelectItem value="part-time">Part-time</SelectItem>
                          <SelectItem value="contract">Contract</SelectItem>
                          <SelectItem value="internship">Internship</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="skills_required">Required Skills (comma-separated)</Label>
                      <Input id="skills_required" name="skills_required" placeholder="React, TypeScript, Node.js" data-testid="input-skills" />
                    </div>
                    <div>
                      <Label htmlFor="min_exp">Minimum Experience (years)</Label>
                      <Input id="min_exp" name="min_exp" type="number" placeholder="3" data-testid="input-min-experience" />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsCreateJobOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createJobMutation.isPending} data-testid="button-submit-job">
                      {createJobMutation.isPending ? "Creating..." : "Create Job"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <TabsContent value="jobs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>My Job Postings</CardTitle>
                <CardDescription>
                  Manage your active and closed job postings
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingJobs ? (
                  <div className="text-center py-8">Loading jobs...</div>
                ) : jobs?.length > 0 ? (
                  <div className="space-y-4">
                    {jobs.map((job: Job & { applicantCount?: number }) => (
                      <div key={job.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold" data-testid={`text-job-title-${job.id}`}>{job.title}</h4>
                            <p className="text-sm text-gray-600" data-testid={`text-job-company-${job.id}`}>{job.company}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={job.status === "open" ? "default" : "secondary"} data-testid={`badge-job-status-${job.id}`}>
                              {job.status}
                            </Badge>
                            {job.applicantCount && (
                              <Badge variant="outline" data-testid={`badge-applicant-count-${job.id}`}>
                                {job.applicantCount} applicants
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                          {job.location && (
                            <span className="flex items-center">
                              <MapPin className="mr-1 h-3 w-3" />
                              {job.location}
                            </span>
                          )}
                          <span className="flex items-center">
                            <Clock className="mr-1 h-3 w-3" />
                            Posted {new Date(job.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                          {job.description}
                        </p>
                        <div className="flex justify-between items-center">
                          <div className="flex flex-wrap gap-1">
                            {job.skills_required.slice(0, 4).map((skill, index) => (
                              <Badge key={index} variant="outline" className="text-xs" data-testid={`badge-skill-${job.id}-${index}`}>
                                {skill}
                              </Badge>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" data-testid={`button-view-applicants-${job.id}`}>
                              View Applicants
                            </Button>
                            <Button variant="outline" size="sm" data-testid={`button-edit-job-${job.id}`}>
                              Edit
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No jobs posted yet. Create your first job posting!
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="candidates" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Search className="mr-2 h-5 w-5" />
                  Candidate Search
                </CardTitle>
                <CardDescription>
                  Find the perfect candidates using AI-powered search
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-6">
                  <Input
                    placeholder="Search by skills, experience, location..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleCandidateSearch()}
                    data-testid="input-candidate-search"
                  />
                  <Button
                    onClick={handleCandidateSearch}
                    disabled={searchCandidatesMutation.isPending}
                    data-testid="button-search-candidates"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>

                {searchCandidatesMutation.data && (
                  <div className="space-y-4">
                    {searchCandidatesMutation.data.map((candidate: UserType & { matchScore?: number }) => (
                      <div key={candidate.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold" data-testid={`text-candidate-name-${candidate.id}`}>
                              {candidate.full_name}
                            </h4>
                            <p className="text-sm text-gray-600" data-testid={`text-candidate-headline-${candidate.id}`}>
                              {candidate.headline || "Professional"}
                            </p>
                          </div>
                          {candidate.matchScore && (
                            <Badge variant="secondary" className="text-accent font-bold">
                              <span data-testid={`text-candidate-match-${candidate.id}`}>
                                {Math.round(candidate.matchScore)}%
                              </span>
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                          {candidate.location && (
                            <span className="flex items-center">
                              <MapPin className="mr-1 h-3 w-3" />
                              {candidate.location}
                            </span>
                          )}
                          {candidate.experience_years && (
                            <span className="flex items-center">
                              <Briefcase className="mr-1 h-3 w-3" />
                              {candidate.experience_years} years exp.
                            </span>
                          )}
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex flex-wrap gap-1">
                            {candidate.skills.slice(0, 4).map((skill, index) => (
                              <Badge key={index} variant="outline" className="text-xs" data-testid={`badge-candidate-skill-${candidate.id}-${index}`}>
                                {skill}
                              </Badge>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" data-testid={`button-view-profile-${candidate.id}`}>
                              View Profile
                            </Button>
                            <Button size="sm" data-testid={`button-contact-${candidate.id}`}>
                              <MessageSquare className="mr-2 h-4 w-4" />
                              Contact
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {searchCandidatesMutation.isPending && (
                  <div className="text-center py-8">Searching for candidates...</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="applications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="mr-2 h-5 w-5" />
                  Applications
                </CardTitle>
                <CardDescription>
                  Review and manage job applications
                </CardDescription>
              </CardHeader>
              <CardContent>
                {applications?.length > 0 ? (
                  <div className="space-y-4">
                    {applications.map((application: Application & { job?: Job; seeker?: UserType }) => (
                      <div key={application.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold" data-testid={`text-applicant-name-${application.id}`}>
                              {application.seeker?.full_name || "Applicant"}
                            </h4>
                            <p className="text-sm text-gray-600" data-testid={`text-application-job-${application.id}`}>
                              Applied for {application.job?.title || "Job"}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                application.status === "shortlisted"
                                  ? "default"
                                  : application.status === "rejected"
                                  ? "destructive"
                                  : "secondary"
                              }
                              data-testid={`badge-application-status-${application.id}`}
                            >
                              {application.status}
                            </Badge>
                            {application.scores && (
                              <Badge variant="outline" data-testid={`badge-application-score-${application.id}`}>
                                <Star className="mr-1 h-3 w-3" />
                                {Math.round(application.scores.final * 100)}%
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                          <span className="flex items-center">
                            <Clock className="mr-1 h-3 w-3" />
                            {new Date(application.created_at).toLocaleDateString()}
                          </span>
                          {application.seeker?.location && (
                            <span className="flex items-center">
                              <MapPin className="mr-1 h-3 w-3" />
                              {application.seeker.location}
                            </span>
                          )}
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" data-testid={`button-view-resume-${application.id}`}>
                            View Resume
                          </Button>
                          <Button variant="outline" size="sm" data-testid={`button-schedule-interview-${application.id}`}>
                            <Calendar className="mr-2 h-4 w-4" />
                            Schedule Interview
                          </Button>
                          <Button size="sm" data-testid={`button-shortlist-${application.id}`}>
                            Shortlist
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No applications yet. Post some jobs to start receiving applications!
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
                  Manage upcoming and completed interviews
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  No interviews scheduled yet.
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
