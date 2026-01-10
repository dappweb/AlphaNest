'use client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function CopyTradePage() {
  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold'>Copy Trading</h1>
        <p className='text-muted-foreground mt-2'>Follow top traders and copy their strategies</p>
      </div>
      
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <Card className='p-4'>
          <div className='text-sm text-muted-foreground'>Top Trader PnL</div>
          <div className='text-2xl font-bold text-green-500'>+\.2M</div>
        </Card>
        <Card className='p-4'>
          <div className='text-sm text-muted-foreground'>Active Traders</div>
          <div className='text-2xl font-bold'>1,234</div>
        </Card>
        <Card className='p-4'>
          <div className='text-sm text-muted-foreground'>Your Following</div>
          <div className='text-2xl font-bold'>0</div>
        </Card>
      </div>
      
      <Card className='p-6'>
        <h2 className='text-xl font-semibold mb-4'>Coming Soon</h2>
        <p className='text-muted-foreground mb-4'>
          Copy trading feature is under development. Follow top-performing traders automatically.
        </p>
        <Button disabled>Explore Traders</Button>
      </Card>
    </div>
  );
}
