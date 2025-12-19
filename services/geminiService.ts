
import { GoogleGenAI } from "@google/genai";

export interface AnalysisResult {
  text: string;
  sources: { title: string; uri: string }[];
}

/**
 * 복용 중인 영양제 및 의약품 목록을 분석하여 상호작용 위험을 반환합니다.
 */
export const analyzeSupplements = async (supplementList: string[]): Promise<AnalysisResult> => {
    // 반드시 process.env.API_KEY로부터 키를 가져옵니다.
    const apiKey = process.env.API_KEY;
    
    if (!apiKey || apiKey === "undefined" || apiKey === "") {
      throw new Error("API_KEY_MISSING");
    }

    // 호출 직전에 인스턴스를 생성하여 최신 API 키 상태를 반영합니다.
    const ai = new GoogleGenAI({ apiKey });
    
    // 복잡한 의료 추론 및 검색 증강을 위해 gemini-3-pro-preview를 명시적으로 사용합니다.
    // gemini-1.5-flash 모델은 현재 404 에러를 유발할 수 있으므로 사용하지 않습니다.
    const modelName = 'gemini-3-pro-preview';
    
    const prompt = `
        당신은 세계적인 수준의 임상 약학 데이터 분석가이자 건강기능식품 전문가입니다.
        사용자가 복용 중인 다음 목록을 정밀 분석하십시오: [${supplementList.join(', ')}]

        분석 리포트 가이드라인:
        1. 안전성 종합 평가 (안전, 주의, 위험 중 선택)
        2. 주요 성분 간의 치명적 상호작용 (흡수 저해, 독성 증가 등)
        3. 동일 성분 중복 섭취에 의한 과다복용 위험군 식별
        4. 최적의 복용 시간대 및 생활 수칙 제안

        답변은 친절하면서도 전문적이어야 하며, 한국어로 작성하십시오.
        신뢰할 수 있는 최신 의학 정보를 검색하여 근거를 포함하십시오.
    `;

    try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: [{ parts: [{ text: prompt }] }],
          config: {
            tools: [{ googleSearch: {} }],
            temperature: 0.4, // 분석의 정확도를 위해 온도를 낮춤
          },
        });

        const text = response.text || "분석 결과를 생성할 수 없습니다.";
        const sources: { title: string; uri: string }[] = [];
        
        // Grounding Metadata에서 소스 추출 (규칙 준수)
        const candidates = (response as any).candidates;
        if (candidates && candidates[0]?.groundingMetadata?.groundingChunks) {
          candidates[0].groundingMetadata.groundingChunks.forEach((chunk: any) => {
            if (chunk.web && chunk.web.uri && chunk.web.title) {
              sources.push({
                title: chunk.web.title,
                uri: chunk.web.uri
              });
            }
          });
        }

        return { text, sources };
    } catch (error: any) {
        // 404 Not Found 에러가 발생하면 모델 또는 키 문제로 간주
        if (error.message?.includes("404") || error.message?.includes("not found")) {
            throw new Error("API_KEY_INVALID");
        }
        throw error;
    }
};
