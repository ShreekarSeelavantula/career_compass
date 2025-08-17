import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  MapPin, 
  Briefcase, 
  Star, 
  MessageSquare,
  Calendar,
  FileText,
  User,
  Mail,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { User as UserType } from "@shared/schema";

interface CandidateCardProps {
  candidate: UserType & { 
    matchScore?: number;
    applicationStatus?: string;
    appliedDate?: string;
  };
  onViewProfile?: (candidateId: string) => void;
  onContact?: (candidateId: string) => void;
  onScheduleInterview?: (candidateId: string) => void;
  onViewResume?: (candidateId: string) => void;
  onShortlist?: (candidateId: string) => void;
  onUpdateStatus?: (candidateId: string, status: string) => void;
  showMatchScore?: boolean;
  showApplicationStatus?: boolean;
  userRole?: 'recruiter' | 'seeker';
  className?: string;
}

export default function CandidateCard({
  candidate,
  onViewProfile,
  onContact,
  onScheduleInterview,
  onViewResume,
  onShortlist,
  onUpdateStatus,
  showMatchScore = false,
  showApplicationStatus = false,
  userRole = 'recruiter',
  className
}: CandidateCardProps) {
  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map(part => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getMatchScoreColor = (score?: number) => {
    if (!score) return '';
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 75) return 'text-blue-600 bg-blue-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'applied':
        return 'bg-blue-100 text-blue-800';
      case 'screening':
        return 'bg-yellow-100 text-yellow-800';
      case 'shortlisted':
        return 'bg-purple-100 text-purple-800';
      case 'interviewed':
        return 'bg-indigo-100 text-indigo-800';
      case 'offered':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <Card className={cn("hover:shadow-md transition-shadow duration-200", className)} data-testid={`candidate-card-${candidate.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start space-x-4">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-primary text-white font-medium">
              {getUserInitials(candidate.full_name)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg line-clamp-1" data-testid="candidate-name">
                  {candidate.full_name}
                </CardTitle>
                <CardDescription className="line-clamp-1" data-testid="candidate-headline">
                  {candidate.headline || 'Professional'}
                </CardDescription>
              </div>
              
              <div className="flex items-center space-x-2 ml-4">
                {showMatchScore && candidate.matchScore && (
                  <Badge 
                    className={cn("font-semibold", getMatchScoreColor(candidate.matchScore))}
                    data-testid="candidate-match-score"
                  >
                    <Star className="h-3 w-3 mr-1" />
                    {Math.round(candidate.matchScore)}%
                  </Badge>
                )}
                
                {showApplicationStatus && candidate.applicationStatus && (
                  <Badge 
                    className={getStatusColor(candidate.applicationStatus)}
                    data-testid="candidate-application-status"
                  >
                    {candidate.applicationStatus}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Candidate Details */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
          {candidate.location && (
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-1" />
              <span data-testid="candidate-location">{candidate.location}</span>
            </div>
          )}
          
          {candidate.experience_years && (
            <div className="flex items-center">
              <Briefcase className="h-4 w-4 mr-1" />
              <span data-testid="candidate-experience">
                {candidate.experience_years} years experience
              </span>
            </div>
          )}
          
          <div className="flex items-center">
            <Mail className="h-4 w-4 mr-1" />
            <span data-testid="candidate-email">{candidate.email}</span>
          </div>

          {showApplicationStatus && candidate.appliedDate && (
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              <span data-testid="candidate-applied-date">
                Applied {formatDate(candidate.appliedDate)}
              </span>
            </div>
          )}
        </div>

        {/* Skills */}
        {candidate.skills && candidate.skills.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-900">Skills:</div>
            <div className="flex flex-wrap gap-1">
              {candidate.skills.slice(0, 6).map((skill, index) => (
                <Badge 
                  key={index} 
                  variant="outline" 
                  className="text-xs"
                  data-testid={`candidate-skill-${index}`}
                >
                  {skill}
                </Badge>
              ))}
              {candidate.skills.length > 6 && (
                <Badge variant="outline" className="text-xs">
                  +{candidate.skills.length - 6} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Resume Status */}
        {candidate.resume_file_path && (
          <div className="flex items-center text-sm text-green-600">
            <FileText className="h-4 w-4 mr-1" />
            <span data-testid="resume-status">Resume available</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onViewProfile?.(candidate.id)}
            data-testid="view-profile-button"
          >
            <User className="h-4 w-4 mr-2" />
            View Profile
          </Button>
          
          <div className="flex space-x-2">
            {candidate.resume_file_path && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewResume?.(candidate.id)}
                data-testid="view-resume-button"
              >
                <FileText className="h-4 w-4 mr-2" />
                Resume
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onContact?.(candidate.id)}
              data-testid="contact-button"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Message
            </Button>
            
            {showApplicationStatus && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onScheduleInterview?.(candidate.id)}
                  data-testid="schedule-interview-button"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Interview
                </Button>
                
                <Button
                  size="sm"
                  onClick={() => onShortlist?.(candidate.id)}
                  disabled={candidate.applicationStatus === 'shortlisted'}
                  data-testid="shortlist-button"
                >
                  {candidate.applicationStatus === 'shortlisted' ? 'Shortlisted' : 'Shortlist'}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Status Update Actions */}
        {showApplicationStatus && candidate.applicationStatus && (
          <div className="flex space-x-2 pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onUpdateStatus?.(candidate.id, 'screening')}
              disabled={candidate.applicationStatus === 'screening'}
              data-testid="move-to-screening-button"
            >
              Move to Screening
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onUpdateStatus?.(candidate.id, 'rejected')}
              disabled={candidate.applicationStatus === 'rejected'}
              data-testid="reject-button"
            >
              Reject
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
