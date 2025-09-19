/**
 * Loading screen component for Finished Goods initialization
 * Displays during data sync with progress tracking
 */

'use client';

import { useEffect, useState } from 'react';
import { Loader2, Package, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

interface FinishedGoodsLoadingScreenProps {
  isVisible: boolean;
  progress: {
    stage: 'fetching' | 'storing' | 'processing' | 'complete' | null;
    message: string;
    percentage: number;
  };
  error: string | null;
  onRetry?: () => void;
  onCancel?: () => void;
}

export function FinishedGoodsLoadingScreen({
  isVisible,
  progress,
  error,
  onRetry,
  onCancel
}: FinishedGoodsLoadingScreenProps) {
  const [dots, setDots] = useState('');

  // Animated dots effect
  useEffect(() => {
    if (!isVisible || error) return;

    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === '...') return '';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, [isVisible, error]);

  // Don't render if not visible
  if (!isVisible) return null;

  const getStageIcon = () => {
    if (error) {
      return <AlertCircle className="h-8 w-8 text-destructive" />;
    }
    
    if (progress.stage === 'complete') {
      return <CheckCircle2 className="h-8 w-8 text-green-500" />;
    }

    return <Loader2 className="h-8 w-8 text-primary animate-spin" />;
  };

  const getStageColor = () => {
    if (error) return 'bg-destructive';
    if (progress.stage === 'complete') return 'bg-green-500';
    return 'bg-primary';
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-full max-w-md mx-auto p-4">
        <Card className="border-2 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-6">
              {/* Header */}
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center space-x-2">
                  <Package className="h-6 w-6 text-primary" />
                  <h2 className="text-lg font-semibold">Finished Goods</h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  {error ? 'Sync Failed' : 'Initializing data...'}
                </p>
              </div>

              {/* Icon and Status */}
              <div className="flex flex-col items-center space-y-4">
                {getStageIcon()}
                
                {!error && (
                  <div className="w-full space-y-3">
                    {/* Progress Bar */}
                    <div className="w-full">
                      <Progress 
                        value={progress.percentage} 
                        className="h-2"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>{progress.percentage}%</span>
                        <span>{progress.stage === 'complete' ? 'Complete' : 'In Progress'}</span>
                      </div>
                    </div>

                    {/* Stage Message */}
                    <div className="text-center">
                      <p className="text-sm font-medium">
                        {progress.message}{progress.stage !== 'complete' && !error && dots}
                      </p>
                    </div>

                    {/* Stage Indicators */}
                    <div className="grid grid-cols-4 gap-2 mt-4">
                      {[
                        { key: 'fetching', label: 'Fetch' },
                        { key: 'storing', label: 'Store' },
                        { key: 'processing', label: 'Process' },
                        { key: 'complete', label: 'Done' }
                      ].map((stage, index) => {
                        const isActive = progress.stage === stage.key;
                        const isCompleted = progress.percentage > (index + 1) * 25;
                        
                        return (
                          <div key={stage.key} className="flex flex-col items-center space-y-1">
                            <div 
                              className={`w-3 h-3 rounded-full transition-colors ${
                                isCompleted || isActive 
                                  ? getStageColor()
                                  : 'bg-muted'
                              }`}
                            />
                            <span className={`text-xs ${
                              isCompleted || isActive 
                                ? 'text-foreground font-medium' 
                                : 'text-muted-foreground'
                            }`}>
                              {stage.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Error State */}
                {error && (
                  <div className="w-full space-y-4">
                    <div className="text-center space-y-2">
                      <p className="text-sm font-medium text-destructive">
                        Synchronization Failed
                      </p>
                      <p className="text-xs text-muted-foreground break-words">
                        {error}
                      </p>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-2">
                      {onRetry && (
                        <Button 
                          onClick={onRetry}
                          size="sm"
                          className="flex-1"
                        >
                          <Loader2 className="h-4 w-4 mr-2" />
                          Retry Sync
                        </Button>
                      )}
                      {onCancel && (
                        <Button 
                          onClick={onCancel}
                          variant="outline"
                          size="sm"
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* Success State */}
                {progress.stage === 'complete' && !error && (
                  <div className="text-center space-y-2">
                    <p className="text-sm font-medium text-green-600">
                      Synchronization Complete!
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Data is ready for use
                    </p>
                  </div>
                )}
              </div>

              {/* Help Text */}
              {!error && progress.stage !== 'complete' && (
                <div className="text-center space-y-1">
                  <p className="text-xs text-muted-foreground">
                    Syncing data from iDempiere server
                  </p>
                  <p className="text-xs text-muted-foreground">
                    This may take a few moments...
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}