import {} from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

interface PowerChartProps {
  data: any[];
  title?: string;
}

export const PowerChart: React.FC<PowerChartProps> = ({
  data,
  title = 'Power Consumption'
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
          <div className="text-2xl font-bold text-accent-orange">
            {latest?.powerDraw ?? '0'}W
          </div>
          <div className="text-sm text-dark-600">Power Draw</div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey="timestamp"
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            axisLine={{ stroke: '#334155' }}
            tickLine={false}
          />
          <YAxis
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
            formatter={(value: any) => [`${value ?? '0'}W`, 'Power']}
          />
          {/* Current power limit (dynamically adjustable) */}
          <ReferenceLine
            y={latest?.powerLimit || 208}
            stroke="#ef4444"
            strokeDasharray="4 4"
            strokeWidth={2}
            opacity={0.5}
            label={{ value: `${latest?.powerLimit ?? 208}W Limit`, fill: '#ef4444', fontSize: 10, position: 'insideBottomLeft' }}
          />
          <ReferenceLine
            y={200}
            stroke="#ef4444"
            strokeDasharray="4 4"
            strokeWidth={2}
            label={{ value: 'High Load', fill: '#ef4444', fontSize: 10, position: 'insideBottomLeft' }}
            opacity={0.3}
          />
          <Bar
            dataKey="powerDraw"
            fill="#f97316"
            fillOpacity={0.8}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
