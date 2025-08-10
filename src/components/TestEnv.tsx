import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const TestEnv: React.FC = () => {
  const envVars = {
    'VITE_GIGACHAT_CLIENT_ID': import.meta.env.VITE_GIGACHAT_CLIENT_ID,
    'VITE_GIGACHAT_CLIENT_SECRET': import.meta.env.VITE_GIGACHAT_CLIENT_SECRET,
    'NODE_ENV': import.meta.env.NODE_ENV,
    'DEV': import.meta.env.DEV,
    'BASE_URL': import.meta.env.BASE_URL
  };

  const hasValidKeys = envVars['VITE_GIGACHAT_CLIENT_ID'] && 
                      envVars['VITE_GIGACHAT_CLIENT_SECRET'] &&
                      !envVars['VITE_GIGACHAT_CLIENT_ID'].includes('your_') &&
                      !envVars['VITE_GIGACHAT_CLIENT_SECRET'].includes('your_');

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🧪 Тест переменных окружения
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">🔑 Переменные окружения:</h3>
          <div className="space-y-2">
            {Object.entries(envVars).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2">
                <Badge variant={value ? 'default' : 'destructive'}>
                  {value ? '✅' : '❌'}
                </Badge>
                <span className="font-mono text-sm">
                  <strong>{key}:</strong> {value || 'НЕ УСТАНОВЛЕНО'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="text-lg font-semibold mb-2">🎨 Поддержка генерации изображений:</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant={hasValidKeys ? 'default' : 'destructive'}>
                {hasValidKeys ? '✅ Доступно' : '❌ Недоступно'}
              </Badge>
              <span>Статус</span>
            </div>
            
            <div className="text-sm text-muted-foreground">
              <strong>Причина:</strong> {
                !envVars['VITE_GIGACHAT_CLIENT_ID'] ? 'Отсутствует CLIENT_ID' :
                !envVars['VITE_GIGACHAT_CLIENT_SECRET'] ? 'Отсутствует CLIENT_SECRET' :
                envVars['VITE_GIGACHAT_CLIENT_ID'].includes('your_') || 
                envVars['VITE_GIGACHAT_CLIENT_SECRET'].includes('your_') ? 'Placeholder значения' :
                'Неизвестно'
              }
            </div>
          </div>
        </div>

        <Separator />

        <div className="text-sm text-muted-foreground">
          <p><strong>💡 Подсказка:</strong> Если переменные не читаются, попробуйте:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Перезапустить приложение (npm run dev)</li>
            <li>Проверить, что файл .env находится в корне проекта</li>
            <li>Убедиться, что переменные начинаются с VITE_</li>
            <li>Проверить консоль браузера на ошибки</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

const Separator = () => <div className="border-t my-4" />;
