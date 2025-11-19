'use client';

import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { PricePoint } from '@/services/priceHistoryService';
import { PriceDisplay } from './PriceDisplay';

interface PriceHistoryChartProps {
  data: PricePoint[];
  currentPrice?: number;
  title?: string;
  height?: number;
  showLegend?: boolean;
}

export function PriceHistoryChart({
  data,
  currentPrice,
  title = 'Price History',
  height = 300,
  showLegend = false,
}: PriceHistoryChartProps) {
  // Format data for chart - group by date if there are multiple entries per day
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    // Group by date and calculate average price per day
    const grouped = new Map<string, number[]>();
    
    for (const point of data) {
      const date = point.date.split('T')[0]; // Get YYYY-MM-DD
      if (!grouped.has(date)) {
        grouped.set(date, []);
      }
      grouped.get(date)!.push(point.price);
    }

    // Calculate daily averages and sort by date
    const result: Array<{ date: string; price: number; formattedDate: string }> = [];
    
    for (const [date, prices] of grouped.entries()) {
      const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
      const dateObj = new Date(date);
      const formattedDate = dateObj.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
      
      result.push({
        date,
        price: Number(avgPrice.toFixed(2)),
        formattedDate,
      });
    }

    // Sort by date
    result.sort((a, b) => a.date.localeCompare(b.date));

    // Add current price if provided and not already in data
    if (currentPrice && result.length > 0) {
      const lastEntry = result[result.length - 1];
      const today = new Date().toISOString().split('T')[0];
      
      if (lastEntry.date !== today) {
        result.push({
          date: today,
          price: currentPrice,
          formattedDate: new Date().toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          }),
        });
      } else {
        // Update last entry with current price
        lastEntry.price = currentPrice;
      }
    }

    return result;
  }, [data, currentPrice]);

  // Calculate price change
  const priceChange = useMemo(() => {
    if (chartData.length < 2) return null;
    
    const firstPrice = chartData[0].price;
    const lastPrice = chartData[chartData.length - 1].price;
    const change = lastPrice - firstPrice;
    const changePercent = (change / firstPrice) * 100;

    return {
      change,
      changePercent,
      isPositive: change >= 0,
    };
  }, [chartData]);

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>No price history data available</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const minPrice = Math.min(...chartData.map(d => d.price));
  const maxPrice = Math.max(...chartData.map(d => d.price));
  const priceRange = maxPrice - minPrice;
  const padding = priceRange * 0.1; // 10% padding

  // Format price for Y-axis
  const formatPrice = (value: number) => {
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}k`;
    }
    return `$${value.toFixed(0)}`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>
              {chartData.length} data point{chartData.length !== 1 ? 's' : ''} over time
            </CardDescription>
          </div>
          {priceChange && (
            <div className={`flex items-center gap-1 ${priceChange.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {priceChange.isPositive ? (
                <TrendingUp className="h-4 w-4" />
              ) : priceChange.change < 0 ? (
                <TrendingDown className="h-4 w-4" />
              ) : (
                <Minus className="h-4 w-4" />
              )}
              <span className="font-semibold">
                {priceChange.changePercent > 0 ? '+' : ''}
                {priceChange.changePercent.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
            <XAxis 
              dataKey="formattedDate" 
              className="text-xs"
              tick={{ fill: 'currentColor' }}
            />
            <YAxis 
              domain={[minPrice - padding, maxPrice + padding]}
              tickFormatter={formatPrice}
              className="text-xs"
              tick={{ fill: 'currentColor' }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 shadow-lg">
                      <p className="text-sm font-semibold mb-1">{data.formattedDate}</p>
                      <p className="text-sm">
                        <PriceDisplay price={data.price} fromCurrency="USD" />
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            {showLegend && <Legend />}
            <Line
              type="monotone"
              dataKey="price"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ r: 4, fill: 'hsl(var(--primary))' }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
        
        {priceChange && (
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-slate-600 dark:text-slate-400">Starting Price</p>
                <p className="font-semibold">
                  <PriceDisplay price={chartData[0].price} fromCurrency="USD" />
                </p>
              </div>
              <div>
                <p className="text-slate-600 dark:text-slate-400">Current Price</p>
                <p className="font-semibold">
                  <PriceDisplay price={chartData[chartData.length - 1].price} fromCurrency="USD" />
                </p>
              </div>
              <div>
                <p className="text-slate-600 dark:text-slate-400">Change</p>
                <p className={`font-semibold ${priceChange.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {priceChange.change > 0 ? '+' : ''}
                  <PriceDisplay price={priceChange.change} fromCurrency="USD" />
                  {' '}
                  ({priceChange.changePercent > 0 ? '+' : ''}
                  {priceChange.changePercent.toFixed(1)}%)
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

