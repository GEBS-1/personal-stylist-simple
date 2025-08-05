import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AIService } from '@/services/aiService';
import { EnhancedMarketplaceService } from '@/services/enhancedMarketplaceService';

interface APIStatus {
  ai: {
    provider: string;
    status: 'loading' | 'success' | 'error' | 'simulation';
    message: string;
  };
  marketplace: {
    ozon: 'loading' | 'success' | 'error' | 'fallback';
    wildberries: 'loading' | 'success' | 'error' | 'fallback';
    lamoda: 'loading' | 'success' | 'error' | 'fallback';
  };
}

const TestAPI: React.FC = () => {
  const [status, setStatus] = useState<APIStatus>({
    ai: { provider: 'simulation', status: 'loading', message: 'Initializing...' },
    marketplace: {
      ozon: 'loading',
      wildberries: 'loading',
      lamoda: 'loading'
    }
  });
  const [testResult, setTestResult] = useState<string>('');

  const aiService = new AIService();
  const marketplaceService = new EnhancedMarketplaceService();

  useEffect(() => {
    testAIService();
    testMarketplaceService();
  }, []);

  const testAIService = async () => {
    try {
      setStatus(prev => ({
        ...prev,
        ai: { provider: 'testing', status: 'loading', message: 'Testing AI providers...' }
      }));

      const testRequest = {
        bodyType: 'hourglass',
        measurements: { height: 165, chest: 90, waist: 70, hips: 95, shoulders: 40 },
        stylePreferences: ['casual'],
        colorPreferences: ['blue', 'white'],
        occasion: 'casual',
        season: 'summer',
        budget: 'medium'
      };

      const result = await aiService.generateOutfit(testRequest);
      const currentProvider = aiService.getCurrentProvider();

      setStatus(prev => ({
        ...prev,
        ai: {
          provider: currentProvider,
          status: currentProvider === 'simulation' ? 'simulation' : 'success',
          message: currentProvider === 'simulation' 
            ? 'Using simulation mode (API keys not configured or regional restrictions)'
            : `Successfully generated outfit with ${currentProvider}`
        }
      }));

      setTestResult(JSON.stringify(result, null, 2));
    } catch (error) {
      setStatus(prev => ({
        ...prev,
        ai: {
          provider: 'error',
          status: 'error',
          message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      }));
    }
  };

  const testMarketplaceService = async () => {
    try {
      const recommendations = await marketplaceService.getRecommendations(
        'hourglass',
        'casual',
        'medium',
        'female'
      );

      setStatus(prev => ({
        ...prev,
        marketplace: {
          ozon: recommendations.some(p => p.marketplace === 'ozon') ? 'success' : 'fallback',
          wildberries: recommendations.some(p => p.marketplace === 'wildberries') ? 'success' : 'fallback',
          lamoda: recommendations.some(p => p.marketplace === 'lamoda') ? 'success' : 'fallback'
        }
      }));
    } catch (error) {
      setStatus(prev => ({
        ...prev,
        marketplace: {
          ozon: 'error',
          wildberries: 'error',
          lamoda: 'error'
        }
      }));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      case 'loading': return 'bg-yellow-500';
      case 'simulation':
      case 'fallback': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'success': return 'Success';
      case 'error': return 'Error';
      case 'loading': return 'Loading';
      case 'simulation': return 'Simulation';
      case 'fallback': return 'Fallback';
      default: return 'Unknown';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>API Status Test</CardTitle>
          <CardDescription>
            Проверка подключения к AI сервисам и маркетплейсам
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* AI Service Status */}
          <div>
            <h3 className="text-lg font-semibold mb-2">AI Service</h3>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(status.ai.status)}>
                {getStatusText(status.ai.status)}
              </Badge>
              <span className="text-sm text-gray-600">
                Provider: {status.ai.provider}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">{status.ai.message}</p>
          </div>

          {/* Marketplace Status */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Marketplace Services</h3>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(status.marketplace).map(([marketplace, marketStatus]) => (
                <div key={marketplace} className="flex items-center gap-2">
                  <Badge className={getStatusColor(marketStatus)}>
                    {getStatusText(marketStatus)}
                  </Badge>
                  <span className="text-sm capitalize">{marketplace}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Test Buttons */}
          <div className="flex gap-2">
            <Button onClick={testAIService} variant="outline">
              Test AI Service
            </Button>
            <Button onClick={testMarketplaceService} variant="outline">
              Test Marketplace
            </Button>
          </div>

          {/* Test Result */}
          {testResult && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Test Result</h3>
              <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-64">
                {testResult}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TestAPI; 