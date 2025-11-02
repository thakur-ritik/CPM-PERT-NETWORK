import { useState } from 'react';
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
  Download, 
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Toaster } from 'react-hot-toast';

const Index = () => {
  const [activities, setActivities] = useState<Activity[]>(SAMPLE_SIMPLE);
  const [result, setResult] = useState<CPMResult | null>(null);
  const [timeUnit, setTimeUnit] = useState<TimeUnit>('days');
  const [activeTab, setActiveTab] = useState('input');

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
    <div className="min-h-screen bg-background">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">CPM Planner</h1>
              <p className="text-muted-foreground mt-1">
                Critical Path Method Calculator & Visualizer
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => handleLoadSample('simple')}>
                Load Simple Sample
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleLoadSample('complex')}>
                Load Complex Sample
              </Button>
              <label>
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleImportCSV}
                />
                <Button variant="outline" size="sm" asChild>
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    Import CSV
                  </span>
                </Button>
              </label>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="input" className="gap-2">
              <Table className="h-4 w-4" />
              Input
            </TabsTrigger>
            <TabsTrigger value="results" className="gap-2" disabled={!result}>
              <FileSpreadsheet className="h-4 w-4" />
              Results
            </TabsTrigger>
            <TabsTrigger value="network" className="gap-2" disabled={!result}>
              <Network className="h-4 w-4" />
              Network
            </TabsTrigger>
            <TabsTrigger value="gantt" className="gap-2" disabled={!result}>
              <BarChart3 className="h-4 w-4" />
              Gantt
            </TabsTrigger>
          </TabsList>

          {/* Input Tab */}
          <TabsContent value="input" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Activities</CardTitle>
              </CardHeader>
              <CardContent>
                <ActivityTable activities={activities} onChange={setActivities} />
                <div className="mt-6 flex justify-end">
                  <Button onClick={handleCompute} size="lg" className="gap-2">
                    <Calculator className="h-5 w-5" />
                    Compute CPM
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Instructions */}
            <Card>
              <CardHeader>
                <CardTitle>How to Use</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>
                  1. <strong>Add activities</strong>: Enter unique IDs, names, durations, and predecessors for each activity.
                </p>
                <p>
                  2. <strong>Define dependencies</strong>: List predecessor IDs separated by commas (e.g., "A, B").
                </p>
                <p>
                  3. <strong>Compute CPM</strong>: Click the compute button to calculate ES, EF, LS, LF, and identify critical paths.
                </p>
                <p>
                  4. <strong>Visualize</strong>: View results in table, network diagram, or Gantt chart format.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results" className="space-y-6">
            {result && (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-primary/10">
                          <Clock className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Project Duration</p>
                          <p className="text-2xl font-bold">{result.projectDuration} {timeUnit}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-critical/10">
                          <AlertCircle className="h-6 w-6 text-critical" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Critical Activities</p>
                          <p className="text-2xl font-bold">
                            {result.activities.filter(a => a.isCritical).length}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-success/10">
                          <CheckCircle className="h-6 w-6 text-success" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Critical Paths</p>
                          <p className="text-2xl font-bold">{result.criticalPaths.length}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Errors/Warnings */}
                {result.errors && result.errors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <ul className="list-disc list-inside space-y-1">
                        {result.errors.map((error, idx) => (
                          <li key={idx}>{error}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {result.warnings && result.warnings.length > 0 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <ul className="list-disc list-inside space-y-1">
                        {result.warnings.map((warning, idx) => (
                          <li key={idx}>{warning}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Critical Paths */}
                {result.criticalPaths.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Critical Paths</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {result.criticalPaths.map((path, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <span className="text-sm font-medium text-muted-foreground">
                              Path {idx + 1}:
                            </span>
                            <div className="flex items-center gap-2">
                              {path.map((id, i) => (
                                <span key={i} className="flex items-center gap-2">
                                  <span className="px-2 py-1 rounded bg-critical text-critical-foreground text-sm font-medium">
                                    {id}
                                  </span>
                                  {i < path.length - 1 && (
                                    <span className="text-muted-foreground">→</span>
                                  )}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Results Table */}
                <Card>
                  <CardContent className="pt-6">
                    <ResultsTable activities={result.activities} onExport={handleExportCSV} />
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Network Tab */}
          <TabsContent value="network">
            <Card>
              <CardHeader>
                <CardTitle>Network Diagram</CardTitle>
              </CardHeader>
              <CardContent>
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
            <Card>
              <CardHeader>
                <CardTitle>Gantt Chart</CardTitle>
              </CardHeader>
              <CardContent>
                {result && <GanttChart activities={result.activities} />}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
