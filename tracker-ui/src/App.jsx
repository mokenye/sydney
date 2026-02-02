import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Tv, History, Milestone, Activity, ArrowUpRight } from 'lucide-react';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: history, error } = await supabase
        .from('playlist_history')
        .select('*')
        .order('created_at', { ascending: true });
      if (!error) setData(history);
      setLoading(false);
    };

    fetchData();

    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'playlist_history' }, 
        (payload) => {
          setData((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-[#050505] text-zinc-500 font-medium tracking-[0.3em] animate-pulse px-6 text-center text-xs">
      SYNCING DATASTREAM...
    </div>
  );

  const latest = data[data.length - 1] || { view_count: 0, total_hours: 0 };
  const nextMilestone = Math.ceil((latest.view_count + 1) / 1000000) * 1000000;
  const viewsNeeded = nextMilestone - latest.view_count;

  return (
    <div className="min-h-screen bg-[#050505] p-4 sm:p-8 md:p-12 text-zinc-100 selection:bg-red-500/30 font-sans antialiased overflow-x-hidden">
      <div className="mx-auto max-w-6xl">
        
        {/* --- ADAPTIVE HEADER --- */}
        <header className="mb-10 md:mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8 md:pb-12">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-600/10 p-2 rounded-lg border border-red-600/20">
                <Tv className="text-red-500" size={20} md={24} />
              </div>
              <span className="text-[9px] md:text-[10px] font-bold tracking-[0.4em] text-red-500 uppercase">System Active</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter text-white uppercase italic leading-none">
              Sydney <span className="text-zinc-700">Studio</span>
            </h1>
            <p className="text-zinc-500 font-medium mt-3 md:mt-4 tracking-[0.3em] text-[9px] md:text-[10px] uppercase">
              Real-time Feed
            </p>
          </div>
          
          <div className="flex items-center w-fit gap-3 md:gap-4 bg-white/[0.03] backdrop-blur-2xl px-4 md:px-6 py-2 md:py-3 rounded-full border border-white/5 shadow-2xl">
            <Activity size={14} className="text-red-500 animate-pulse" />
            <span className="text-[9px] md:text-[10px] font-bold text-zinc-400 tracking-[0.2em] uppercase">Connected</span>
          </div>
        </header>

        {/* --- METRICS: STACKED ON MOBILE --- */}
        <div className="mb-8 md:mb-12 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-red-600/20 rounded-[1.5rem] md:rounded-[2rem] blur-xl opacity-0 group-hover:opacity-100 transition duration-1000"></div>
            <div className="relative bg-[#0a0a0a] p-6 md:p-10 rounded-[1.5rem] md:rounded-[2rem] border border-white/5 flex flex-col justify-between h-full hover:border-red-500/20 transition-all overflow-hidden">
              <div className="flex justify-between items-start mb-6 md:mb-8">
                <span className="text-zinc-500 text-[10px] md:text-[11px] font-bold uppercase tracking-[0.4em]">Accumulated Views</span>
                <ArrowUpRight className="text-zinc-700 group-hover:text-red-500 transition-colors" size={18} md={20} />
              </div>
              <p className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tighter text-white tabular-nums leading-none truncate">
                {latest.view_count.toLocaleString()}<span className="text-red-600">.</span>
              </p>
            </div>
          </div>

          <div className="group relative">
            <div className="relative bg-[#0a0a0a] p-6 md:p-10 rounded-[1.5rem] md:rounded-[2rem] border border-white/5 flex flex-col justify-between h-full hover:border-white/10 transition-all overflow-hidden">
              <div className="flex justify-between items-start mb-6 md:mb-8">
                <span className="text-zinc-500 text-[10px] md:text-[11px] font-bold uppercase tracking-[0.4em]">Total Airtime</span>
                <div className="h-1 w-6 md:w-8 bg-zinc-800 rounded-full group-hover:bg-zinc-600 transition-colors" />
              </div>
              <p className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tighter text-white tabular-nums leading-none">
                {latest.total_hours}<span className="text-zinc-800 ml-1 md:ml-2 text-xl sm:text-2xl md:text-3xl font-medium tracking-normal italic uppercase">Hrs</span>
              </p>
            </div>
          </div>
        </div>

        {/* --- MILESTONE: ADAPTIVE HEIGHT --- */}
        <div className="mb-8 md:mb-12 rounded-[1.5rem] md:rounded-[2.5rem] bg-white/[0.01] backdrop-blur-md p-6 md:p-10 border border-white/5 overflow-hidden relative">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-8 relative z-10">
            <div className="flex items-center gap-4 md:gap-6">
              <div className="h-12 w-12 md:h-16 md:w-16 rounded-full border border-red-500/30 flex flex-shrink-0 items-center justify-center bg-red-500/5">
                <Milestone className="text-red-500" size={20} md={28} />
              </div>
              <div>
                <h3 className="text-xl md:text-3xl font-black uppercase italic tracking-tighter">Road to {nextMilestone.toLocaleString()}</h3>
                <p className="text-zinc-500 font-bold text-[11px] md:text-sm tracking-wide">Next goal synchronization</p>
              </div>
            </div>
            <div className="bg-white/5 px-6 md:px-10 py-3 md:py-5 rounded-xl md:rounded-2xl border border-white/5 w-full md:w-auto text-center md:text-right">
              <p className="text-2xl md:text-4xl font-black text-white tabular-nums tracking-tighter leading-none">
                -{viewsNeeded.toLocaleString()}
              </p>
              <p className="text-[9px] md:text-[10px] font-bold text-red-500/60 uppercase tracking-[0.3em] mt-2">Deficit to Goal</p>
            </div>
          </div>
          <div className="hidden md:block absolute -right-10 -bottom-16 opacity-[0.02] text-white select-none pointer-events-none font-black text-[14rem] italic uppercase">Goal</div>
        </div>

        {/* --- CHART: REDUCED PADDING ON MOBILE --- */}
        <div className="rounded-[1.5rem] md:rounded-[3rem] bg-[#080808] p-4 sm:p-6 md:p-10 border border-white/5 shadow-3xl">
          <div className="mb-8 md:mb-12 flex items-center justify-between">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="h-2 w-2 bg-red-600 rounded-full shadow-[0_0_10px_#ef4444]" />
              <h3 className="text-[11px] md:text-sm font-black uppercase tracking-[0.4em] text-zinc-400 italic">Growth Analytics</h3>
            </div>
            <span className="hidden sm:inline-block text-[9px] font-bold text-zinc-600 border border-zinc-800/50 px-3 md:px-4 py-1.5 rounded-full italic tracking-widest uppercase">6H Sync</span>
          </div>
          
          <div className="h-[250px] sm:h-[350px] md:h-[450px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="0" stroke="#121212" vertical={false} />
                <XAxis 
                  dataKey="created_at" 
                  tickFormatter={(t) => new Date(t).toLocaleDateString([], { month: 'short', day: 'numeric' })} 
                  stroke="#27272a" 
                  fontSize={9}
                  fontWeight="900"
                  tickMargin={15}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={30}
                />
                <YAxis hide domain={['auto', 'auto']} />
                <Tooltip 
                  cursor={{ stroke: '#27272a', strokeWidth: 1 }}
                  contentStyle={{ 
                    backgroundColor: '#000', 
                    border: '1px solid #1a1a1a', 
                    borderRadius: '16px', 
                    padding: '12px',
                    boxShadow: '0 10px 20px rgba(0,0,0,0.5)'
                  }}
                  itemStyle={{ color: '#ef4444', fontWeight: '900', fontSize: '12px', textTransform: 'uppercase' }}
                  labelStyle={{ color: '#52525b', fontSize: '9px', marginBottom: '4px', fontWeight: 'bold' }}
                  labelFormatter={(t) => new Date(t).toLocaleString()}
                />
                <Line 
                  type="monotone" 
                  dataKey="view_count" 
                  stroke="#ef4444" 
                  strokeWidth={3} 
                  dot={false}
                  activeDot={{ r: 4, fill: '#ef4444', strokeWidth: 0 }} 
                  animationDuration={2000}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <footer className="mt-16 md:mt-24 mb-8 md:mb-12 text-center px-4">
            <p className="text-zinc-800 text-[8px] md:text-[9px] font-black uppercase tracking-[0.5em] md:tracking-[1em]">End of Transmission</p>
        </footer>
      </div>
    </div>
  );
}