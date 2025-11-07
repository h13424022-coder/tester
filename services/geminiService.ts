
import { GoogleGenAI } from "@google/genai";

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeSupplements = async (supplementList: string[]): Promise<string> => {
    const model = 'gemini-2.5-flash';
    
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
        아래 소제목으로 나누어 상세 분석을 제공해줘:
        - **중복 섭취**: 여러 제품에 동일한 성분이 포함되어 과다 복용 위험이 있는지 분석해줘.
        - **상호작용**: 특정 성분들이 서로의 흡수를 방해하거나 부작용을 증가시킬 수 있는 조합을 상세히 설명해줘.

        ### ✅ 권장사항
        사용자가 취할 수 있는 구체적이고 실행 가능한 조언을 제공해줘. 의사/약사와의 상담 권유, 특정 제품 재고려, 대체 영양제 제안 등을 포함할 수 있어.

        **매우 중요:**
        - 너의 답변은 전문적이고 신중한 톤을 유지해야 해.
        - 모든 분석의 마지막에는 **"본 정보는 참고용이며, 복용 계획에 변화를 주기 전 반드시 의사 또는 약사와 상담하십시오."** 라는 경고 문구를 반드시 포함해야 해.
    `;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Gemini API Error:", error);
        throw new Error("Failed to get analysis from Gemini API.");
    }
};
