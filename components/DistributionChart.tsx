import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Label } from 'recharts';

interface DistributionChartProps {
  data: { size: number; count: number }[];
}

const DistributionChart: React.FC<DistributionChartProps> = ({ data }) => {
  return (
    <div className="w-full h-96 bg-slate-800 rounded-lg p-4 border border-slate-700 shadow-inner">
      <h3 className="text-slate-200 font-serif text-lg mb-2 text-center border-b border-slate-600 pb-2">
        РАСПРЕДЕЛЕНИЕ РАЗМЕРОВ ДОМЕНОВ
      </h3>
      <ResponsiveContainer width="100%" height="90%">
        <ScatterChart
          margin={{ top: 20, right: 20, bottom: 20, left: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis 
            type="number" 
            dataKey="size" 
            name="Размер" 
            scale="log" 
            domain={['auto', 'auto']}
            stroke="#94a3b8"
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            allowDataOverflow
          >
             <Label value="Размер домена (s) (лог. шкала)" offset={0} position="insideBottom" fill="#cbd5e1" dy={15} />
          </XAxis>
          <YAxis 
            type="number" 
            dataKey="count" 
            name="Количество" 
            scale="log" 
            domain={['auto', 'auto']}
            stroke="#94a3b8"
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            allowDataOverflow
          >
             <Label value="Количество (лог. шкала)" angle={-90} position="insideLeft" fill="#cbd5e1" style={{ textAnchor: 'middle' }} />
          </YAxis>
          <Tooltip 
            cursor={{ strokeDasharray: '3 3' }} 
            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f1f5f9' }}
            formatter={(value: number) => [value, '']}
            labelFormatter={(label) => `Размер: ${label}`}
          />
          <Scatter name="Домены" data={data} fill="#60a5fa" line={false} shape="circle" />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DistributionChart;