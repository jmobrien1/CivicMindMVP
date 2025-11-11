import { storage } from "./storage";
import { detectBias, checkPolicyCompliance, type BiasAnalysis, type PolicyViolation } from "./bias-detection";
import { redactPii } from "./utils/pii-detector";
import type { PolicyConfig } from "@shared/schema";

interface GuardrailCheck {
  allowed: boolean;
  wasBlocked: boolean;
  biasDetected?: BiasAnalysis;
  policyViolation?: PolicyViolation;
  rewrittenContent?: string;
  reason?: string;
}

class GuardrailsService {
  private configCache: Map<string, { config: PolicyConfig; expiry: number }> = new Map();
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  // Severity ranking for threshold comparisons (low < medium < high)
  private readonly SEVERITY_RANK: Record<string, number> = {
    low: 1,
    medium: 2,
    high: 3,
  };

  private severityMeetsThreshold(detectedSeverity: string, thresholdSeverity: string): boolean {
    const detectedRank = this.SEVERITY_RANK[detectedSeverity] || 0;
    const thresholdRank = this.SEVERITY_RANK[thresholdSeverity] || 0;
    return detectedRank >= thresholdRank;
  }

  async checkResponse(
    content: string,
    messageId: string,
    conversationId: string,
    context?: string
  ): Promise<GuardrailCheck> {
    const startTime = Date.now();

    try {
      console.log('[Guardrails] Starting compliance check...');

      // Get active policy configs (with caching)
      const configs = await this.getActiveConfigs();

      // Extract policy settings with defaults
      const biasThresholdConfig = this.getConfig(configs, 'bias_threshold')?.configValue as {
        blockSeverity?: string;
        rewriteSeverity?: string;
        allowSeverity?: string;
      } | undefined;

      // Determine severity thresholds (configurable with sensible defaults)
      const blockSeverity = biasThresholdConfig?.blockSeverity || 'high'; // Block at this level and above
      const rewriteSeverity = biasThresholdConfig?.rewriteSeverity || 'medium'; // Auto-rewrite at this level
      const allowSeverity = biasThresholdConfig?.allowSeverity || 'low'; // Allow with flag at this level

      const blockedTopics = (this.getConfig(configs, 'blocked_topics')?.configValue as string[]) || [];
      const allowedTopics = (this.getConfig(configs, 'allowed_topics')?.configValue as string[]) || [];

      console.log(`[Guardrails] Using thresholds - Block: ${blockSeverity}, Rewrite: ${rewriteSeverity}, Allow: ${allowSeverity}`);

      // Check for policy violations first (faster, deterministic)
      const policyCheck = await checkPolicyCompliance(content, allowedTopics, blockedTopics);
      
      if (policyCheck.isViolation && policyCheck.shouldBlock) {
        console.warn('[Guardrails] Policy violation detected - BLOCKING response');
        
        // Log to audit trail (with PII redaction)
        await storage.createAuditLog({
          eventType: 'policy_violation',
          severity: policyCheck.severity,
          messageId,
          conversationId,
          details: {
            violatedPolicies: policyCheck.violatedPolicies,
            explanation: redactPii(policyCheck.explanation),
          },
        });

        // Flag response for review
        await storage.createFlaggedResponse({
          messageId,
          flagType: 'policy_violation',
          severity: policyCheck.severity,
          violatedPolicies: policyCheck.violatedPolicies,
          explanation: redactPii(policyCheck.explanation),
          wasBlocked: true,
        });

        const processingTime = Date.now() - startTime;
        console.log(`[Guardrails] Check complete in ${processingTime}ms - BLOCKED`);

        return {
          allowed: false,
          wasBlocked: true,
          policyViolation: policyCheck,
          reason: 'Response violates content policy',
        };
      }

      // Check for bias
      const biasCheck = await detectBias(content, context);

      // Handle bias based on configured thresholds using severity ranking
      // Block if severity >= blockSeverity (e.g., high/medium block if threshold is medium)
      // Rewrite if severity >= rewriteSeverity but < blockSeverity
      // Flag if severity >= allowSeverity but < rewriteSeverity
      const shouldBlock = biasCheck.hasBias && this.severityMeetsThreshold(biasCheck.severity, blockSeverity);
      const shouldRewrite = biasCheck.hasBias && 
        this.severityMeetsThreshold(biasCheck.severity, rewriteSeverity) &&
        !this.severityMeetsThreshold(biasCheck.severity, blockSeverity);
      const shouldFlag = biasCheck.hasBias && 
        this.severityMeetsThreshold(biasCheck.severity, allowSeverity) &&
        !this.severityMeetsThreshold(biasCheck.severity, rewriteSeverity);

      // Block responses that meet or exceed block threshold
      if (shouldBlock) {
        console.warn(`[Guardrails] Bias at block threshold (${biasCheck.severity}) - BLOCKING response`);

        // Log to audit trail (with PII redaction)
        await storage.createAuditLog({
          eventType: 'bias_detected',
          severity: biasCheck.severity,
          messageId,
          conversationId,
          details: {
            biasTypes: biasCheck.biasTypes,
            explanation: redactPii(biasCheck.explanation),
            confidence: biasCheck.confidence,
          },
        });

        // Flag response for review
        await storage.createFlaggedResponse({
          messageId,
          flagType: 'bias',
          severity: biasCheck.severity,
          biasTypes: biasCheck.biasTypes,
          explanation: redactPii(biasCheck.explanation),
          suggestedRewrite: redactPii(biasCheck.suggestedRewrite || ''),
          confidence: biasCheck.confidence,
          wasBlocked: true,
        });

        const processingTime = Date.now() - startTime;
        console.log(`[Guardrails] Check complete in ${processingTime}ms - BLOCKED`);

        return {
          allowed: false,
          wasBlocked: true,
          biasDetected: biasCheck,
          reason: `Response contains bias at block threshold (${biasCheck.severity})`,
        };
      }

      // Auto-rewrite responses that meet rewrite threshold
      if (shouldRewrite && biasCheck.suggestedRewrite) {
        console.warn(`[Guardrails] Bias at rewrite threshold (${biasCheck.severity}) - attempting auto-rewrite`);

        // Secondary validation: check if rewrite also has bias
        const rewriteCheck = await detectBias(biasCheck.suggestedRewrite, context);

        if (!rewriteCheck.hasBias || rewriteCheck.severity === 'low') {
          // Rewrite is acceptable - use it
          console.log('[Guardrails] Auto-rewrite passed validation');

          // Log the rewrite to audit trail
          await storage.createAuditLog({
            eventType: 'bias_auto_rewrite',
            severity: biasCheck.severity,
            messageId,
            conversationId,
            details: {
              originalText: redactPii(content),
              rewrittenText: redactPii(biasCheck.suggestedRewrite),
              biasTypes: biasCheck.biasTypes,
              explanation: redactPii(biasCheck.explanation),
            },
          });

          // Flag for review but don't block
          await storage.createFlaggedResponse({
            messageId,
            flagType: 'bias',
            severity: biasCheck.severity,
            biasTypes: biasCheck.biasTypes,
            explanation: redactPii(biasCheck.explanation),
            suggestedRewrite: redactPii(biasCheck.suggestedRewrite),
            confidence: biasCheck.confidence,
            wasBlocked: false,
          });

          const processingTime = Date.now() - startTime;
          console.log(`[Guardrails] Check complete in ${processingTime}ms - REWRITTEN`);

          return {
            allowed: true,
            wasBlocked: false,
            biasDetected: biasCheck,
            rewrittenContent: biasCheck.suggestedRewrite,
          };
        } else {
          // Rewrite also has bias - block the response
          console.warn('[Guardrails] Auto-rewrite failed validation - BLOCKING');

          await storage.createAuditLog({
            eventType: 'bias_detected',
            severity: biasCheck.severity,
            messageId,
            conversationId,
            details: {
              biasTypes: biasCheck.biasTypes,
              explanation: redactPii(biasCheck.explanation),
              rewriteAttemptFailed: true,
            },
          });

          await storage.createFlaggedResponse({
            messageId,
            flagType: 'bias',
            severity: biasCheck.severity,
            biasTypes: biasCheck.biasTypes,
            explanation: redactPii(biasCheck.explanation),
            suggestedRewrite: redactPii(biasCheck.suggestedRewrite),
            confidence: biasCheck.confidence,
            wasBlocked: true,
          });

          const processingTime = Date.now() - startTime;
          console.log(`[Guardrails] Check complete in ${processingTime}ms - BLOCKED`);

          return {
            allowed: false,
            wasBlocked: true,
            biasDetected: biasCheck,
            reason: 'Auto-rewrite failed validation',
          };
        }
      }

      // Flag responses at allow threshold (but don't block)
      if (shouldFlag) {
        console.log(`[Guardrails] Bias at allow threshold (${biasCheck.severity}) - allowing with flag`);

        // Log to audit trail
        await storage.createAuditLog({
          eventType: 'bias_detected',
          severity: biasCheck.severity,
          messageId,
          conversationId,
          details: {
            biasTypes: biasCheck.biasTypes,
            explanation: redactPii(biasCheck.explanation),
          },
        });

        // Flag for review but don't block
        await storage.createFlaggedResponse({
          messageId,
          flagType: 'bias',
          severity: biasCheck.severity,
          biasTypes: biasCheck.biasTypes,
          explanation: redactPii(biasCheck.explanation),
          confidence: biasCheck.confidence,
          wasBlocked: false,
        });
      }

      // No blocking issues - allow response
      const processingTime = Date.now() - startTime;
      console.log(`[Guardrails] Check complete in ${processingTime}ms - ALLOWED`);

      return {
        allowed: true,
        wasBlocked: false,
        biasDetected: biasCheck.hasBias ? biasCheck : undefined,
        policyViolation: policyCheck.isViolation ? policyCheck : undefined,
      };

    } catch (error) {
      console.error('[Guardrails] Check failed - using keyword fallback:', error);
      
      // Graceful degradation: use simple keyword detection
      const fallbackCheck = this.keywordFallbackCheck(content);

      if (fallbackCheck.shouldBlock) {
        console.warn('[Guardrails] Fallback check BLOCKED response');
        
        await storage.createAuditLog({
          eventType: 'guardrails_fallback_block',
          severity: 'medium',
          messageId,
          conversationId,
          details: {
            reason: fallbackCheck.reason,
            keywordsMatched: fallbackCheck.matchedKeywords,
          },
        });

        return {
          allowed: false,
          wasBlocked: true,
          reason: fallbackCheck.reason,
        };
      }

      // If fallback doesn't block, allow with warning
      console.warn('[Guardrails] Fallback check passed - allowing response');
      return {
        allowed: true,
        wasBlocked: false,
        reason: 'Guardrails check degraded to keyword fallback',
      };
    }
  }

  private getConfig(configs: PolicyConfig[], configType: string): PolicyConfig | undefined {
    return configs.find(c => c.configType === configType && c.isActive);
  }

  private async getActiveConfigs(): Promise<PolicyConfig[]> {
    const cacheKey = 'active_configs';
    const cached = this.configCache.get(cacheKey);

    if (cached && cached.expiry > Date.now()) {
      console.log('[Guardrails] Using cached policy configs');
      return [cached.config];
    }

    console.log('[Guardrails] Fetching fresh policy configs');
    const configs = await storage.getActiveConfigs();

    // Cache each config individually
    configs.forEach(config => {
      this.configCache.set(`${config.configType}_${config.name}`, {
        config,
        expiry: Date.now() + this.CACHE_TTL_MS,
      });
    });

    // Also cache the full list
    if (configs.length > 0) {
      this.configCache.set(cacheKey, {
        config: configs[0],
        expiry: Date.now() + this.CACHE_TTL_MS,
      });
    }

    return configs;
  }

  invalidateCache() {
    console.log('[Guardrails] Cache invalidated');
    this.configCache.clear();
  }

  private keywordFallbackCheck(content: string): {
    shouldBlock: boolean;
    reason?: string;
    matchedKeywords?: string[];
  } {
    const lowerContent = content.toLowerCase();

    // Blocked patterns for graceful degradation
    const blockedPatterns = [
      { pattern: /\b(vote for|endorse|support|oppose) (democrat|republican|liberal|conservative)/i, reason: 'Political endorsement detected' },
      { pattern: /\byou should (vote|support|believe)/i, reason: 'Political opinion detected' },
      { pattern: /\b(rich|poor|wealthy|low-income) (people|families|neighborhoods) (are|deserve|should)/i, reason: 'Socioeconomic bias detected' },
      { pattern: /\ball (men|women|people of color|minorities|immigrants) (are|can't|should)/i, reason: 'Demographic stereotype detected' },
    ];

    for (const {pattern, reason} of blockedPatterns) {
      if (pattern.test(content)) {
        return {
          shouldBlock: true,
          reason,
          matchedKeywords: [pattern.source],
        };
      }
    }

    return { shouldBlock: false };
  }
}

export const guardrails = new GuardrailsService();
