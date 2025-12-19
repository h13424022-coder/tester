
import { GoogleGenAI } from "@google/genai";

export interface AnalysisResult {
  text: string;
  sources: { title: string; uri: string }[];
}

/**
 * 복용 중인 영양제 및 의약품 목록을 분석하여 상호작용 위험을 반환합니다.
 */
export const analyzeSupplements = async (supplementList: string[]): Promise<AnalysisResult> => {
    // API 키는 환경 변수 process.env.API_KEY에서 직접 가져옵니다.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // 텍스트 분석 및 검색 기능에 최적화된 모델 선택
    const modelName = 'gemini-3-flash-preview';
    
    const prompt = `
        당신은 세계적인 수준의 건강기능식품 및 임상 약학 데이터 분석가입니다.
        사용자가 복용 중인 다음 목록을 분석하여 잠재적 위험을 평가하십시오: [${supplementList.join(', ')}]

        분석 보고서는 다음 구조를 따라야 합니다:
        1. 요약: 전체적인 조합의 안전성 등급 (안전/주의/위험 중 하나 선택 및 이유)
        2. 중복 성분 확인: 동일하거나 유사한 성분이 포함되어 과다 복용 위험이 있는지 확인
        3. 상호작용 분석: 성분 간의 흡수 방해, 부작용 증폭, 효능 감소 등 상세 분석
        4. 전문가의 조언: 복용 시간 조정이나 전문가 상담 권유 등 구체적 지침

        모든 설명은 일반인이 이해하기 쉬우면서도 과학적으로 정확해야 합니다.
        마지막에 "본 정보는 참고용이며, 반드시 의사나 약사와 상담하십시오."를 포함하세요.
    `;

    try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: [{ parts: [{ text: prompt }] }],
            config: {
                tools: [{ googleSearch: {} }], // 최신 정보 기반 검색 기능 활성화
                temperature: 0.7,
            }
        });

        const text = response.text || "분석 결과를 생성할 수 없습니다.";
        
        // 검색 출처(Grounding Chunks) 추출
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
        
        // 브라우저에서 API 키를 인식하지 못할 때의 상세 메시지
        if (error.message?.includes("API Key not set") || error.message?.includes("API_KEY")) {
          throw new Error("API 키가 설정되지 않았습니다. Netlify 설정에서 'Build environment variables'에 API_KEY가 정확히 입력되었는지 확인하고, 사이트를 다시 'Deploy' 하십시오.");
        }
        
        throw new Error("분석 도중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    }
};