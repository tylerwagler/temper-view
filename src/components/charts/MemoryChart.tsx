import {} from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';

interface MemoryChartProps {
  data: any[];
  title?: string;
}

const COLORS = ['#06b6d4', '#22c55e', '#f97316', '#ef4444'];

export const MemoryChart: React.FC<MemoryChartProps> = ({
  data,
  title = 'Memory Usage'
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-dark-600">
        No data available
      </div>
    );
  }

  const latest = data[data.length - 1];

  const memoryData = [
    {
      name: 'Used',
      value: latest?.memoryUsage ?? 0,
      color: COLORS[0]
    },
    {
      name: 'Free',
      value: (latest?.memoryTotal ?? 0) - (latest?.memoryUsage ?? 0),
      color: COLORS[1]
    }
  ];

  return (
    <div className="bg-dark-800 rounded-lg p-4 border border-dark-700">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className="text-right">
          <div className="text-2xl font-bold text-accent-cyan">
            {((latest?.memoryUsage ?? 0) / (latest?.memoryTotal ?? 1) * 100).toFixed(1)}%
          </div>
          <div className="text-sm text-dark-600">Memory Used</div>
        </div>
      </div>

      <div className="flex items-center justify-center">
        <ResponsiveContainer width={300} height={300}>
          <PieChart>
            <Pie
              data={memoryData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {memoryData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px'
              }}
              labelStyle={{ color: '#fff' }}
              formatter={(value: any) => [`${value ?? '0'} MB`, 'Memory']}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 text-center text-sm">
        <div className="text-dark-600">
          Total: <span className="text-white">{latest?.memoryTotal ?? '0'} MB</span>
        </div>
        <div className="text-dark-600">
          Used: <span className="text-accent-cyan">{latest?.memoryUsage ?? '0'} MB</span>
        </div>
      </div>
    </div>
  );
};
