import {} from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

interface UtilizationChartProps {
  data: any[];
  maxUtilization?: number;
  title?: string;
}

export const UtilizationChart: React.FC<UtilizationChartProps> = ({
  data,
  maxUtilization = 100,
  title = 'GPU Utilization'
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-dark-600">
        No data available
      </div>
    );
  }

  const latest = data[data.length - 1];

  return (
    <div className="bg-dark-800 rounded-lg p-4 border border-dark-700">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className="text-right">
          <div className="text-2xl font-bold text-accent-cyan">
            {latest?.utilization?.toFixed(1) ?? '0'}%
          </div>
          <div className="text-sm text-dark-600">Utilization</div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey="timestamp"
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            axisLine={{ stroke: '#334155' }}
            tickLine={false}
          />
          <YAxis
            domain={[0, maxUtilization]}
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            axisLine={{ stroke: '#334155' }}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px'
            }}
            labelStyle={{ color: '#fff' }}
            formatter={(value: any, name: any) => [
              `${value?.toFixed(1) ?? '0'}%`,
              name === 'utilization' ? 'Utilization' : name
            ]}
          />
          <ReferenceLine
            y={80}
            stroke="#ef4444"
            strokeDasharray="4 4"
            strokeWidth={2}
          />
          <ReferenceLine
            y={60}
            stroke="#f97316"
            strokeDasharray="4 4"
            strokeWidth={2}
            label={{ value: 'High Load', fill: '#f97316', fontSize: 10, position: 'insideBottomLeft' }}
          />
          <Area
            name="utilization"
            type="monotone"
            dataKey="utilization"
            stroke="#06b6d4"
            strokeWidth={2}
            fillOpacity={0.3}
            fill="#06b6d4"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
