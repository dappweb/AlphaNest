'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function SettingsPage() {
  const [slippage, setSlippage] = useState('0.5');
  const [deadline, setDeadline] = useState('20');
  
  return (
    <div className='space-y-6'>
      <h1 className='text-3xl font-bold'>Settings</h1>
      
      <Card className='p-6'>
        <h2 className='text-xl font-semibold mb-4'>Trading Settings</h2>
        <div className='space-y-4'>
          <div>
            <label className='block text-sm mb-2'>Slippage Tolerance (%)</label>
            <input 
              type='number' 
              value={slippage} 
              onChange={(e) => setSlippage(e.target.value)} 
              className='w-full p-2 border rounded bg-background'
            />
          </div>
          <div>
            <label className='block text-sm mb-2'>Transaction Deadline (minutes)</label>
            <input 
              type='number' 
              value={deadline} 
              onChange={(e) => setDeadline(e.target.value)} 
              className='w-full p-2 border rounded bg-background'
            />
          </div>
          <Button>Save Settings</Button>
        </div>
      </Card>
      
      <Card className='p-6'>
        <h2 className='text-xl font-semibold mb-4'>Notifications</h2>
        <div className='space-y-3'>
          <label className='flex items-center gap-2'>
            <input type='checkbox' defaultChecked />
            <span>Price Alerts</span>
          </label>
          <label className='flex items-center gap-2'>
            <input type='checkbox' defaultChecked />
            <span>New Token Launches</span>
          </label>
          <label className='flex items-center gap-2'>
            <input type='checkbox' />
            <span>Whale Activity</span>
          </label>
        </div>
      </Card>
    </div>
  );
}
