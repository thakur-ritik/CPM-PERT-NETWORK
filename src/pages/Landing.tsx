import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Calculator, Network, Clock, ArrowRight, Play } from 'lucide-react';
import { useEffect, useState } from 'react';

const Landing = () => {
  const navigate = useNavigate();
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const fullText = 'CPM-PERT Generation';

  useEffect(() => {
    if (currentIndex < fullText.length) {
      const timer = setTimeout(() => {
        setDisplayText(prev => prev + fullText[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [currentIndex]);

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `url('https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')`,
      }}
    >
      {/* Overlay */}
      <div className="min-h-screen bg-background/80 backdrop-blur-sm">
        
        {/* Header */}
        <header className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Network className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold text-foreground">Network Planner</span>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <main className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center">
            
            {/* Typewriter Heading */}
            <div className="mb-8">
              <h1 className="text-6xl md:text-7xl font-bold text-foreground mb-4 min-h-[120px]">
                {displayText}
                <span className="animate-pulse">|</span>
              </h1>
              
              {/* Subheading */}
              <div className="mt-8">
                <p className="text-3xl md:text-4xl font-light text-muted-foreground tracking-wide">
                  PROJECT NETWORK DIAGRAM
                </p>
              </div>
            </div>

            {/* Description */}
            <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
              Advanced project management tools for Critical Path Method and Program Evaluation 
              Review Technique. Visualize, analyze, and optimize your project networks with 
              professional-grade diagrams and calculations.
            </p>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 max-w-4xl mx-auto">
              <Card className="bg-card/80 backdrop-blur border-border/50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <Calculator className="h-8 w-8 text-primary" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-xl font-semibold text-foreground">CPM Calculator</h3>
                      <p className="text-muted-foreground mt-1">Critical Path Method Analysis</p>
                    </div>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-2 text-left">
                    <li>• Calculate ES, EF, LS, LF values</li>
                    <li>• Identify critical paths</li>
                    <li>• Float and slack calculations</li>
                    <li>• Network diagram visualization</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-card/80 backdrop-blur border-border/50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 rounded-lg bg-blue-500/10">
                      <Clock className="h-8 w-8 text-blue-500" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-xl font-semibold text-foreground">PERT Analysis</h3>
                      <p className="text-muted-foreground mt-1">Program Evaluation Review Technique</p>
                    </div>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-2 text-left">
                    <li>• Optimistic, Pessimistic, Most likely times</li>
                    <li>• Probability analysis</li>
                    <li>• Standard deviation calculations</li>
                    <li>• Risk assessment</li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                onClick={() => navigate('/cpm')} 
                size="lg"
                className="gap-3 px-8 py-3 text-lg h-14"
              >
                <Play className="h-5 w-5" />
                Start CPM Analysis
                <ArrowRight className="h-5 w-5" />
              </Button>
              
              <Button 
                onClick={() => navigate('/pert')} 
                variant="outline" 
                size="lg"
                className="gap-3 px-8 py-3 text-lg h-14 border-2"
              >
                <Network className="h-5 w-5" />
                Start PERT Analysis
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-8 mt-16 pt-8 border-t border-border/50">
              <div>
                <div className="text-2xl font-bold text-primary"></div>
                <div className="text-sm text-muted-foreground"></div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary"></div>
                <div className="text-sm text-muted-foreground">Developed By Ayushi, Tanish, Ritik</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary"></div>
                <div className="text-sm text-muted-foreground"></div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Landing;