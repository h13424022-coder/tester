
import { GoogleGenAI } from "@google/genai";

export interface AnalysisResult {
  text: string;
  sources: { title: string; uri: string }[];
}
/**
 * 복용 중인 영양제 및 의약품 목록을 분석하여 상호작용 위험을 반환합니다.
 */
export const analyzeSupplements = async (supplementList: string[]): Promise<AnalysisResult> => {
    // API key must be obtained from process.env.API_KEY.
    const apiKey = process.env.API_KEY;
    
    if (!apiKey || apiKey === "undefined") {
      throw new Error("API_KEY_MISSING");
    }

    // Always create a new GoogleGenAI instance right before the call for up-to-date key selection.
    const ai = new GoogleGenAI({ apiKey });
    // Use gemini-3-pro-preview for complex medical/pharmacological reasoning tasks.
    const modelName = "gemini-1.5-flash";
    
    const prompt = `
        당신은 세계적인 수준의 건강기능식품 및 임상 약학 데이터 분석가입니다.
        사용자가 복용 중인 다음 목록을 분석하여 잠재적 위험을 평가하십시오: [${supplementList.join(', ')}]

        분석 보고서는 다음 구조를 따라야 합니다:
        1. 요약: 전체적인 조합의 안전성 등급 (안전/주의/위험 중 하나 선택 및 이유)
        2. 중복 성분 확인: 동일하거나 유사한 성분이 포함되어 과다 복용 위험이 있는지 확인
        3. 상호작용 분석: 성분 간의 흡수 방해, 부작용 증폭, 효능 감소 등 상세 분석
        4. 전문가의 조언: 복용 시간 조정이나 전문가 상담 권유 등 구체적 지침

        모든 설명은 일반인이 이해하기 쉬우면서도 과학적으로 정확해야 합니다.
        마지막에 "본 정보는 참고용이며, 반드시 의사나 약사와 상담하십시오."를 포함하세요..
    `;

    try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: [{ parts: [{ text: prompt }] }],
            config: {
                tools: [{ googleSearch: {} }],
                temperature: 0.7,
            }
        });

        const text = response.text || "분석 결과를 생성할 수 없습니다.";
        const sources: { title: string; uri: string }[] = [];
        
        // Guidelines: Extract website URLs from groundingChunks and list them.
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        
        if (groundingChunks) {
            groundingChunks.forEach((chunk: any) => {
                if (chunk.web && chunk.web.uri && chunk.web.title) {
                    sources.push({ title: chunk.web.title, uri: chunk.web.uri });
                }
            });
        }

        return { text, sources };
    } catch (error: any) {
        console.error("Gemini API Error:", error);
        // Handle "Requested entity was not found" by throwing a specific error for the UI.
        if (error.message?.includes("Requested entity was not found")) {
            throw new Error("API_KEY_INVALID");
        }
        throw error;
    }
};
