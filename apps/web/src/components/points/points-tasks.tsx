'use client';

import { Check, Clock, ArrowRight, Wallet, RefreshCw, Shield, Users, Share2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Task {
  id: string;
  title: string;
  description: string;
  points: number;
  icon: React.ReactNode;
  status: 'available' | 'completed' | 'locked';
  type: 'daily' | 'weekly' | 'one-time';
  progress?: { current: number; total: number };
}

const TASKS: Task[] = [
  {
    id: 'connect-wallet',
    title: 'Connect Wallet',
    description: 'Connect your wallet to start earning',
    points: 100,
    icon: <Wallet className="h-5 w-5" />,
    status: 'completed',
    type: 'one-time',
  },
  {
    id: 'daily-check-in',
    title: 'Daily Check-in',
    description: 'Visit the platform daily',
    points: 10,
    icon: <Clock className="h-5 w-5" />,
    status: 'available',
    type: 'daily',
  },
  {
    id: 'first-trade',
    title: 'Execute First Trade',
    description: 'Complete your first swap',
    points: 200,
    icon: <RefreshCw className="h-5 w-5" />,
    status: 'available',
    type: 'one-time',
  },
  {
    id: 'buy-insurance',
    title: 'Purchase Insurance',
    description: 'Buy your first AlphaGuard policy',
    points: 500,
    icon: <Shield className="h-5 w-5" />,
    status: 'available',
    type: 'one-time',
  },
  {
    id: 'refer-friend',
    title: 'Refer a Friend',
    description: 'Invite friends to join AlphaNest',
    points: 1000,
    icon: <Users className="h-5 w-5" />,
    status: 'available',
    type: 'one-time',
    progress: { current: 0, total: 3 },
  },
  {
    id: 'weekly-volume',
    title: 'Weekly Trading Volume',
    description: 'Trade $1,000 in volume this week',
    points: 250,
    icon: <RefreshCw className="h-5 w-5" />,
    status: 'available',
    type: 'weekly',
    progress: { current: 450, total: 1000 },
  },
  {
    id: 'share-social',
    title: 'Share on Social',
    description: 'Share your trading stats on Twitter',
    points: 50,
    icon: <Share2 className="h-5 w-5" />,
    status: 'available',
    type: 'daily',
  },
];

export function PointsTasks() {
  const dailyTasks = TASKS.filter((t) => t.type === 'daily');
  const weeklyTasks = TASKS.filter((t) => t.type === 'weekly');
  const oneTimeTasks = TASKS.filter((t) => t.type === 'one-time');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Earn Points</span>
          <Badge variant="outline">
            {TASKS.filter((t) => t.status === 'completed').length}/{TASKS.length} Completed
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Daily Tasks */}
        <div>
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">Daily Tasks</h3>
          <div className="space-y-2">
            {dailyTasks.map((task) => (
              <TaskItem key={task.id} task={task} />
            ))}
          </div>
        </div>

        {/* Weekly Tasks */}
        <div>
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">Weekly Tasks</h3>
          <div className="space-y-2">
            {weeklyTasks.map((task) => (
              <TaskItem key={task.id} task={task} />
            ))}
          </div>
        </div>

        {/* One-time Tasks */}
        <div>
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">One-time Tasks</h3>
          <div className="space-y-2">
            {oneTimeTasks.map((task) => (
              <TaskItem key={task.id} task={task} />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TaskItem({ task }: { task: Task }) {
  const isCompleted = task.status === 'completed';
  const isLocked = task.status === 'locked';

  return (
    <div
      className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${
        isCompleted
          ? 'border-success/30 bg-success/5'
          : isLocked
          ? 'opacity-50'
          : 'hover:bg-secondary/50'
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${
            isCompleted ? 'bg-success/20 text-success' : 'bg-secondary text-muted-foreground'
          }`}
        >
          {isCompleted ? <Check className="h-5 w-5" /> : task.icon}
        </div>
        <div>
          <p className="font-medium">{task.title}</p>
          <p className="text-sm text-muted-foreground">{task.description}</p>
          {task.progress && (
            <div className="mt-1 flex items-center gap-2">
              <div className="h-1.5 w-24 rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${(task.progress.current / task.progress.total) * 100}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">
                {task.progress.current}/{task.progress.total}
              </span>
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Badge variant="outline" className="font-mono">
          +{task.points}
        </Badge>
        {!isCompleted && !isLocked && (
          <Button size="sm" variant="ghost">
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
