
import { GoogleGenAI } from "@google/genai";

export interface AnalysisResult {
  text: string;
  sources: { title: string; uri: string }[];
}

/**
 * 할당량 문제를 최소화하기 위해 gemini-flash-lite-latest 모델을 사용하여 분석을 수행합니다.
 */
export const analyzeSupplements = async (supplementList: string[]): Promise<AnalysisResult> => {
    const apiKey = process.env.API_KEY;
    
    if (!apiKey || apiKey === "undefined" || apiKey === "") {
      throw new Error("API_KEY_MISSING");
    }

    // 호출 시마다 새로운 인스턴스를 생성하여 최신 환경 변수를 반영합니다.
    const ai = new GoogleGenAI({ apiKey });
    
    // 무료 티어에서 가장 안정적이고 호출 제한이 덜한 'gemini-flash-lite-latest' 모델을 사용합니다.
    const modelName = 'gemini-flash-lite-latest';
    
    const prompt = `
        당신은 세계적인 임상 약학 데이터 분석가입니다.
        사용자가 입력한 목록: [${supplementList.join(', ')}]

        다음 가이드라인에 따라 정밀 분석 리포트를 작성하십시오:
        1. [안전 등급]: 안전, 주의, 위험 중 선택 후 이유 명시.
        2. [상호작용 위험]: 성분 간의 충돌이나 흡수 방해 요소 분석.
        3. [중복 섭취 경고]: 동일 성분 과다 복용 가능성 확인.
        4. [복용 꿀팁]: 효과를 극대화하는 복용 시간 및 식사 관련 조언.

        반드시 한국어로 작성하고, 일반인도 이해하기 쉬운 비유를 섞어 전문적으로 답변하세요.
    `;

    try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }],
            temperature: 0.1, // 의료 정보의 정확성을 위해 가장 낮은 온도로 설정
          },
        });

        const text = response.text || "분석 결과를 생성할 수 없습니다.";
        const sources: { title: string; uri: string }[] = [];
        
        // 검색 결과 출처 추출
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
        
        // 429 에러(할당량 초과)를 명시적으로 체크
        if (error.message?.includes("429") || error.message?.includes("quota") || error.message?.includes("RESOURCE_EXHAUSTED")) {
            throw new Error("QUOTA_EXHAUSTED");
        }
        
        if (error.message?.includes("404") || error.message?.includes("not found")) {
            throw new Error("API_KEY_INVALID");
        }
        
        throw new Error(error.message || "분석 중 오류가 발생했습니다.");
    }
};