import React, { useState, useEffect, useRef, MouseEvent } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useReactToPrint } from 'react-to-print';
import Papa from 'papaparse';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import {
  Users,
  Target,
  Brain,
  Map,
  ArrowUp,
  FileText
} from 'lucide-react';

const BRAND_COLORS = {
  navy: '#2e5076',
  teal: '#2899a1',
  gray: '#7d8d8f',
  burgundy: '#8d223f',
  tan: '#c5af8c',
  orange: '#d74831'
};

const COLORS = [
  BRAND_COLORS.navy,
  BRAND_COLORS.teal,
  BRAND_COLORS.burgundy,
  BRAND_COLORS.orange,
  BRAND_COLORS.tan,
  BRAND_COLORS.gray
];

interface SurveyData {
  [key: string]: string;
}

interface ChartData {
  name: string;
  value: number;
  percentage: number;
}

interface ExecutiveSummary {
  totalResponses: number;
  highestRated: {
    question: string;
    percentage: number;
  };
  lowestRated: {
    question: string;
    percentage: number;
  };
  overallSatisfaction: number;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    payload: ChartData;
  }>;
}

type LikertResponse = 'Strongly Agree' | 'Agree' | 'Somewhat Agree' | 'Neutral' | 'Somewhat Disagree' | 'Disagree' | 'Strongly Disagree';

const SurveyVisualization = () => {
  const [data, setData] = useState<SurveyData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortedQuestions, setSortedQuestions] = useState<string[]>([]);
  const [executiveSummary, setExecutiveSummary] = useState<ExecutiveSummary | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const componentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'E') {
        setIsEditMode(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const EditableText = ({ text, className }: { text: string, className?: string }) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      }
    }, [isEditMode, text]);

    if (isEditMode) {
      return (
        <textarea
          ref={textareaRef}
          rows={1}
          className={`w-full bg-transparent resize-none border-none focus:ring-0 focus:outline-none ${className}`}
          defaultValue={text}
          onChange={(e) => {
            e.target.style.height = 'auto';
            e.target.style.height = `${e.target.scrollHeight}px`;
          }}
        />
      );
    }
    return <p className={className}>{text}</p>;
  };

  const processLikertResponses = (question: string): ChartData[] => {
    if (!data || data.length === 0) return [];

    const responses = data.map(row => row[question]).filter(Boolean);
    const counts: Record<LikertResponse, number> = {
      'Strongly Agree': 0,
      'Agree': 0,
      'Somewhat Agree': 0,
      'Neutral': 0,
      'Somewhat Disagree': 0,
      'Disagree': 0,
      'Strongly Disagree': 0
    };

    responses.forEach(response => {
      if (response in counts) {
        counts[response as LikertResponse]++;
      }
    });

    return Object.entries(counts)
      .filter(([, value]) => value > 0)
      .map(([name, value]) => ({
        name,
        value,
        percentage: Math.round((value / responses.length) * 100)
      }));
  };

  const calculateExecutiveSummary = (parsedData: SurveyData[], questions: string[]): ExecutiveSummary | null => {
    if (!parsedData.length || !questions.length) return null;

    const totalResponses = parsedData.length;
    const stronglyAgreePercentages = questions.map(question => {
      const responses = parsedData.filter(row => row[question] === 'Strongly Agree').length;
      return Math.round((responses / totalResponses) * 100);
    });

    const highestRated = {
      question: questions[0],
      percentage: stronglyAgreePercentages[0]
    };

    const lowestRated = {
      question: questions[questions.length - 1],
      percentage: stronglyAgreePercentages[questions.length - 1]
    };

    const overallSatisfaction = Math.round(
      stronglyAgreePercentages.reduce((a, b) => a + b, 0) / stronglyAgreePercentages.length
    );

    return {
      totalResponses,
      highestRated,
      lowestRated,
      overallSatisfaction
    };
  };

  const handlePrint = useReactToPrint({
    documentTitle: "Survey Results",
    contentRef: componentRef,
    pageStyle: `
      @page {
        size: A4;
        margin: 20mm;
      }
      @media print {
        /* Hide the export button when printing */
        .no-print {
          display: none !important;
        }
        /* Prevent page breaks inside components */
        .keep-together {
          break-inside: avoid;
          page-break-inside: avoid;
        }
        /* Force page breaks between major sections */
        .force-break {
          break-before: page;
          page-break-before: always;
          margin-top: 20mm;
        }
        /* Add margin to top row cards on new pages */
        .force-break .grid > *:nth-child(-n+2) {
          margin-top: 20mm;
        }
      }
    `,
    onAfterPrint: () => console.log('Print completed')
  });

  const onPrintClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    handlePrint();
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/survey.csv');
        const text = await response.text();

        const lines = text.split('\n');
        const headerIndex = lines.findIndex(line => line.startsWith('"Submitted Date"'));

        if (headerIndex === -1) {
          throw new Error("Could not find header row");
        }

        const cleanedCSV = lines.slice(headerIndex).join('\n');

        Papa.parse<SurveyData>(cleanedCSV, {
          header: true,
          skipEmptyLines: 'greedy',
          complete: (results) => {
            if (results.errors.length > 0) {
              console.error('Parsing errors:', results.errors);
              setError('Error parsing CSV data');
            } else {
              const parsedData = results.data;

              const questions = Object.keys(parsedData[0] || {}).filter(key =>
                parsedData[0][key] &&
                typeof parsedData[0][key] === 'string' &&
                (parsedData[0][key].includes('Agree') || parsedData[0][key].includes('Disagree')) &&
                !key.startsWith('Response') &&
                !key.includes('ID')
              );

              const questionsWithStronglyAgree = questions.map(question => {
                const stronglyAgreeCount = parsedData.filter(row =>
                  row[question] === 'Strongly Agree'
                ).length;
                return { question, stronglyAgreeCount };
              });

              const sortedQs = questionsWithStronglyAgree
                .sort((a, b) => b.stronglyAgreeCount - a.stronglyAgreeCount)
                .map(item => item.question);

              setData(parsedData);
              setSortedQuestions(sortedQs);
              setExecutiveSummary(calculateExecutiveSummary(parsedData, sortedQs));
            }
            setLoading(false);
          },
          error: (error: Error) => {
            console.error('Error:', error);
            setError('Failed to parse CSV data');
            setLoading(false);
          }
        });
      } catch (error) {
        if (error instanceof Error) {
          console.error('Error loading file:', error);
          setError('Failed to load CSV file');
        }
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const CustomTooltip: React.FC<TooltipProps> = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="px-4 py-3 rounded-lg shadow-lg" style={{ backgroundColor: BRAND_COLORS.navy }}>
          <p className="text-white font-medium mb-1">{payload[0].payload.name}</p>
          <p className="text-teal-200">
            Count: {payload[0].value}
            <span className="ml-2">({payload[0].payload.percentage}%)</span>
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card className="w-full" style={{ backgroundColor: BRAND_COLORS.navy }}>
        <CardContent className="p-6">
          <div className="text-center text-white">Loading survey data...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="w-full" style={{ backgroundColor: BRAND_COLORS.burgundy }}>
        <AlertDescription className="text-white">{error}</AlertDescription>
      </Alert>
    );
  }

  if (!executiveSummary) {
    return (
      <Alert variant="destructive" className="w-full" style={{ backgroundColor: BRAND_COLORS.burgundy }}>
        <AlertDescription className="text-white">Unable to process survey data</AlertDescription>
      </Alert>
    );
  }

  return (
    <div>
      <button
        onClick={onPrintClick}
        className="fixed top-4 right-4 px-4 py-2 bg-navy text-white rounded-md hover:bg-opacity-90 z-50 no-print"
      >
        Export PDF
      </button>
      <div ref={componentRef} className="space-y-8 p-8 rounded-xl" style={{ backgroundColor: BRAND_COLORS.navy }}>
        {/* Executive Summary Section */}
        <div className="keep-together">
          <div className="mb-8">
            <h1 className="text-5xl font-bold text-white text-center mb-8">Black History Retreat Impact Report</h1>

            {/* Metrics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <Card className="border-none rounded-xl shadow-lg transform hover:scale-105 transition-transform duration-200"
                style={{ backgroundColor: BRAND_COLORS.teal }}>
                <CardContent className="p-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/80 text-lg mb-2">Total Responses</p>
                      <p className="text-4xl font-bold text-white">{executiveSummary.totalResponses}</p>
                    </div>
                    <Users className="w-16 h-16 text-white/80" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none rounded-xl shadow-lg transform hover:scale-105 transition-transform duration-200"
                style={{ backgroundColor: BRAND_COLORS.burgundy }}>
                <CardContent className="p-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/80 text-lg mb-2">Overall Satisfaction</p>
                      <p className="text-4xl font-bold text-white">{executiveSummary.overallSatisfaction}%</p>
                    </div>
                    <ArrowUp className="w-16 h-16 text-white/80" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none rounded-xl shadow-lg transform hover:scale-105 transition-transform duration-200"
                style={{ backgroundColor: BRAND_COLORS.orange }}>
                <CardContent className="p-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/80 text-lg mb-2">Areas for Growth</p>
                      <p className="text-4xl font-bold text-white">{executiveSummary.lowestRated.percentage}%</p>
                    </div>
                    <Target className="w-16 h-16 text-white/80" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Narrative Summary */}
            <Card className="border-none rounded-xl shadow-lg" style={{ backgroundColor: 'rgba(125, 141, 143, 0.15)' }}>
              <CardHeader className="pb-2 px-6 pt-6">
                <CardTitle className="flex items-center text-white text-2xl">
                  <FileText className="w-8 h-8 mr-3 text-teal-400" />
                  Key Findings
                </CardTitle>
              </CardHeader>
              <CardContent className="text-white/90 space-y-4 px-6 pb-6">
                <EditableText
                  className="text-white/90 text-lg leading-relaxed"
                  text={`The Black History Retreat survey results reveal a highly successful event, with ${executiveSummary.totalResponses} participants providing comprehensive feedback. The overall satisfaction rate of ${executiveSummary.overallSatisfaction}% 'Strongly Agree' responses across all categories indicates strong program effectiveness. Notably, the historical site visits and panel discussions received particularly positive feedback, with over ${executiveSummary.highestRated.percentage}% of participants strongly agreeing about their value.`}
                />
                <EditableText
                  className="text-white/90 text-lg leading-relaxed"
                  text="Participants especially appreciated the integration of historical knowledge with contemporary leadership challenges. The visit to Legacy Sites and the panel conversation with community leaders emerged as standout experiences. However, participants indicated a desire for more structured networking opportunities and peer connection time, suggesting an area for future enhancement."
                />
                <EditableText
                  className="text-white/90 text-lg leading-relaxed"
                  text="Key recommendations from participants include increasing dedicated time for peer interaction, developing follow-up support mechanisms, and creating more opportunities for regional cohort building. The feedback suggests that while the content and historical components were highly impactful, the retreat's networking and relationship-building aspects could be expanded in future iterations."
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Event Team Debrief Agenda - Now with force-break */}
        <div className="force-break mb-16">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Black History Retreat Program Review</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-none rounded-xl shadow-lg transform hover:scale-105 transition-transform duration-200"
              style={{ backgroundColor: BRAND_COLORS.teal }}>
              <CardHeader className="pb-2 px-6 pt-6">
                <CardTitle className="flex items-center text-white text-xl">
                  <Brain className="w-6 h-6 mr-3" />
                  Program Impact Review
                </CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <ul className="space-y-3">
                  <li className="flex items-start text-white">
                    <div className="w-2 h-2 mt-2 mr-2 bg-white rounded-full" />
                    <EditableText
                      className="text-white"
                      text="Analysis of highest-rated activities and their key success factors"
                    />
                  </li>
                  <li className="flex items-start text-white">
                    <div className="w-2 h-2 mt-2 mr-2 bg-white rounded-full" />
                    <EditableText
                      className="text-white"
                      text="Review of participant engagement levels across different sessions"
                    />
                  </li>
                  <li className="flex items-start text-white">
                    <div className="w-2 h-2 mt-2 mr-2 bg-white rounded-full" />
                    <EditableText
                      className="text-white"
                      text="Discussion of historical knowledge integration effectiveness"
                    />
                  </li>
                  <li className="flex items-start text-white">
                    <div className="w-2 h-2 mt-2 mr-2 bg-white rounded-full" />
                    <EditableText
                      className="text-white"
                      text="Assessment of connection-building opportunities"
                    />
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-none rounded-xl shadow-lg transform hover:scale-105 transition-transform duration-200"
              style={{ backgroundColor: BRAND_COLORS.burgundy }}>
              <CardHeader className="pb-2 px-6 pt-6">
                <CardTitle className="flex items-center text-white text-xl">
                  <Target className="w-6 h-6 mr-3" />
                  Areas for Enhancement
                </CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <ul className="space-y-4">
                  <li className="flex items-start text-white">
                    <div className="w-2 h-2 mt-2 mr-2 bg-white rounded-full" />
                    <EditableText
                      className="text-white"
                      text="Evaluation of participant feedback on session timing and pacing"
                    />
                  </li>
                  <li className="flex items-start text-white">
                    <div className="w-2 h-2 mt-2 mr-2 bg-white rounded-full" />
                    <EditableText
                      className="text-white"
                      text="Review of networking and relationship-building structures"
                    />
                  </li>
                  <li className="flex items-start text-white">
                    <div className="w-2 h-2 mt-2 mr-2 bg-white rounded-full" />
                    <EditableText
                      className="text-white"
                      text="Discussion of support mechanisms for implementation"
                    />
                  </li>
                  <li className="flex items-start text-white">
                    <div className="w-2 h-2 mt-2 mr-2 bg-white rounded-full" />
                    <EditableText
                      className="text-white"
                      text="Analysis of logistics and operational improvements"
                    />
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-none rounded-xl shadow-lg transform hover:scale-105 transition-transform duration-200"
              style={{ backgroundColor: BRAND_COLORS.orange }}>
              <CardHeader className="pb-2 px-6 pt-6">
                <CardTitle className="flex items-center text-white text-xl">
                  <Map className="w-6 h-6 mr-3" />
                  Future Planning
                </CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <ul className="space-y-4">
                  <li className="flex items-start text-white">
                    <div className="w-2 h-2 mt-2 mr-2 bg-white rounded-full" />
                    <EditableText
                      className="text-white"
                      text="Integration of successful elements into future retreats"
                    />
                  </li>
                  <li className="flex items-start text-white">
                    <div className="w-2 h-2 mt-2 mr-2 bg-white rounded-full" />
                    <EditableText
                      className="text-white"
                      text="Development of follow-up support strategies"
                    />
                  </li>
                  <li className="flex items-start text-white">
                    <div className="w-2 h-2 mt-2 mr-2 bg-white rounded-full" />
                    <EditableText
                      className="text-white"
                      text="Planning for enhanced peer connection opportunities"
                    />
                  </li>
                  <li className="flex items-start text-white">
                    <div className="w-2 h-2 mt-2 mr-2 bg-white rounded-full" />
                    <EditableText
                      className="text-white"
                      text="Discussion of resource allocation and timeline adjustments"
                    />
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Charts Section - Now 2 per row and forced to new page */}
        <div className="force-break">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Black History Retreat Participant Feedback</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sortedQuestions.map((question, index) => (
              <Card key={index}
                className="border-none rounded-xl shadow-lg transform hover:scale-105 transition-transform duration-200 keep-together"
                style={{ backgroundColor: 'rgba(125, 141, 143, 0.15)' }}>
                <CardHeader className="p-4">
                  <CardTitle className="text-lg text-white break-words">
                    {question}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart margin={{ top: 20, right: 20, bottom: 40, left: 20 }}>
                        <Pie
                          data={processLikertResponses(question)}
                          cx="50%"
                          cy="45%"
                          labelLine={false}
                          label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                            const RADIAN = Math.PI / 180;
                            const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                            const x = cx + radius * Math.cos(-midAngle * RADIAN);
                            const y = cy + radius * Math.sin(-midAngle * RADIAN);

                            return (
                              <text
                                x={x}
                                y={y}
                                fill="#FFFFFF"
                                fontSize={14}
                                fontWeight="bold"
                                textAnchor="middle"
                                dominantBaseline="middle"
                              >
                                {`${(percent * 100).toFixed(0)}%`}
                              </text>
                            );
                          }}
                          outerRadius={100}
                          innerRadius={50}
                          fill="#8884d8"
                          dataKey="value"
                          paddingAngle={4}
                        >
                          {processLikertResponses(question).map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                              stroke="rgba(255,255,255,0.1)"
                              strokeWidth={2}
                            />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                          verticalAlign="bottom"
                          align="center"
                          height={36}
                          layout="horizontal"
                          wrapperStyle={{
                            paddingTop: "20px",
                            width: "100%",
                            margin: "0 auto"
                          }}
                          formatter={(value) => (
                            <span className="text-white/90 text-sm whitespace-normal break-words max-w-[120px]">{value}</span>
                          )}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SurveyVisualization;