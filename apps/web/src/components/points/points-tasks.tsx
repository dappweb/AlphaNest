'use client';

import { useState, useEffect } from 'react';
import { Check, Clock, ArrowRight, Wallet, RefreshCw, Shield, Users, Share2, Loader2 } from 'lucide-react';
import { useAccount } from 'wagmi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePointsInfo } from '@/hooks/use-alphanest-core';
import { useUserPolicies } from '@/hooks/use-alphaguard';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://alphanest-api.dappweb.workers.dev';

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
    description: 'Invite friends to join PopCow',
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
  const { isConnected, address } = useAccount();
  const { pointsInfo } = usePointsInfo();
  const { policyIds } = useUserPolicies();
  const [tasks, setTasks] = useState<Task[]>(TASKS);
  const [completingTask, setCompletingTask] = useState<string | null>(null);

  // Update task statuses based on user state
  useEffect(() => {
    setTasks((prevTasks) =>
      prevTasks.map((task) => {
        if (task.id === 'connect-wallet') {
          return { ...task, status: isConnected ? 'completed' : 'available' };
        }
        if (task.id === 'buy-insurance' && policyIds && policyIds.length > 0) {
          return { ...task, status: 'completed' };
        }
        // Add more task status checks here
        return task;
      })
    );
  }, [isConnected, policyIds]);

  const handleCompleteTask = async (task: Task) => {
    if (task.status === 'completed' || task.status === 'locked') return;
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    setCompletingTask(task.id);

    try {
      // Call backend API to record task completion
      const response = await fetch(`${API_URL}/api/v1/points/complete-task`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId: task.id,
          address: address,
        }),
      });

      if (response.ok) {
        // Update task status locally
        setTasks((prevTasks) =>
          prevTasks.map((t) => (t.id === task.id ? { ...t, status: 'completed' as const } : t))
        );
      } else {
        // For tasks that don't require backend (like daily check-in)
        if (task.id === 'daily-check-in') {
          // Store in localStorage
          const lastCheckIn = localStorage.getItem('lastCheckIn');
          const today = new Date().toDateString();
          if (lastCheckIn !== today) {
            localStorage.setItem('lastCheckIn', today);
            setTasks((prevTasks) =>
              prevTasks.map((t) => (t.id === task.id ? { ...t, status: 'completed' as const } : t))
            );
          }
        } else {
          alert('Failed to complete task. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error completing task:', error);
      // For daily check-in, still allow local completion
      if (task.id === 'daily-check-in') {
        const lastCheckIn = localStorage.getItem('lastCheckIn');
        const today = new Date().toDateString();
        if (lastCheckIn !== today) {
          localStorage.setItem('lastCheckIn', today);
          setTasks((prevTasks) =>
            prevTasks.map((t) => (t.id === task.id ? { ...t, status: 'completed' as const } : t))
          );
        }
      } else {
        alert('Failed to complete task. Please try again.');
      }
    } finally {
      setCompletingTask(null);
    }
  };

  const dailyTasks = tasks.filter((t) => t.type === 'daily');
  const weeklyTasks = tasks.filter((t) => t.type === 'weekly');
  const oneTimeTasks = tasks.filter((t) => t.type === 'one-time');

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
              <TaskItem
                key={task.id}
                task={task}
                onComplete={() => handleCompleteTask(task)}
                isCompleting={completingTask === task.id}
              />
            ))}
          </div>
        </div>

        {/* Weekly Tasks */}
        <div>
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">Weekly Tasks</h3>
          <div className="space-y-2">
            {weeklyTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onComplete={() => handleCompleteTask(task)}
                isCompleting={completingTask === task.id}
              />
            ))}
          </div>
        </div>

        {/* One-time Tasks */}
        <div>
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">One-time Tasks</h3>
          <div className="space-y-2">
            {oneTimeTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onComplete={() => handleCompleteTask(task)}
                isCompleting={completingTask === task.id}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TaskItem({
  task,
  onComplete,
  isCompleting,
}: {
  task: Task;
  onComplete: () => void;
  isCompleting: boolean;
}) {
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
          <Button
            size="sm"
            variant="ghost"
            onClick={onComplete}
            disabled={isCompleting}
          >
            {isCompleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowRight className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
