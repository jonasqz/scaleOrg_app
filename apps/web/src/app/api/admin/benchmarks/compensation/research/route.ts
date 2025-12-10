import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface ResearchRequest {
  roleFamily: string;
  standardizedTitle: string;
  seniorityLevel: string;
  industry: string;
  region: string;
  companySize: string;
  currency: string;
}

interface ResearchResponse {
  suggested: {
    p10TotalComp: number | null;
    p25TotalComp: number | null;
    p50TotalComp: number | null;
    p75TotalComp: number | null;
    p90TotalComp: number | null;
    p10BaseSalary: number | null;
    p25BaseSalary: number | null;
    p50BaseSalary: number | null;
    p75BaseSalary: number | null;
    p90BaseSalary: number | null;
    sampleSizeEstimate: number;
  };
  sources: string[];
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
  warnings: string[];
}

// POST /api/admin/benchmarks/compensation/research - AI research compensation data
export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Add admin role check here

    const body: ResearchRequest = await request.json();

    // Validation
    if (!body.roleFamily || !body.standardizedTitle || !body.seniorityLevel) {
      return NextResponse.json(
        { error: 'Missing required fields for research' },
        { status: 400 }
      );
    }

    // Build the research prompt
    const prompt = `You are a compensation research analyst. Research current market compensation data for the following role:

**Role Details:**
- Role Family: ${body.roleFamily}
- Standardized Title: ${body.standardizedTitle}
- Seniority Level: ${body.seniorityLevel}
- Industry: ${body.industry}
- Region: ${body.region}
- Company Size: ${body.companySize}
- Currency: ${body.currency}

**Your Task:**
Using web search, find reliable current compensation data for this role. Look for:
1. Salary data from Levels.fyi, Glassdoor, Payscale, LinkedIn Salary, or other reputable sources
2. Recent job postings with salary ranges
3. Industry reports or surveys
4. Government labor statistics if available

**Output Format (JSON only):**
\`\`\`json
{
  "suggested": {
    "p10TotalComp": <number or null>,
    "p25TotalComp": <number or null>,
    "p50TotalComp": <number>,
    "p75TotalComp": <number or null>,
    "p90TotalComp": <number or null>,
    "p10BaseSalary": <number or null>,
    "p25BaseSalary": <number or null>,
    "p50BaseSalary": <number or null>,
    "p75BaseSalary": <number or null>,
    "p90BaseSalary": <number or null>,
    "sampleSizeEstimate": <number>
  },
  "sources": [
    "Source 1: URL or description",
    "Source 2: URL or description"
  ],
  "confidence": "high|medium|low",
  "reasoning": "Brief explanation of how you arrived at these numbers",
  "warnings": [
    "Any caveats or limitations (e.g., 'Limited data for this specific region')"
  ]
}
\`\`\`

**Important:**
- All compensation values should be in ${body.currency} and ANNUAL amounts
- At minimum, provide p50 (median) total compensation
- If you can't find specific data, provide your best estimate based on similar roles
- Be transparent about data quality in confidence level and warnings
- Convert currencies if needed (use current exchange rates)

Return ONLY the JSON object, no other text.`;

    // Call Claude with web search
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      tools: [
        {
          type: 'web_search_tool' as any,
        },
      ],
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Extract the response
    let responseText = '';
    for (const block of message.content) {
      if (block.type === 'text') {
        responseText += block.text;
      }
    }

    // Parse JSON from response (handle markdown code blocks)
    let jsonText = responseText.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }

    const researchResult: ResearchResponse = JSON.parse(jsonText);

    // Validate the response has required fields
    if (!researchResult.suggested || !researchResult.suggested.p50TotalComp) {
      throw new Error('Invalid research result: missing p50 total compensation');
    }

    // Add metadata
    const response = {
      ...researchResult,
      timestamp: new Date().toISOString(),
      model: 'claude-sonnet-4-20250514',
      researchParams: body,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error researching compensation:', error);

    // Provide helpful error message
    const errorMessage = error.message || 'Failed to research compensation data';

    return NextResponse.json(
      {
        error: 'AI research failed',
        details: errorMessage,
        suggestion: 'Try adjusting the role details or use manual entry'
      },
      { status: 500 }
    );
  }
}
