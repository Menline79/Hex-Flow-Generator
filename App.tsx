import React, { useState } from 'react';
import { CodeBlock } from './components/CodeBlock';
import { PerformanceChart } from './components/PerformanceChart';
import { ORIGINAL_CODE, OPTIMIZED_CODE, EXPLANATION_TEXT } from './constants';
import { Cpu, Zap, Activity, AlertTriangle, Copy, CheckCircle } from 'lucide-react';

enum Tab {
  OVERVIEW = 'overview',
  CODE = 'code',
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.OVERVIEW);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(OPTIMIZED_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-500/10 p-2 rounded-lg">
                <Activity className="w-6 h-6 text-emerald-500" />
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-100">HexFlow<span className="text-emerald-500">Optimizer</span></span>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => setActiveTab(Tab.OVERVIEW)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === Tab.OVERVIEW ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-400 hover:text-white'
                }`}
              >
                Analysis
              </button>
              <button
                onClick={() => setActiveTab(Tab.CODE)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === Tab.CODE ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-400 hover:text-white'
                }`}
              >
                Optimized Solution
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {activeTab === Tab.OVERVIEW && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Col: Analysis */}
            <div className="lg:col-span-2 space-y-8">
              <section className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-indigo-400" />
                  Bottleneck Analysis
                </h2>
                <div className="prose prose-invert prose-sm max-w-none text-slate-300">
                  <p className="leading-relaxed">
                    The primary reason your script is capped at 770,000 lines/s is <strong>System Call Latency</strong>.
                  </p>
                  <div className="my-4 p-4 bg-red-500/5 border border-red-500/20 rounded-lg">
                    <h3 className="text-red-400 font-medium mb-2 text-sm uppercase tracking-wide">The Anti-Pattern</h3>
                    <CodeBlock code={ORIGINAL_CODE} label="Original Loop (Slow)" />
                  </div>
                  <p>
                    Calling <code>win32file.WriteFile</code> inside a tight loop creates a massive overhead. 
                    The CPU spends more time switching contexts between your Python script and the Windows Kernel than it does actually processing data.
                  </p>
                </div>
              </section>

              <section className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-emerald-400" />
                  Solution Strategy
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                    <h3 className="font-medium text-white mb-2">1. I/O Batching</h3>
                    <p className="text-sm text-slate-400">Accumulate 16MB of data in memory before making a single call to the Named Pipe.</p>
                  </div>
                  <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                    <h3 className="font-medium text-white mb-2">2. Binascii Optimization</h3>
                    <p className="text-sm text-slate-400">Use <code>binascii.hexlify</code> for slightly faster C-level byte conversion compared to method calls.</p>
                  </div>
                  <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                    <h3 className="font-medium text-white mb-2">3. List Joining</h3>
                    <p className="text-sm text-slate-400">Use <code>b"".join(list)</code> to construct the output buffer efficiently, avoiding repeated string concatenation penalties.</p>
                  </div>
                  <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                    <h3 className="font-medium text-white mb-2">4. HDD Limitations</h3>
                    <p className="text-sm text-slate-400">Reading from HDD is sequential. We use a single reader thread to prevent disk thrashing.</p>
                  </div>
                </div>
              </section>
            </div>

            {/* Right Col: Stats */}
            <div className="space-y-8">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-6">Throughput Projection</h2>
                <PerformanceChart />
                <div className="mt-6 text-sm text-slate-400 space-y-2">
                  <div className="flex justify-between">
                    <span>Current:</span>
                    <span className="text-red-400 font-mono">~0.77 M/s</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Optimized (SSD):</span>
                    <span className="text-emerald-400 font-mono">~4.80 M/s</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-700 pt-2 mt-2">
                    <span>HDD Physical Limit:</span>
                    <span className="text-amber-400 font-mono">~2.50 M/s</span>
                  </div>
                </div>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />
                  <div>
                    <h3 className="text-amber-400 font-medium mb-1">Physics Warning</h3>
                    <p className="text-sm text-amber-200/80 leading-relaxed">
                      5 Million lines/sec generates ~325 MB/s of data. A standard HDD reads at ~150 MB/s.
                      The code will be fast enough, but your <strong>disk drive</strong> will likely become the new bottleneck.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === Tab.CODE && (
          <div className="space-y-6">
             <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Optimized Python Script</h2>
                <button 
                  onClick={handleCopy}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-sm font-medium transition-colors shadow-lg shadow-emerald-900/20"
                >
                  {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy Code'}
                </button>
             </div>
             <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
                <CodeBlock code={OPTIMIZED_CODE} isModified={true} />
             </div>
             <div className="p-6 bg-slate-900 rounded-xl border border-slate-800">
               <h3 className="text-lg font-semibold text-white mb-2">Implementation Notes</h3>
               <ul className="list-disc list-inside text-slate-300 space-y-1 text-sm">
                 <li>Ensure the receiving application reads from the pipe with a large buffer size as well.</li>
                 <li>The <code>BATCH_SIZE</code> isn't explicitly defined in the loop, but implicit via <code>BUFFER_SIZE</code> (16MB). This means we write every 16MB.</li>
                 <li>If memory is tight, reduce <code>BUFFER_SIZE</code> to 4MB or 8MB.</li>
               </ul>
             </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;