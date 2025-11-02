import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, CPMResult, TimeUnit } from '@/types/activity';
import { ActivityTable } from '@/components/ActivityTable';
import { ResultsTable } from '@/components/ResultsTable';
import { NetworkDiagram } from '@/components/NetworkDiagram';
import { GanttChart } from '@/components/GanttChart';
import { CPMCalculator } from '@/utils/cpmCalculator';
import { SAMPLE_PROJECT, SAMPLE_SIMPLE, exportToCSV, parseCSV } from '@/utils/sampleData';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Calculator, 
  Network, 
  BarChart3, 
  Table, 
  Upload, 
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  Clock,
  Play,
  ArrowLeft
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Toaster } from 'react-hot-toast';

const CPM = () => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<Activity[]>(SAMPLE_SIMPLE);
  const [result, setResult] = useState<CPMResult | null>(null);
  const [timeUnit, setTimeUnit] = useState<TimeUnit>('days');
  const [activeTab, setActiveTab] = useState('input');
  const networkContainerRef = useRef<HTMLDivElement>(null);

  const handleCompute = () => {
    if (activities.length === 0) {
      toast.error('Please add at least one activity');
      return;
    }

    const calculator = new CPMCalculator(activities);
    const computedResult = calculator.compute();
    
    if (computedResult.errors && computedResult.errors.length > 0) {
      computedResult.errors.forEach(error => toast.error(error));
      setResult(computedResult);
      return;
    }

    if (computedResult.warnings && computedResult.warnings.length > 0) {
      computedResult.warnings.forEach(warning => toast(warning, { icon: '⚠️' }));
    }

    setResult(computedResult);
    setActiveTab('results');
    toast.success('CPM computed successfully!');
  };

  const handleLoadSample = (sample: 'simple' | 'complex') => {
    const sampleData = sample === 'simple' ? SAMPLE_SIMPLE : SAMPLE_PROJECT;
    setActivities(sampleData);
    setResult(null);
    setActiveTab('input');
    toast.success(`Loaded ${sample} sample project`);
  };

  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const csv = e.target?.result as string;
      const parsed = parseCSV(csv);
      if (parsed.length > 0) {
        setActivities(parsed);
        setResult(null);
        setActiveTab('input');
        toast.success(`Imported ${parsed.length} activities`);
      } else {
        toast.error('Failed to parse CSV file');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleExportCSV = () => {
    if (!result || result.activities.length === 0) {
      toast.error('No computed results to export');
      return;
    }

    const csv = [
      'id,name,duration,predecessors,es,ef,ls,lf,total_float,free_float,critical',
      ...result.activities.map(a => 
        `${a.id},${a.name},${a.duration},${a.predecessors.join(';')},${a.es},${a.ef},${a.ls},${a.lf},${a.totalFloat},${a.freeFloat},${a.isCritical}`
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cpm-results.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Results exported to CSV');
  };

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `url('https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')`,
      }}
    >
      {/* Overlay - Same as Landing Page */}
      <div className="min-h-screen bg-background/80 backdrop-blur-sm">
        
        {/* Header - Same as Landing Page with Back Icon */}
        <header className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate('/')}
                  className="h-10 w-10 rounded-full bg-gray-100/80 hover:bg-gray-200/80 transition-all duration-200"
                >
                  <ArrowLeft className="h-5 w-5 text-gray-700" />
                </Button>
                <Network className="h-8 w-8 text-blue-600" />
                <span className="text-2xl font-bold text-foreground">Network Planner</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleLoadSample('simple')}
                className="bg-white/80 hover:bg-white border-gray-300"
              >
                Simple Sample
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleLoadSample('complex')}
                className="bg-white/80 hover:bg-white border-gray-300"
              >
                Complex Sample
              </Button>
            </div>
          </div>
        </header>

        {/* Page Title */}
        <div className="container mx-auto px-4 text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">CPM Calculator</h1>
          <p className="text-xl text-muted-foreground">
            Critical Path Method Analysis & Visualization
          </p>
        </div>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-gray-100/80 backdrop-blur border border-gray-300">
              <TabsTrigger value="input" className="gap-2 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm">
                <Table className="h-4 w-4" />
                Input
              </TabsTrigger>
              <TabsTrigger value="results" className="gap-2 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm" disabled={!result}>
                <FileSpreadsheet className="h-4 w-4" />
                Results
              </TabsTrigger>
              <TabsTrigger value="network" className="gap-2 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm" disabled={!result}>
                <Network className="h-4 w-4" />
                Network
              </TabsTrigger>
              <TabsTrigger value="gantt" className="gap-2 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm" disabled={!result}>
                <BarChart3 className="h-4 w-4" />
                Gantt
              </TabsTrigger>
            </TabsList>

            {/* Input Tab */}
            <TabsContent value="input" className="space-y-6">
              <Card className="bg-gray-50/90 backdrop-blur border border-gray-300 shadow-lg">
                <CardHeader className="border-b border-gray-300 bg-white/50">
                  <CardTitle className="flex items-center gap-3 text-gray-800">
                    <Table className="h-6 w-6 text-gray-700" />
                    Project Activities
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <ActivityTable activities={activities} onChange={setActivities} />
                  <div className="mt-6 flex justify-end gap-3">
                    <label>
                      <input
                        type="file"
                        accept=".csv"
                        className="hidden"
                        onChange={handleImportCSV}
                      />
                      <Button variant="outline" className="bg-white/80 border-gray-300 hover:bg-white">
                        <Upload className="h-4 w-4 mr-2" />
                        Import CSV
                      </Button>
                    </label>
                    <Button onClick={handleCompute} size="lg" className="gap-2 bg-blue-600 hover:bg-blue-700 shadow-lg">
                      <Play className="h-5 w-5" />
                      Compute CPM
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Results Tab */}
            <TabsContent value="results" className="space-y-6">
              {result && (
                <>
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="bg-gray-50/90 backdrop-blur border border-gray-300 shadow-lg">
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-lg bg-blue-100/80 border border-blue-200">
                            <Clock className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Project Duration</p>
                            <p className="text-2xl font-bold text-gray-900">{result.projectDuration} {timeUnit}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gray-50/90 backdrop-blur border border-gray-300 shadow-lg">
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-lg bg-red-100/80 border border-red-200">
                            <AlertCircle className="h-6 w-6 text-red-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Critical Activities</p>
                            <p className="text-2xl font-bold text-gray-900">
                              {result.activities.filter(a => a.isCritical).length}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gray-50/90 backdrop-blur border border-gray-300 shadow-lg">
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-lg bg-green-100/80 border border-green-200">
                            <CheckCircle className="h-6 w-6 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Critical Paths</p>
                            <p className="text-2xl font-bold text-gray-900">{result.criticalPaths.length}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Results Table */}
                  <Card className="bg-gray-50/90 backdrop-blur border border-gray-300 shadow-lg">
                    <CardContent className="p-6">
                      <ResultsTable activities={result.activities} onExport={handleExportCSV} />
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

{/* Network Tab - Simple Version */}
<TabsContent value="network">
  <Card className="bg-gray-50/90 backdrop-blur border border-gray-300 shadow-xl">
    <CardHeader className="border-b border-gray-300 bg-white/50">
      <CardTitle className="flex items-center gap-3 text-gray-800">
        <Network className="h-6 w-6 text-gray-700" />
        Network Diagram
      </CardTitle>
    </CardHeader>
    <CardContent className="p-6">
      {result && (
        <NetworkDiagram
          activities={result.activities}
          criticalPaths={result.criticalPaths}
          aoaNetwork={result.aoaNetwork}
        />
      )}
    </CardContent>
  </Card>
</TabsContent>

            {/* Gantt Tab */}
            <TabsContent value="gantt">
              <Card className="bg-gray-50/90 backdrop-blur border border-gray-300 shadow-xl">
                <CardHeader className="border-b border-gray-300 bg-white/50">
                  <CardTitle className="flex items-center gap-3 text-gray-800">
                    <BarChart3 className="h-6 w-6 text-gray-700" />
                    Gantt Chart
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {result && <GanttChart activities={result.activities} />}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default CPM;