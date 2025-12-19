
import React, { useState, useCallback, FormEvent, useRef } from 'react';
import { analyzeSupplements, AnalysisResult } from './services/geminiService';

const App: React.FC = () => {
    const [supplements, setSupplements] = useState<string[]>(['아스피린', '오메가-3', '비타민 E']);
    const [newItem, setNewItem] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const resultRef = useRef<HTMLDivElement>(null);

    const handleAddItem = (e: FormEvent) => {
        e.preventDefault();
        const trimmed = newItem.trim();
        if (trimmed && !supplements.includes(trimmed)) {
            setSupplements(prev => [...prev, trimmed]);
            setNewItem('');
        }
    };

    const removeItem = (item: string) => {
        setSupplements(prev => prev.filter(s => s !== item));
    };

    const runAnalysis = async () => {
        if (supplements.length === 0) {
            setError("분석할 항목을 하나 이상 추가해주세요.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            const data = await analyzeSupplements(supplements);
            setResult(data);
            // 분석 완료 후 결과 창으로 스크롤
            setTimeout(() => {
                resultRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const renderText = (text: string) => {
        return text.split('\n').map((line, i) => (
            <p key={i} className="mb-3 last:mb-0 leading-relaxed text-gray-700">
                {line.split('**').map((part, index) => 
                    index % 2 === 1 ? <strong key={index} className="text-blue-900 font-bold">{part}</strong> : part
                )}
            </p>
        ));
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-100">
            <div className="max-w-3xl mx-auto px-6 py-12">
                {/* Header */}
                <header className="mb-12 text-center">
                    <div className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6 shadow-lg shadow-blue-200">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        <span>Health Shield AI</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 mb-4">
                        영양제 <span className="text-blue-600">안전 분석</span>
                    </h1>
                    <p className="text-slate-500 text-lg max-w-lg mx-auto leading-relaxed">
                        복용 중인 약물과 영양제의 성분을 교차 분석하여 잠재적 위험 요소를 찾아냅니다.
                    </p>
                </header>

                <main className="space-y-8">
                    {/* Input Section */}
                    <section className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/60 border border-slate-100">
                        <form onSubmit={handleAddItem} className="relative mb-6">
                            <input
                                type="text"
                                value={newItem}
                                onChange={(e) => setNewItem(e.target.value)}
                                placeholder="약품 또는 영양제 이름을 입력하세요 (예: 비타민 C)"
                                className="w-full pl-6 pr-24 py-5 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 rounded-2xl outline-none transition-all text-lg font-medium"
                            />
                            <button
                                type="submit"
                                className="absolute right-2 top-2 bottom-2 px-6 bg-slate-900 text-white font-bold rounded-xl hover:bg-black transition-colors active:scale-95"
                            >
                                추가
                            </button>
                        </form>

                        <div className="flex flex-wrap gap-2 min-h-[50px]">
                            {supplements.map((item) => (
                                <div
                                    key={item}
                                    className="flex items-center bg-blue-50 text-blue-700 px-4 py-2 rounded-xl border border-blue-100 font-semibold text-sm animate-in fade-in zoom-in duration-300"
                                >
                                    {item}
                                    <button
                                        onClick={() => removeItem(item)}
                                        className="ml-2.5 p-0.5 hover:bg-blue-200 rounded-full transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l18 18" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                            {supplements.length === 0 && (
                                <p className="text-slate-400 text-sm italic w-full text-center py-4">
                                    목록이 비어있습니다. 약품을 입력하여 추가하세요.
                                </p>
                            )}
                        </div>

                        <button
                            onClick={runAnalysis}
                            disabled={isLoading || supplements.length === 0}
                            className="w-full mt-8 py-5 bg-blue-600 text-white rounded-2xl font-black text-xl shadow-lg shadow-blue-500/30 hover:bg-blue-700 disabled:bg-slate-300 disabled:shadow-none transition-all active:scale-[0.98] flex items-center justify-center space-x-3"
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin h-6 w-6 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>AI 엔진 분석 중...</span>
                                </>
                            ) : (
                                <span>정밀 분석 리포트 생성</span>
                            )}
                        </button>
                    </section>

                    {/* Error Display */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 p-6 rounded-2xl flex items-start space-x-4 animate-in slide-in-from-top-4 duration-300">
                            <div className="p-2 bg-red-100 rounded-lg text-red-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-red-900 font-bold mb-1">분석 오류 발생</h3>
                                <p className="text-red-700 text-sm leading-relaxed">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* Result Display */}
                    {result && (
                        <section ref={resultRef} className="bg-white rounded-3xl p-8 shadow-2xl shadow-blue-900/5 border border-blue-100 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                            <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-6">
                                <h2 className="text-2xl font-black text-slate-900 flex items-center">
                                    <span className="bg-blue-100 text-blue-600 p-2 rounded-lg mr-3">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                        </svg>
                                    </span>
                                    AI 정밀 분석 결과
                                </h2>
                                <button 
                                    onClick={() => window.print()}
                                    className="text-slate-400 hover:text-slate-600 transition-colors"
                                    title="인쇄하기"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                    </svg>
                                </button>
                            </div>

                            <div className="prose prose-slate max-w-none">
                                {renderText(result.text)}
                            </div>

                            {/* Grounding Sources */}
                            {result.sources.length > 0 && (
                                <div className="mt-10 pt-8 border-t border-slate-100">
                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">근거 자료 및 출처</h4>
                                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {result.sources.map((source, idx) => (
                                            <li key={idx} className="bg-slate-50 rounded-xl p-3 border border-slate-100 hover:border-blue-200 transition-all group">
                                                <a 
                                                    href={source.uri} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="flex items-center text-sm font-semibold text-slate-600 group-hover:text-blue-600"
                                                >
                                                    <svg className="w-4 h-4 mr-2 flex-shrink-0 text-slate-400 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                    </svg>
                                                    <span className="truncate">{source.title}</span>
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </section>
                    )}
                </main>

                <footer className="mt-16 text-center">
                    <p className="text-slate-400 text-xs leading-relaxed max-w-md mx-auto">
                        제공된 정보는 AI가 학습한 데이터를 기반으로 하며, 실시간 의학 정보와 다를 수 있습니다. 
                        새로운 영양제나 약물을 복용하기 전에는 반드시 전문 의료진과 상담하십시오.
                    </p>
                    <div className="mt-8 flex justify-center space-x-6 text-slate-300">
                        <span className="text-[10px] font-bold tracking-tighter uppercase">Gemini 3.0 Flash Driven</span>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default App;
