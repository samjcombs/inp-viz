import React, { useState, useEffect, useRef, MouseEvent } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useReactToPrint } from 'react-to-print';
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
  const [selectedSurvey, setSelectedSurvey] = useState<'opening' | 'closing'>('opening');
  const [data, setData] = useState<SurveyData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortedQuestions, setSortedQuestions] = useState<string[]>([]);
  const [executiveSummary, setExecutiveSummary] = useState<ExecutiveSummary | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const componentRef = useRef<HTMLDivElement>(null);
  const [isSwitching, setIsSwitching] = useState(false);

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
    }, [text]);

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
    const satisfactionPercentages = questions.map(question => {
      const responses = parsedData.filter(row =>
        row[question] === 'Strongly Agree' ||
        row[question] === 'Agree'
      ).length;
      return Math.round((responses / totalResponses) * 100);
    });

    const roomForImprovementPercentages = questions.map(question => {
      const responses = parsedData.filter(row =>
        row[question] === 'Disagree'
      ).length;
      return Math.round((responses / totalResponses) * 100);
    });

    const highestRated = {
      question: questions[0],
      percentage: satisfactionPercentages[0]
    };

    const lowestRated = {
      question: questions[questions.length - 1],
      percentage: roomForImprovementPercentages[questions.length - 1]
    };

    const overallSatisfaction = Math.round(
      satisfactionPercentages.reduce((a, b) => a + b, 0) / satisfactionPercentages.length
    );

    return {
      totalResponses,
      highestRated,
      lowestRated,
      overallSatisfaction
    };
  };

  const getSurveyNarrativeSummary = (selectedSurvey: 'opening' | 'closing', executiveSummary: ExecutiveSummary) => {
    if (selectedSurvey === 'opening') {
      return [
        `The Black History Retreat survey results reveal a highly successful event, with ${executiveSummary.totalResponses} participants providing comprehensive feedback. The overall satisfaction rate of ${executiveSummary.overallSatisfaction}% 'Strongly Agree' responses across all categories indicates strong program effectiveness. Notably, the historical site visits and panel discussions received particularly positive feedback, with over ${executiveSummary.highestRated.percentage}% of participants strongly agreeing about their value.`,
        "Participants especially appreciated the integration of historical knowledge with contemporary leadership challenges. The visit to Legacy Sites and the panel conversation with community leaders emerged as standout experiences. However, participants indicated a desire for more structured networking opportunities and peer connection time, suggesting an area for future enhancement.",
        "Key recommendations from participants include increasing dedicated time for peer interaction, developing follow-up support mechanisms, and creating more opportunities for regional cohort building. The feedback suggests that while the content and historical components were highly impactful, the retreat's networking and relationship-building aspects could be expanded in future iterations."
      ];
    } else {
      return [
        `The Black Futures Retreat survey results demonstrate a transformative experience, with ${executiveSummary.totalResponses} participants sharing their insights. The overall satisfaction rate of ${executiveSummary.overallSatisfaction}% 'Strongly Agree' responses highlights the program's success. The futurism-focused sessions and DC-based experiences were particularly well-received, with ${executiveSummary.highestRated.percentage}% of participants strongly agreeing about their effectiveness.`,
        "Participants found significant value in exploring futurism as a leadership tool and connecting it to their current work. The Anacostia tour, Frederick Douglass House visit, and panel discussions with local leaders provided a powerful framework for understanding both historical context and future possibilities. The combination of theoretical learning and practical application was highlighted as particularly effective.",
        "Feedback emphasized the impact of connecting historical learning from Montgomery with future-focused leadership strategies. Participants appreciated the balance of policy discussions, leadership development, and community engagement. The retreat successfully bridged past learnings with future applications, though some participants suggested more time for peer-to-peer discussion and practical application exercises."
      ];
    }
  };

  const getProgramReviewSections = (selectedSurvey: 'opening' | 'closing') => {
    if (selectedSurvey === 'opening') {
      return {
        impact: [
          "Analysis of highest-rated activities and their key success factors",
          "Review of participant engagement levels across different sessions",
          "Discussion of historical knowledge integration effectiveness",
          "Assessment of connection-building opportunities"
        ],
        enhancement: [
          "Evaluation of participant feedback on session timing and pacing",
          "Review of networking and relationship-building structures",
          "Discussion of support mechanisms for implementation",
          "Analysis of logistics and operational improvements"
        ],
        planning: [
          "Integration of successful elements into future retreats",
          "Development of follow-up support strategies",
          "Planning for enhanced peer connection opportunities",
          "Discussion of resource allocation and timeline adjustments"
        ]
      };
    } else {
      return {
        impact: [
          "Analysis of futurism integration and practical applications",
          "Review of DC-specific programming effectiveness",
          "Evaluation of policy and advocacy session impact",
          "Assessment of historical-future connections made"
        ],
        enhancement: [
          "Review of session timing and content depth",
          "Analysis of peer learning opportunities",
          "Evaluation of practical application exercises",
          "Discussion of post-retreat support needs"
        ],
        planning: [
          "Integration of futurism tools into ongoing work",
          "Development of policy advocacy strategies",
          "Planning for continued peer collaboration",
          "Discussion of regional implementation support"
        ]
      };
    }
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

  const SurveySelector = () => (
    <div className={`fixed top-0 left-0 right-0 backdrop-blur-lg p-4 flex justify-between items-center z-50 no-print transition-colors duration-500 ${selectedSurvey === 'opening' ? 'bg-navy/90' : 'bg-burgundy/90'}`}>
      <button
        onClick={() => {
          setIsSwitching(true);
          setSelectedSurvey(selectedSurvey === 'opening' ? 'closing' : 'opening');
        }}
        disabled={isSwitching}
        className="group flex items-center space-x-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 backdrop-blur-sm hover:bg-white/10 transition-all duration-300"
      >
        <svg className="w-4 h-4 text-white/70 group-hover:text-white/90 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
        </svg>
        <span className="text-sm text-white/70 group-hover:text-white/90 transition-colors duration-300">
          Switch to {selectedSurvey === 'opening' ? 'Futures' : 'History'} Retreat
        </span>
      </button>

      <div className="absolute left-1/2 -translate-x-1/2 flex items-center">
        <div className="flex items-center space-x-6 px-6 py-2 rounded-xl bg-white/5 border border-white/5 backdrop-blur-sm">
          <div className="flex items-center space-x-4">
            <div className={`w-1.5 h-1.5 rounded-full transition-colors duration-500 ${selectedSurvey === 'opening' ? 'bg-teal-400/40' : 'bg-orange-400/40'}`}></div>
            {isSwitching ? (
              <div className="text-teal-300 text-sm animate-pulse">Loading...</div>
            ) : (
              <div className="flex items-center space-x-6">
                <div className="text-white/90 text-base font-medium flex items-center space-x-2">
                  <span>{selectedSurvey === 'opening' ? 'Black History Retreat' : 'Black Futures Retreat'}</span>
                  <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${selectedSurvey === 'opening'
                    ? 'bg-teal-400/20 text-teal-300'
                    : 'bg-orange-400/20 text-orange-300'
                    }`}>
                    {selectedSurvey === 'opening' ? 'History' : 'Futures'}
                  </span>
                </div>
                <div className="h-4 w-px bg-white/10"></div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-white/50 text-sm">Responses</span>
                    <span className="text-white/90 text-sm font-medium">{executiveSummary?.totalResponses || 0}</span>
                  </div>
                  <div className="h-3 w-px bg-white/10"></div>
                  <div className="flex items-center space-x-2">
                    <span className="text-white/50 text-sm">Satisfaction</span>
                    <span className="text-white/90 text-sm font-medium">{executiveSummary?.overallSatisfaction || 0}%</span>
                  </div>
                </div>
              </div>
            )}
            <div className={`w-1.5 h-1.5 rounded-full transition-colors duration-500 ${selectedSurvey === 'opening' ? 'bg-teal-400/40' : 'bg-orange-400/40'}`}></div>
          </div>
        </div>
      </div>

      <button
        onClick={onPrintClick}
        className="group bg-white/5 border border-white/5 text-white/90 px-4 py-1.5 rounded-lg backdrop-blur-sm hover:bg-white/10 transition-all duration-300 flex items-center space-x-2 text-sm"
      >
        <svg className="w-4 h-4 text-white/70 group-hover:text-white/90 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        <span>Export</span>
      </button>
    </div>
  );

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsSwitching(true);
        const response = await fetch(`/api/survey?type=${selectedSurvey}`);

        if (!response.ok) {
          throw new Error('Failed to fetch survey data');
        }

        const parsedData = await response.json();
        console.log('Received data length:', parsedData.length);

        if (parsedData.length === 0) {
          setError('No valid data found');
          setLoading(false);
          setIsSwitching(false);
          return;
        }

        // Filter questions based on survey type
        const questions = Object.keys(parsedData[0] || {}).filter(key => {
          const isValidResponse = parsedData[0][key] &&
            typeof parsedData[0][key] === 'string' &&
            (parsedData[0][key].includes('Agree') || parsedData[0][key].includes('Disagree'));

          const isMetadataField = key.startsWith('Response') ||
            key.includes('ID') ||
            ['First Name', 'Last Name', 'Title', 'Organization'].includes(key);

          return isValidResponse && !isMetadataField;
        });

        // Sort questions by "Strongly Agree" percentage
        const questionsWithStronglyAgree = questions.map(question => {
          const stronglyAgreeCount = parsedData.filter((row: SurveyData) =>
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
        setLoading(false);
        setIsSwitching(false);
      } catch (error) {
        if (error instanceof Error) {
          console.error('Error loading data:', error);
          setError('Failed to load data');
        }
        setLoading(false);
        setIsSwitching(false);
      }
    };

    loadData();
  }, [selectedSurvey]);

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

  const calculateAveragePercentage = (data: SurveyData[], responseType: string) => {
    const questions = Object.keys(data[0] || {}).filter(key => {
      const isValidResponse = data[0][key] &&
        typeof data[0][key] === 'string' &&
        (data[0][key].includes('Agree') || data[0][key].includes('Disagree'));

      const isMetadataField = key.startsWith('Response') ||
        key.includes('ID') ||
        ['First Name', 'Last Name', 'Title', 'Organization'].includes(key);

      return isValidResponse && !isMetadataField;
    });

    const percentages = questions.map(question => {
      const responses = data.filter(row => row[question] === responseType).length;
      return (responses / data.length) * 100;
    });

    return Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length);
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
      <Alert className="w-full" style={{ backgroundColor: BRAND_COLORS.burgundy }}>
        <AlertDescription className="text-white">{error}</AlertDescription>
      </Alert>
    );
  }

  if (!executiveSummary) {
    return (
      <Alert className="w-full" style={{ backgroundColor: BRAND_COLORS.burgundy }}>
        <AlertDescription className="text-white">Unable to process survey data</AlertDescription>
      </Alert>
    );
  }

  return (
    <div>
      <SurveySelector />
      <div ref={componentRef} className="space-y-8 p-8 pt-24 rounded-xl" style={{ backgroundColor: BRAND_COLORS.navy }}>
        {/* Executive Summary Section */}
        <div className="keep-together">
          <div className="mb-8">
            <h1 className="text-5xl font-bold text-white text-center mb-8">
              {selectedSurvey === 'opening' ? 'Black History Retreat Impact Report' : 'Black Futures Retreat Impact Report'}
            </h1>

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
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white/80 text-lg mb-2">Overall Satisfaction</p>
                        <p className="text-4xl font-bold text-white">{executiveSummary.overallSatisfaction}%</p>
                      </div>
                      <ArrowUp className="w-16 h-16 text-white/80" />
                    </div>
                    <div className="text-white/90 text-sm mt-4">
                      <ul className="space-y-1">
                        <li className="flex justify-between">
                          <span>Strongly Agree:</span>
                          <span>{calculateAveragePercentage(data, 'Strongly Agree')}%</span>
                        </li>
                        <li className="flex justify-between">
                          <span>Agree:</span>
                          <span>{calculateAveragePercentage(data, 'Agree')}%</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none rounded-xl shadow-lg transform hover:scale-105 transition-transform duration-200"
                style={{ backgroundColor: BRAND_COLORS.orange }}>
                <CardContent className="p-8">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white/80 text-lg mb-2">Areas for Growth</p>
                        <p className="text-4xl font-bold text-white">
                          {calculateAveragePercentage(data, 'Somewhat Agree') + calculateAveragePercentage(data, 'Disagree')}%
                        </p>
                      </div>
                      <Target className="w-16 h-16 text-white/80" />
                    </div>
                    <div className="text-white/90 text-sm mt-4">
                      <ul className="space-y-1">
                        <li className="flex justify-between">
                          <span>Somewhat Agree:</span>
                          <span>{calculateAveragePercentage(data, 'Somewhat Agree')}%</span>
                        </li>
                        <li className="flex justify-between">
                          <span>Disagree:</span>
                          <span>{calculateAveragePercentage(data, 'Disagree')}%</span>
                        </li>
                      </ul>
                    </div>
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
                {getSurveyNarrativeSummary(selectedSurvey, executiveSummary).map((text, index) => (
                  <EditableText
                    key={index}
                    className="text-white/90 text-lg leading-relaxed"
                    text={text}
                  />
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Event Team Debrief Agenda - Now with force-break */}
        <div className="force-break mb-16">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            {selectedSurvey === 'opening' ? 'Black History Retreat' : 'Black Futures Retreat'} Program Review
          </h2>
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
                  {getProgramReviewSections(selectedSurvey).impact.map((text, index) => (
                    <li key={index} className="flex items-start text-white">
                      <div className="w-2 h-2 mt-2 mr-2 bg-white rounded-full" />
                      <EditableText className="text-white" text={text} />
                    </li>
                  ))}
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
                  {getProgramReviewSections(selectedSurvey).enhancement.map((text, index) => (
                    <li key={index} className="flex items-start text-white">
                      <div className="w-2 h-2 mt-2 mr-2 bg-white rounded-full" />
                      <EditableText className="text-white" text={text} />
                    </li>
                  ))}
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
                  {getProgramReviewSections(selectedSurvey).planning.map((text, index) => (
                    <li key={index} className="flex items-start text-white">
                      <div className="w-2 h-2 mt-2 mr-2 bg-white rounded-full" />
                      <EditableText className="text-white" text={text} />
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Charts Section - Now 2 per row and forced to new page */}
        <div className="force-break">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            {selectedSurvey === 'opening' ? 'Black History Retreat' : 'Black Futures Retreat'} Participant Feedback
          </h2>
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${isSwitching ? 'opacity-50' : ''}`}>
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