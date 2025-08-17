import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, User, MapPin, Briefcase, Plus, X, Save, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import FileUpload from "@/components/ui/file-upload";
import { useFileUpload } from "@/hooks/use-file-upload";

const profileSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  headline: z.string().optional(),
  location: z.string().optional(),
  experience_years: z.number().optional(),
});

type ProfileData = z.infer<typeof profileSchema>;

export default function EditProfile() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newSkill, setNewSkill] = useState("");

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["/api/me"],
    enabled: !!user,
  });

  const form = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile?.full_name || "",
      headline: profile?.headline || "",
      location: profile?.location || "",
      experience_years: profile?.experience_years || undefined,
    },
  });

  // Update form when profile data loads
  React.useEffect(() => {
    if (profile) {
      form.reset({
        full_name: profile.full_name || "",
        headline: profile.headline || "",
        location: profile.location || "",
        experience_years: profile.experience_years || undefined,
      });
      setSkills(profile.skills || []);
    }
  }, [profile, form]);

  const [skills, setSkills] = useState<string[]>(profile?.skills || []);

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

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileData & { skills: string[] }) => {
      const response = await apiRequest("PUT", "/api/me/update", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map(part => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
  };

  const onSubmit = (data: ProfileData) => {
    updateProfileMutation.mutate({
      ...data,
      skills,
    });
  };

  const handleResumeSelect = (file: File) => {
    selectFile(file);
  };

  const handleResumeUpload = () => {
    uploadFile();
  };

  if (!user) return null;

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

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
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-primary text-white text-xl font-bold">
                {getUserInitials(profile?.full_name || user.full_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Profile</h1>
              <p className="text-gray-600">Update your information and preferences</p>
            </div>
          </div>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2 h-5 w-5" />
                Basic Information
              </CardTitle>
              <CardDescription>
                Your personal details and professional headline
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    {...form.register("full_name")}
                    data-testid="input-full-name"
                  />
                  {form.formState.errors.full_name && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.full_name.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="e.g., San Francisco, CA"
                    {...form.register("location")}
                    data-testid="input-location"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="headline">Professional Headline</Label>
                <Input
                  id="headline"
                  placeholder="e.g., Senior Software Engineer"
                  {...form.register("headline")}
                  data-testid="input-headline"
                />
              </div>

              {user.role === 'seeker' && (
                <div>
                  <Label htmlFor="experience_years">Years of Experience</Label>
                  <Input
                    id="experience_years"
                    type="number"
                    min="0"
                    max="50"
                    placeholder="e.g., 5"
                    {...form.register("experience_years", { valueAsNumber: true })}
                    data-testid="input-experience-years"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Skills */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Briefcase className="mr-2 h-5 w-5" />
                Skills
              </CardTitle>
              <CardDescription>
                Add your technical and professional skills
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="Add a skill"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                  data-testid="input-new-skill"
                />
                <Button
                  type="button"
                  onClick={addSkill}
                  disabled={!newSkill.trim()}
                  data-testid="add-skill-button"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="flex items-center space-x-1"
                      data-testid={`skill-badge-${index}`}
                    >
                      <span>{skill}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 hover:bg-transparent"
                        onClick={() => removeSkill(skill)}
                        data-testid={`remove-skill-${index}`}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}

              {skills.length === 0 && (
                <p className="text-sm text-gray-500">No skills added yet</p>
              )}
            </CardContent>
          </Card>

          {/* Resume Upload (Job Seekers only) */}
          {user.role === 'seeker' && (
            <Card>
              <CardHeader>
                <CardTitle>Resume</CardTitle>
                <CardDescription>
                  Upload your resume to improve job matching accuracy
                </CardDescription>
              </CardHeader>
              <CardContent>
                {profile?.resume_file_path ? (
                  <div className="space-y-4">
                    <Alert data-testid="current-resume">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Current resume uploaded. You can upload a new one to replace it.
                      </AlertDescription>
                    </Alert>
                    
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
                        type="button"
                        onClick={handleResumeUpload}
                        data-testid="upload-resume-button"
                      >
                        Upload New Resume
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
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
                        type="button"
                        onClick={handleResumeUpload}
                        data-testid="upload-resume-button"
                      >
                        Upload Resume
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Form Actions */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation(user.role === "seeker" ? "/dashboard/job-seeker" : "/dashboard/recruiter")}
              data-testid="cancel-button"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateProfileMutation.isPending}
              data-testid="save-profile-button"
            >
              {updateProfileMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
