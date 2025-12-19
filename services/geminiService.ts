
import { GoogleGenAI } from "@google/genai";

/**
 * 복용 중인 영양제 및 의약품 목록을 분석하여 상호작용 위험을 반환합니다.
 */
export const analyzeSupplements = async (supplementList: string[]): Promise<string> => {
    // API 키는 환경 변수 process.env.API_KEY에서 직접 가져옵니다.
    // 인스턴스 생성을 함수 내부에서 수행하여 빌드/로드 타임의 ReferenceError를 방지합니다.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // 기본 텍스트 분석 작업에 권장되는 gemini-3-flash-preview 모델을 사용합니다.
    const modelName = 'gemini-3-flash-preview';
    
    const prompt = `
        너는 천재적인 건강기능식품 데이터 분석가야. 너의 역할은 사용자가 제공한 의약품 및 건강기능식품 목록을 분석하여, 중복 섭취 또는 상호작용의 잠재적 위험을 경고하고 피해야 할 성분에 대해 안내하는 거야.

        사용자가 복용 중인 목록: [${supplementList.join(', ')}]

        분석 결과를 아래의 마크다운 형식에 맞춰 한국어로 제공해줘.

        ### 💊 총평
        복용 중인 조합에 대한 간결하고 전반적인 평가를 제공해줘.

        ### ⚠️ 주요 경고
        가장 중요하고 시급한 상호작용이나 중복 섭취 위험을 먼저 글머리 기호로 나열해줘. 각 항목은 어떤 제품/성분이 관련 있고, 어떤 위험이 있는지 명확히 설명해야 해.
        예시:
        - **혈액 응고 방해 위험**: 와파린(혈액 응고제)과 고함량 오메가-3를 함께 복용하면 출혈 위험이 증가할 수 있습니다.

        ### 🔬 성분별 상세 분석
        - **중복 섭취**: 여러 제품에 동일한 성분이 포함되어 과다 복용 위험이 있는지 분석.
        - **상호작용**: 특정 성분들이 서로의 흡수를 방해하거나 부작용을 증가시킬 수 있는 조합 상세 설명.

        ### ✅ 권장사항
        사용자가 취할 수 있는 구체적이고 실행 가능한 조언(의사/약사 상담 권유, 특정 제품 재고려 등).

        **매우 중요:**
        - 전문적이고 신중한 톤을 유지할 것.
        - 마지막에 반드시 "본 정보는 참고용이며, 복용 계획에 변화를 주기 전 반드시 의사 또는 약사와 상담하십시오." 문구를 포함할 것.
    `;

    try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
                temperature: 0.7,
                topP: 0.95,
            }
        });

        if (!response.text) {
            throw new Error("분석 결과를 생성하지 못했습니다.");
        }

        return response.text;
    } catch (error: any) {
        console.error("Gemini API 분석 오류:", error);
        if (error.message?.includes("API_KEY")) {
            throw new Error("API 키 설정에 문제가 있습니다. 관리자에게 문의하세요.");
        }
        throw new Error("AI 분석 서비스에 일시적인 문제가 발생했습니다.");
    }
};
