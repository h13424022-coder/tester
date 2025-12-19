
import React, { useState, FormEvent, useRef, useEffect } from 'react';
import { analyzeSupplements, AnalysisResult } from './services/geminiService';

// AIStudio 인터페이스 정의 - Moved into declare global and removed readonly to avoid type and modifier conflicts
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    aistudio: AIStudio;
  }
}

const App: React.FC = () => {
    const [supplements, setSupplements] = useState<string[]>(['아스피린', '오메가-3', '비타민 E']);
    const [newItem, setNewItem] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isSelectingKey, setIsSelectingKey] = useState<boolean>(false);
    const [error, setError] = useState<{message: string; type?: string} | null>(null);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    // process.env.API_KEY가 실제 유효한 값인지 확인

    const [hasKey, setHasKey] = useState<boolean>(import.meta.env.VITE_GEMINI_API_KEY);
    //    !!process.env.API_KEY && process.env.API_KEY !== "undefined" && process.env.API_KEY !== ""
    //);
    const resultRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const checkKey = async () => {
            if (window.aistudio) {
                try {
                    const selected = await window.aistudio.hasSelectedApiKey();
                    if (selected) setHasKey(true);
                } catch (e) {
                    console.error("Failed to check API key status:", e);
                }
            }
        };
        checkKey();
    }, []);

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

    const handleOpenKeySelector = async () => {
        if (window.aistudio) {
            try {
                setIsSelectingKey(true);
                await window.aistudio.openSelectKey();
                // 지침에 따라 즉시 성공으로 가정하고 진행
                setHasKey(true);
                setError(null);
            } catch (err) {
                console.error("Error opening key selector:", err);
                alert("API 키 선택창을 열 수 없습니다. 브라우저 설정을 확인해주세요.");
            } finally {
                setIsSelectingKey(false);
            }
        } else {
            alert("이 브라우저 환경에서는 시스템 API 키 선택 기능을 지원하지 않습니다. .env 파일이나 Netlify 환경 변수 설정을 확인해주세요.");
        }
    };

    const runAnalysis = async () => {
        if (supplements.length === 0) {
            setError({ message: "분석할 항목을 하나 이상 추가해주세요." });
            return;
        }

        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            const data = await analyzeSupplements(supplements);
            setResult(data);
            setTimeout(() => {
                resultRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        } catch (err: any) {
            if (err.message === "API_KEY_MISSING") {
                setHasKey(false);
                setError({ 
                    message: "API 키가 설정되지 않았습니다. 분석을 위해 Google AI 키가 필요합니다.",
                    type: "KEY_MISSING"
                });
            } else if (err.message === "API_KEY_INVALID") {
                setHasKey(false);
                setError({ 
                    message: "현재 사용 중인 API 키가 유효하지 않습니다. 새로운 키를 선택하거나 설정을 확인해주세요.",
                    type: "KEY_INVALID"
                });
            } else {
                setError({ message: err.message || "분석 중 알 수 없는 오류가 발생했습니다." });
            }
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
                    
                    {!hasKey && (
                        <div className="mt-6 inline-flex items-center px-4 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-sm font-medium animate-pulse cursor-pointer hover:bg-amber-100 transition-colors" onClick={handleOpenKeySelector}>
                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            API 키 설정이 필요합니다 (클릭하여 선택)
                        </div>
                    )}
                </header>

                <main className="space-y-8">
                    {/* Input Section */}
                    <section className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/60 border border-slate-100">
                        <form onSubmit={handleAddItem} className="relative mb-6">
                            <input
                                type="text"
                                value={newItem}
                                onChange={(e) => setNewItem(e.target.value)}
                                placeholder="약품 또는 영양제 이름을 입력하세요"
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
                                <div key={item} className="flex items-center bg-blue-50 text-blue-700 px-4 py-2 rounded-xl border border-blue-100 font-semibold text-sm">
                                    {item}
                                    <button onClick={() => removeItem(item)} className="ml-2.5 p-0.5 hover:bg-blue-200 rounded-full transition-colors">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l18 18" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={runAnalysis}
                            disabled={isLoading || supplements.length === 0}
                            className="w-full mt-8 py-5 bg-blue-600 text-white rounded-2xl font-black text-xl shadow-lg shadow-blue-500/30 hover:bg-blue-700 disabled:bg-slate-300 transition-all active:scale-[0.98] flex items-center justify-center space-x-3"
                        >
                            {isLoading ? (
                                <svg className="animate-spin h-6 w-6 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : "정밀 분석 리포트 생성"}
                        </button>
                    </section>

                    {/* Error & Setup Display */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 p-8 rounded-3xl animate-in slide-in-from-top-4 duration-300">
                            <div className="flex items-start space-x-4 mb-6">
                                <div className="p-3 bg-red-100 rounded-xl text-red-600">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-red-900 font-bold text-lg mb-2">문제가 발생했습니다</h3>
                                    <p className="text-red-700 text-sm leading-relaxed">{error.message}</p>
                                </div>
                            </div>
                            
                            {(error.type === "KEY_MISSING" || error.type === "KEY_INVALID") && (
                                <div className="space-y-4">
                                    <button
                                        onClick={handleOpenKeySelector}
                                        disabled={isSelectingKey}
                                        className="w-full py-4 bg-white border-2 border-red-200 text-red-700 rounded-2xl font-bold hover:bg-red-100 transition-colors flex items-center justify-center disabled:opacity-50"
                                    >
                                        {isSelectingKey ? (
                                            <span className="flex items-center italic">다이얼로그 여는 중...</span>
                                        ) : (
                                            <>
                                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                                </svg>
                                                시스템 API 키 선택하기
                                            </>
                                        )}
                                    </button>
                                    <div className="bg-white/50 p-4 rounded-xl border border-red-100">
                                        <p className="text-[11px] text-red-500 font-medium mb-1">💡 해결되지 않는다면?</p>
                                        <p className="text-[10px] text-red-400 leading-tight">
                                            1. 로컬 개발 시: 프로젝트 루트의 .env 파일에 API_KEY=키값 을 추가하세요.<br/>
                                            2. Netlify 배포 시: Site settings &gt Environment variables에서 키를 추가하고 <b>'Deploys &gt Clear cache and deploy'</b>를 실행하세요.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Result Display */}
                    {result && (
                        <section ref={resultRef} className="bg-white rounded-3xl p-8 shadow-2xl shadow-blue-900/5 border border-blue-100 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                            <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-6">
                                <h2 className="text-2xl font-black text-slate-900 flex items-center">
                                    <span className="bg-blue-100 text-blue-600 p-2 rounded-lg mr-3">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                        </svg>
                                    </span>
                                    AI 정밀 분석 결과
                                </h2>
                                <button onClick={() => window.print()} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-lg transition-colors" title="출력하기">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                    </svg>
                                </button>
                            </div>

                            <div className="prose prose-slate max-w-none mb-10">
                                {renderText(result.text)}
                            </div>

                            {result.sources.length > 0 && (
                                <div className="pt-8 border-t border-slate-100">
                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">참조 데이터 소스 (Google Search)</h4>
                                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {result.sources.map((source, idx) => (
                                            <li key={idx} className="bg-slate-50 rounded-xl p-3 border border-slate-100 hover:border-blue-200 transition-all group">
                                                <a href={source.uri} target="_blank" rel="noopener noreferrer" className="flex items-center text-sm font-semibold text-slate-600 group-hover:text-blue-600">
                                                    <svg className="w-4 h-4 mr-2 flex-shrink-0 text-slate-300 group-hover:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    <p className="text-slate-400 text-[10px] leading-relaxed max-w-md mx-auto">
                        본 서비스는 의학적 조언을 대체할 수 없습니다. 중요한 건강상의 결정은 반드시 의료 전문가와 상담하십시오. AI 분석 결과는 100% 정확하지 않을 수 있습니다.
                    </p>
                </footer>
            </div>
        </div>
    );
};

export default App;
