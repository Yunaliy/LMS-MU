import React, { useState, useMemo } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const RevenueOverviewChart = () => {
  const [timeFilter, setTimeFilter] = useState("month");

  // Generate sample data based on the time filter
  const generateData = (timeFilter) => {
    switch (timeFilter) {
      case "today":
        return Array.from({ length: 24 }, (_, i) => ({
          name: `${i}:00`,
          revenue: Math.floor(Math.random() * 500) + 100,
        }));
      case "week":
        const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        return days.map((day) => ({
          name: day,
          revenue: Math.floor(Math.random() * 5000) + 1000,
        }));
      case "year":
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return months.map((month) => ({
          name: month,
          revenue: Math.floor(Math.random() * 50000) + 10000,
        }));
      case "month":
      default:
        return Array.from({ length: 30 }, (_, i) => ({
          name: `${i + 1}`,
          revenue: Math.floor(Math.random() * 2000) + 500,
        }));
    }
  };

  const data = useMemo(() => generateData(timeFilter), [timeFilter]);

  const formatYAxis = (value) => {
    if (value >= 1000) {
      return `ETB ${(value / 1000).toFixed(1)}k`;
    }
    return `ETB ${value}`;
  };

  const formatTooltipValue = (value) => {
    return `ETB ${value.toLocaleString()}`;
  };

  return (
    <div className="revenue-chart-container">
      <div className="chart-header">
        <h3 className="chart-title">Revenue Overview</h3>
        <div className="time-filter">
          <button 
            className={`time-btn ${timeFilter === 'today' ? 'active' : ''}`}
            onClick={() => setTimeFilter('today')}
          >
            Today
          </button>
          <button 
            className={`time-btn ${timeFilter === 'week' ? 'active' : ''}`}
            onClick={() => setTimeFilter('week')}
          >
            Week
          </button>
          <button 
            className={`time-btn ${timeFilter === 'month' ? 'active' : ''}`}
            onClick={() => setTimeFilter('month')}
          >
            Month
          </button>
          <button 
            className={`time-btn ${timeFilter === 'year' ? 'active' : ''}`}
            onClick={() => setTimeFilter('year')}
          >
            Year
          </button>
        </div>
      </div>
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="name" 
              stroke="#888888" 
              fontSize={12} 
              tickLine={false} 
              axisLine={false} 
            />
            <YAxis 
              stroke="#888888" 
              fontSize={12} 
              tickLine={false} 
              axisLine={false} 
              tickFormatter={formatYAxis} 
            />
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <Tooltip
              formatter={formatTooltipValue}
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #ddd",
                borderRadius: "4px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              }}
            />
            <Area 
              type="monotone" 
              dataKey="revenue" 
              stroke="#8884d8" 
              fillOpacity={1} 
              fill="url(#colorRevenue)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RevenueOverviewChart; 