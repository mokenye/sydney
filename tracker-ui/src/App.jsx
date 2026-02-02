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
    <div className="flex h-screen items-center justify-center bg-[#050505] text-zinc-500 font-medium tracking-[0.3em] animate-pulse">
      SYNCING DATASTREAM...
    </div>
  );

  const latest = data[data.length - 1] || { view_count: 0, total_hours: 0 };
  const nextMilestone = Math.ceil((latest.view_count + 1) / 1000000) * 1000000;
  const viewsNeeded = nextMilestone - latest.view_count;

  return (
    <div className="min-h-screen bg-[#050505] p-6 md:p-12 text-zinc-100 selection:bg-red-500/30 font-sans antialiased">
      <div className="mx-auto max-w-6xl">
        
        {/* --- ELEGANT HEADER --- */}
        <header className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/5 pb-12">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-600/10 p-2 rounded-lg border border-red-600/20">
                <Tv className="text-red-500" size={24} />
              </div>
              <span className="text-[10px] font-bold tracking-[0.4em] text-red-500 uppercase">System Active</span>
            </div>
            <h1 className="text-6xl font-black tracking-tighter text-white uppercase italic leading-none">
              Sydney <span className="text-zinc-700">Studio</span>
            </h1>
            <p className="text-zinc-500 font-medium mt-4 tracking-[0.3em] text-[10px] uppercase">
              Real-time Feed
            </p>
          </div>
          
          <div className="flex items-center gap-4 bg-white/[0.03] backdrop-blur-2xl px-6 py-3 rounded-full border border-white/5 shadow-2xl">
            <Activity size={14} className="text-red-500 animate-pulse" />
            <span className="text-[10px] font-bold text-zinc-400 tracking-[0.2em] uppercase">Connected</span>
          </div>
        </header>

        {/* --- METRICS WITH GLOW --- */}
        <div className="mb-12 grid gap-8 md:grid-cols-2">
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-red-600/20 rounded-[2rem] blur-xl opacity-0 group-hover:opacity-100 transition duration-1000"></div>
            <div className="relative bg-[#0a0a0a] p-10 rounded-[2rem] border border-white/5 flex flex-col justify-between h-full hover:border-red-500/20 transition-all">
              <div className="flex justify-between items-start mb-8">
                <span className="text-zinc-500 text-[11px] font-bold uppercase tracking-[0.4em]">Accumulated Views</span>
                <ArrowUpRight className="text-zinc-700 group-hover:text-red-500 transition-colors" size={20} />
              </div>
              <p className="text-7xl font-black tracking-tighter text-white tabular-nums leading-none">
                {latest.view_count.toLocaleString()}<span className="text-red-600">.</span>
              </p>
            </div>
          </div>

          <div className="group relative">
            <div className="relative bg-[#0a0a0a] p-10 rounded-[2rem] border border-white/5 flex flex-col justify-between h-full hover:border-white/10 transition-all">
              <div className="flex justify-between items-start mb-8">
                <span className="text-zinc-500 text-[11px] font-bold uppercase tracking-[0.4em]">Total Airtime</span>
                <div className="h-1 w-8 bg-zinc-800 rounded-full group-hover:bg-zinc-600 transition-colors" />
              </div>
              <p className="text-7xl font-black tracking-tighter text-white tabular-nums leading-none">
                {latest.total_hours}<span className="text-zinc-800 ml-2 text-3xl font-medium tracking-normal italic uppercase">Hrs</span>
              </p>
            </div>
          </div>
        </div>

        {/* --- MILESTONE GLASS CARD --- */}
        <div className="mb-12 rounded-[2.5rem] bg-white/[0.01] backdrop-blur-md p-10 border border-white/5 overflow-hidden relative">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
            <div className="flex items-center gap-6">
              <div className="h-16 w-16 rounded-full border border-red-500/30 flex items-center justify-center bg-red-500/5">
                <Milestone className="text-red-500" size={28} />
              </div>
              <div>
                <h3 className="text-3xl font-black uppercase italic tracking-tighter">Road to {nextMilestone.toLocaleString()}</h3>
                <p className="text-zinc-500 font-bold text-sm tracking-wide">Targeting the next million views</p>
              </div>
            </div>
            <div className="bg-white/5 px-10 py-5 rounded-2xl border border-white/5 text-center">
              <p className="text-4xl font-black text-white tabular-nums tracking-tighter leading-none">
                -{viewsNeeded.toLocaleString()}
              </p>
              <p className="text-[10px] font-bold text-red-500/60 uppercase tracking-[0.3em] mt-3">Deficit to Goal</p>
            </div>
          </div>
          <div className="absolute -right-10 -bottom-16 opacity-[0.02] text-white select-none pointer-events-none font-black text-[14rem] italic uppercase">Goal</div>
        </div>

        {/* --- ANALYTICS CHART: DARK MODE OPTIMIZED --- */}
        <div className="rounded-[3rem] bg-[#080808] p-10 border border-white/5 shadow-3xl">
          <div className="mb-12 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-2 w-2 bg-red-600 rounded-full shadow-[0_0_10px_#ef4444]" />
              <h3 className="text-sm font-black uppercase tracking-[0.4em] text-zinc-400 italic">Growth Analytics</h3>
            </div>
            <span className="text-[9px] font-bold text-zinc-600 border border-zinc-800/50 px-4 py-1.5 rounded-full italic tracking-widest uppercase">6H Sync Interval</span>
          </div>
          
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ bottom: 20, left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="0" stroke="#121212" vertical={false} />
                <XAxis 
                  dataKey="created_at" 
                  tickFormatter={(t) => new Date(t).toLocaleDateString([], { month: 'short', day: 'numeric' })} 
                  stroke="#27272a" 
                  fontSize={10}
                  fontWeight="900"
                  tickMargin={25}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide domain={['auto', 'auto']} />
                <Tooltip 
                  cursor={{ stroke: '#27272a', strokeWidth: 1 }}
                  contentStyle={{ 
                    backgroundColor: '#000', 
                    border: '1px solid #1a1a1a', 
                    borderRadius: '24px', 
                    padding: '20px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                  }}
                  itemStyle={{ color: '#ef4444', fontWeight: '900', fontSize: '14px', textTransform: 'uppercase' }}
                  labelStyle={{ color: '#52525b', fontSize: '10px', marginBottom: '8px', fontWeight: 'bold', textTransform: 'uppercase' }}
                  labelFormatter={(t) => new Date(t).toLocaleString()}
                />
                <Line 
                  type="monotone" 
                  dataKey="view_count" 
                  stroke="#ef4444" 
                  strokeWidth={4} 
                  dot={false}
                  activeDot={{ r: 6, fill: '#ef4444', strokeWidth: 0 }} 
                  animationDuration={2500}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <footer className="mt-20 mb-12 text-center">
            <p className="text-zinc-800 text-[9px] font-black uppercase tracking-[1em]">End of Transmission</p>
        </footer>
      </div>
    </div>
  );
}