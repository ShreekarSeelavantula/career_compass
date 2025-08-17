import { EmbeddingGenerator } from './embeddings';

export interface ScoreComponents {
  bm25: number;
  semantic: number;
  rule_boost: number;
  final: number;
}

export class RankingService {
  private embeddingGenerator = new EmbeddingGenerator();
  private bm25Weight = 0.4;
  private semanticWeight = 0.5;
  private ruleBoostWeight = 0.1;

  calculateHybridScore(
    resumeText: string,
    resumeVec: number[],
    jobText: string,
    jobVec: number[],
    resumeSkills: string[],
    jobSkills: string[],
    resumeExp?: number,
    jobMinExp?: number,
    sameLocation: boolean = false
  ): ScoreComponents {
    const bm25Score = this.calculateBM25Score(resumeText, jobText);
    const semanticScore = this.calculateSemanticScore(resumeVec, jobVec);
    const ruleBoost = this.calculateRuleBoost(
      resumeSkills,
      jobSkills,
      resumeExp,
      jobMinExp,
      sameLocation
    );

    const finalScore = 
      this.bm25Weight * bm25Score +
      this.semanticWeight * semanticScore +
      this.ruleBoostWeight * ruleBoost;

    return {
      bm25: bm25Score,
      semantic: semanticScore,
      rule_boost: ruleBoost,
      final: Math.max(0, Math.min(1, finalScore))
    };
  }

  calculateBM25Score(resumeText: string, jobText: string): number {
    if (!resumeText || !jobText) return 0;

    const resumeTokens = this.tokenize(resumeText);
    const jobTokens = this.tokenize(jobText);
    
    if (resumeTokens.length === 0 || jobTokens.length === 0) return 0;

    const resumeTermFreq = this.getTermFrequency(resumeTokens);
    const jobTerms = new Set(jobTokens);

    let score = 0;
    const k1 = 1.5;
    const b = 0.75;
    const avgDocLength = (resumeTokens.length + jobTokens.length) / 2;

    for (const term of jobTerms) {
      const tf = resumeTermFreq[term] || 0;
      if (tf > 0) {
        const idf = Math.log(2 / (1 + (resumeTermFreq[term] ? 1 : 0)));
        const numerator = tf * (k1 + 1);
        const denominator = tf + k1 * (1 - b + b * (resumeTokens.length / avgDocLength));
        score += idf * (numerator / denominator);
      }
    }

    return Math.min(1, score / (jobTokens.length * 2));
  }

  calculateSemanticScore(resumeVec: number[], jobVec: number[]): number {
    if (!resumeVec || !jobVec || resumeVec.length === 0 || jobVec.length === 0) {
      return 0;
    }

    const similarity = this.embeddingGenerator.cosineSimilarity(resumeVec, jobVec);
    return (similarity + 1) / 2; // Convert from [-1, 1] to [0, 1]
  }

  calculateRuleBoost(
    resumeSkills: string[],
    jobSkills: string[],
    resumeExp?: number,
    jobMinExp?: number,
    sameLocation: boolean = false
  ): number {
    const skillsScore = this.jaccardSimilarity(
      resumeSkills.map(s => s.toLowerCase()),
      jobSkills.map(s => s.toLowerCase())
    );

    const expScore = this.calculateExperienceScore(resumeExp, jobMinExp);
    const locationScore = sameLocation ? 1.0 : 0.8;

    return 0.6 * skillsScore + 0.3 * expScore + 0.1 * locationScore;
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 2);
  }

  private getTermFrequency(tokens: string[]): Record<string, number> {
    const freq: Record<string, number> = {};
    for (const token of tokens) {
      freq[token] = (freq[token] || 0) + 1;
    }
    return freq;
  }

  private jaccardSimilarity(set1: string[], set2: string[]): number {
    if (set1.length === 0 && set2.length === 0) return 1;
    if (set1.length === 0 || set2.length === 0) return 0;

    const s1 = new Set(set1);
    const s2 = new Set(set2);
    const intersection = new Set([...s1].filter(x => s2.has(x)));
    const union = new Set([...s1, ...s2]);

    return intersection.size / union.size;
  }

  private calculateExperienceScore(resumeExp?: number, jobMinExp?: number): number {
    if (resumeExp === undefined || jobMinExp === undefined) return 0.5;

    if (resumeExp >= jobMinExp) {
      if (resumeExp <= jobMinExp + 2) {
        return 1.0;
      } else {
        const excess = resumeExp - jobMinExp - 2;
        const penalty = Math.min(0.3, excess * 0.05);
        return 1.0 - penalty;
      }
    } else {
      const deficit = jobMinExp - resumeExp;
      const penalty = Math.min(0.8, deficit * 0.2);
      return 1.0 - penalty;
    }
  }
}
