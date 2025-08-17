import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar as CalendarIcon, Clock, Video, Plus, User, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimeSlot {
  start_time: string;
  end_time: string;
}

interface Interview {
  id: string;
  job_id: string;
  seeker_id: string;
  recruiter_id: string;
  start_time: string;
  end_time: string;
  meeting_link?: string;
  status: 'scheduled' | 'rescheduled' | 'cancelled' | 'completed';
  notes?: string;
  job?: {
    title: string;
    company: string;
  };
  seeker?: {
    full_name: string;
    email: string;
  };
  recruiter?: {
    full_name: string;
    email: string;
  };
}

interface CalendarSchedulerProps {
  interviews: Interview[];
  availableSlots: TimeSlot[];
  onScheduleInterview: (data: {
    job_id: string;
    seeker_id: string;
    start_time: string;
    end_time: string;
    notes?: string;
  }) => void;
  onUpdateInterview: (interviewId: string, data: {
    start_time?: string;
    end_time?: string;
    status?: string;
    notes?: string;
  }) => void;
  onCancelInterview: (interviewId: string) => void;
  userRole: 'seeker' | 'recruiter';
  isLoading?: boolean;
  className?: string;
}

export default function CalendarScheduler({
  interviews,
  availableSlots,
  onScheduleInterview,
  onUpdateInterview,
  onCancelInterview,
  userRole,
  isLoading = false,
  className
}: CalendarSchedulerProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    job_id: '',
    seeker_id: '',
    start_time: '',
    end_time: '',
    notes: ''
  });

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'rescheduled':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getInterviewsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return interviews.filter(interview => 
      interview.start_time.startsWith(dateStr)
    );
  };

  const getAvailableSlotsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return availableSlots.filter(slot => 
      slot.start_time.startsWith(dateStr)
    );
  };

  const handleScheduleSubmit = () => {
    if (scheduleForm.job_id && scheduleForm.seeker_id && scheduleForm.start_time && scheduleForm.end_time) {
      onScheduleInterview(scheduleForm);
      setIsScheduleDialogOpen(false);
      setScheduleForm({
        job_id: '',
        seeker_id: '',
        start_time: '',
        end_time: '',
        notes: ''
      });
    }
  };

  const todaysInterviews = getInterviewsForDate(selectedDate);
  const todaysAvailableSlots = getAvailableSlotsForDate(selectedDate);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Calendar Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <CalendarIcon className="h-5 w-5" />
                <span>Interview Schedule</span>
              </CardTitle>
              <CardDescription>
                Manage your interview appointments
              </CardDescription>
            </div>
            
            {userRole === 'recruiter' && (
              <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="schedule-interview-button">
                    <Plus className="h-4 w-4 mr-2" />
                    Schedule Interview
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Schedule New Interview</DialogTitle>
                    <DialogDescription>
                      Set up a new interview appointment
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="job_id">Job</Label>
                      <Input
                        id="job_id"
                        value={scheduleForm.job_id}
                        onChange={(e) => setScheduleForm(prev => ({ ...prev, job_id: e.target.value }))}
                        placeholder="Job ID"
                        data-testid="schedule-job-input"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="seeker_id">Candidate</Label>
                      <Input
                        id="seeker_id"
                        value={scheduleForm.seeker_id}
                        onChange={(e) => setScheduleForm(prev => ({ ...prev, seeker_id: e.target.value }))}
                        placeholder="Candidate ID"
                        data-testid="schedule-candidate-input"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="start_time">Start Time</Label>
                        <Input
                          id="start_time"
                          type="datetime-local"
                          value={scheduleForm.start_time}
                          onChange={(e) => setScheduleForm(prev => ({ ...prev, start_time: e.target.value }))}
                          data-testid="schedule-start-time-input"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="end_time">End Time</Label>
                        <Input
                          id="end_time"
                          type="datetime-local"
                          value={scheduleForm.end_time}
                          onChange={(e) => setScheduleForm(prev => ({ ...prev, end_time: e.target.value }))}
                          data-testid="schedule-end-time-input"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="notes">Notes (Optional)</Label>
                      <Textarea
                        id="notes"
                        value={scheduleForm.notes}
                        onChange={(e) => setScheduleForm(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Interview notes or instructions"
                        data-testid="schedule-notes-input"
                      />
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button 
                        onClick={() => setIsScheduleDialogOpen(false)} 
                        variant="outline"
                        data-testid="schedule-cancel-button"
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleScheduleSubmit}
                        disabled={!scheduleForm.job_id || !scheduleForm.seeker_id || !scheduleForm.start_time || !scheduleForm.end_time}
                        data-testid="schedule-submit-button"
                      >
                        Schedule
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="rounded-md border"
              data-testid="interview-calendar"
            />
          </CardContent>
        </Card>

        {/* Schedule for Selected Date */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">
              {formatDate(selectedDate)}
            </CardTitle>
            <CardDescription>
              {todaysInterviews.length} interview{todaysInterviews.length !== 1 ? 's' : ''} scheduled
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {todaysInterviews.length === 0 ? (
                <div className="text-center py-8 text-gray-500" data-testid="no-interviews">
                  <CalendarIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p>No interviews scheduled for this date</p>
                </div>
              ) : (
                todaysInterviews.map((interview) => (
                  <div 
                    key={interview.id} 
                    className="border rounded-lg p-4 space-y-3"
                    data-testid={`interview-${interview.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Clock className="h-4 w-4" />
                          <span data-testid="interview-time">
                            {formatTime(interview.start_time)} - {formatTime(interview.end_time)}
                          </span>
                        </div>
                        <Badge className={getStatusColor(interview.status)} data-testid="interview-status">
                          {interview.status}
                        </Badge>
                      </div>
                      
                      {interview.meeting_link && (
                        <Button size="sm" variant="outline" asChild data-testid="join-meeting-button">
                          <a href={interview.meeting_link} target="_blank" rel="noopener noreferrer">
                            <Video className="h-4 w-4 mr-2" />
                            Join
                          </a>
                        </Button>
                      )}
                    </div>

                    <div className="space-y-2">
                      {interview.job && (
                        <div className="flex items-center space-x-2 text-sm">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span data-testid="interview-job">
                            {interview.job.title} at {interview.job.company}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-2 text-sm">
                        <User className="h-4 w-4 text-gray-400" />
                        <span data-testid="interview-participant">
                          {userRole === 'recruiter' 
                            ? `with ${interview.seeker?.full_name}`
                            : `with ${interview.recruiter?.full_name}`
                          }
                        </span>
                      </div>
                    </div>

                    {interview.notes && (
                      <div className="text-sm text-gray-600 bg-gray-50 rounded p-2">
                        <strong>Notes:</strong> {interview.notes}
                      </div>
                    )}

                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => onUpdateInterview(interview.id, { status: 'rescheduled' })}
                        disabled={interview.status === 'completed' || interview.status === 'cancelled'}
                        data-testid={`reschedule-interview-${interview.id}`}
                      >
                        Reschedule
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => onCancelInterview(interview.id)}
                        disabled={interview.status === 'completed' || interview.status === 'cancelled'}
                        data-testid={`cancel-interview-${interview.id}`}
                      >
                        Cancel
                      </Button>
                      {interview.status === 'scheduled' && (
                        <Button 
                          size="sm"
                          onClick={() => onUpdateInterview(interview.id, { status: 'completed' })}
                          data-testid={`complete-interview-${interview.id}`}
                        >
                          Mark Complete
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}

              {/* Available Time Slots */}
              {todaysAvailableSlots.length > 0 && userRole === 'recruiter' && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Available Time Slots</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {todaysAvailableSlots.slice(0, 6).map((slot, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        data-testid={`available-slot-${index}`}
                      >
                        {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading && (
        <Alert data-testid="calendar-loading">
          <AlertDescription>Loading calendar data...</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
