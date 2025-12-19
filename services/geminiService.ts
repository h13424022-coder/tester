
import { GoogleGenAI } from "@google/genai";

export interface AnalysisResult {
  text: string;
  sources: { title: string; uri: string }[];
}

/**
 * 사용자가 입력한 영양제 및 의약품 목록을 최신 Gemini Flash 모델로 분석합니다.
 */
export const analyzeSupplements = async (supplementList: string[]): Promise<AnalysisResult> => {
    // ALWAYS obtain the API key from the environment variable process.env.API_KEY.
    const apiKey = process.env.API_KEY;
    
    if (!apiKey || apiKey === "undefined" || apiKey === "") {
      throw new Error("API_KEY_MISSING");
    }

    // Create a new GoogleGenAI instance right before making an API call to ensure it uses the latest key.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Using gemini-3-flash-preview for general text and search tasks as recommended.
    const modelName = 'gemini-3-flash-preview';
    
    const prompt = `
        당신은 천재적인 건강기능식품 데이터 분석가이자 임상 약학 전문가입니다.
        다음 목록의 영양제 및 의약품 간의 상호작용을 정밀 분석하십시오: [${supplementList.join(', ')}]

        분석 지침:
        1. [종합 안전도]: 안전, 주의, 위험 중 하나를 선택하고 이유를 설명하세요.
        2. [상호작용 주의사항]: 약물 간의 흡수율 변화나 부작용 증폭 가능성을 분석하세요.
        3. [중복 성분 확인]: 서로 다른 제품에 공통으로 들어있어 과다복용 위험이 있는 성분을 찾으세요.
        4. [전문가 제안]: 복용 시간(식전/식후) 및 함께 먹으면 좋은/나쁜 음식을 조언하세요.

        답변은 일반인이 이해하기 쉬우면서도 전문성을 유지해야 하며, 반드시 한국어로 작성하십시오.
        신뢰할 수 있는 최신 정보를 바탕으로 근거를 포함하십시오.
    `;

    try {
        // Generate content with Google Search grounding enabled.
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }],
            temperature: 0.2, // Keep temperature low for high-quality factual analysis.
          },
        });

        // Use the .text property to extract the generated text.
        const text = response.text || "분석 결과를 생성하는 데 실패했습니다.";
        
        // Extract website URLs from groundingChunks as required when using Google Search.
        const sources: { title: string; uri: string }[] = [];
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        
        if (groundingChunks) {
          groundingChunks.forEach((chunk: any) => {
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
        console.error("Gemini API Error:", error);
        // Handle "not found" or 404 errors which may require a key reset.
        if (error.message?.includes("404") || error.message?.includes("not found")) {
            throw new Error("API_KEY_INVALID");
        }
        throw new Error(error.message || "알 수 없는 API 오류가 발생했습니다.");
    }
};
