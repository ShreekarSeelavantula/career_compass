import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  Clock, 
  Briefcase, 
  Star, 
  Building2,
  Calendar,
  DollarSign,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Job } from "@shared/schema";

interface JobCardProps {
  job: Job & { 
    matchScore?: number;
    applicantCount?: number;
  };
  onApply?: (jobId: string) => void;
  onViewDetails?: (jobId: string) => void;
  onEdit?: (jobId: string) => void;
  onViewApplicants?: (jobId: string) => void;
  showMatchScore?: boolean;
  showApplicantCount?: boolean;
  userRole?: 'seeker' | 'recruiter';
  applied?: boolean;
  className?: string;
}

export default function JobCard({
  job,
  onApply,
  onViewDetails,
  onEdit,
  onViewApplicants,
  showMatchScore = false,
  showApplicantCount = false,
  userRole = 'seeker',
  applied = false,
  className
}: JobCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const getMatchScoreColor = (score?: number) => {
    if (!score) return '';
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 75) return 'text-blue-600 bg-blue-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className={cn("hover:shadow-md transition-shadow duration-200", className)} data-testid={`job-card-${job.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg line-clamp-1" data-testid="job-title">
              {job.title}
            </CardTitle>
            <CardDescription className="flex items-center mt-1">
              <Building2 className="h-4 w-4 mr-1" />
              <span data-testid="job-company">{job.company}</span>
            </CardDescription>
          </div>
          
          <div className="flex items-center space-x-2 ml-4">
            {showMatchScore && job.matchScore && (
              <Badge 
                className={cn("font-semibold", getMatchScoreColor(job.matchScore))}
                data-testid="match-score"
              >
                <Star className="h-3 w-3 mr-1" />
                {Math.round(job.matchScore)}%
              </Badge>
            )}
            
            <Badge 
              className={getStatusColor(job.status)}
              data-testid="job-status"
            >
              {job.status}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Job Details */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
          {job.location && (
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-1" />
              <span data-testid="job-location">{job.location}</span>
            </div>
          )}
          
          {job.employment_type && (
            <div className="flex items-center">
              <Briefcase className="h-4 w-4 mr-1" />
              <span data-testid="job-employment-type" className="capitalize">
                {job.employment_type.replace('-', ' ')}
              </span>
            </div>
          )}
          
          {job.min_exp && (
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              <span data-testid="job-min-experience">
                {job.min_exp}+ years
              </span>
            </div>
          )}
          
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            <span data-testid="job-posted-date">
              Posted {formatDate(job.created_at)}
            </span>
          </div>

          {showApplicantCount && job.applicantCount !== undefined && (
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-1" />
              <span data-testid="applicant-count">
                {job.applicantCount} applicant{job.applicantCount !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        {/* Job Description */}
        <p className="text-sm text-gray-700 line-clamp-3" data-testid="job-description">
          {job.description}
        </p>

        {/* Skills */}
        {job.skills_required && job.skills_required.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-900">Required Skills:</div>
            <div className="flex flex-wrap gap-1">
              {job.skills_required.slice(0, 6).map((skill, index) => (
                <Badge 
                  key={index} 
                  variant="outline" 
                  className="text-xs"
                  data-testid={`job-skill-${index}`}
                >
                  {skill}
                </Badge>
              ))}
              {job.skills_required.length > 6 && (
                <Badge variant="outline" className="text-xs">
                  +{job.skills_required.length - 6} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onViewDetails?.(job.id)}
            data-testid="view-details-button"
          >
            View Details
          </Button>
          
          <div className="flex space-x-2">
            {userRole === 'seeker' && (
              <Button
                size="sm"
                onClick={() => onApply?.(job.id)}
                disabled={applied || job.status !== 'open'}
                data-testid="apply-button"
              >
                {applied ? 'Applied' : 'Apply Now'}
              </Button>
            )}
            
            {userRole === 'recruiter' && (
              <>
                {showApplicantCount && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewApplicants?.(job.id)}
                    data-testid="view-applicants-button"
                  >
                    View Applicants
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit?.(job.id)}
                  data-testid="edit-job-button"
                >
                  Edit
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
