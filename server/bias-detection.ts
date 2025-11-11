import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
});

export interface BiasAnalysis {
  hasBias: boolean;
  biasTypes: string[];
  severity: 'low' | 'medium' | 'high';
  explanation: string;
  suggestedRewrite?: string;
  confidence: number;
}

export async function detectBias(text: string, context?: string): Promise<BiasAnalysis> {
  const startTime = Date.now();

  try {
    console.log('[BiasDetection] Analyzing text for bias...');

    const systemPrompt = `You are an expert bias detection system for municipal government AI assistants. Your role is to identify potential bias in AI-generated responses to ensure fair, equitable service to all citizens.

Analyze the response for these bias types:
1. **Demographic bias**: Unfair treatment based on age, race, ethnicity, gender, disability, religion
2. **Socioeconomic bias**: Assumptions about income, housing, employment status, education level
3. **Political bias**: Partisan language, political opinions, favoritism toward any ideology
4. **Geographic bias**: Unfair treatment of different neighborhoods, zip codes, or areas
5. **Language bias**: Assumptions about English proficiency, literacy level, or communication style
6. **Accessibility bias**: Content that excludes people with disabilities or limited technology access

Response format (JSON only):
{
  "hasBias": true/false,
  "biasTypes": ["demographic", "socioeconomic", "political", "geographic", "language", "accessibility"],
  "severity": "low" | "medium" | "high",
  "explanation": "Brief explanation of detected bias",
  "suggestedRewrite": "Improved version without bias (if hasBias is true)",
  "confidence": 0-100
}

Severity levels:
- **low**: Minor language choices that could be improved but don't significantly impact fairness
- **medium**: Clear bias that should be corrected before sending to citizen
- **high**: Serious bias that violates government service standards and must be blocked

Context: This is for a municipal government chatbot serving a diverse community. Responses must be:
- Neutral and non-partisan
- Accessible to all education and literacy levels
- Inclusive of all demographics and socioeconomic backgrounds
- Free from assumptions about resources, technology access, or abilities`;

    const userPrompt = context
      ? `Context: ${context}\n\nAnalyze this AI response for bias:\n"${text}"`
      : `Analyze this AI response for bias:\n"${text}"`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_completion_tokens: 500,
    });

    const content = response.choices[0]?.message?.content || '{"hasBias": false, "biasTypes": [], "severity": "low", "explanation": "No analysis available", "confidence": 0}';

    let parsed;
    try {
      parsed = JSON.parse(content.trim());
    } catch (parseError) {
      console.error('[BiasDetection] JSON parse error:', parseError);
      console.error('[BiasDetection] Raw response:', content);
      throw new Error('Failed to parse bias detection response');
    }

    const result: BiasAnalysis = {
      hasBias: parsed.hasBias || false,
      biasTypes: Array.isArray(parsed.biasTypes) ? parsed.biasTypes : [],
      severity: parsed.severity || 'low',
      explanation: parsed.explanation || '',
      suggestedRewrite: parsed.suggestedRewrite,
      confidence: Math.max(0, Math.min(100, parsed.confidence || 0)),
    };

    const processingTime = Date.now() - startTime;
    console.log(`[BiasDetection] Analysis complete in ${processingTime}ms: ${result.hasBias ? 'BIAS DETECTED' : 'No bias'} (${result.severity}, confidence: ${result.confidence}%)`);
    
    if (result.hasBias) {
      console.warn(`[BiasDetection] Bias types: ${result.biasTypes.join(', ')}`);
      console.warn(`[BiasDetection] Explanation: ${result.explanation}`);
    }

    return result;
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`[BiasDetection] Analysis failed after ${processingTime}ms:`, error);

    return {
      hasBias: false,
      biasTypes: [],
      severity: 'low',
      explanation: 'Bias detection unavailable - proceeding with caution',
      confidence: 0,
    };
  }
}

export interface PolicyViolation {
  isViolation: boolean;
  violatedPolicies: string[];
  severity: 'low' | 'medium' | 'high';
  explanation: string;
  shouldBlock: boolean;
}

export async function checkPolicyCompliance(
  text: string,
  allowedTopics: string[] = [],
  blockedTopics: string[] = []
): Promise<PolicyViolation> {
  const startTime = Date.now();

  try {
    console.log('[PolicyCheck] Checking policy compliance...');

    const systemPrompt = `You are a policy compliance checker for municipal government AI assistants.

BLOCKED TOPICS (must never discuss):
${blockedTopics.length > 0 ? blockedTopics.map(t => `- ${t}`).join('\n') : '- Political endorsements\n- Personal opinions on controversial topics\n- Medical or legal advice\n- Private citizen information'}

${allowedTopics.length > 0 ? `ALLOWED TOPICS (only these are permitted):\n${allowedTopics.map(t => `- ${t}`).join('\n')}` : ''}

Check if the response violates any policies. Response format (JSON only):
{
  "isViolation": true/false,
  "violatedPolicies": ["policy name"],
  "severity": "low" | "medium" | "high",
  "explanation": "Brief explanation",
  "shouldBlock": true/false
}

Severity & Blocking:
- **low**: Minor policy concern, allow with flag (shouldBlock: false)
- **medium**: Clear violation, should block unless reviewed (shouldBlock: true)
- **high**: Serious violation, must block immediately (shouldBlock: true)`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Check this response:\n"${text}"` }
      ],
      max_completion_tokens: 300,
    });

    const content = response.choices[0]?.message?.content || '{"isViolation": false, "violatedPolicies": [], "severity": "low", "explanation": "", "shouldBlock": false}';

    let parsed;
    try {
      parsed = JSON.parse(content.trim());
    } catch (parseError) {
      console.error('[PolicyCheck] JSON parse error:', parseError);
      throw new Error('Failed to parse policy check response');
    }

    const result: PolicyViolation = {
      isViolation: parsed.isViolation || false,
      violatedPolicies: Array.isArray(parsed.violatedPolicies) ? parsed.violatedPolicies : [],
      severity: parsed.severity || 'low',
      explanation: parsed.explanation || '',
      shouldBlock: parsed.shouldBlock || false,
    };

    const processingTime = Date.now() - startTime;
    console.log(`[PolicyCheck] Check complete in ${processingTime}ms: ${result.isViolation ? 'VIOLATION DETECTED' : 'Compliant'} (severity: ${result.severity})`);
    
    if (result.isViolation) {
      console.warn(`[PolicyCheck] Violated policies: ${result.violatedPolicies.join(', ')}`);
      console.warn(`[PolicyCheck] Should block: ${result.shouldBlock}`);
    }

    return result;
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`[PolicyCheck] Check failed after ${processingTime}ms:`, error);

    return {
      isViolation: false,
      violatedPolicies: [],
      severity: 'low',
      explanation: 'Policy check unavailable',
      shouldBlock: false,
    };
  }
}
