import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const data = [
  {
    name: 'Original',
    speed: 0.77,
    display: '770k',
    color: '#ef4444', // red-500
  },
  {
    name: 'Target',
    speed: 5.0,
    display: '5.0M',
    color: '#3b82f6', // blue-500
  },
  {
    name: 'Optimized',
    speed: 4.8, // Estimated limit based on batching
    display: '~4.8M*',
    color: '#10b981', // emerald-500
  },
];

export const PerformanceChart: React.FC = () => {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
          <XAxis type="number" domain={[0, 6]} tick={{ fill: '#94a3b8' }} />
          <YAxis 
            type="category" 
            dataKey="name" 
            tick={{ fill: '#e2e8f0', fontSize: 12, fontWeight: 600 }} 
            width={80}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
            itemStyle={{ color: '#f8fafc' }}
            cursor={{fill: 'transparent'}}
          />
          <Bar dataKey="speed" radius={[0, 4, 4, 0]} barSize={30}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="text-xs text-slate-500 mt-2 text-right">*Theoretical max on SSD. HDD limited by physics.</p>
    </div>
  );
};