import {} from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

interface TempFanChartProps {
  data: any[];
  title?: string;
}

export const TempFanChart: React.FC<TempFanChartProps> = ({
  data,
  title = 'Temperature & Fan Speed'
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
          <div className="text-2xl font-bold text-accent-red">
            {latest?.temperature ?? '0'}°C
          </div>
          <div className="text-sm text-dark-600">Temperature</div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey="timestamp"
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            axisLine={{ stroke: '#334155' }}
            tickLine={false}
          />
          <YAxis
            yAxisId="left"
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            axisLine={{ stroke: '#334155' }}
            tickLine={false}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
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
              `${value ?? '0'}`,
              name === 'temperature' ? 'Temp' : name
            ]}
          />
          <ReferenceLine
            y={latest?.temperatureLimit || 85}
            stroke="#ef4444"
            strokeDasharray="4 4"
            strokeWidth={2}
            label={{ value: 'Max', fill: '#ef4444', fontSize: 10, position: 'insideTopLeft' }}
          />
          <ReferenceLine
            y={80}
            stroke="#f97316"
            strokeDasharray="4 4"
            strokeWidth={2}
            label={{ value: 'High', fill: '#f97316', fontSize: 10, position: 'insideBottomLeft' }}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="temperature"
            stroke="#ef4444"
            strokeWidth={2}
            dot={{ fill: '#ef4444', r: 4 }}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="fanSpeed"
            stroke="#22c55e"
            strokeWidth={2}
            dot={{ fill: '#22c55e', r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-4 flex justify-around text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-accent-red" />
          <span className="text-dark-600">Temperature (°C)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-accent-green" />
          <span className="text-dark-600">Fan Speed (RPM)</span>
        </div>
      </div>
    </div>
  );
};
